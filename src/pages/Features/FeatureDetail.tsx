import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { featuresList } from '../../data/features';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';

const FeatureDetail: React.FC = () => {
  const params = useParams();
  const slug = params.slug || '';
  const feature = featuresList.find(f => f.slug === slug);

  if (!feature) {
    return (
      <div className="section">
        <div className="container">
          <h1>Feature not found</h1>
          <p>The feature you are looking for does not exist.</p>
          <Link to="/features" className="btn btn-primary">Back to Features</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div className="section-header text-center">
          <div style={{ fontSize: '3rem' }}>{feature.icon}</div>
          <h1 className="gradient-text" style={{ marginTop: '0.5rem' }}>{feature.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{feature.description}</p>
        </div>

        <div className="modern-grid" style={{ marginTop: '2rem' }}>
          <SpotlightCard>
            <ul className="feature-details">
              {feature.details.map((detail, idx) => (
                <li key={idx}>
                  <span className="detail-bullet">✨</span>
                  {detail}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Try This Feature</StarBorder>
              <Link to="/features" className="btn btn-ghost">All Features →</Link>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetail;


