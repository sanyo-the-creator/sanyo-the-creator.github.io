import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftHomeImage from '../../assets/images/upshift-home.png';
import './FeaturePages.css';

const TimeTracker: React.FC = () => {
  return (
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftHomeImage}
              altText="Time Tracker Preview"
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
              <h1 className="feature-hero-title gradient-text">Time Tracker</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Track deep work, focus sessions, and screen time. See where your time actually goes.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Start a Session</StarBorder>
            </div>
          </div>
        </div>

        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-title">Sessions that Fit Your Flow</h3>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🍅</span>Pomodoro and custom session lengths</li>
              <li><span className="detail-bullet">🏷️</span>Automatic tagging and manual overrides</li>
              <li><span className="detail-bullet">📊</span>Daily, weekly, and project reports</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Start a Session</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-title">See Patterns Clearly</h3>
            <p className="feature-description">Identify peak hours, session quality, and distractions to optimize your schedule.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">⏰</span>Trendlines and heatmaps</li>
              <li><span className="detail-bullet">🔗</span>Link time blocks to quests and goals</li>
              <li><span className="detail-bullet">⚠️</span>Smart alerts to reduce context switching</li>
            </ul>
          </SpotlightCard>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Plan Blocks</div>
            <div className="benefit-text">Choose a method (Pomodoro/custom), assign tags and linked quests.</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Focus Deeply</div>
            <div className="benefit-text">Minimize context switching; blocker can auto-activate for focus.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Review Time</div>
            <div className="benefit-text">See trends and heatmaps. Iterate your schedule for better results.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;


