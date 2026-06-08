import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaDiscord as _FaDiscord, 
  FaReddit as _FaReddit, 
  FaChartLine as _FaChartLine, 
  FaDollarSign as _FaDollarSign 
} from 'react-icons/fa';
import StarBorder from '../../components/common/StarBorder/StarBorder';
import './CreatorProgram.css';

const FaDiscord = _FaDiscord as any;
const FaReddit = _FaReddit as any;
const FaChartLine = _FaChartLine as any;
const FaDollarSign = _FaDollarSign as any;

const RedditProgramSection: React.FC = () => {
  return (
    <section className="creator-hero section">
      <div className="container">
        <div className="creator-hero-content">
          <h2 className="creator-title">
            Upshift <span className="gradient-text">Reddit Program</span>
          </h2>
          <p className="creator-subtitle">
            Partner with us to promote Upshift on Reddit and earn money based on your post success.
          </p>

          <div className="creator-steps-grid">
            {/* Step 1 */}
            <div className="creator-step-card">
              <div className="step-icon-wrapper">
                <FaDiscord className="step-icon" />
              </div>
              <h3 className="step-title">1. Join Discord</h3>
              <p className="step-description">
                Join the Upshift Creator Discord to learn everything you need to get started
              </p>
              <a
                href="https://discord.gg/HGsWPTRmp"
                target="_blank"
                rel="noopener noreferrer"
                className="step-link"
              >
                discord.gg/HGsWPTRmp
                <span className="link-arrow">→</span>
              </a>
            </div>

            {/* Step 2 */}
            <div className="creator-step-card">
              <div className="step-icon-wrapper">
                <FaReddit className="step-icon" />
              </div>
              <h3 className="step-title">2. Create</h3>
              <p className="step-description">
                Make Reddit posts promoting Upshift. Earn money for successful posts that drive engagement + bonuses
              </p>
              <Link to="/creator/content" className="step-link" style={{ marginTop: '12px', display: 'flex' }}>
                Download Assets
                <span className="link-arrow">→</span>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="creator-step-card">
              <div className="step-icon-wrapper">
                <FaChartLine className="step-icon" />
              </div>
              <h3 className="step-title">3. Submit</h3>
              <p className="step-description">
                Submit your Reddit posts through our portal to track performance
              </p>
            </div>

            {/* Step 4 */}
            <div className="creator-step-card">
              <div className="step-icon-wrapper">
                <FaDollarSign className="step-icon" />
              </div>
              <h3 className="step-title">4. Earn</h3>
              <p className="step-description">
                Get paid monthly based on your verified post engagement and views
              </p>
            </div>
          </div>

          <div className="program-action">
            <Link to="/portal" style={{ textDecoration: 'none' }}>
              <StarBorder color="#3A29FF" className="portal-btn">
                Go To Creator Portal
              </StarBorder>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RedditProgramSection;
