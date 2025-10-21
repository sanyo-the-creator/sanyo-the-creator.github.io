import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import TextType from '../../components/common/TextType/TextType';
import { Link } from 'react-router-dom';
import { featuresList } from '../../data/features';
import { useMeta } from '../../hooks/useMeta';
import './Features.css';
import ScrollVelocity from '../../components/common/ScrollVelocity/ScrollVelocity';

const additionalFeatures = [
  {
    image: '🎯',
    title: 'Goal Management',
    subtitle: 'Set long-term goals with deadlines and photo documentation',
    borderColor: '#4F46E5',
    gradient: 'linear-gradient(145deg, #4F46E5, #000)',
  },
  {
    image: '👑',
    title: 'Titles & Badges',
    subtitle: 'Unlock special recognition and show off your achievements',
    borderColor: '#10B981',
    gradient: 'linear-gradient(210deg, #10B981, #000)',
  },

  {
    image: '🔒',
    title: 'Privacy First',
    subtitle: 'Your data is secure with end-to-end encryption',
    borderColor: '#EF4444',
    gradient: 'linear-gradient(195deg, #EF4444, #000)',
  },
  {
    image: '🌍',
    title: 'Global Community',
    subtitle: 'Connect with users from around the world',
    borderColor: '#8B5CF6',
    gradient: 'linear-gradient(225deg, #8B5CF6, #000)',
  },
  {
    image: '📈',
    title: 'Analytics',
    subtitle: 'Deep insights into your habits and progress patterns',
    borderColor: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4, #000)',
  }
];

const Features: React.FC = () => {
  // Nastavenie meta tagov pre Features stránku
  useMeta({
    title: 'Features - Upshift App',
    description: 'Discover all features of Upshift: habit tracking, goal setting, time tracking, app blocking, and more. Level up your life with gamification.',
    keywords: 'upshift features, habit tracking, goal setting, time tracker, app blocker, productivity features',
    ogTitle: 'Features - Upshift App',
    ogDescription: 'Discover all features of Upshift app',
    ogImage: 'https://jerguslejko.github.io/upshift-web/static/media/upshift-home.53c469a5cb81ef1f4d25.png'
  });

  return (
    <div className="features-page">
      {/* Hero Section */}
      <section className="features-hero mt-6">
        <div className="">
          <div className="features-hero-content">
            <h1 className="features-title">
              <span className="gradient-text">Powerful</span> Features
            </h1>
            <TextType
              text="Everything you need to transform your life into an epic quest. Discover the tools that make personal growth engaging and sustainable."
              className="features-subtitle"
              typingSpeed={30}
              initialDelay={500}
            />
          </div>
        </div>
      </section>

      <section className="additional-features-section">
        <ScrollVelocity
          components={[
            <div key="all-cards" className="scroll-velocity-spotlight-cards">
              {additionalFeatures.map((feature, index) => (
                <div key={index} className="spotlight-card-container">
                  <SpotlightCard
                    className="additional-feature-spotlight-card"
                    spotlightColor="rgba(57, 70, 255, 0.2)"
                  >
                    <div className="feature-icon-large">{feature.image}</div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.subtitle}</p>
                  </SpotlightCard>
                </div>
              ))}
            </div>
          ]}
          velocity={50}
          isComponent={true}
          numCopies={3}
          className="scroll-velocity-wrapper"
        />
      </section>

      {/* Main Features */}
      <section className="main-features-section">
        <div className="container">
          <div className="kokot-grid">
            {featuresList.map((feature, index) => (
              <SpotlightCard className="feature-card" spotlightColor="rgba(57, 70, 255, 0.2)">
                {/* <div className="feature-icon-large">{feature.icon}</div> */}
                <h3 className="feature-title">{feature.icon} {feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <ul className="feature-details">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>
                      <span className="detail-bullet">&nbsp; 
 </span>
                      {detail}
                    </li>
                  ))}
                </ul>
                {/* <Link to={`/features/${feature.slug}`} className="btn btn-secondary feature-btn mt-3">
                  Learn More →
                </Link> */}
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      {/* <section className="features-cta-section section">
        <div className="container">
          <div className="features-cta-card">
            <div className="cta-content">
              <h2 className="features-cta-title gradient-text">Ready to Experience These Features?</h2>
              <p className="features-cta-description">
                Download Upshift today and start transforming your life with the most engaging personal development app ever created.
              </p>
              <div className="cta-actions">
                <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">
                  Download Now
                </StarBorder>
                <StarBorder className="btn btn-secondary btn-lg" color="#8b5cf6">
                  Watch Demo
                </StarBorder>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Features;
