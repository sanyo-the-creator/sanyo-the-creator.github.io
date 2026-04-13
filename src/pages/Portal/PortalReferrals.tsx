import React from 'react';
import { FiGift as _FiGift, FiClock as _FiClock } from 'react-icons/fi';

const FiGift = _FiGift as React.ElementType;
const FiClock = _FiClock as React.ElementType;

const PortalReferrals = () => {
  return (
    <div className="portal-dashboard">
      <div className="portal-referrals-container">
        
        <div className="referrals-hero-icon">
          <FiGift />
        </div>
        
        <h1 className="referrals-title">Referrals</h1>
        
        <div className="referrals-badge">
          <FiClock className="referrals-badge-icon" /> Coming Soon
        </div>
        
        <p className="referrals-description">
          Earn rewards by inviting other creators to join the platform.<br />
          Stay tuned for this exciting new feature!
        </p>
        
        <div className="referrals-stats">
          <div className="referrals-stat-block">
            <div className="stat-value text-accent">$10</div>
            <div className="stat-label">Per referral</div>
          </div>
          
          <div className="referrals-stat-block">
            <div className="stat-value text-light">Unlimited</div>
            <div className="stat-label">Referrals</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortalReferrals;
