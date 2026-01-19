import React from 'react';
import { Link } from 'react-router-dom';
import { articles } from '../../data/articles';
import './Articles.css';
import LightRays from '../../components/common/LightRays/LightRays';
import { SEO, StructuredData } from '../../components/common/SEO';

const Articles: React.FC = () => {
  return (
    <div className="articles-page">
      <SEO
        title="Articles - Productivity & Personal Development Tips | Upshift"
        description="Read helpful articles about productivity, app blocking, screen time management, digital wellness, and personal development. Learn how to improve focus and achieve your goals."
        keywords="productivity articles, app blocker guide, screen time tips, digital wellness, focus improvement, personal development, time management, how to block apps"
        image="https://joinupshift.com/icon.png"
        type="website"
      />
      <StructuredData
        type="webpage"
        title="Upshift Articles - Productivity & Personal Development"
        description="Read helpful articles about productivity and personal development"
        url="https://joinupshift.com/articles"
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
      <div className="articles-container">
        {/* <Breadcrumbs
          customItems={[
            { label: 'Home', path: '/' },
            { label: 'Articles', path: '/articles' }
          ]}
        /> */}
        <h1 className="articles-title gradient-text">Articles</h1>

        <div className="articles-list">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className="article-item"
            >
              <div className="article-image">
                <img
                  src={article.mainImage}
                  alt={article.title}
                  onError={(e) => {
                    // Fallback image if main image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/articles/placeholder.jpg';
                  }}
                />
              </div>
              <div className="article-content">
                <h2 className="article-title">{article.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Articles;
