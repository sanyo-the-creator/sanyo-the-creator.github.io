import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { trackReferralClick } from '../../utils/referralUtils';

/**
 * Lightweight redirect handler for /download/:platform?ref=code
 * Logs the click, then immediately redirects to /download
 */
const ReferralRedirect: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasTracked = useRef(false);

  const refCode = searchParams.get('ref');

  useEffect(() => {
    const trackAndRedirect = async () => {
      // Track click if we have a referral code
      if (refCode && !hasTracked.current) {
        hasTracked.current = true;
        await trackReferralClick(refCode, platform);
        
        // On mobile, give it an extra tiny bit of time for the request to flush
        if (/iPhone|Android|iPad|iPod/.test(navigator.userAgent)) {
          await new Promise(r => setTimeout(r, 500));
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
