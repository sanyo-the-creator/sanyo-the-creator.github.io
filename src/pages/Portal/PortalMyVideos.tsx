import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch as _FiSearch, FiGrid as _FiGrid, FiList as _FiList, FiVideo as _FiVideo, FiEye as _FiEye } from 'react-icons/fi';
import { BiCalendar as _BiCalendar, BiChevronDown as _BiChevronDown } from 'react-icons/bi';
import { supabase } from '../../lib/supabase';

const FiSearch = _FiSearch as React.ElementType;
const FiGrid = _FiGrid as React.ElementType;
const FiList = _FiList as React.ElementType;
const FiVideo = _FiVideo as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const BiCalendar = _BiCalendar as React.ElementType;
const BiChevronDown = _BiChevronDown as React.ElementType;

const PortalMyVideos = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [syncing, setSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', user.id);

        console.log('Videos Data:', data, 'Error:', error);
        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleSyncTikTok = () => {
    setSyncing(true);
    // Simulate API delay
    setTimeout(() => {
      setSyncing(false);
      setShowSyncSuccess(true);
      
      // Add mock videos for the demo
      setVideos([
        {
          id: 'mock-1',
          video_url: 'https://www.tiktok.com/@upshift/video/123456789',
          thumbnail_url: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/o4f5e7f8a9b0c1d2e3f4g5h6i7j8k9l0~tplv-tiktok-play.jpeg?x-expires=1630000000&x-signature=abcd',
          views: 45200,
          earnings_cents: 2000,
          status: 'approved',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          video_url: 'https://www.tiktok.com/@upshift/video/987654321',
          thumbnail_url: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-p-0068/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6~tplv-tiktok-play.jpeg?x-expires=1630000000&x-signature=efgh',
          views: 1200,
          earnings_cents: 0,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);

      setTimeout(() => setShowSyncSuccess(false), 3000);
    }, 2000);
  };

  const filteredVideos = videos.filter(video => 
    video.video_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">My Videos</h1>
          <p className="portal-page-subtitle">Track the status of your submitted videos</p>
        </div>
        <div className="portal-date-selector">
          <BiCalendar className="portal-date-icon" />
          <span>April 2026</span>
          <span className="portal-badge-current">Current</span>
          <BiChevronDown className="portal-chevron-down" />
        </div>
      </header>

      {/* Filters Bar */}
      <div className="portal-filters-row">
        <div className="portal-search-wrapper">
          <FiSearch className="portal-search-icon" />
          <input 
            type="text" 
            className="portal-search-input" 
            placeholder="Search by TikTok URL..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="portal-filter-dropdown">
          <span>Default</span>
          <BiChevronDown />
        </div>

        <div className="portal-video-count-badge">
          <FiVideo />
          <span>{filteredVideos.length} videos</span>
        </div>

        <div className="portal-view-toggles">
          <button 
            className={`portal-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid />
          </button>
          <button 
            className={`portal-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FiList />
          </button>
        </div>

        <button 
          onClick={handleSyncTikTok}
          disabled={syncing}
          className="portal-sync-btn"
          style={{
            background: 'rgba(254, 44, 85, 0.1)',
            color: '#fe2c55',
            border: '1px solid rgba(254, 44, 85, 0.3)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: syncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: '10px',
            transition: 'all 0.2s ease'
          }}
        >
          {syncing ? 'Syncing...' : 'Sync from TikTok'}
        </button>

        {showSyncSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: '#22c55e',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease-out'
          }}>
            ✅ Videos synced successfully!
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="portal-empty-state-card" style={{ padding: '40px' }}>
          <div style={{ color: '#666' }}>Loading your submissions...</div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="portal-empty-state-card">
          <FiVideo className="portal-empty-state-icon" />
          <h2 className="portal-empty-state-title">No videos yet</h2>
          <p className="portal-empty-state-text">Submit your first video to start earning!</p>
          <Link to="/portal/submit" className="portal-secondary-btn">Submit a Video</Link>
        </div>
      ) : (
        <div className="portal-leaderboard-table">
          <div className="leaderboard-table-header" style={{ gridTemplateColumns: '70px 1fr 100px 100px 120px' }}>
            <span className="col-rank">PREVIEW</span>
            <span className="col-rank">VIDEO URL</span>
            <span className="col-views text-center">VIEWS</span>
            <span className="col-views text-center">EARNINGS</span>
            <span className="col-views text-center">STATUS</span>
          </div>
          <div className="leaderboard-table-body">
            {filteredVideos.map((video) => (
              <div key={video.id} className="leaderboard-row-container" style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="leaderboard-row" style={{ gridTemplateColumns: '70px 1fr 100px 100px 120px', borderBottom: 'none', padding: '12px 20px' }}>
                  <div className="col-rank" style={{ display: 'flex', alignItems: 'center' }}>
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt="thumbnail" 
                        style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x50?text=Video';
                        }}
                      />
                    ) : (
                      <div style={{ width: '50px', height: '50px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiVideo style={{ color: '#666' }} />
                      </div>
                    )}
                  </div>
                  <div className="col-creator" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <a href={video.video_url} target="_blank" rel="noreferrer" className="creator-name" style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontSize: '13px',
                      color: '#3b82f6',
                      textDecoration: 'none'
                    }}>
                      {video.video_url}
                    </a>
                  </div>
                  <div className="col-views" style={{ justifyContent: 'center' }}>
                    <FiEye className="view-icon" /> {video.views || 0}
                  </div>
                  <div className="col-views" style={{ justifyContent: 'center', fontWeight: 'bold', color: video.earnings_cents > 0 ? '#4ade80' : 'inherit' }}>
                    {video.earnings_cents > 0 ? `$${(video.earnings_cents / 100).toFixed(2)}` : '—'}
                  </div>
                  <div className="col-views" style={{ justifyContent: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      backgroundColor: video.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 
                                       video.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: video.status === 'approved' ? '#4ade80' : 
                             video.status === 'rejected' ? '#f87171' : '#f59e0b',
                      textTransform: 'uppercase'
                    }}>
                      {video.status}
                    </span>
                  </div>
                </div>
                {video.status === 'rejected' && video.rejection_reason && (
                  <div style={{ padding: '0 20px 15px 90px', fontSize: '12px', color: '#f87171', marginTop: '-5px' }}>
                    <strong>Rejection reason:</strong> {video.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalMyVideos;
