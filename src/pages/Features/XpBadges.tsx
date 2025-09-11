import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftHomeImage from '../../assets/images/upshift-home.png';
import './FeaturePages.css';

const XpBadges: React.FC = () => {
  return (
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftHomeImage}
              altText="Progress Preview"
              containerHeight="360px"
              imageHeight="320px"
              imageWidth="100%"
              scaleOnHover={1.06}
              rotateAmplitude={10}
              showMobileWarning={false}
              showTooltip={false}
            />
          </div>
          <div>
            <ScrollReveal>
              <h1 className="feature-hero-title gradient-text">XP, Progress & Badges</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Level up across categories, collect badges, and watch your story unfold in beautiful charts.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Earn XP</StarBorder>
            </div>
          </div>
        </div>

        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-title">Level Up</h3>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">📈</span>Category XP and global level</li>
              <li><span className="detail-bullet">🎚️</span>Difficulty scaling and bonuses</li>
              <li><span className="detail-bullet">🎖️</span>Title tiers as you progress</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Earn XP</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-title">Badges & Insights</h3>
            <p className="feature-description">Collect themed badges and explore interactive progress charts and heatmaps.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🏷️</span>Badge sets for milestones</li>
              <li><span className="detail-bullet">📊</span>Charts, trends, and heatmaps</li>
              <li><span className="detail-bullet">🔎</span>Drill down into streaks and habits</li>
            </ul>
          </SpotlightCard>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Earn XP</div>
            <div className="benefit-text">Complete quests, hit streaks, and level up in Money, Strength, Health, Knowledge.</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Unlock Badges</div>
            <div className="benefit-text">Collect sets for milestones and special challenges—display your favorites.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Read the Trends</div>
            <div className="benefit-text">Use charts and heatmaps to see what’s working and where to focus next.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XpBadges;


