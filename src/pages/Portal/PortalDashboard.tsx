import React, { useState, useEffect } from 'react';
import { FiClock as _FiClock, FiDollarSign as _FiDollarSign, FiVideo as _FiVideo, FiEye as _FiEye, FiGift as _FiGift } from 'react-icons/fi';
import { BiCalendar as _BiCalendar } from 'react-icons/bi';
const FiClock = _FiClock as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
const FiVideo = _FiVideo as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiGift = _FiGift as React.ElementType;
const BiCalendar = _BiCalendar as React.ElementType;

const PortalDashboard = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 17, h: 18, m: 53, s: 8 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { d, h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
            else {
              h = 23;
              if (d > 0) d--;
            }
          }
        }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Dashboard</h1>
          <p className="portal-page-subtitle">Track your performance and earnings</p>
        </div>
        <div className="portal-date-selector">
          <BiCalendar className="portal-date-icon" />
          <span>April 2026</span>
          <span className="portal-badge-current">Current</span>
          <svg className="portal-chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </header>

      <div className="portal-countdown-banner">
        <FiClock className="portal-countdown-icon" />
        <div className="portal-countdown-timer">
          <span className="portal-time-block">{String(timeLeft.d).padStart(2, '0')}</span><span className="portal-time-label">d</span><span className="portal-time-sep">:</span>
          <span className="portal-time-block">{String(timeLeft.h).padStart(2, '0')}</span><span className="portal-time-label">h</span><span className="portal-time-sep">:</span>
          <span className="portal-time-block">{String(timeLeft.m).padStart(2, '0')}</span><span className="portal-time-label">m</span><span className="portal-time-sep">:</span>
          <span className="portal-time-block">{String(timeLeft.s).padStart(2, '0')}</span><span className="portal-time-label">s</span>
        </div>
        <span className="portal-countdown-text">until monthly payouts finalize (PST)</span>
        <div className="portal-info-icon-small">i</div>
      </div>

      <div className="portal-metrics-grid">
        <div className="portal-metric-card">
          <div className="portal-metric-header">
            <span className="portal-metric-title">Verified Earnings <span className="portal-info-icon-inline">i</span></span>
            <div className="portal-metric-icon-wrapper verified-icon">
              <FiDollarSign />
            </div>
          </div>
          <div className="portal-metric-value">$0.00</div>
          <div className="portal-metric-subtext">April 2026</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-header">
            <span className="portal-metric-title">Unverified Earnings <span className="portal-info-icon-inline">i</span></span>
            <div className="portal-metric-icon-wrapper unverified-icon">
              <FiClock />
            </div>
          </div>
          <div className="portal-metric-value highlight">$0.00</div>
          <div className="portal-metric-subtext">Awaiting review</div>
        </div>

        <div className="portal-metric-card">
           <div className="portal-metric-header">
            <span className="portal-metric-title">Total Posts</span>
            <div className="portal-metric-icon-wrapper posts-icon">
              <FiVideo />
            </div>
          </div>
          <div className="portal-metric-value">0</div>
          <div className="portal-metric-subtext">Submitted videos</div>
        </div>

        <div className="portal-metric-card">
           <div className="portal-metric-header">
            <span className="portal-metric-title">Total Views</span>
            <div className="portal-metric-icon-wrapper views-icon">
              <FiEye />
            </div>
          </div>
          <div className="portal-metric-value">0</div>
          <div className="portal-metric-subtext">Across all videos</div>
        </div>
      </div>

      <div className="portal-payout-deal-card">
        <div className="portal-deal-header">
          <div className="portal-deal-icon">
            <FiGift />
          </div>
          <div>
            <h3 className="portal-deal-title">Your Payout Deal</h3>
            <p className="portal-deal-subtitle">$20 per video that reaches 40k+ views</p>
          </div>
        </div>

        <div className="portal-deal-base">
          <div>
            <div className="portal-deal-label">Base Rate</div>
            <div className="portal-deal-amount">$20</div>
          </div>
          <div className="portal-deal-right">
             <div className="portal-deal-label right-align">per video that reaches</div>
             <div className="portal-deal-target">40K+ views</div>
          </div>
        </div>

        <div className="portal-deal-bonus-section">
          <h4 className="portal-deal-bonus-title">Bonus Tiers</h4>
          
          <div className="portal-deal-bonus-row">
            <div className="portal-deal-bonus-amt"><span className="bullet">•</span> +$30</div>
            <div className="portal-deal-bonus-req">500K views</div>
          </div>
          
          <div className="portal-deal-bonus-row">
            <div className="portal-deal-bonus-amt"><span className="bullet">•</span> +$50</div>
            <div className="portal-deal-bonus-req">1M views</div>
          </div>
        </div>

        <div className="portal-deal-footer">
          Maximum earnings per video: $100
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
