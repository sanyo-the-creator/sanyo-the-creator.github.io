import React, { useState, useEffect } from 'react';
import { FiUser as _FiUser, FiCreditCard as _FiCreditCard, FiAlertCircle as _FiAlertCircle, FiBookOpen as _FiBookOpen } from 'react-icons/fi';
import { SiTiktok as _SiTiktok, SiInstagram as _SiInstagram, SiDiscord as _SiDiscord, SiStripe as _SiStripe } from 'react-icons/si';
import { supabase } from '../../lib/supabase';

const FiUser = _FiUser as React.ElementType;
const FiCreditCard = _FiCreditCard as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiBookOpen = _FiBookOpen as React.ElementType;
const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const SiDiscord = _SiDiscord as React.ElementType;
const SiStripe = _SiStripe as React.ElementType;

const PortalSettings = () => {
  const [isTikTokConnected, setIsTikTokConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch actual user data
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      setUser(user);
    });

    // Check local storage for existing mock connections
    if (localStorage.getItem('tiktok_connected') === 'true') {
      setIsTikTokConnected(true);
    }
    if (localStorage.getItem('instagram_connected') === 'true') {
      setIsInstagramConnected(true);
    }

    // Check URL parameters for OAuth redirect callbacks
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'tiktok_flow') {
      localStorage.setItem('tiktok_connected', 'true');
      setIsTikTokConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (code && state === 'instagram_flow') {
      localStorage.setItem('instagram_connected', 'true');
      setIsInstagramConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTikTokConnect = () => {
    const clientKey = process.env.REACT_APP_TIKTOK_CLIENT_KEY;
    if (!clientKey) {
      console.error('TikTok Client Key missing in environment.');
      return;
    }
    
    // Redirect to TikTok Login Kit v2
    // TikTok strictly requires PKCE (Proof Key for Code Exchange) in v2.
    // For a mock flow, we just provide a validly formatted random base64url string.
    const dummyCodeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    const redirectUri = window.location.origin + '/portal/settings';
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=user.info.profile&redirect_uri=${encodeURIComponent(redirectUri)}&state=tiktok_flow&code_challenge=${dummyCodeChallenge}&code_challenge_method=S256`;
    
    window.location.href = authUrl;
  };

  const handleTikTokDisconnect = () => {
    localStorage.removeItem('tiktok_connected');
    setIsTikTokConnected(false);
  };

  const handleInstagramConnect = () => {
    const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
    if (!clientId) {
      console.error('Instagram Client ID missing in environment.');
      return;
    }
    
    // Redirect to Instagram Basic Display OAuth
    const redirectUri = window.location.origin + '/portal/settings';
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=instagram_flow`;
    
    window.location.href = authUrl;
  };

  const handleInstagramDisconnect = () => {
    localStorage.removeItem('instagram_connected');
    setIsInstagramConnected(false);
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userHandle = `@${user?.user_metadata?.custom_claims?.global_name || user?.email?.split('@')[0] || 'user'}`;
  const userEmail = user?.email || '...';
  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Pulandooo'}`;

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Settings</h1>
          <p className="portal-page-subtitle">Manage your account and preferences</p>
        </div>
      </header>

      {/* Profile Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><FiUser /></div>
          <h3>Profile</h3>
        </div>
        
        <div className="settings-block-content profile-block">
          <img src={userAvatar} alt="avatar" className="settings-avatar" />
          <div className="profile-info">
            <div className="profile-name">{userName}</div>
            <div className="profile-handle text-accent">{userHandle}</div>
            <div className="profile-email">{userEmail}</div>
          </div>
          <div className="profile-discord-badge">
            <SiDiscord />
          </div>
        </div>
      </div>

      {/* TikTok Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><SiTiktok /></div>
          <h3>TikTok Accounts</h3>
        </div>
        
        <div className="settings-block-content center-content">
          {isTikTokConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: '#4ade80', 
                padding: '12px 24px', 
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✅ Connected as @sanyo_creator
              </div>
              <button 
                onClick={handleTikTokDisconnect}
                style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <>
              <button className="settings-connect-btn" onClick={handleTikTokConnect}>+ Connect Account</button>
              <p className="settings-help-text">Connect your account to submit videos and track your earnings.</p>
            </>
          )}
        </div>
      </div>

      {/* Instagram Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><SiInstagram /></div>
          <h3>Instagram Accounts</h3>
        </div>
        
        <div className="settings-block-content center-content">
          {isInstagramConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: '#4ade80', 
                padding: '12px 24px', 
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✅ Connected as {userName}
              </div>
              <button 
                onClick={handleInstagramDisconnect}
                style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <>
              <button className="settings-connect-btn" onClick={handleInstagramConnect}>+ Connect Account</button>
              <p className="settings-help-text">Connect your Instagram account to submit Reels and track your earnings.</p>
            </>
          )}
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><FiCreditCard /></div>
          <h3>Payment Methods</h3>
        </div>
        <p className="settings-section-description">
          Add your payment info below. You only need one to get paid, but adding multiple gives us backup options if there's an issue.
        </p>

        {/* Stripe */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon stripe-icon">🏛️</span> <strong>Bank</strong> (Stripe) <span className="badge-main text-accent">Main</span>
          </div>
          <p className="payment-help">Connect your bank account to receive payouts directly.</p>
          <button className="settings-btn-stripe">
            <SiStripe style={{ marginRight: '6px' }} /> Connect with Stripe
          </button>
        </div>

        {/* Crypto */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon crypto-icon">🟣</span> <strong>Crypto</strong> (USDC on the Solana Network) <span className="badge-main text-accent">Main</span>
          </div>
          <p className="payment-help">Connect your Phantom wallet or enter your address manually to receive USDC payouts.</p>
          
          <div className="payment-actions-row">
            <button className="settings-btn-wallet">
              <span className="phantom-logo">👻</span> Connect Wallet
            </button>
            <button className="settings-btn-manual">
              <span className="edit-icon">✏️</span> Enter Manually
            </button>
          </div>
          
          <div className="warning-box">
             <FiAlertCircle className="warning-icon" />
             <div className="warning-text">
               <strong>Connect Wallet</strong> will request your public wallet address from Phantom — no transactions will be made, and we never access your funds.<br />
               <span className="text-warning-orange">Phantom not detected. <a href="#">Install Phantom</a> or use "Enter Manually" below.</span>
             </div>
          </div>
          <div className="wallet-help-link">
             <FiBookOpen /> How to get a wallet
          </div>
        </div>

        {/* PayPal */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon paypal-icon">P</span> <strong>PayPal</strong> <span className="info-circle-tiny">i</span>
          </div>
          
          <div className="form-group">
            <label>PAYPAL EMAIL OR USERNAME</label>
            <input type="text" placeholder="yourname@example.com or @username" className="settings-input" />
          </div>
          <div className="form-group">
            <label>CONFIRM</label>
            <input type="text" placeholder="Enter again to confirm" className="settings-input" />
          </div>
          <button className="settings-save-btn">Save</button>
        </div>

        {/* Cash App */}
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title">
            <span className="payment-icon cashapp-icon">$</span> <strong>Cash App</strong> <span className="info-circle-tiny">i</span>
          </div>
          
          <div className="form-group">
            <label>$CASHTAG</label>
            <input type="text" placeholder="$YourCashTag" className="settings-input" />
          </div>
          <div className="form-group">
            <label>CONFIRM $CASHTAG</label>
            <input type="text" placeholder="Enter again to confirm" className="settings-input" />
          </div>
          <button className="settings-save-btn">Save</button>
        </div>

      </div>
    </div>
  );
};

export default PortalSettings;
