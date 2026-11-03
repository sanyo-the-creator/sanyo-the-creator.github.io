import React, { useEffect } from 'react';
import { LOCALES, SITE_URL } from '../../../i18n';
import { useLocale } from '../../../i18n';

const APP_STORE_URL = 'https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.upshift.app';
const SUPPORT_EMAIL = 'support@joinupshift.com';
const LOGO = `${SITE_URL}/icon.png`;

interface OrganizationSchemaProps {
  type: 'organization';
  description?: string;
}

interface WebsiteSchemaProps {
  type: 'website';
  description?: string;
}

interface SoftwareSchemaProps {
  type: 'software';
  description: string;
}

interface ArticleSchemaProps {
  type: 'article';
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
}

interface WebPageSchemaProps {
  type: 'webpage';
  title: string;
  description: string;
  url: string;
}

interface FAQSchemaProps {
  type: 'faq';
  items: {
    question: string;
    answer: string;
  }[];
}

interface BreadcrumbSchemaProps {
  type: 'breadcrumb';
  items: { name: string; url: string }[];
}

type StructuredDataProps =
  | OrganizationSchemaProps
  | WebsiteSchemaProps
  | SoftwareSchemaProps
  | ArticleSchemaProps
  | WebPageSchemaProps
  | FAQSchemaProps
  | BreadcrumbSchemaProps;

const StructuredData: React.FC<StructuredDataProps> = (props) => {
  const { lang } = useLocale();

  const getSchema = () => {
    if (props.type === 'organization') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Upshift',
        url: SITE_URL,
        logo: LOGO,
        description: props.description || 'Upshift turns habits into quests and keeps distracting apps blocked until they are done.',
        sameAs: ['https://instagram.com/joinupshift', APP_STORE_URL, PLAY_STORE_URL],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          email: SUPPORT_EMAIL,
          availableLanguage: LOCALES.map((l) => l.hreflang),
        },
      };
    }

    if (props.type === 'website') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Upshift',
        url: SITE_URL,
        inLanguage: lang,
        description: props.description,
        publisher: { '@id': `${SITE_URL}/#organization` },
      };
    }

    if (props.type === 'software') {
      return {
        '@context': 'https://schema.org',
        '@type': 'MobileApplication',
        '@id': `${SITE_URL}/#app`,
        name: 'Upshift',
        description: props.description,
        operatingSystem: 'iOS, Android',
        applicationCategory: 'LifestyleApplication',
        applicationSubCategory: 'Habit tracker and app blocker',
        installUrl: [APP_STORE_URL, PLAY_STORE_URL],
        downloadUrl: APP_STORE_URL,
        image: LOGO,
        inLanguage: LOCALES.map((l) => l.hreflang),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE_URL}/#organization` },
      };
    }

    if (props.type === 'article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: props.title,
        description: props.description,
        image: props.image,
        datePublished: props.datePublished,
        dateModified: props.dateModified || props.datePublished,
        author: {
          '@type': 'Person',
          name: props.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Upshift',
          logo: {
            '@type': 'ImageObject',
            url: LOGO,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': props.url,
        },
      };
    }

    if (props.type === 'webpage') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: props.title,
        description: props.description,
        url: props.url,
        inLanguage: lang,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        publisher: { '@id': `${SITE_URL}/#organization` },
      };
    }

    if (props.type === 'faq') {
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: lang,
        mainEntity: props.items.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      };
    }

    if (props.type === 'breadcrumb') {
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: props.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      };
    }

    return null;
  };

  const schema = getSchema();
  const serialized = schema ? JSON.stringify(schema) : '';

  useEffect(() => {
    if (!serialized) return;

    const selector = `script[type="application/ld+json"][data-schema-type="${props.type}"]`;
    document.querySelector(selector)?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-type', props.type);
    script.textContent = serialized;
    document.head.appendChild(script);

    return () => {
      document.querySelector(selector)?.remove();
    };
  }, [serialized, props.type]);

  return null;
};

export default StructuredData;
