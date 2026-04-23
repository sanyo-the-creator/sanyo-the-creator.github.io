import React from 'react';
import { Link } from 'react-router-dom';
import { 
  RiMagicLine as _RiMagicLine, 
  RiTimeLine as _RiTimeLine,
  RiLayoutMasonryLine as _RiLayoutMasonryLine
} from 'react-icons/ri';
import './Creator.css';

const RiMagicLine = _RiMagicLine as any;
const RiTimeLine = _RiTimeLine as any;
const RiLayoutMasonryLine = _RiLayoutMasonryLine as any;

const CreatorLanding: React.FC = () => {
  return (
    <div className="creator-landing">
      <h1 className="creator-landing-title">Creator Tools</h1>
      
      <div className="tools-grid">
        <Link to="/creator/quests" className="tool-card">
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

        <Link to="/creator/screentime" className="tool-card">
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

        <Link to="/creator/mix" className="tool-card">
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
