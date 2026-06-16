// Supabase Edge Function: revenuecat-webhook
// Deploy to the REFERRAL project (yxuqudsqjtaltrxpuush).
//
// Receives RevenueCat webhook events and updates the referral DB:
//   • REFUND        → insert referral_refunds  (trigger_decrement_sales then
//                     subtracts the amount from the affiliate's earnings)
//   • trial → paid  → insert referral_sales (trial=true)  (trigger_increment_sales
//                     credits the affiliate)
//
// Matching is by RevenueCat `app_user_id` == referral_sales/installs.profile_id
// (the buyer's Supabase auth id; the app calls Purchases.logIn(userId), so RC's
// app_user_id equals the Supabase id after the anonymous→login alias).
//
// Env (set with `supabase secrets set` or in the dashboard):
//   REVENUECAT_WEBHOOK_AUTH  — the exact Authorization header value you also
//                              configure in RevenueCat → Webhooks.
//   SUPABASE_URL             — auto-injected in Edge Functions.
//   SUPABASE_SERVICE_ROLE_KEY— auto-injected in Edge Functions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const WEBHOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "";

// 200 helper — RevenueCat retries on any non-2xx, so for "nothing to do"
// cases (event ignored, no referral match) we still return 200.
function ok(body: unknown = { ok: true }) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 1. Verify the shared secret configured in RevenueCat.
  if (!WEBHOOK_AUTH || req.headers.get("authorization") !== WEBHOOK_AUTH) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const event = payload?.event;
  if (!event?.id) return ok({ ignored: "no event" });

  const type: string = event.type;
  const cancelReason: string | undefined = event.cancel_reason;
  const isTrialConversion: boolean = event.is_trial_conversion === true;

  // Buyer id. After Purchases.logIn(userId) RC's app_user_id is the Supabase
  // user id; original_app_user_id / aliases cover the anonymous→login window.
  const candidateIds: string[] = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ].filter(Boolean);

  const amountCents = Math.round(
    Math.abs(Number(event.price_in_purchased_currency ?? 0)) * 100,
  );
  const currency: string = event.currency ?? "USD";

  try {
    // 2. Idempotency — claim the event id; if it's already there, we processed it.
    const { error: dupErr } = await supabase
      .from("revenuecat_events")
      .insert({ event_id: event.id, type, app_user_id: candidateIds[0] ?? null });
    if (dupErr) {
      // primary-key conflict = already processed → ack and stop.
      return ok({ duplicate: true });
    }

    // 3. Refund → insert referral_refunds (trigger deducts from earnings).
    //    RevenueCat sends refunds as type REFUND, or CANCELLATION with
    //    cancel_reason CUSTOMER_SUPPORT. A plain auto-renew-off is
    //    cancel_reason UNSUBSCRIBE → NOT a refund, must be ignored.
    const isRefund =
      type === "REFUND" ||
      (type === "CANCELLATION" && cancelReason === "CUSTOMER_SUPPORT");

    if (isRefund) {
      const sale = await findLatestSale(candidateIds);
      if (!sale) return ok({ ignored: "no referred sale for user" });

      const { error } = await supabase.from("referral_refunds").insert({
        sale_id: sale.id,
        referral_code: sale.referral_code,
        profile_id: sale.profile_id,
        amount_cents: amountCents || sale.amount_cents, // fall back to sale amount
      });
      if (error) throw error;
      return ok({ refunded: true, sale_id: sale.id });
    }

    // 4. Trial conversion → record a real sale flagged trial=true.
    //    RevenueCat marks the first paid renewal after a trial with
    //    is_trial_conversion = true on a RENEWAL event.
    if (type === "RENEWAL" && isTrialConversion) {
      const install = await findInstall(candidateIds);
      if (!install) return ok({ ignored: "no referred install for user" });

      const { error } = await supabase.from("referral_sales").insert({
        install_id: install.id,
        referral_code: install.referral_code,
        profile_id: install.profile_id,
        amount_cents: amountCents,
        currency,
        trial: true,
      });
      if (error) throw error;
      return ok({ trial_converted_to_sale: true, install_id: install.id });
    }

    // Everything else (INITIAL_PURCHASE, plain RENEWAL, UNSUBSCRIBE, etc.) is
    // already handled in-app or irrelevant to referral accounting.
    return ok({ ignored: type });
  } catch (err) {
    console.error("[revenuecat-webhook] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

/** Most recent referral_sale for any of the buyer's RC ids. */
async function findLatestSale(ids: string[]) {
  if (!ids.length) return null;
  const { data } = await supabase
    .from("referral_sales")
    .select("id, referral_code, profile_id, amount_cents")
    .in("profile_id", ids)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

/** The buyer's referral_install (carries referral_code + profile_id). */
async function findInstall(ids: string[]) {
  if (!ids.length) return null;
  const { data } = await supabase
    .from("referral_installs")
    .select("id, referral_code, profile_id")
    .in("profile_id", ids)
    .order("installed_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}
