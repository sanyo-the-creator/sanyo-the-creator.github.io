import React, { useState, useEffect } from 'react';
import { RiTrophyLine as _RiTrophyLine, RiVipCrownLine as _RiVipCrownLine, RiMedalLine as _RiMedalLine } from 'react-icons/ri';
import { FiEye as _FiEye, FiInfo as _FiInfo } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const RiTrophyLine = _RiTrophyLine as React.ElementType;
const RiVipCrownLine = _RiVipCrownLine as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiInfo = _FiInfo as React.ElementType;
const RiMedalLine = _RiMedalLine as React.ElementType;

const PortalLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('leaderboard_ranking')
          .select('*')
          .limit(20);

        if (error) throw error;
        setLeaderboardData(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatViews = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

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
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading real-world rankings...</div>
          ) : leaderboardData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No creators have submitted videos yet. Be the first!</div>
          ) : (
            leaderboardData.map((user, index) => {
              const rank = index + 1;
              return (
                <div key={user.user_id} className={`leaderboard-row ${rank === 1 ? 'rank-1' : ''}`}>
                  <div className="col-rank">
                    <span className="rank-number">{rank}</span>
                    {rank === 1 && <RiTrophyLine className="rank-icon trophy" />}
                    {rank > 1 && rank <= 3 && <RiMedalLine className="rank-icon medal" />}
                  </div>
                  <div className="col-creator">
                    <img 
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} 
                      alt="avatar" 
                      className="creator-avatar" 
                    />
                    <span className="creator-name">{user.display_name}</span>
                  </div>
                  <div className="col-views">
                    <FiEye className="view-icon" /> {formatViews(parseInt(user.total_views || '0'))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalLeaderboard;
