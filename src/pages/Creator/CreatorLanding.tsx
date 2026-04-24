import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiMagicLine as _RiMagicLine,
  RiTimeLine as _RiTimeLine,
  RiLayoutMasonryLine as _RiLayoutMasonryLine,
  RiArrowLeftLine as _RiArrowLeftLine
} from 'react-icons/ri';
import './Creator.css';
import LightRays from '../../components/common/LightRays/LightRays';

const RiMagicLine = _RiMagicLine as any;
const RiTimeLine = _RiTimeLine as any;
const RiLayoutMasonryLine = _RiLayoutMasonryLine as any;
const RiArrowLeftLine = _RiArrowLeftLine as any;

const CreatorLanding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  return (
    <div className="creator-landing">
      {fromPortal && (
        <Link to="/portal" className="back-to-portal">
          <RiArrowLeftLine /> Back to Portal
        </Link>
      )}
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
      <h1 className="creator-landing-title">Creator Tools</h1>

      <div className="tools-grid">
        <Link to={`/creator/quests${fromPortal ? '?from=portal' : ''}`} className="tool-card">
          <div className="tool-icon-wrapper">
            <RiMagicLine />
          </div>
          <div className="tool-info">
            <h2 className="tool-title">Quests & Routine</h2>
            <p className="tool-description">
              Create countdown templates with ratings and progress circles for social media
            </p>
          </div>
        </Link>

        <Link to={`/creator/screentime${fromPortal ? '?from=portal' : ''}`} className="tool-card">
          <div className="tool-icon-wrapper">
            <RiTimeLine />
          </div>
          <div className="tool-info">
            <h2 className="tool-title">Screen Time Template</h2>
            <p className="tool-description">
              Simplified rating template to track your app usage and digital health
            </p>
          </div>
        </Link>

        <Link to={`/creator/mix${fromPortal ? '?from=portal' : ''}`} className="tool-card">
          <div className="tool-icon-wrapper">
            <RiLayoutMasonryLine />
          </div>
          <div className="tool-info">
            <h2 className="tool-title">Mix & Match</h2>
            <p className="tool-description">
              Combine Quests and Screen Time apps seamlessly in a single layout
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CreatorLanding;
