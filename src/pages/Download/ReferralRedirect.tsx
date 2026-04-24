import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getDeviceInfo, generateVisitorId, normalizePlatform } from '../../utils/referralUtils';

/**
 * Lightweight redirect handler for /download/:platform?ref=code
 * Logs the click, then immediately redirects to /download
 */
const ReferralRedirect: React.FC = () => {
  const { platform: rawPlatform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasTracked = useRef(false);

  const refCode = searchParams.get('ref');
  const platform = normalizePlatform(rawPlatform);

  useEffect(() => {
    const trackAndRedirect = async () => {
      // Track click if we have a referral code
      if (refCode && !hasTracked.current) {
        hasTracked.current = true;

        try {
          // Verify the referral code exists
          const { data: profile } = await supabase
            .from('referral_profiles')
            .select('referral_code')
            .eq('referral_code', refCode)
            .single();

          if (profile) {
            const deviceInfo = getDeviceInfo();
            const visitorId = await generateVisitorId();

            // Fetch country via free geo-IP API (non-blocking, 1.5s timeout)
            let country: string | null = null;
            try {
              const geoController = new AbortController();
              const geoTimeout = setTimeout(() => geoController.abort(), 1500);
              const geoRes = await fetch('https://ipapi.co/json/', { signal: geoController.signal });
              clearTimeout(geoTimeout);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                country = geoData.country_name || null; // Full name e.g. "United States", "Slovakia"
              }
            } catch {
              // Geo lookup failed or timed out — continue without it
            }

            const { data: clickData } = await supabase
              .from('referral_clicks')
              .insert({
                referral_code: refCode,
                visitor_id: visitorId,
                platform: platform,
                device_type: deviceInfo.device_type,
                country: country,
              })
              .select('id')
              .single();

            if (clickData) {
              // Store for mobile app attribution
              localStorage.setItem('upshift_click_id', clickData.id);
              localStorage.setItem('upshift_referral_code', refCode);
            }
          }
        } catch (err) {
          console.error('Referral tracking error:', err);
        }
      }

      // Redirect to /download (which auto-redirects to the store)
      navigate('/download', { replace: true });
    };

    trackAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Brief loading state while tracking
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#666',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px'
    }}>
      Redirecting to download...
    </div>
  );
};

export default ReferralRedirect;
