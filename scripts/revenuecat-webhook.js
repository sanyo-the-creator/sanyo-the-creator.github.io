/**
 * RevenueCat Webhook Handler for Supabase
 * 
 * This script is designed to be deployed as a Vercel Serverless Function 
 * or a simple Node.js Express endpoint.
 * 
 * It handles INITIAL_PURCHASE and REFUND events from RevenueCat 
 * to attribute sales/refunds to the correct Sales Affiliate in Supabase.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with Service Role Key (needed for RLS bypass)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 1. Verify RevenueCat Authorization (Highly Recommended)
  // Configure this in RevenueCat Dashboard -> Webhooks -> Authorization Header
  const authHeader = req.headers['authorization'];
  if (authHeader !== process.env.REVENUECAT_WEBHOOK_AUTH) {
    return res.status(401).send('Unauthorized');
  }

  const { event } = req.body;
  if (!event) return res.status(400).send('No event data');

  const { type, app_user_id, price_in_purchased_currency, currency, transaction_id } = event;
  
  // The app_user_id in RevenueCat corresponds to our Supabase User UUID (profile_id)
  const profile_id = app_user_id;
  const amount_cents = Math.round(price_in_purchased_currency * 100);

  console.log(`Processing RevenueCat event: ${type} for user: ${profile_id}`);

  try {
    // 2. Fetch the user's referral profile to get their referral_code
    const { data: profile, error: pError } = await supabase
      .from('referral_profiles')
      .select('referral_code')
      .eq('id', profile_id)
      .single();

    if (pError || !profile) {
      console.error('Profile not found for ID:', profile_id);
      return res.status(404).send('Profile not found');
    }

    const referral_code = profile.referral_code;

    // 3. Handle REFUND (Deduction)
    if (type === 'REFUND') {
      const { data, error } = await supabase
        .from('referral_refunds')
        .insert({
          profile_id: profile_id,
          referral_code: referral_code,
          amount_cents: Math.abs(amount_cents), // Ensure positive cents for the trigger to subtract
          sale_id: null, 
        })
        .select()
        .single();

      if (error) throw error;
      console.log('Successfully saved refund:', data.id);
      return res.status(200).json({ success: true, refund_id: data.id });
    }

    console.log(`Ignoring non-refund event: ${type}`);
    return res.status(200).send('Event received but not processed (ignored type)');

  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
