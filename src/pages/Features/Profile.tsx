import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftProfileImage from '../../assets/images/upshift-profile.png';
import './FeaturePages.css';

const Profile: React.FC = () => {
  return (
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftProfileImage}
              altText="Profile Preview"
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
              <h1 className="feature-hero-title gradient-text">Profile</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Your identity, story, and public presence—curated to show meaningful progress.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Edit Profile</StarBorder>
            </div>
          </div>
        </div>

        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-title">Make It Yours</h3>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🖼️</span>Avatar, header, and profile card</li>
              <li><span className="detail-bullet">🖊️</span>Bio with links and highlights</li>
              <li><span className="detail-bullet">🔐</span>Privacy controls for each section</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Edit Profile</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-title">Show Your Work</h3>
            <p className="feature-description">Pin achievements, share quests, and let your streaks speak for themselves.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">📌</span>Pinned quests and goals</li>
              <li><span className="detail-bullet">📣</span>Shareable progress snapshots</li>
              <li><span className="detail-bullet">🤝</span>Follow friends and celebrate wins</li>
            </ul>
          </SpotlightCard>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Set Identity</div>
            <div className="benefit-text">Choose visuals and describe your mission. Keep parts private or public.</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Show Progress</div>
            <div className="benefit-text">Pin your best work—quests, milestones, and badges—so others get inspired.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Connect</div>
            <div className="benefit-text">Follow friends, comment on wins, and grow together with accountability.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


