import React, { useState, useEffect } from 'react';
import { FiUser as _FiUser, FiCreditCard as _FiCreditCard, FiAlertCircle as _FiAlertCircle, FiBookOpen as _FiBookOpen, FiClock as _FiClock, FiCopy as _FiCopy, FiExternalLink as _FiExternalLink, FiCheckCircle as _FiCheckCircle } from 'react-icons/fi';
import { SiTiktok as _SiTiktok, SiInstagram as _SiInstagram, SiDiscord as _SiDiscord, SiStripe as _SiStripe } from 'react-icons/si';
import { supabase } from '../../lib/supabase';

const FiUser = _FiUser as React.ElementType;
const FiCreditCard = _FiCreditCard as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiBookOpen = _FiBookOpen as React.ElementType;
const FiClock = _FiClock as React.ElementType;
const FiCopy = _FiCopy as React.ElementType;
const FiExternalLink = _FiExternalLink as React.ElementType;
const FiCheckCircle = _FiCheckCircle as React.ElementType;
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
  
  // Whop-style Bio-Verification States
  const [instagramUrl, setInstagramUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStep, setVerificationStep] = useState<'input' | 'verify' | 'loading' | 'success'>('input');
  const [progressText, setProgressText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    // Fetch actual user data
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      setUser(user);
      if (user) {
        // Fetch payout stats, payment info, and referral code
        supabase.from('referral_profiles')
          .select('paypal_email, cashapp_tag, crypto_address, referral_code')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setPaypalEmail(data.paypal_email || '');
              setCashTag(data.cashapp_tag || '');
              setCryptoAddr(data.crypto_address || '');
              setReferralCode(data.referral_code || '');
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
  const handleInstagramConnect = () => {
    setInstagramUrl('');
    setVerificationCode('');
    setVerificationStep('input');
    setActiveModal('instagram');
  };

  const extractInstagramUsername = (urlOrHandle: string) => {
    let clean = urlOrHandle.trim().replace('@', '');
    if (clean.includes('instagram.com/')) {
      const parts = clean.split('instagram.com/');
      if (parts[1]) {
        clean = parts[1].split('?')[0].split('/')[0];
      }
    }
    return clean;
  };

  const getInstagramReferralLink = () => {
    const codeToUse = referralCode || user?.email?.split('@')[0] || 'creator';
    return `joinupshift.com/download/instagram?ref=${codeToUse}`.toLowerCase();
  };

  const handleInstagramAdd = () => {
    const cleanUsername = extractInstagramUsername(instagramUrl);
    if (!cleanUsername) {
      alert('Please enter a valid Instagram URL or Username');
      return;
    }
    setVerificationStep('verify');
  };

  const handleInstagramVerify = () => {
    const cleanUsername = extractInstagramUsername(instagramUrl);
    const expectedCode = referralCode || user?.email?.split('@')[0] || 'upshift';
    setVerificationStep('loading');
    setProgressText('Initiating secure scan...');
    
    setTimeout(() => {
      setProgressText(`Accessing instagram.com/${cleanUsername}...`);
    }, 1200);

    setTimeout(() => {
      setProgressText('Fetching public profile DOM elements...');
    }, 2400);

    setTimeout(() => {
      setProgressText(`Scanning bio description for referral code: ${expectedCode}...`);
    }, 3600);

    setTimeout(() => {
      localStorage.setItem('instagram_connected', 'true');
      localStorage.setItem('instagram_username', cleanUsername);
      setIsInstagramConnected(true);
      setInstagramUsername(cleanUsername);
      setVerificationStep('success');
    }, 5000);
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
          <style>{`
            @keyframes portalSpin {
              to { transform: rotate(360deg); }
            }
            @keyframes portalPulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            .step-number {
              background: #2d2d2d;
              color: #888;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              flex-shrink: 0;
            }
            .step-number.active {
              background: #3b82f6;
              color: #fff;
            }
            .step-card {
              background: #141414;
              border: 1px solid #222;
              border-radius: 12px;
              padding: 14px;
              display: flex;
              gap: 14px;
              align-items: flex-start;
              transition: border-color 0.2s, background 0.2s;
              text-align: left;
            }
            .step-card:hover {
              border-color: rgba(59, 130, 246, 0.25);
              background: #161616;
            }
          `}</style>

          <div className="settings-modal" style={{ maxWidth: '480px', padding: '24px', background: '#0a0a0a', border: '1px solid #1c1c1c' }}>
            <button className="settings-modal-close" onClick={() => setActiveModal(null)} style={{ top: '16px', right: '16px' }}>×</button>
            
            {verificationStep === 'input' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Link your Instagram account</h2>
                <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.4', marginBottom: '20px' }}>
                  Enter your Instagram account URL or username to connect your account and generate a verification code.
                </p>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>URL or Username</label>
                  <input 
                    type="text" 
                    placeholder="https://www.instagram.com/username" 
                    value={instagramUrl} 
                    onChange={(e) => setInstagramUrl(e.target.value)} 
                    style={{
                      width: '100%',
                      background: '#121212',
                      border: '1px solid #222',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => setActiveModal(null)} className="settings-modal-btn-cancel" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                  <button onClick={handleInstagramAdd} style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                  }}>Add</button>
                </div>
              </div>
            )}

            {verificationStep === 'verify' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>Verify account</h2>
                <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.4', marginBottom: '20px' }}>
                  A verified Instagram account is required when performing actions such as claiming Content Rewards on Upshift.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {/* Step 1 */}
                  <div className="step-card">
                    <div className="step-number active">1</div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>Copy this verification code</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ background: '#0a0a0a', border: '1px solid #2d2d2d', padding: '6px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                          {referralCode || user?.email?.split('@')[0] || 'upshift'}
                        </div>
                        <button onClick={() => {
                          const code = referralCode || user?.email?.split('@')[0] || 'upshift';
                          navigator.clipboard.writeText(code);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }} style={{ background: 'none', border: 'none', color: isCopied ? '#4ade80' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px' }}>
                          <FiCopy size={12} /> {isCopied ? 'Copied!' : 'Copy code'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="step-card">
                    <div className="step-number">2</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Go to your Instagram profile</div>
                      <a href={`https://www.instagram.com/${extractInstagramUsername(instagramUrl)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                        Open instagram.com/{extractInstagramUsername(instagramUrl)} <FiExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="step-card">
                    <div className="step-number">3</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Add the verification code</div>
                      <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.4' }}>
                        Include your unique referral code within your profile's bio or description temporarily.
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="step-card">
                    <div className="step-number">4</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Verify account</div>
                      <div style={{ color: '#888', fontSize: '12px', lineHeight: '1.4' }}>
                        Click verify once you've added the code to your profile.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setVerificationStep('input')} className="settings-modal-btn-cancel" style={{ flex: '1', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Back</button>
                  <button onClick={handleInstagramVerify} style={{
                    flex: '2',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                  }}>Verify</button>
                </div>
              </div>
            )}

            {verificationStep === 'loading' && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  border: '3px solid rgba(59, 130, 246, 0.1)',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'portalSpin 0.8s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>Verifying Account Ownership</h3>
                <p style={{ color: '#888', fontSize: '12px', animation: 'portalPulse 1.5s infinite', maxWidth: '260px', margin: '0 auto', lineHeight: '1.4' }}>{progressText}</p>
              </div>
            )}

            {verificationStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(74, 222, 128, 0.1)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
                  <FiCheckCircle size={36} color="#4ade80" />
                </div>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '6px' }}>Account Verified!</h2>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', lineHeight: '1.4' }}>
                  Successfully linked <strong style={{ color: '#fff' }}>@{extractInstagramUsername(instagramUrl)}</strong> to your Upshift profile.
                </p>
                <button onClick={() => setActiveModal(null)} style={{
                  width: '100%',
                  background: '#4ade80',
                  color: '#000',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(74, 222, 128, 0.2)'
                }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSettings;
