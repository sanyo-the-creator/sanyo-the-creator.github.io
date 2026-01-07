import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getArticleBySlug } from '../../data/articles';
import { ArticleContent } from '../../types/articles';
import './ArticleDetail.css';
import LightRays from '../../components/common/LightRays/LightRays';
import { SEO, StructuredData } from '../../components/common/SEO';
import Breadcrumbs from '../../components/common/Breadcrumbs/Breadcrumbs';

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [articleContent, setArticleContent] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const article = slug ? getArticleBySlug(slug) : null;

  useEffect(() => {
    if (!article) {
      setLoading(false);
      return;
    }

    const loadArticleContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load HTML content from the specified path
        const response = await fetch(article.htmlContentPath);

        if (!response.ok) {
          throw new Error(`Failed to load article content: ${response.status}`);
        }

        const htmlContent = await response.text();

        setArticleContent({
          title: article.title,
          subtitle: article.subtitle,
          mainImage: article.mainImage,
          htmlContent
        });
      } catch (err) {
        console.error('Error loading article content:', err);
        setError('Failed to load article content');
      } finally {
        setLoading(false);
      }
    };

    loadArticleContent();
  }, [article]);

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  if (loading) {
    return (
      <div className="article-detail-page">
        <div className="article-detail-container">
          <div className="loading-spinner">Loading article...</div>
        </div>
      </div>
    );
  }

  if (error || !articleContent) {
    return (
      <div className="article-detail-page">
        <div className="article-detail-container">
          <div className="error-message">
            {error || 'Article content not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      <SEO
        title={`${articleContent.title} | Upshift`}
        description={articleContent.subtitle}
        image={articleContent.mainImage}
        article={true}
        author="Upshift Team"
        publishedTime={article.publishedDate || new Date().toISOString()}
        type="article"
      />
      <StructuredData
        type="article"
        title={articleContent.title}
        description={articleContent.subtitle}
        image={articleContent.mainImage}
        datePublished={article.publishedDate || new Date().toISOString()}
        author="Upshift Team"
        url={`https://joinupshift.com/articles/${slug}`}
      />
      <LightRays
        raysOrigin="top-center"
        raysColor="#667EEA"
        raysSpeed={0.6}
        lightSpread={1.5}
        rayLength={2}
        pulsating={true}
        fadeDistance={1.2}
        saturation={0.8}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.05}
        distortion={0.1}
      />
      <div className="article-detail-container">
        <Breadcrumbs
          customItems={[
            { label: 'Home', path: '/' },
            { label: 'Articles', path: '/articles' },
            { label: articleContent.title, path: `/articles/${slug}` }
          ]}
        />
        <header className="article-header">
          <h1 className="article-detail-title">{articleContent.title}</h1>
          <p className="article-detail-subtitle">{articleContent.subtitle}</p>
          <div className="article-main-image">
            <img
              src={articleContent.mainImage}
              alt={articleContent.title}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/articles/placeholder.jpg';
              }}
            />
          </div>
        </header>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: articleContent.htmlContent }}
        />
      </div>
    </div>
  );
};

export default ArticleDetail;
