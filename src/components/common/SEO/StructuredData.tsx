import React, { useEffect } from 'react';

interface OrganizationSchemaProps {
  type: 'organization';
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

type StructuredDataProps = OrganizationSchemaProps | ArticleSchemaProps | WebPageSchemaProps | FAQSchemaProps;

const StructuredData: React.FC<StructuredDataProps> = (props) => {
  const getSchema = () => {
    if (props.type === 'organization') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Upshift',
        url: 'https://joinupshift.com',
        logo: 'https://joinupshift.com/icon.png',
        description: 'Transform your life with Upshift - The most engaging personal development app',
        sameAs: [
          'https://instagram.com/joinupshift',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          email: 'support@upshift.app',
        },
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
            url: 'https://joinupshift.com/icon.png',
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
        publisher: {
          '@type': 'Organization',
          name: 'Upshift',
          logo: {
            '@type': 'ImageObject',
            url: 'https://joinupshift.com/icon.png',
          },
        },
      };
    }

    if (props.type === 'faq') {
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
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

    return null;
  };

  const schema = getSchema();

  useEffect(() => {
    if (!schema) return;

    // Remove existing schema script if any
    const existingScript = document.querySelector('script[type="application/ld+json"][data-schema-type="' + props.type + '"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-type', props.type);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-schema-type="' + props.type + '"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema, props.type]);

  return null;
};

export default StructuredData;

