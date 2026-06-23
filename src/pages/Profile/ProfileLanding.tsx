import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Vanity referral URL: joinupshift.com/<referral_code>  (optionally /<code>/<platform>)
 *
 * We don't show a landing page here anymore — we just behave exactly like the
 * "Other" referral link: forward to the download flow with ?ref=<code>, which
 * tracks the click and then redirects the visitor to the right store.
 */
const ProfileLanding: React.FC = () => {
  const { referralCode, platform } = useParams<{ referralCode: string; platform?: string }>();
  const code = (referralCode || '').toLowerCase().trim();

  if (!code) {
    return <Navigate to="/download" replace />;
  }

  // Preserve an explicit platform if the vanity URL had one (/<code>/<platform>),
  // otherwise attribute it to "other".
  const plat = (platform || 'other').toLowerCase();
  return <Navigate to={`/download/${plat}?ref=${encodeURIComponent(code)}`} replace />;
};

export default ProfileLanding;
