import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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

const SEO: React.FC<SEOProps> = ({
  title = 'Upshift - Level up your life',
  description = 'Transform your life with Upshift - The most engaging personal development app. Block distracting apps, set time limits, and achieve your goals.',
  keywords = 'upshift, productivity, app blocker, screen time, focus, personal development, time management, digital wellness',
  image = 'https://joinupshift.com/icon.png',
  article = false,
  author = 'Upshift Team',
  publishedTime,
  modifiedTime,
  type = 'website',
  noindex = false,
}) => {
  const location = useLocation();
  const canonicalUrl = `https://joinupshift.com${location.pathname}`;
  const siteName = 'Upshift';

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', article ? 'article' : type, true);
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:locale', 'en_US', true);

    // Article specific tags
    if (article) {
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime, true);
      }
      if (author) {
        updateMetaTag('article:author', author, true);
      }
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@upshift');
    updateMetaTag('twitter:creator', '@upshift');

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Add alternate language links (if needed in future)
    let alternateLang = document.querySelector('link[rel="alternate"][hreflang="en"]') as HTMLLinkElement;
    if (!alternateLang) {
      alternateLang = document.createElement('link');
      alternateLang.setAttribute('rel', 'alternate');
      alternateLang.setAttribute('hreflang', 'en');
      document.head.appendChild(alternateLang);
    }
    alternateLang.setAttribute('href', canonicalUrl);

  }, [title, description, keywords, image, canonicalUrl, article, author, publishedTime, modifiedTime, type, noindex, siteName]);

  return null;
};

export default SEO;

