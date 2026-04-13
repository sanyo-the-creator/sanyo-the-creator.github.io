import React, { useState } from 'react';
import { BiCalendar as _BiCalendar } from 'react-icons/bi';
import { RiTrophyLine as _RiTrophyLine, RiVipCrownLine as _RiVipCrownLine, RiMedalLine as _RiMedalLine } from 'react-icons/ri';
import { FiEye as _FiEye, FiInfo as _FiInfo } from 'react-icons/fi';

const BiCalendar = _BiCalendar as React.ElementType;
const RiTrophyLine = _RiTrophyLine as React.ElementType;
const RiVipCrownLine = _RiVipCrownLine as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiInfo = _FiInfo as React.ElementType;
const RiMedalLine = _RiMedalLine as React.ElementType;

const leaderboardData = [
  { rank: 1, name: 'carllop', views: '2.6M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carllop' },
  { rank: 2, name: '1x.shaunn', views: '2.6M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shaunn' },
  { rank: 3, name: 'Kuba', views: '2.1M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kuba' },
  { rank: 4, name: 'Lookmaxing 2585', views: '2.1M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lookmax' },
  { rank: 5, name: 'Thor.xyz', views: '1.6M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thor' },
  { rank: 6, name: '48', views: '1.6M', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=48' }
];

const PortalLeaderboard = () => {
  const [filter, setFilter] = useState<'Unverified' | 'Verified'>('Unverified');

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Leaderboard</h1>
          <p className="portal-page-subtitle">See how you rank against other creators this month</p>
        </div>
        <div className="portal-leaderboard-controls">
          <div className="portal-date-selector">
            <span>April 2026</span>
            <svg className="portal-chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          
          <div className="portal-toggle-group">
            <button 
              className={`portal-toggle-btn ${filter === 'Unverified' ? 'active' : ''}`}
              onClick={() => setFilter('Unverified')}
            >
              Unverified <span className="portal-info-icon-inline">i</span>
            </button>
            <button 
              className={`portal-toggle-btn ${filter === 'Verified' ? 'active' : ''}`}
              onClick={() => setFilter('Verified')}
            >
              Verified <span className="portal-info-icon-inline">i</span>
            </button>
          </div>
        </div>
      </header>

      <div className="portal-rules-box">
        <FiInfo className="portal-rules-icon" />
        <div className="portal-rules-content">
          <p>
            Creators are ranked by <strong>total views</strong> across all submitted videos for the selected month. The top 10 earn from the prize pool:
          </p>
          <div className="portal-rules-grid">
            <div className="portal-rule-col"><span className="text-muted">1st</span> <span className="text-accent">$300</span></div>
            <div className="portal-rule-col"><span className="text-muted">2nd</span> <span className="text-accent">$200</span></div>
            <div className="portal-rule-col"><span className="text-muted">3rd</span> <span className="text-accent">$150</span></div>
            <div className="portal-rule-col"><span className="text-muted">4th</span> <span className="text-accent">$100</span></div>
            <div className="portal-rule-col"><span className="text-muted">5th</span> <span className="text-accent">$80</span></div>
            <div className="portal-rule-col"><span className="text-muted">6th</span> <span className="text-accent">$60</span></div>
            <div className="portal-rule-col"><span className="text-muted">7th</span> <span className="text-accent">$40</span></div>
            <div className="portal-rule-col"><span className="text-muted">8th</span> <span className="text-accent">$30</span></div>
            <div className="portal-rule-col"><span className="text-muted">9th</span> <span className="text-accent">$20</span></div>
            <div className="portal-rule-col"><span className="text-muted">10th</span> <span className="text-accent">$20</span></div>
          </div>
        </div>
      </div>

      <div className="portal-prize-pool-card">
        <div className="prize-pool-left">
          <div className="prize-pool-icon">
            <RiVipCrownLine />
          </div>
          <div>
            <div className="prize-pool-label">This Month's Prize Pool</div>
            <div className="prize-pool-amount">$1,000</div>
          </div>
        </div>
        <div className="prize-pool-right">
          <div className="prize-pool-label text-right">Split among top</div>
          <div className="prize-pool-target">10 creators</div>
        </div>
      </div>

      <div className="portal-leaderboard-table">
        <div className="leaderboard-table-header">
          <span className="col-rank">RANK</span>
          <span className="col-creator">CREATOR</span>
          <span className="col-views">VIEWS</span>
        </div>

        <div className="leaderboard-table-body">
          {leaderboardData.map((user, index) => (
            <div key={index} className={`leaderboard-row ${user.rank === 1 ? 'rank-1' : ''}`}>
              <div className="col-rank">
                <span className="rank-number">{user.rank}</span>
                {user.rank === 1 && <RiTrophyLine className="rank-icon trophy" />}
                {user.rank > 1 && user.rank <= 3 && <RiMedalLine className="rank-icon medal" />}
              </div>
              <div className="col-creator">
                <img src={user.avatar} alt="avatar" className="creator-avatar" />
                <span className="creator-name">{user.name}</span>
              </div>
              <div className="col-views">
                <FiEye className="view-icon" /> {user.views}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalLeaderboard;
