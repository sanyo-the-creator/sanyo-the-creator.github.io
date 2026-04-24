import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getDeviceInfo, generateVisitorId, normalizePlatform, PLATFORM_INFO } from '../../utils/referralUtils';
import type { ReferralPlatform } from '../../utils/referralUtils';
import './ProfileLanding.css';

interface ProfileData {
  referral_code: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  total_clicks: number;
}

const ProfileLanding: React.FC = () => {
  const { referralCode, platform: rawPlatform } = useParams<{ referralCode: string; platform?: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clickId, setClickId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const hasTracked = useRef(false);

  const platform: ReferralPlatform = normalizePlatform(rawPlatform);
  const platformInfo = PLATFORM_INFO[platform];

  useEffect(() => {
    if (!referralCode) return;

    const loadProfile = async () => {
      try {
        // Fetch profile
        const { data, error } = await supabase
          .from('referral_profiles')
          .select('referral_code, display_name, avatar_url, bio, total_clicks')
          .eq('referral_code', referralCode)
          .single();

        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(data);
        setLoading(false);

        // Track the click (only once)
        if (!hasTracked.current) {
          hasTracked.current = true;
          trackClick(referralCode);
        }
      } catch {
        setNotFound(true);
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralCode]);

  const trackClick = async (code: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      const visitorId = await generateVisitorId();

      const { data, error } = await supabase
        .from('referral_clicks')
        .insert({
          referral_code: code,
          visitor_id: visitorId,
          platform: platform,
          device_type: deviceInfo.device_type,
          country: null,
        })
        .select('id')
        .single();

      if (!error && data) {
        setClickId(data.id);
        // Store for fallback attribution
        localStorage.setItem('upshift_click_id', data.id);
        localStorage.setItem('upshift_referral_code', code);
      }
    } catch (err) {
      console.error('Failed to track click:', err);
    }
  };

  const handleDownload = async () => {
    setRedirecting(true);

    // Mark the click as downloaded
    if (clickId) {
      try {
        await supabase.rpc('mark_click_downloaded', { p_click_id: clickId });
      } catch {
        // Non-critical, continue with redirect
      }
    }

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /android/i.test(ua);

    const storeClickId = clickId || '';

    if (isIOS) {
      // App Store with campaign tracking
      window.location.href = `https://apps.apple.com/us/app/upshift-level-up-your-life/id6749509316?ct=${storeClickId}`;
    } else if (isAndroid) {
      // Google Form with referral info pre-filled
      window.location.href = `https://forms.gle/iJa3K3p6LmWkmHxn6#`;
    } else {
      // Desktop — show both options
      window.location.href = `https://apps.apple.com/us/app/upshift-level-up-your-life/id6749509316?ct=${storeClickId}`;
    }
  };

  if (loading) {
    return (
      <div className="profile-landing">
        <div className="profile-landing-loader">
          <div className="profile-landing-spinner" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="profile-landing">
        <div className="profile-landing-card profile-landing-not-found">
          <div className="profile-not-found-icon">🔍</div>
          <h1>Profile Not Found</h1>
          <p>This referral link doesn't exist or has been removed.</p>
          <a href="/" className="profile-landing-btn-secondary">Go to Upshift</a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-landing">
      <div className="profile-landing-bg" />

      <div className="profile-landing-card">
        {/* Platform badge */}
        {platform !== 'direct' && (
          <div className="profile-platform-badge" style={{ color: platformInfo.color, borderColor: platformInfo.color + '33', backgroundColor: platformInfo.color + '11' }}>
            <span className="profile-platform-icon">{platformInfo.icon}</span>
            via {platformInfo.label}
          </div>
        )}

        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.referral_code}`}
            alt={profile.display_name || profile.referral_code}
            className="profile-avatar"
          />
          <div className="profile-avatar-glow" />
        </div>

        {/* Name & Bio */}
        <h1 className="profile-name">{profile.display_name || profile.referral_code}</h1>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <p className="profile-invite-text">
          {profile.display_name || profile.referral_code} invites you to try <strong>Upshift</strong> — the app that helps you level up your life.
        </p>

        {/* Download CTA */}
        <button
          className="profile-download-btn"
          onClick={handleDownload}
          disabled={redirecting}
        >
          {redirecting ? (
            <>
              <div className="profile-btn-spinner" />
              Redirecting...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 5v6h1.17L12 13.17 9.83 11H11V5h2m2-2H9v6H5l7 7 7-7h-4V3zm4 15H5v2h14v-2z" />
              </svg>
              Download Upshift
            </>
          )}
        </button>

        <div className="profile-store-badges">
          <span className="profile-store-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            App Store
          </span>
          <span className="profile-store-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
            </svg>
            Android Waitlist
          </span>
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <a href="/" className="profile-footer-link">What is Upshift?</a>
        </div>
      </div>
    </div>
  );
};

export default ProfileLanding;
