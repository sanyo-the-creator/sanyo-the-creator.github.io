import React from 'react';
import SpotlightCard from '../../components/common/SpotlightCard/SpotlightCard';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import ScrollReveal from '../../components/common/ScrollReveal/ScrollReveal';
import TiltedCard from '../../components/common/TiltedCard/TiltedCard';
import upshiftGoalsImage from '../../assets/images/upshift-goals-list.png';
import './FeaturePages.css';

const GoalsJournal: React.FC = () => {
  return (
    <div className="section feature-hero">
      <div className="container">
        <div className="feature-split">
          <div className="feature-media-card">
            <TiltedCard
              imageSrc={upshiftGoalsImage}
              altText="Goals Preview"
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
              <h1 className="feature-hero-title gradient-text">Goals with Journal</h1>
            </ScrollReveal>
            <p className="feature-hero-subtitle">
              Set audacious goals and document the journey with milestones, notes, and photos.
            </p>
            <div className="cta-row" style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary btn-lg" color="#3A29FF">Create a Goal</StarBorder>
            </div>
          </div>
        </div>

        <div className="modern-grid" style={{ marginTop: '1rem' }}>
          <SpotlightCard>
            <h3 className="feature-title">Milestones & Reflections</h3>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">🎯</span>Break goals into actionable milestones</li>
              <li><span className="detail-bullet">🖼️</span>Attach photos to track visible progress</li>
              <li><span className="detail-bullet">🗓️</span>Deadline reminders keep you on pace</li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <StarBorder className="btn btn-primary" color="#3A29FF">Create a Goal</StarBorder>
            </div>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="feature-title">A Journal You’ll Revisit</h3>
            <p className="feature-description">Rich-text notes, mood tags, and prompts help you capture lessons as you grow.</p>
            <ul className="feature-details" style={{ marginTop: '0.75rem' }}>
              <li><span className="detail-bullet">✍️</span>Daily summaries or deep reflections</li>
              <li><span className="detail-bullet">🏷️</span>Tag entries by theme or project</li>
              <li><span className="detail-bullet">🔎</span>Search across entries and milestones</li>
            </ul>
          </SpotlightCard>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="benefit-title">Define North Star</div>
            <div className="benefit-text">Pick an inspiring goal and decide how you’ll measure success.</div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="benefit-title">Break Into Milestones</div>
            <div className="benefit-text">Split into steps with dates; attach photos and notes along the way.</div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="benefit-title">Reflect & Adjust</div>
            <div className="benefit-text">A journal view makes it easy to review, iterate, and stay motivated.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsJournal;


