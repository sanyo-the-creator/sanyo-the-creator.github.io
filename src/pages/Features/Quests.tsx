import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftGoalsImage from '../../assets/images/upshift-goals-list.png';
import './FeaturePages.css';

const Quests: React.FC = () => {
  return (
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftGoalsImage}
              altText="Quests Preview"
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
              <h1 className="feature-hero-title gradient-text">Quests & Sidequests</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Turn habits into main quests and sidequests. Build streaks, earn XP, and keep momentum with smart difficulty and rewards.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Start a Quest</StarBorder>
            </div>
          </div>
        </div>

        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-title">Design Your Questline</h3>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">✨</span>Main quests for core habits, sidequests for flexible wins</li>
              <li><span className="detail-bullet">✨</span>Daily/weekly cadence with streak protection</li>
              <li><span className="detail-bullet">✨</span>Category XP: Money, Strength, Health, Knowledge</li>
              <li><span className="detail-bullet">✨</span>Difficulty tiers and reward multipliers</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Start a Quest</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-title">Keep the Streak Alive</h3>
            <p className="feature-description">Smart reminders, streak freezes, and variable rewards keep you consistent without burnout.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🔥</span>Adaptive difficulty suggestions</li>
              <li><span className="detail-bullet">📈</span>XP curves and weekly goals</li>
              <li><span className="detail-bullet">🔔</span>Contextual nudges at the right time</li>
            </ul>
          </SpotlightCard>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Define Quest</div>
            <div className="benefit-text">Pick cadence, difficulty, and the XP category. Add a tiny reward to make it fun.</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Execute & Track</div>
            <div className="benefit-text">Complete entries daily and keep the streak alive with gentle reminders.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Level Up</div>
            <div className="benefit-text">Earn XP, unlock badges, and evolve quests as your capacity grows.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quests;


