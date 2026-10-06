import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SEO, StructuredData } from '../../components/common/SEO';
import { trackReferralClick } from '../../utils/referralUtils';
import { StoreButtons } from '../../components/site/SiteChrome';
import './Download.css';

const Download: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();

  useEffect(() => {
    // Only auto-redirect if user is on /download, /download/:platform, or /
    if (!window.location.pathname.startsWith('/download') && window.location.pathname !== '/') {
      return;
    }

    const runRedirectLogic = async () => {
      // IMPORTANT: capture whether the visitor actually arrived on a /download path
      // BEFORE we rewrite the URL below. Landing on the bare root "/" must NOT
      // auto-redirect to the store — only an explicit /download (or a referral
      // redirect into /download/...) should.
      const isExplicitDownloadPath = window.location.pathname.startsWith('/download');

      // Check for referral code in URL
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');

      // Clean up the URL to just /download without reloading the page
      if (window.location.pathname !== '/download' || window.location.search) {
        window.history.replaceState({}, '', '/download');
      }

      if (refCode) {
        await trackReferralClick(refCode, platform || 'direct');

        // On mobile, give it an extra tiny bit of time for the request to flush
        if (/iPhone|Android|iPad|iPod/.test(navigator.userAgent)) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

      // Detect iOS (iPhone/iPad)
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

      const isAndroid = /android/i.test(userAgent);
      const isMobile = isIOS || isAndroid;

      if (isExplicitDownloadPath && isMobile) {
        if (isIOS) {
          // Redirect to Apple App Store
          window.location.href = 'https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316';
        } else if (isAndroid) {
          // Redirect to Google Play
          window.location.href = 'https://play.google.com/store/apps/details?id=com.upshift.app';
        }
      }
    };

    runRedirectLogic();
  }, [platform]);


  return (
    <div className="download-page">
      <SEO
        title="Download Upshift - Level up your life | iOS & Android App"
        description="Download Upshift app for iOS and Android. Transform your life with the most engaging personal development app. Block distracting apps, set goals, and track your progress."
        keywords="download upshift, ios app, android app, personal development app, habit tracker download, productivity app, app blocker, screen time management"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData
        type="webpage"
        title="Download Upshift"
        description="Download Upshift app for iOS and Android"
        url="https://joinupshift.com/download"
      />

      <section className="download-intro">
        <span className="site-eyebrow">Get the App</span>
        <h1>Download <span className="grad-blue">Upshift</span></h1>
        <p>Transform your life with the most engaging personal development app. Available on iPhone and Android.</p>
        <StoreButtons className="download-stores" />
      </section>
    </div>
  );
};

export default Download;
