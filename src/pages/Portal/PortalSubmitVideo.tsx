import React, { useState, useEffect } from 'react';
import { SiTiktok as _SiTiktok, SiInstagram as _SiInstagram } from 'react-icons/si';
import { IoSend as _IoSend } from 'react-icons/io5';
import { supabase } from '../../lib/supabase';

const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const IoSend = _IoSend as React.ElementType;

const PortalSubmitVideo = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [views, setViews] = useState('');
  const [earnings, setEarnings] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [connections, setConnections] = useState({ tiktok: false, instagram: false });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Check mock connections from localStorage
    setConnections({
      tiktok: localStorage.getItem('tiktok_connected') === 'true',
      instagram: localStorage.getItem('instagram_connected') === 'true'
    });
  }, []);

  const hasAnyConnection = connections.tiktok || connections.instagram;

  const [fetchedStats, setFetchedStats] = useState<{ views: number, earnings: number } | null>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(false);

  // Effect to "fetch" stats when URL changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!videoUrl || (!videoUrl.includes('tiktok.com') && !videoUrl.includes('instagram.com') && !videoUrl.includes('ig.me'))) {
        setFetchedStats(null);
        return;
      }

      setIsFetchingStats(true);
      try {
        const isTiktok = videoUrl.includes('tiktok.com');
        let viewsValue = 0;
        let thumb = '';
        let bioVerified = true;
        let bioError = '';
        
        if (isTiktok) {
          // 1. Fetch Video Info (Views & Thumbnail)
          const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`);
          if (res.ok) {
            const result = await res.json();
            if (result.code === 0 && result.data) {
              viewsValue = result.data.play_count || 0;
              thumb = result.data.cover || '';
              
              // 2. Extract Username & Verify Bio
              const usernameMatch = videoUrl.match(/@([a-zA-Z0-9._-]+)/);
              if (usernameMatch && usernameMatch[1]) {
                const username = usernameMatch[1];
                const userRes = await fetch(`https://www.tikwm.com/api/user/info?unique_id=${username}`);
                if (userRes.ok) {
                  const userData = await userRes.json();
                  if (userData.code === 0 && userData.data) {
                    const signature = (userData.data.user.signature || '').toLowerCase();
                    
                    // Fetch current user's referral code
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const { data: profile } = await supabase
                        .from('referral_profiles')
                        .select('referral_code')
                        .eq('id', user.id)
                        .single();
                      
                      const refCode = profile?.referral_code || '';
                      
                      // Construct the exact URL they are supposed to have in bio
                      // Format: domain/download/tiktok?ref=code
                      const domain = window.location.hostname === 'localhost' ? 'joinupshift.com' : window.location.hostname;
                      const exactLink = `${domain}/download/tiktok?ref=${refCode}`.toLowerCase();
                      
                      const hasExactLink = signature.includes(exactLink);
                      
                      if (!hasExactLink) {
                        bioVerified = false;
                        bioError = `Exact referral link not found in @${username}'s bio. You must have "${exactLink}" in your profile to submit.`;
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          // Deterministic mock for Instagram
          let hash = 0;
          for (let i = 0; i < videoUrl.length; i++) {
            hash = ((hash << 5) - hash) + videoUrl.charCodeAt(i);
            hash |= 0; 
          }
          viewsValue = Math.abs(hash % 1500000);

          const match = videoUrl.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
          if (match && match[1]) thumb = `https://www.instagram.com/p/${match[1]}/media/?size=l`;
        }

        // Payout Logic
        let earningsValue = 0;
        if (viewsValue >= 1000000) earningsValue = 100;
        else if (viewsValue >= 500000) earningsValue = 50;
        else if (viewsValue >= 40000) earningsValue = 20;

        if (!bioVerified) {
          setStatus({ type: 'error', message: bioError });
          setFetchedStats(null);
        } else {
          setFetchedStats({ views: viewsValue, earnings: earningsValue });
          if (status.type === 'error') setStatus({ type: null, message: '' });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsFetchingStats(false);
      }
    };

    const timer = setTimeout(fetchStats, 1000);
    return () => clearTimeout(timer);
  }, [videoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      // Determine platform from URL
      const isInstagram = videoUrl.includes('instagram.com') || videoUrl.includes('ig.me');
      const isTiktok = videoUrl.includes('tiktok.com');
      
      if (!isInstagram && !isTiktok) {
        throw new Error('Please enter a valid TikTok or Instagram Reel URL.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to submit a video.');

      // Check if video URL was already submitted by anyone
      const { data: existingVideo, error: checkError } = await supabase
        .from('videos')
        .select('id, status')
        .eq('video_url', videoUrl)
        .maybeSingle();

      if (checkError) console.error('Error checking existing video:', checkError);
      
      if (existingVideo) {
        throw new Error(`This video has already been submitted and is currently ${existingVideo.status}.`);
      }

      let thumbnail_url = '';
      try {
        if (isTiktok) {
          const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
          if (response.ok) {
            const data = await response.json();
            thumbnail_url = data.thumbnail_url;
          }
        } else if (isInstagram) {
          const match = videoUrl.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
          if (match && match[1]) {
            thumbnail_url = `https://www.instagram.com/p/${match[1]}/media/?size=l`;
          }
        }
      } catch (err) {
        console.error('Error fetching thumbnail:', err);
      }

      const { error } = await supabase.from('videos').insert({
        user_id: user.id,
        platform: isTiktok ? 'tiktok' : 'instagram',
        video_url: videoUrl,
        thumbnail_url: thumbnail_url,
        views: fetchedStats?.views || 0,
        earnings_cents: Math.round((fetchedStats?.earnings || 0) * 100),
        status: 'pending'
      });

      if (error) {
        if (error.code === '23505') { // Postgres unique_violation code
          throw new Error('This video has already been submitted.');
        }
        throw error;
      }

      setStatus({ type: 'success', message: 'Video submitted successfully! It is now awaiting review.' });
      setVideoUrl('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userHandle = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Felix'}`;

  return (
    <div className="portal-submit-container">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Submit Video</h1>
          <p className="portal-page-subtitle">Enter your TikTok or Instagram Reel link to submit</p>
        </div>
      </header>

      {/* Account Status Card */}
      <div className="account-status-card" style={{ marginBottom: '20px' }}>
        {!hasAnyConnection ? (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              ⚠️ Social Accounts Not Connected
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              We recommend connecting your accounts in Settings for faster verification, but you can still submit via link below.
            </p>
            <a href="/portal/settings" style={{ 
              display: 'inline-block', 
              padding: '8px 16px', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              borderRadius: '6px', 
              fontSize: '13px', 
              fontWeight: '600',
              textDecoration: 'none',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              Go to Settings
            </a>
          </div>
        ) : (
          <>
            <div className="account-status-badge">
              <span className="status-dot"></span> Account Connected
            </div>
            {connections.tiktok && (
              <div className="account-info-row">
                <SiTiktok className="account-platform-icon" />
                <img src={userAvatar} alt="avatar" className="account-avatar-small" />
                <span className="account-handle-text">@{userHandle} (TikTok)</span>
              </div>
            )}
            {connections.instagram && (
              <div className="account-info-row" style={{ marginTop: connections.tiktok ? '8px' : '0' }}>
                <SiInstagram className="account-platform-icon" style={{ color: '#E1306C' }} />
                <img src={userAvatar} alt="avatar" className="account-avatar-small" />
                <span className="account-handle-text">@{userHandle} (Instagram)</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Card */}
      <form className="submission-input-card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label className="input-label">Video URL</label>
          <div className="video-url-input-wrapper">
            <input 
              type="text" 
              className="video-url-input" 
              placeholder="https://www.tiktok.com/... or Instagram link"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Stats Preview Card */}
        {(isFetchingStats || fetchedStats) && (
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: '12px', 
            padding: '15px', 
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            {isFetchingStats ? (
              <div style={{ fontSize: '13px', color: '#666' }}>Fetching video stats...</div>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Views</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{fetchedStats?.views.toLocaleString()}</div>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Earnings</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>${fetchedStats?.earnings.toFixed(2)}</div>
                </div>
              </>
            )}
          </div>
        )}
        
        <p className="input-help-text" style={{ marginBottom: '20px' }}>
          Paste your TikTok or Instagram Reel URL. We'll automatically estimate your views and earnings.
        </p>
        
        {status.type && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px',
            backgroundColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.type === 'success' ? '#4ade80' : '#f87171',
            border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            {status.message}
          </div>
        )}

        <button className="submit-video-btn" type="submit" disabled={isSubmitting || !videoUrl}>
          <IoSend /> {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* Rules Section */}
      <div className="requirements-card" style={{ marginBottom: '20px' }}>
        <h3 className="requirements-title">Submission Info</h3>
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px', lineHeight: '1.6' }}>
          <strong>How to submit:</strong><br />
          – Login to the Upshift Creator Portal and connect your TikTok and Instagram accounts in the Settings.<br />
          – If you're connecting an Instagram account, make sure it's a Business/Professional account; otherwise it can't connect.<br />
          – When a video qualifies and you're satisfied with its view count, submit it using the form above.
        </p>
        
        <h3 className="requirements-title">Submission Rules</h3>
        <ul className="requirements-list">
          <li className="requirement-item"><span className="requirement-bullet">•</span> Video must meet the minimum view threshold for your deal</li>
          <li className="requirement-item"><span className="requirement-bullet">•</span> Payout is calculated based on views at the time of submission (will not update)</li>
          <li className="requirement-item"><span className="requirement-bullet">•</span> You have exactly <strong>30 days</strong> from the time of posting to submit</li>
          <li className="requirement-item"><span className="requirement-bullet">•</span> Only post content in <strong>English</strong></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span> You are <strong>NOT allowed to steal</strong> videos from other Upshift editors</li>
          <li className="requirement-item"><span className="requirement-bullet">•</span> No other brands/promos in the video</li>
          <li className="requirement-item"><span className="requirement-bullet">•</span> Add your Referral Link to your Bio (essential for verification)</li>
        </ul>
      </div>

      {/* Content Rules Card */}
      <div className="requirements-card">
        <h3 className="requirements-title">Video & Content Rules</h3>
        <div style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6' }}>
          <ol style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}>Tie your viral content style into <strong>productivity</strong>. The goal is to go viral.</li>
            <li style={{ marginBottom: '10px' }}>You MUST use our customizable <strong>Upshift template</strong> or clips at least once. Found at <a href="https://joinupshift.com/creator" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>joinupshift.com/creator</a>.</li>
            <li style={{ marginBottom: '10px' }}>Show template within first <strong>15s MAX</strong>, full-screen by itself for <strong>min 2 seconds</strong>.</li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Tag us in the first line of description:</strong><br />
              Instagram: <strong>@byupshift</strong> | TikTok: <strong>@joinupshift.com</strong><br />
              Example: "Upshift video clip + Level Up Your Life w @byupshift"
            </li>
            <li style={{ marginBottom: '10px' }}>Post to story + comment "What's the app?" from another account and reply "Upshift - Level Up Your Life".</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PortalSubmitVideo;
