import React, { useState, useEffect } from 'react';
import { FiUser as _FiUser, FiCreditCard as _FiCreditCard, FiAlertCircle as _FiAlertCircle, FiBookOpen as _FiBookOpen, FiClock as _FiClock } from 'react-icons/fi';
import { SiTiktok as _SiTiktok, SiInstagram as _SiInstagram, SiDiscord as _SiDiscord, SiStripe as _SiStripe } from 'react-icons/si';
import { supabase } from '../../lib/supabase';

const FiUser = _FiUser as React.ElementType;
const FiCreditCard = _FiCreditCard as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiBookOpen = _FiBookOpen as React.ElementType;
const FiClock = _FiClock as React.ElementType;
const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const SiDiscord = _SiDiscord as React.ElementType;
const SiStripe = _SiStripe as React.ElementType;

const PortalSettings = () => {
  const [isTikTokConnected, setIsTikTokConnected] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('@sanyo_creator');
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState('jergus.s');
  const [user, setUser] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'tiktok' | 'instagram' | 'tiktok_sim' | 'instagram_sim' | 'instagram_auth_sim' | null>(null);
  const [stats, setStats] = useState({ paid: 0, pending: 0 });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cashTag, setCashTag] = useState('');
  const [cryptoAddr, setCryptoAddr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch actual user data
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      setUser(user);
      if (user) {
        // Fetch payout stats & payment info
        supabase.from('referral_profiles')
          .select('paypal_email, cashapp_tag, crypto_address')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setPaypalEmail(data.paypal_email || '');
              setCashTag(data.cashapp_tag || '');
              setCryptoAddr(data.crypto_address || '');
            }
          });

        supabase.from('videos')
          .select('status, earnings_cents')
          .eq('user_id', user.id)
          .then(({ data }) => {
            if (data) {
              const paid = data.filter(v => v.status === 'paid').reduce((s, v) => s + (v.earnings_cents || 0), 0);
              const pending = data.filter(v => v.status === 'approved').reduce((s, v) => s + (v.earnings_cents || 0), 0);
              setStats({ paid, pending });
            }
          });

        // Fetch invoices
        supabase.from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) setInvoices(data);
          });
      }
    });

    // Check local storage for existing mock connections
    if (localStorage.getItem('tiktok_connected') === 'true') {
      setIsTikTokConnected(true);
      setTiktokUsername(localStorage.getItem('tiktok_username') || '@sanyo_creator');
    }
    if (localStorage.getItem('instagram_connected') === 'true') {
      setIsInstagramConnected(true);
      setInstagramUsername(localStorage.getItem('instagram_username') || '');
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

  const handleSavePayment = async (type: 'paypal' | 'cashapp' | 'crypto') => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updates: any = {};
      if (type === 'paypal') updates.paypal_email = paypalEmail;
      if (type === 'cashapp') updates.cashapp_tag = cashTag;
      if (type === 'crypto') updates.crypto_address = cryptoAddr;

      const { error } = await supabase
        .from('referral_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      alert('Payment information saved successfully!');
    } catch (err: any) {
      alert('Error saving payment info: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTikTokConnect = () => setActiveModal('tiktok');
  const handleInstagramConnect = () => setActiveModal('instagram');

  const startTikTokOAuth = () => {
    setActiveModal(null);
    const clientKey = 'sbawy70ee96x8fwy4q';
    const dummyCodeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    const scopes = 'user.info.basic,user.info.profile';
    const redirectUri = 'https://www.joinupshift.com/portal/settings';
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=tiktok_flow&code_challenge=${dummyCodeChallenge}&code_challenge_method=S256`;
    window.location.href = authUrl;
  };

  const handleTikTokDisconnect = () => {
    localStorage.removeItem('tiktok_connected');
    localStorage.removeItem('tiktok_username');
    setIsTikTokConnected(false);
  };

  const startInstagramOAuth = () => {
    setActiveModal(null);
    const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
    if (!clientId) {
      alert('Instagram Client ID missing! Check your .env file.');
      return;
    }

    // Redirect to Facebook Login (which now handles Instagram Graph API)
    const redirectUri = 'https://www.joinupshift.com/portal/settings';

    // Scopes needed for Instagram Business/Creator accounts
    const scopes = [
      'instagram_basic',
      'pages_show_list',
      'pages_read_engagement'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=instagram_flow`;

    console.log('Instagram (via Facebook) Auth URL:', authUrl);
    window.location.href = authUrl;
  };

  const handleInstagramDisconnect = () => {
    localStorage.removeItem('instagram_connected');
    localStorage.removeItem('instagram_username');
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
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '12px 24px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✅ Connected as {tiktokUsername}
              </div>
              <button onClick={handleTikTokDisconnect} style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>Disconnect</button>
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
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '12px 24px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✅ Connected as {instagramUsername || userName}
              </div>
              <button onClick={handleInstagramDisconnect} style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>Disconnect</button>
            </div>
          ) : (
            <>
              <button className="settings-connect-btn" onClick={handleInstagramConnect}>+ Connect Account</button>
              <p className="settings-help-text">Connect your Instagram account to submit Reels and track your earnings.</p>
            </>
          )}
        </div>
      </div>

      {/* Payout Stats Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><FiCreditCard /></div>
          <h3>Payment Methods & Payouts</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '0 20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Already Paid Out</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ade80' }}>${(stats.paid / 100).toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Pending Payout</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>${(stats.pending / 100).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Payout History Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <div className="settings-section-icon"><FiClock /></div>
          <h3>Payout History</h3>
        </div>
        <p className="settings-section-description">A history of all payments sent to you. You can use these records for your taxes.</p>
        {invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '14px' }}>No payouts yet.</div>
        ) : (
          <div className="invoices-list" style={{ padding: '0 20px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 5px' }}>Date</th>
                  <th style={{ padding: '10px 5px' }}>Amount</th>
                  <th style={{ padding: '10px 5px' }}>Method</th>
                  <th style={{ padding: '10px 5px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 5px', color: '#888' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 5px', fontWeight: 'bold', color: '#fff' }}>${(inv.amount_cents / 100).toFixed(2)}</td>
                    <td style={{ padding: '12px 5px', color: '#888' }}>{inv.payment_method}</td>
                    <td style={{ padding: '12px 5px' }}><span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontWeight: 'bold' }}>{inv.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Section */}
      <div className="settings-section-card">
        <p className="settings-section-description">Add your payment info below.</p>
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title"><strong>Bank</strong> (Stripe)</div>
          <button className="settings-btn-stripe"><SiStripe /> Connect with Stripe</button>
        </div>
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title"><strong>Crypto</strong> (USDC Solana)</div>
          <input type="text" placeholder="Address" className="settings-input" value={cryptoAddr} onChange={(e) => setCryptoAddr(e.target.value)} />
          <button className="settings-save-btn" onClick={() => handleSavePayment('crypto')}>Save</button>
        </div>
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title"><strong>PayPal</strong></div>
          <input type="text" placeholder="Email" className="settings-input" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
          <button className="settings-save-btn" onClick={() => handleSavePayment('paypal')}>Save</button>
        </div>
        <div className="settings-payment-subblock">
          <div className="payment-subblock-title"><strong>Cash App</strong></div>
          <input type="text" placeholder="$Tag" className="settings-input" value={cashTag} onChange={(e) => setCashTag(e.target.value)} />
          <button className="settings-save-btn" onClick={() => handleSavePayment('cashapp')}>Save</button>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'tiktok' && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <button className="settings-modal-close" onClick={() => setActiveModal(null)}>×</button>
            <h2>Connect TikTok</h2>
            <button onClick={startTikTokOAuth}>Continue</button>
          </div>
        </div>
      )}

      {activeModal === 'instagram' && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <button className="settings-modal-close" onClick={() => setActiveModal(null)}>×</button>
            <h2>Connect Instagram</h2>
            <button onClick={startInstagramOAuth}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSettings;
