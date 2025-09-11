import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftProfileImage from '../../assets/images/upshift-profile.png';
import './FeaturePages.css';

const Groups: React.FC = () => {
  return (
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftProfileImage}
              altText="Groups Preview"
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
              <h1 className="feature-hero-title gradient-text">Groups</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Accountability meets community. Join groups, take on challenges, and grow together.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Join a Group</StarBorder>
            </div>
          </div>
        </div>

        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-title">Community Challenges</h3>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🏆</span>Weekly and monthly group quests</li>
              <li><span className="detail-bullet">📣</span>Check-ins and progress snapshots</li>
              <li><span className="detail-bullet">🥇</span>Leaderboards fuel friendly competition</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Join a Group</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-title">Private or Public</h3>
            <p className="feature-description">Create private circles with friends or explore public communities by interest.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🔒</span>Invite-only groups with codes</li>
              <li><span className="detail-bullet">🌍</span>Discover new groups and teammates</li>
              <li><span className="detail-bullet">💬</span>Lightweight discussions for support</li>
            </ul>
          </SpotlightCard>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Find Your Crew</div>
            <div className="benefit-text">Join a public group or create a private one for your friends.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Pick a Challenge</div>
            <div className="benefit-text">Compete on streaks, XP, or specific quests—celebrate wins together.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Climb the Board</div>
            <div className="benefit-text">Share snapshots, track progress, and aim for the weekly top spot.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;


