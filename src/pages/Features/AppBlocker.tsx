import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftHomeImage from '../../assets/images/upshift-home.png';
import upshiftGoalsImage from '../../assets/images/upshift-goals-list.png';
import upshiftProfileImage from '../../assets/images/upshift-profile.png';
import './FeaturePages.css';

// Inspiration: robust content-blocking UX similar to QUITTR’s approach
// Reference: `https://quittrapp.com/ultimate-content-blocker`

const AppBlocker: React.FC = () => {
  return (
    <>
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftHomeImage}
              altText="App Blocker Preview"
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
              <h1 className="feature-hero-title gradient-text">Breaking the Distraction Loop</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Intelligent, real-time blocking to keep you on track. Covers common loopholes and prevents exposure before it derails you.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Enable Blocking</StarBorder>
              <StarBorder className="btn btn-secondary btn-lg" color="#8b5cf6">Learn How It Works</StarBorder>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="section">
      <div className="container">
        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-section-title">Covers Loopholes</h3>
            <p className="feature-description">Block distracting apps and content with layered rules and context-aware detection.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🛡️</span>Domain, keyword, and category filters</li>
              <li><span className="detail-bullet">🧠</span>Real-time checks during focus</li>
              <li><span className="detail-bullet">🔒</span>Session locks tied to goals</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Enable Blocking</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-section-title">Stay in Control</h3>
            <p className="feature-description">Overrides with friction, accountability prompts, and audit logs keep you honest and safe.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">⏳</span>Cooldown timers for overrides</li>
              <li><span className="detail-bullet">👀</span>Optional accountability reports</li>
              <li><span className="detail-bullet">📜</span>Session history and insights</li>
            </ul>
          </SpotlightCard>
        </div>
      </div>
    </div>

    <div className="section">
      <div className="container">
        <ScrollReveal>
          <h2 className="feature-section-title">Seamless, Real-Time Protection</h2>
        </ScrollReveal>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-media">
              <img src={upshiftGoalsImage} alt="Detection" className="media-rounded" />
            </div>
            <div>
              <div className="benefit-title">Real-time Detection</div>
              <div className="benefit-text">AI-like checks watch for triggers during focus sessions and block them before they become a problem.</div>
            </div>
          </div>
          <div className="benefit-card">
            <div className="benefit-media">
              <img src={upshiftProfileImage} alt="Coverage" className="media-rounded" />
            </div>
            <div>
              <div className="benefit-title">Covers Common Workarounds</div>
              <div className="benefit-text">Domains, keywords, search engines, and app-level locks reduce loopholes and keep you in control.</div>
            </div>
          </div>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Pick Focus Goal</div>
            <div className="benefit-text">Select a goal or quest to link your blocking session to real outcomes.</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Start Session</div>
            <div className="benefit-text">Blocking activates instantly, with gentle friction for attempts to bypass.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Review Insights</div>
            <div className="benefit-text">See triggers, attempted overrides, and improvements to your focus resilience.</div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AppBlocker;


