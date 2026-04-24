import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  FiUsers as _FiUsers,
  FiMousePointer as _FiMousePointer,
  FiDownload as _FiDownload,
  FiDollarSign as _FiDollarSign,
  FiVideo as _FiVideo,
  FiEye as _FiEye,
  FiSearch as _FiSearch,
  FiArrowRight as _FiArrowRight,
  FiShield as _FiShield,
  FiTrendingUp as _FiTrendingUp
} from 'react-icons/fi';
import './AdminDashboard.css';

const FiUsers = _FiUsers as React.ElementType;
const FiMousePointer = _FiMousePointer as React.ElementType;
const FiDownload = _FiDownload as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
const FiVideo = _FiVideo as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiSearch = _FiSearch as React.ElementType;
const FiArrowRight = _FiArrowRight as React.ElementType;
const FiShield = _FiShield as React.ElementType;
const FiTrendingUp = _FiTrendingUp as React.ElementType;

interface UserOverview {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  referral_code: string | null;
  total_clicks: number;
  total_downloads: number;
  total_sales_cents: number;
  total_trials: number;
  video_count: number;
  total_views: number;
  approved_videos: number;
  pending_videos: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'clicks' | 'downloads' | 'trials' | 'revenue' | 'videos' | 'views'>('clicks');

  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    totalClicks: 0,
    totalDownloads: 0,
    totalSales: 0,
    totalTrials: 0,
    totalVideos: 0,
    totalViews: 0,
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); setLoading(false); return; }

      const { data: adminData } = await supabase
        .from('admin_users').select('id').eq('id', user.id).single();
      if (!adminData) { setIsAdmin(false); setLoading(false); return; }
      setIsAdmin(true);

      // Try loading from view first, fallback to profiles
      const { data: usersData, error } = await supabase.from('admin_user_overview').select('*');
      if (error) {
        const { data: profiles } = await supabase.from('referral_profiles').select('*');
        if (profiles) {
          const mapped: UserOverview[] = profiles.map((p: any) => ({
            user_id: p.id, email: '', full_name: p.display_name, avatar_url: p.avatar_url,
            joined_at: p.created_at, referral_code: p.referral_code,
            total_clicks: p.total_clicks || 0, total_downloads: p.total_downloads || 0,
            total_sales_cents: p.total_sales_cents || 0,
            total_trials: p.total_trials || 0,
            video_count: 0, total_views: 0,
            approved_videos: 0, pending_videos: 0,
          }));
          setUsers(mapped);
          computeGlobalStats(mapped);
        }
      } else {
        setUsers(usersData || []);
        computeGlobalStats(usersData || []);
      }
    } catch (err) {
      console.error('Admin load error:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const computeGlobalStats = (userData: UserOverview[]) => {
    setGlobalStats({
      totalUsers: userData.length,
      totalClicks: userData.reduce((sum, u) => sum + (u.total_clicks || 0), 0),
      totalDownloads: userData.reduce((sum, u) => sum + (u.total_downloads || 0), 0),
      totalSales: userData.reduce((sum, u) => sum + (u.total_sales_cents || 0), 0),
      totalTrials: userData.reduce((sum, u) => sum + (u.total_trials || 0), 0),
      totalVideos: userData.reduce((sum, u) => sum + (u.video_count || 0), 0),
      totalViews: userData.reduce((sum, u) => sum + (u.total_views || 0), 0),
    });
  };

  const filteredUsers = users
    .filter(u =>
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.referral_code || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'clicks': return (b.total_clicks || 0) - (a.total_clicks || 0);
        case 'downloads': return (b.total_downloads || 0) - (a.total_downloads || 0);
        case 'trials': return (b.total_trials || 0) - (a.total_trials || 0);
        case 'revenue': return (b.total_sales_cents || 0) - (a.total_sales_cents || 0);
        case 'videos': return (b.video_count || 0) - (a.video_count || 0);
        case 'views': return (b.total_views || 0) - (a.total_views || 0);
        default: return 0;
      }
    });

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const fmtNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return <div className="admin-dashboard"><div className="admin-loader">Loading admin panel...</div></div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="admin-unauthorized">
          <FiShield style={{ fontSize: '48px', color: '#f87171', marginBottom: '16px' }} />
          <h1>Access Denied</h1>
          <p>You don't have admin permissions to view this page.</p>
          <a href="/portal" className="admin-back-btn">Back to Portal</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">
            <FiShield style={{ marginRight: '12px', color: '#f59e0b' }} />
            Admin Dashboard
          </h1>
          <p className="admin-subtitle">Overview of all creators, referrals, videos, and earnings</p>
        </div>
      </header>

      {/* Global Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)' }}><FiUsers /></div>
          <div className="admin-stat-value">{globalStats.totalUsers}</div>
          <div className="admin-stat-label">Total Users</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)' }}><FiMousePointer /></div>
          <div className="admin-stat-value">{fmtNum(globalStats.totalClicks)}</div>
          <div className="admin-stat-label">Total Clicks</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)' }}><FiDownload /></div>
          <div className="admin-stat-value">{globalStats.totalDownloads}</div>
          <div className="admin-stat-label">App Installs</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)' }}><FiDollarSign /></div>
          <div className="admin-stat-value">{fmt(globalStats.totalSales)}</div>
          <div className="admin-stat-label">Total Revenue</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.1)' }}><FiTrendingUp /></div>
          <div className="admin-stat-value">{globalStats.totalTrials}</div>
          <div className="admin-stat-label">Total Trials</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' }}><FiVideo /></div>
          <div className="admin-stat-value">{globalStats.totalVideos}</div>
          <div className="admin-stat-label">Videos Submitted</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)' }}><FiEye /></div>
          <div className="admin-stat-value">{fmtNum(globalStats.totalViews)}</div>
          <div className="admin-stat-label">Total Views</div>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="admin-toolbar">
        <div className="admin-search-bar">
          <FiSearch className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, email, or referral code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="admin-sort-bar">
          <span className="admin-sort-label"><FiTrendingUp /> Sort by</span>
          {[
            { key: 'clicks', label: 'Clicks' },
            { key: 'downloads', label: 'Installs' },
            { key: 'trials', label: 'Trials' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'videos', label: 'Videos' },
            { key: 'views', label: 'Views' },
          ].map(s => (
            <button
              key={s.key}
              className={`admin-sort-btn ${sortBy === s.key ? 'active' : ''}`}
              onClick={() => setSortBy(s.key as any)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="admin-user-count">{filteredUsers.length} users</span>
      </div>

      {/* Users Table */}
      <div className="admin-users-table">
        <div className="admin-table-header">
          <span className="admin-col-user">USER</span>
          <span className="admin-col-code">REF CODE</span>
          <span className="admin-col-stat">CLICKS</span>
          <span className="admin-col-stat">INSTALLS</span>
          <span className="admin-col-stat">TRIALS</span>
          <span className="admin-col-stat">REVENUE</span>
          <span className="admin-col-stat">VIDEOS</span>
          <span className="admin-col-stat">VIEWS</span>
          <span className="admin-col-expand"></span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="admin-empty">No users found</div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.user_id}
              className="admin-user-row"
              onClick={() => navigate(`/admin/user/${user.user_id}`)}
            >
              <div className="admin-col-user">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`}
                  alt=""
                  className="admin-user-avatar"
                />
                <div>
                  <div className="admin-user-name">{user.full_name || 'Unknown'}</div>
                  <div className="admin-user-email">{user.email}</div>
                </div>
              </div>
              <div className="admin-col-code">
                {user.referral_code ? (
                  <span className="admin-ref-code">{user.referral_code}</span>
                ) : (
                  <span style={{ color: '#555', fontSize: '12px' }}>—</span>
                )}
              </div>
              <div className="admin-col-stat">
                <span className={user.total_clicks > 0 ? 'admin-stat-highlight' : ''}>{user.total_clicks}</span>
              </div>
              <div className="admin-col-stat">{user.total_downloads}</div>
              <div className="admin-col-stat">
                <span className={user.total_trials > 0 ? 'admin-stat-highlight' : ''} style={{ color: user.total_trials > 0 ? '#0ea5e9' : 'inherit' }}>
                  {user.total_trials}
                </span>
              </div>
              <div className="admin-col-stat">
                <span className={user.total_sales_cents > 0 ? 'admin-stat-money' : ''}>{fmt(user.total_sales_cents)}</span>
              </div>
              <div className="admin-col-stat">{user.video_count}</div>
              <div className="admin-col-stat">{fmtNum(user.total_views)}</div>
              <div className="admin-col-expand">
                <FiArrowRight style={{ color: '#555', transition: 'color .2s' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
