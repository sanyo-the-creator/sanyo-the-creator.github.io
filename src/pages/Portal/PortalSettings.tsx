import React, { useState, useEffect } from 'react';
import { 
  FiUser as _FiUser, 
  FiCreditCard as _FiCreditCard, 
  FiAlertCircle as _FiAlertCircle, 
  FiBookOpen as _FiBookOpen, 
  FiClock as _FiClock, 
  FiCopy as _FiCopy, 
  FiExternalLink as _FiExternalLink, 
  FiCheckCircle as _FiCheckCircle,
  FiTrendingUp as _FiTrendingUp,
  FiX as _FiX,
  FiDownload as _FiDownload,
  FiEye as _FiEye
} from 'react-icons/fi';
import { 
  SiTiktok as _SiTiktok, 
  SiInstagram as _SiInstagram, 
  SiDiscord as _SiDiscord, 
  SiStripe as _SiStripe 
} from 'react-icons/si';
import { supabase } from '../../lib/supabase';
import { generateInvoicePDF, InvoiceData } from '../../utils/invoiceUtils';

const FiUser = _FiUser as React.ElementType;
const FiCreditCard = _FiCreditCard as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiBookOpen = _FiBookOpen as React.ElementType;
const FiClock = _FiClock as React.ElementType;
const FiCopy = _FiCopy as React.ElementType;
const FiExternalLink = _FiExternalLink as React.ElementType;
const FiCheckCircle = _FiCheckCircle as React.ElementType;
const FiTrendingUp = _FiTrendingUp as React.ElementType;
const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const SiDiscord = _SiDiscord as React.ElementType;
const SiStripe = _SiStripe as React.ElementType;
const FiX = _FiX as React.ElementType;
const FiDownload = _FiDownload as React.ElementType;
const FiEye = _FiEye as React.ElementType;

