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
  const raw = [
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0,
    navigator.userAgent,
  ].join('|');

  // Use SubtleCrypto to hash if available, otherwise simple hash
  if (window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
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
