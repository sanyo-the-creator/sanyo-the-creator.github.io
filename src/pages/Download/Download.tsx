import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SEO, StructuredData } from '../../components/common/SEO';
import { trackReferralClick } from '../../utils/referralUtils';
import { StoreButtons } from '../../components/site/SiteChrome';
import { useLocale, rich, localizePath } from '../../i18n';
import './Download.css';

const Download: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  const { t, lang } = useLocale();

  useEffect(() => {
    // Only auto-redirect if user is on /download, /download/:platform, or /
    const downloadRoot = localizePath(lang, '/download');
    if (!window.location.pathname.startsWith(downloadRoot) && window.location.pathname !== '/') {
      return;
    }

    // Never bounce crawlers to a store listing, they need to see this page.
    if (/bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse/i.test(navigator.userAgent || '')) {
      return;
    }

    const runRedirectLogic = async () => {
      // IMPORTANT: capture whether the visitor actually arrived on a /download path
      // BEFORE we rewrite the URL below. Landing on the bare root "/" must NOT
      // auto-redirect to the store — only an explicit /download (or a referral
      // redirect into /download/...) should.
      const isExplicitDownloadPath = window.location.pathname.startsWith(downloadRoot);

      // Check for referral code in URL
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');

      // Clean up the URL to just /download without reloading the page
      if (window.location.pathname !== downloadRoot || window.location.search) {
        window.history.replaceState({}, '', downloadRoot);
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
  }, [platform, lang]);


  const downloadUrlPath = localizePath(lang, '/download');

  return (
    <div className="download-page">
      <SEO
        title={t.meta.download.title}
        description={t.meta.download.description}
        keywords={t.meta.download.keywords}
        image="https://www.joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData
        type="webpage"
        title={t.meta.download.title}
        description={t.meta.download.description}
        url={`https://www.joinupshift.com${downloadUrlPath}`}
      />

      <section className="download-intro">
        <span className="site-eyebrow">{t.downloadPage.eyebrow}</span>
        <h1>{rich(t.downloadPage.h1)}</h1>
        <p>{t.downloadPage.text}</p>
        <StoreButtons className="download-stores" />
      </section>
    </div>
  );
};

export default Download;
