import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LOCALES, LOCALIZED_PATHS, SITE_URL, localizePath, localeFromPath, stripLocale } from '../../../i18n';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  article?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const setMeta = (name: string, content: string, isProperty = false) => {
  const attribute = isProperty ? 'property' : 'name';
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const canonicalPath = (pathname: string) => {
  let p = pathname.replace(/\/+$/, '') || '/';
  // /download/:platform and the vanity redirects all canonicalise to /download
  p = p.replace(/^(\/(?:[a-z]{2}\/)?download)\/.+$/, '$1');
  return p;
};

const SEO: React.FC<SEOProps> = ({
  title = 'Upshift - Level up your life',
  description = 'Turn habits into quests, earn XP and keep distracting apps blocked until your quests are done. Upshift for iPhone and Android.',
  keywords = 'upshift, habit tracker, quest blocker, app blocker, screen time, productivity, gamification, goals',
  image = `${SITE_URL}/icon.png`,
  article = false,
  author = 'Upshift Team',
  publishedTime,
  modifiedTime,
  type = 'website',
  noindex = false,
}) => {
  const location = useLocation();
  const path = canonicalPath(location.pathname);
  const canonicalUrl = `${SITE_URL}${path}`;
  const lang = localeFromPath(location.pathname);
  const siteName = 'Upshift';

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = lang;

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('author', author);
    setMeta(
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    const current = LOCALES.find((l) => l.code === lang) || LOCALES[0];
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', article ? 'article' : type, true);
    setMeta('og:site_name', siteName, true);
    setMeta('og:locale', current.ogLocale, true);

    if (article) {
      if (publishedTime) setMeta('article:published_time', publishedTime, true);
      if (modifiedTime) setMeta('article:modified_time', modifiedTime, true);
      if (author) setMeta('article:author', author, true);
    }

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
    setMeta('twitter:site', '@upshift');
    setMeta('twitter:creator', '@upshift');

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Alternate language versions: replace whatever is in <head> with the set for this page.
    document.head
      .querySelectorAll('link[rel="alternate"][hreflang], meta[property="og:locale:alternate"]')
      .forEach((el) => el.remove());

    const basePath = stripLocale(path);
    if (LOCALIZED_PATHS.includes(basePath)) {
      const addAlternate = (hreflang: string, href: string) => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', hreflang);
        link.setAttribute('href', href);
        document.head.appendChild(link);
      };
      LOCALES.forEach((l) => addAlternate(l.hreflang, `${SITE_URL}${localizePath(l.code, basePath)}`));
      addAlternate('x-default', `${SITE_URL}${localizePath('en', basePath)}`);
      LOCALES.filter((l) => l.code !== lang).forEach((l) => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:locale:alternate');
        meta.setAttribute('content', l.ogLocale);
        document.head.appendChild(meta);
      });
    }
  }, [title, description, keywords, image, canonicalUrl, path, lang, article, author, publishedTime, modifiedTime, type, noindex, siteName]);

  return null;
};

export default SEO;
