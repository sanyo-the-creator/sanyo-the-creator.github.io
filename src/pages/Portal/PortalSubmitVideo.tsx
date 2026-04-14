import React, { useState, useEffect } from 'react';
import { SiTiktok as _SiTiktok, SiInstagram as _SiInstagram } from 'react-icons/si';
import { IoSend as _IoSend } from 'react-icons/io5';
import { supabase } from '../../lib/supabase';

const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const IoSend = _IoSend as React.ElementType;

const PortalSubmitVideo = () => {
  const [videoUrl, setVideoUrl] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !hasAnyConnection) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      // Determine platform from URL
      const isInstagram = videoUrl.includes('instagram.com');
      const isTiktok = videoUrl.includes('tiktok.com');
      
      if (!isInstagram && !isTiktok) {
        throw new Error('Please enter a valid TikTok or Instagram Reel URL.');
      }

      // Check if user is trying to submit for a platform they haven't connected
      if (isTiktok && !connections.tiktok) {
        throw new Error('You must connect your TikTok account in Settings to submit TikTok videos.');
      }
      if (isInstagram && !connections.instagram) {
        throw new Error('You must connect your Instagram account in Settings to submit Instagram Reels.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to submit a video.');

      const { error } = await supabase.from('videos').insert({
        user_id: user.id,
        platform: isTiktok ? 'tiktok' : 'instagram',
        video_url: videoUrl,
        status: 'pending'
      });

      if (error) throw error;

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
      <div className="account-status-card">
        {!hasAnyConnection ? (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              ⚠️ No Social Accounts Connected
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
              You must connect your TikTok or Instagram account before you can submit videos.
            </p>
            <a href="/portal/settings" style={{ 
              display: 'inline-block', 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: '#fff', 
              borderRadius: '6px', 
              fontSize: '13px', 
              fontWeight: '600',
              textDecoration: 'none'
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
      <form className="submission-input-card" onSubmit={handleSubmit} style={{ opacity: hasAnyConnection ? 1 : 0.5 }}>
        <label className="input-label">Video URL</label>
        <div className="video-url-input-wrapper">
          <input 
            type="text" 
            className="video-url-input" 
            placeholder={hasAnyConnection ? "https://www.tiktok.com/... or https://www.instagram.com/reel/..." : "Connect an account first..."}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={isSubmitting || !hasAnyConnection}
          />
        </div>
        <p className="input-help-text">
          Paste a TikTok URL or Instagram Reel URL. It must belong to one of your connected accounts.
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

        <button className="submit-video-btn" type="submit" disabled={isSubmitting || !videoUrl || !hasAnyConnection}>
          <IoSend /> {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* Requirements Card */}
      <div className="requirements-card">
        <h3 className="requirements-title">Submission Requirements</h3>
        <ul className="requirements-list">
          <li className="requirement-item">
            <span className="requirement-bullet">•</span> Video must be from your connected TikTok or Instagram account
          </li>
          <li className="requirement-item">
            <span className="requirement-bullet">•</span> <strong>TikTok:</strong> tag @upshift (or @Upshift App) in the description
          </li>
          <li className="requirement-item">
            <span className="requirement-bullet">•</span> <strong>Instagram:</strong> tag @upshift.app in the description
          </li>
          <li className="requirement-item">
            <span className="requirement-bullet">•</span> Video must meet the minimum view threshold for your deal
          </li>
          <li className="requirement-item">
            <span className="requirement-bullet">•</span> Each video can only be submitted once
          </li>
          <li className="requirement-item">
            <span className="requirement-bullet">•</span> Videos must be submitted within 30 days of posting
          </li>
        </ul>
      </div>

      {/* Tip Box */}
      <div className="tip-box">
        <div className="tip-header">
          💡 Important Tip
        </div>
        <div className="tip-content">
          Only submit your video when you're satisfied with its view count. Your payout will be calculated based on the views at the time of submission and <strong>will not update</strong> after that.
        </div>
      </div>
    </div>
  );
};

export default PortalSubmitVideo;
