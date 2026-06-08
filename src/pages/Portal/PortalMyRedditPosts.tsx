import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch as _FiSearch, FiEye as _FiEye, FiExternalLink as _FiExternalLink } from 'react-icons/fi';
import { FaReddit as _FaReddit } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

const FiSearch = _FiSearch as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiExternalLink = _FiExternalLink as React.ElementType;
const FaReddit = _FaReddit as React.ElementType;

const PortalMyRedditPosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('reddit_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false });
        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching reddit posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filtered = posts.filter((p) => (p.reddit_url || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">My Reddit Posts</h1>
          <p className="portal-page-subtitle">Track the status of your submitted Reddit posts</p>
        </div>
      </header>

      <div className="portal-filters-row">
        <div className="portal-search-wrapper">
          <FiSearch className="portal-search-icon" />
          <input
            type="text"
            className="portal-search-input"
            placeholder="Search by Reddit URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="portal-video-count-badge">
          <FaReddit />
          <span>{filtered.length} posts</span>
        </div>
      </div>

      {loading ? (
        <div className="portal-empty-state-card" style={{ padding: 40 }}>
          <div style={{ color: '#666' }}>Loading your submissions...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="portal-empty-state-card">
          <FaReddit className="portal-empty-state-icon" style={{ color: '#ff4500' }} />
          <h2 className="portal-empty-state-title">No Reddit posts yet</h2>
          <p className="portal-empty-state-text">Submit your first Reddit post to start earning!</p>
          <Link to="/portal/submit-reddit" className="portal-secondary-btn">Submit a Reddit Post</Link>
        </div>
      ) : (
        <div className="portal-leaderboard-table">
          <div className="leaderboard-table-header" style={{ gridTemplateColumns: '70px 1fr 90px 100px 100px 120px' }}>
            <span className="col-rank">PREVIEW</span>
            <span className="col-rank">POST</span>
            <span className="col-views text-center">PROOF</span>
            <span className="col-views text-center">VIEWS</span>
            <span className="col-views text-center">EARNINGS</span>
            <span className="col-views text-center">STATUS</span>
          </div>
          <div className="leaderboard-table-body">
            {filtered.map((post) => {
              const preview = post.screenshot_urls && post.screenshot_urls.length > 0 ? post.screenshot_urls[0] : null;
              return (
                <div key={post.id} className="leaderboard-row-container" style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="leaderboard-row" style={{ gridTemplateColumns: '70px 1fr 90px 100px 100px 120px', borderBottom: 'none', padding: '12px 20px' }}>
                    <div className="col-rank" style={{ display: 'flex', alignItems: 'center' }}>
                      {preview ? (
                        <img src={preview} alt="preview" style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <div style={{ width: 50, height: 50, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaReddit style={{ color: '#ff4500' }} />
                        </div>
                      )}
                    </div>
                    <div className="col-creator" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                      <a href={post.reddit_url} target="_blank" rel="noreferrer" className="creator-name" style={{
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, color: '#3b82f6', textDecoration: 'none',
                      }}>
                        {post.reddit_url}
                      </a>
                    </div>
                    <div className="col-views" style={{ justifyContent: 'center' }}>
                      {post.proof_video_url ? (
                        <a href={post.proof_video_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          View <FiExternalLink size={11} />
                        </a>
                      ) : '—'}
                    </div>
                    <div className="col-views" style={{ justifyContent: 'center' }}>
                      <FiEye className="view-icon" /> {(post.views || 0).toLocaleString()}
                    </div>
                    <div className="col-views" style={{ justifyContent: 'center', fontWeight: 'bold', color: post.earnings_cents > 0 ? '#4ade80' : 'inherit' }}>
                      {post.earnings_cents > 0 ? `$${(post.earnings_cents / 100).toFixed(2)}` : '—'}
                    </div>
                    <div className="col-views" style={{ justifyContent: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        backgroundColor: post.status === 'approved' || post.status === 'paid' ? 'rgba(34,197,94,0.1)' : post.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: post.status === 'approved' || post.status === 'paid' ? '#4ade80' : post.status === 'rejected' ? '#f87171' : '#f59e0b',
                        textTransform: 'uppercase',
                      }}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  {post.rejection_reason && (
                    <div style={{ padding: '10px 20px 15px 90px', fontSize: 12, color: post.status === 'rejected' ? '#f87171' : '#4ade80', marginTop: -5, opacity: 0.9, fontStyle: 'italic' }}>
                      <strong>{post.status === 'rejected' ? 'Rejection reason:' : 'Moderator message:'}</strong> {post.rejection_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalMyRedditPosts;
