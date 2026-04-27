import { supabase } from '../lib/supabase';

/**
 * Device detection and visitor fingerprinting utilities
 * Used by the public profile page to track referral clicks
 */

export interface DeviceInfo {
  device_type: 'iPhone' | 'Android' | 'Desktop';
}

/**
 * Detect device: iPhone, Android, or Desktop
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  if (/iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) {
    return { device_type: 'iPhone' };
  }
  if (/android/i.test(ua)) {
    return { device_type: 'Android' };
  }
  return { device_type: 'Desktop' };
}

/**
 * Generate a privacy-friendly visitor fingerprint
 * Uses only non-PII data like screen size, language, timezone
 * Returns a hex hash string
 */
export async function generateVisitorId(): Promise<string> {
  // Extract OS version from User Agent for higher uniqueness
  const osVersionMatch = navigator.userAgent.match(/OS (\d+_\d+)/);
  const osVersion = osVersionMatch ? osVersionMatch[1].replace('_', '.') : 'unknown';

  const raw = [
    window.screen.width,
    window.screen.height,
    window.devicePixelRatio,
    window.screen.colorDepth,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0,
    osVersion,
    getDeviceInfo().device_type,
  ].join('|');
  console.log(raw);
  try {
    // Use SubtleCrypto to hash if available, otherwise simple hash
    if (window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(raw);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }
  } catch (e) {
    // Fall through to simple hash
  }

  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Valid platform values for referral tracking URLs
 */
export const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'x', 'snapchat', 'direct'] as const;
export type ReferralPlatform = typeof VALID_PLATFORMS[number];

/**
 * Validate and normalize platform from URL parameter
 */
export function normalizePlatform(platform?: string): ReferralPlatform {
  if (!platform) return 'direct';
  const lower = platform.toLowerCase();
  if (VALID_PLATFORMS.includes(lower as ReferralPlatform)) {
    return lower as ReferralPlatform;
  }
  return 'direct';
}

/**
 * Platform display info for UI
 */
export const PLATFORM_INFO: Record<ReferralPlatform, { label: string; color: string; icon: string }> = {
  tiktok: { label: 'TikTok', color: '#ff0050', icon: '♪' },
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📷' },
  youtube: { label: 'YouTube', color: '#FF0000', icon: '▶' },
  x: { label: 'X / Twitter', color: '#1DA1F2', icon: '𝕏' },
  snapchat: { label: 'Snapchat', color: '#FFFC00', icon: '👻' },
  direct: { label: 'Direct', color: '#3b82f6', icon: '🔗' },
};

/**
 * Robust tracking for referral clicks
 * Returns the click ID if successful
 */
export async function trackReferralClick(rawCode: string, platform: string = 'direct'): Promise<string | null> {
  if (!rawCode) return null;

  const code = rawCode.toLowerCase().trim();
  const normalizedPlatform = normalizePlatform(platform);

  try {
    // 1. Gather device & visitor info
    const deviceInfo = getDeviceInfo();
    const visitorId = await generateVisitorId();

    // 2. Fetch country (non-blocking)
    let country: string | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const geoRes = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        country = geoData.country_name || null;
      }
    } catch {
      // Geo lookup failed — continue anyway
    }

    // 3. Check if already counted (manual check to be safe)
    const { data: existingClick, error: checkError } = await supabase
      .from('referral_clicks')
      .select('id')
      .eq('referral_code', code)
      .eq('visitor_id', visitorId)
      .maybeSingle();

    if (checkError) {
      console.warn('Check error:', checkError);
      // Continue anyway, try to insert
    }

    if (existingClick) {
      console.log('Already counted');
      return 'already-counted';
    }

    // 5. Insert click
    const { data: clickData, error: insertError } = await supabase
      .from('referral_clicks')
      .insert({
        referral_code: code,
        visitor_id: visitorId,
        platform: normalizedPlatform,
        device_type: deviceInfo.device_type,
        country: country,
      })
      .select('id'); // Removed .single() to be safer

    if (insertError) {
      localStorage.setItem('upshift_debug_error', JSON.stringify(insertError));
      console.error('Insert error:', insertError);
      throw insertError;
    }

    const newId = clickData && clickData[0]?.id;
    if (newId) {
      // Store for mobile app attribution
      localStorage.setItem('upshift_click_id', newId);
      localStorage.setItem('upshift_referral_code', code);
      localStorage.setItem('upshift_last_success', new Date().toISOString());
      return newId;
    }

    return null;
  } catch (err: any) {
    console.error('Referral tracking error:', err);
    localStorage.setItem('upshift_debug_catch', err.message || String(err));
    return null;
  }
}