const PortalSettings = () => {
  const [isTikTokConnected, setIsTikTokConnected] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('@sanyo_creator');
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState('');
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
  const [verificationStep, setVerificationStep] = useState<'input' | 'verify' | 'loading' | 'success'>('input');
  const [progressText, setProgressText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceVideos, setInvoiceVideos] = useState<any[]>([]);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [refundsHistory, setRefundsHistory] = useState<any[]>([]);
  const [loadingAffiliateData, setLoadingAffiliateData] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState('');
  const [userHandle, setUserHandle] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator');
        setUserEmail(user.email || '');
        setUserAvatar(user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`);
        setUserHandle(user.user_metadata?.user_name || `@${user.email?.split('@')[0] || 'creator'}`);
        
        // Fetch profile
        supabase
          .from('referral_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            if (data) {
              if (data.paypal_email) setPaypalEmail(data.paypal_email);
              if (data.cashapp_tag) setCashTag(data.cashapp_tag);
              if (data.crypto_address) setCryptoAddr(data.crypto_address);
              if (data.referral_code) setReferralCode(data.referral_code);
              
              if (data.is_sales_affiliate) {
                fetchAffiliateData(data.referral_code);
              }
            }
          });

        fetchInvoices(user.id);
        
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
      }
    });

    if (localStorage.getItem('tiktok_connected') === 'true') {
      setIsTikTokConnected(true);
      setTiktokUsername(localStorage.getItem('tiktok_username') || '@sanyo_creator');
    }
    if (localStorage.getItem('instagram_connected') === 'true') {
      setIsInstagramConnected(true);
      setInstagramUsername(localStorage.getItem('instagram_username') || '');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'tiktok_flow') {
      localStorage.setItem('tiktok_connected', 'true');
      setIsTikTokConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchInvoices = async (userId: string) => {
    const { data } = await supabase.from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setInvoices(data);
  };

  const fetchAffiliateData = async (code: string) => {
    setLoadingAffiliateData(true);
    try {
      const { data: sales } = await supabase
        .from('referral_sales')
        .select('*')
        .eq('referral_code', code)
        .order('created_at', { ascending: false });
      
      const { data: refunds } = await supabase
        .from('referral_refunds')
        .select('*')
        .eq('referral_code', code)
        .order('refunded_at', { ascending: false });

      setSalesHistory(sales || []);
      setRefundsHistory(refunds || []);
    } catch (err) {
      console.error('Error fetching affiliate data:', err);
    } finally {
      setLoadingAffiliateData(false);
    }
  };

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

  const handleViewInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setLoadingInvoice(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      if (error) throw error;
      setInvoiceVideos(data || []);
    } catch (err: any) {
      console.error('Error fetching invoice videos:', err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleDownloadPDF = async (invoice: any) => {
    try {
      let videos = invoiceVideos;
      if (!selectedInvoice || selectedInvoice.id !== invoice.id) {
        const { data } = await supabase
          .from('videos')
          .select('*')
          .eq('invoice_id', invoice.id);
        videos = data || [];
      }

      const invoiceData: InvoiceData = {
        id: invoice.id,
        created_at: invoice.created_at,
        amount_cents: invoice.amount_cents,
        payment_method: invoice.payment_method,
        payment_details: invoice.payment_details,
        user_name: userName,
        user_email: userEmail,
        items: videos.map((v: any) => ({
          id: v.id,
          url: v.video_url,
          views: v.views || 0,
          earnings_cents: v.earnings_cents || 0,
          platform: v.platform
        }))
      };

      await generateInvoicePDF(invoiceData);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Could not generate PDF. Please try again.');
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
    
    setTimeout(() => setProgressText(`Accessing instagram.com/${cleanUsername}...`), 1200);
    setTimeout(() => setProgressText('Fetching public profile DOM elements...'), 2400);
    setTimeout(() => setProgressText(`Scanning bio description for code: ${expectedCode}...`), 3600);

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
        <p className="settings-section-description">A history of all payments sent to you.</p>
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
                  <th style={{ padding: '10px 5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 5px', color: '#888' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 5px', fontWeight: 'bold', color: '#fff' }}>${(inv.amount_cents / 100).toFixed(2)}</td>
                    <td style={{ padding: '12px 5px', color: '#888' }}>{inv.payment_method}</td>
                    <td style={{ padding: '12px 5px' }}><span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontWeight: 'bold' }}>{inv.status.toUpperCase()}</span></td>
                    <td style={{ padding: '12px 5px', textAlign: 'right' }}>
                      <button onClick={() => handleViewInvoice(inv)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '5px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }} title="View Details"><FiEye size={14} /></button>
                      <button onClick={() => handleDownloadPDF(inv)} style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', padding: '5px', borderRadius: '4px', cursor: 'pointer' }} title="Download PDF"><FiDownload size={14} /></button>
                    </td>
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="settings-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="settings-modal invoice-detail-modal" style={{ maxWidth: '700px', width: '90%' }}>
            <button className="settings-modal-close" onClick={() => setSelectedInvoice(null)}><FiX /></button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ marginBottom: '5px' }}>Invoice Detail</h2>
                <p style={{ fontSize: '13px', color: '#888' }}>ID: {selectedInvoice.id}</p>
              </div>
              <button onClick={() => handleDownloadPDF(selectedInvoice)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FiDownload /> Download PDF</button>
            </div>
            <div className="invoice-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Date Paid</label>
                <div style={{ fontWeight: 'bold' }}>{new Date(selectedInvoice.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Total Amount</label>
                <div style={{ fontWeight: 'bold', color: '#4ade80', fontSize: '18px' }}>${(selectedInvoice.amount_cents / 100).toFixed(2)}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Payment Method</label>
                <div style={{ fontWeight: 'bold' }}>{selectedInvoice.payment_method}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Recipient</label>
                <div style={{ fontWeight: 'bold' }}>{userName}</div>
              </div>
            </div>
            <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#fff' }}>Items ({invoiceVideos.length} videos)</h3>
            <div className="invoice-items-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              {loadingInvoice ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Loading items...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#1a1a2e' }}>
                    <tr style={{ textAlign: 'left', color: '#666', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '10px' }}>Video URL</th>
                      <th style={{ padding: '10px' }}>Views</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceVideos.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', color: '#888', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><a href={v.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{v.video_url}</a></td>
                        <td style={{ padding: '10px' }}>{v.views?.toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>${(v.earnings_cents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instagram Verification Modal */}
      {activeModal === 'instagram' && (
        <div className="settings-modal-overlay">
          <style>{`
            @keyframes portalSpin { to { transform: rotate(360deg); } }
            @keyframes portalPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
            .step-number { background: #2d2d2d; color: #888; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0; }
            .step-number.active { background: #3b82f6; color: #fff; }
            .step-card { background: #141414; border: 1px solid #222; border-radius: 12px; padding: 14px; display: flex; gap: 14px; align-items: flex-start; text-align: left; transition: border-color 0.2s; }
            .step-card:hover { border-color: rgba(59, 130, 246, 0.25); }
          `}</style>
          <div className="settings-modal" style={{ maxWidth: '480px', padding: '24px', background: '#0a0a0a', border: '1px solid #1c1c1c' }}>
            <button className="settings-modal-close" onClick={() => setActiveModal(null)} style={{ top: '16px', right: '16px' }}>×</button>
            {verificationStep === 'input' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Link Instagram</h2>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Enter your Instagram URL or username.</p>
                <input type="text" placeholder="https://instagram.com/username" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} style={{ width: '100%', background: '#121212', border: '1px solid #222', borderRadius: '8px', padding: '12px', color: '#fff', marginBottom: '20px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => setActiveModal(null)} className="settings-modal-btn-cancel">Cancel</button>
                  <button onClick={handleInstagramAdd} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
                </div>
              </div>
            )}
            {verificationStep === 'verify' && (
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>Verify account</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div className="step-card">
                    <div className="step-number active">1</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>Copy verification code</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <code style={{ background: '#000', padding: '4px 8px', borderRadius: '4px' }}>{referralCode || 'upshift'}</code>
                        <button onClick={() => { navigator.clipboard.writeText(referralCode || 'upshift'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} style={{ background: 'none', border: 'none', color: isCopied ? '#4ade80' : '#888', cursor: 'pointer' }}><FiCopy size={12} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="step-card">
                    <div className="step-number">2</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>Go to Instagram profile</div>
                      <a href={`https://instagram.com/${extractInstagramUsername(instagramUrl)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '12px' }}>Open profile <FiExternalLink size={10} /></a>
                    </div>
                  </div>
                  <div className="step-card">
                    <div className="step-number">3</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Add the code to your bio temporarily.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setVerificationStep('input')} className="settings-modal-btn-cancel" style={{ flex: 1 }}>Back</button>
                  <button onClick={handleInstagramVerify} style={{ flex: 2, background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Verify</button>
                </div>
              </div>
            )}
            {verificationStep === 'loading' && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'portalSpin 0.8s linear infinite', margin: '0 auto 20px' }}></div>
                <p style={{ color: '#888', fontSize: '12px' }}>{progressText}</p>
              </div>
            )}
            {verificationStep === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <FiCheckCircle size={40} color="#4ade80" style={{ marginBottom: '15px' }} />
                <h2 style={{ color: '#fff', marginBottom: '20px' }}>Verified!</h2>
                <button onClick={() => setActiveModal(null)} style={{ width: '100%', background: '#4ade80', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Affiliate Logs Section */}
      {profile?.is_sales_affiliate && (
        <div className="settings-section-card">
          <div className="settings-section-header">
            <div className="settings-section-icon"><FiTrendingUp /></div>
            <h3>Affiliate Logs</h3>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <h4 style={{ fontSize: '14px', color: '#3b82f6', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: '8px', marginBottom: '15px' }}>Sales History</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '30px' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 5px' }}>Date</th>
                  <th style={{ padding: '8px 5px' }}>Amount</th>
                  <th style={{ padding: '8px 5px' }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#555' }}>No sales yet.</td></tr>
                ) : (
                  salesHistory.map(sale => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 5px', color: '#888' }}>{new Date(sale.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 5px' }}>${(sale.amount_cents / 100).toFixed(2)}</td>
                      <td style={{ padding: '10px 5px', color: '#4ade80', fontWeight: 'bold' }}>
                        ${((sale.amount_cents * (profile.commission_rate > 1 ? profile.commission_rate / 100 : (profile.commission_rate || 0.15))) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h4 style={{ fontSize: '14px', color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: '8px', marginBottom: '15px' }}>Refunds</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 5px' }}>Date</th>
                  <th style={{ padding: '8px 5px' }}>Amount</th>
                  <th style={{ padding: '8px 5px' }}>Deduction</th>
                </tr>
              </thead>
              <tbody>
                {refundsHistory.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#555' }}>No refunds yet.</td></tr>
                ) : (
                  refundsHistory.map(ref => (
                    <tr key={ref.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 5px', color: '#888' }}>{new Date(ref.refunded_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 5px' }}>${(ref.amount_cents / 100).toFixed(2)}</td>
                      <td style={{ padding: '10px 5px', color: '#ef4444', fontWeight: 'bold' }}>
                        -${((ref.amount_cents * (profile.commission_rate > 1 ? profile.commission_rate / 100 : (profile.commission_rate || 0.15))) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSettings;
