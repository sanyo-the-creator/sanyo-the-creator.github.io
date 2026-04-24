import React, { useState, useEffect, useCallback } from 'react';
import {
  FiLink as _FiLink,
  FiCopy as _FiCopy,
  FiCheck as _FiCheck,
  FiGlobe as _FiGlobe,
  FiAlertCircle as _FiAlertCircle,
  FiLock as _FiLock
} from 'react-icons/fi';
import {
  SiTiktok as _SiTiktok,
  SiInstagram as _SiInstagram,
} from 'react-icons/si';
import { supabase } from '../../lib/supabase';

const FiLink = _FiLink as React.ElementType;
const FiCopy = _FiCopy as React.ElementType;
const FiCheck = _FiCheck as React.ElementType;
const FiGlobe = _FiGlobe as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiLock = _FiLock as React.ElementType;
const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;

const PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', icon: SiTiktok, color: '#ff0050' },
  { key: 'instagram', label: 'Instagram', icon: SiInstagram, color: '#E1306C' },
];

interface ClickData {
  id: string;
  visitor_id: string;
  platform: string;
  device_type: string;
  browser: string;
  os: string;
  country: string | null;
  clicked_download: boolean;
  created_at: string;
}

const PortalReferrals = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickData[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Setup flow state
  const [setupStep, setSetupStep] = useState<'input' | 'confirm' | 'done'>('input');
  const [inputCode, setInputCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user already has a referral profile
      const { data: profileData } = await supabase
        .from('referral_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setReferralCode(profileData.referral_code);
        setHasProfile(true);

        // Fetch clicks
        const { data: clicksData } = await supabase
          .from('referral_clicks')
          .select('*')
          .eq('referral_code', profileData.referral_code)
          .order('created_at', { ascending: false })
          .limit(100);
        setClicks(clicksData || []);

        // Note: installs and sales data loaded in admin panel only
      }
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced availability check
  const checkAvailability = useCallback(async (code: string) => {
    if (code.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const { data } = await supabase
        .from('referral_profiles')
        .select('referral_code')
        .eq('referral_code', code)
        .single();

      setIsAvailable(!data); // Available if no result
    } catch {
      setIsAvailable(true); // If error (no row found), it's available
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check availability when input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputCode.length >= 3) {
        checkAvailability(inputCode);
      } else {
        setIsAvailable(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputCode, checkAvailability]);

  const sanitizeCode = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9_.-]/g, '').substring(0, 30);
  };

  const handleInputChange = (val: string) => {
    const sanitized = sanitizeCode(val);
    setInputCode(sanitized);
    setSetupError('');
  };

  const proceedToConfirm = () => {
    if (inputCode.length < 3) {
      setSetupError('Username must be at least 3 characters');
      return;
    }
    if (!isAvailable) {
      setSetupError('This username is taken');
      return;
    }
    setSetupStep('confirm');
    setConfirmCode('');
    setSetupError('');
  };

  const saveReferralCode = async () => {
    if (confirmCode !== inputCode) {
      setSetupError('Usernames don\'t match. Please type it exactly as above.');
      return;
    }

    setIsSaving(true);
    setSetupError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSetupError('Not authenticated');
        setIsSaving(false);
        return;
      }

      // Double-check availability right before saving
      const { data: existing } = await supabase
        .from('referral_profiles')
        .select('referral_code')
        .eq('referral_code', inputCode)
        .single();

      if (existing) {
        setSetupError('This username was just taken! Please choose another.');
        setSetupStep('input');
        setIsAvailable(false);
        setIsSaving(false);
        return;
      }

      const { data: newProfile, error } = await supabase
        .from('referral_profiles')
        .insert({
          id: user.id,
          referral_code: inputCode,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setSetupError('This username was just taken! Please choose another.');
          setSetupStep('input');
          setIsAvailable(false);
        } else {
          setSetupError(error.message);
        }
        setIsSaving(false);
        return;
      }

      // Success
      setProfile(newProfile);
      setReferralCode(inputCode);
      setHasProfile(true);
      setSetupStep('done');
    } catch (err) {
      setSetupError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const baseUrl = window.location.origin;

  const copyLink = (platformKey: string) => {
    const url = `${baseUrl}/download/${platformKey}?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(platformKey);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Platform breakdown
  const platformStats = PLATFORMS.map(p => ({
    ...p,
    count: clicks.filter(c => c.platform === p.key).length,
  })).sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="portal-dashboard">
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#666' }}>Loading referral data...</div>
      </div>
    );
  }

  // ========== SETUP FLOW ==========
  if (!hasProfile) {
    return (
      <div className="portal-dashboard">
        <header className="portal-header">
          <div>
            <h1 className="portal-page-title">Referrals</h1>
            <p className="portal-page-subtitle">Set up your referral username to start tracking</p>
          </div>
        </header>

        <div className="referral-setup-card">
          <div className="referral-setup-icon">
            <FiLink />
          </div>

          {setupStep === 'input' && (
            <>
              <h2 className="referral-setup-title">Choose your referral username</h2>
              <p className="referral-setup-desc">
                This will be used in your referral links. Choose carefully — <strong>you can't change it later</strong>.
              </p>

              <div className="referral-setup-input-group">
                <div className="referral-setup-preview">
                  {baseUrl}/download/tiktok?ref=<span className="referral-setup-highlight">{inputCode || '...'}</span>
                </div>

                <div className="referral-setup-field">
                  <input
                    type="text"
                    className="referral-setup-input"
                    placeholder="your_username"
                    value={inputCode}
                    onChange={e => handleInputChange(e.target.value)}
                    maxLength={30}
                    autoFocus
                  />
                  <div className="referral-setup-status">
                    {isChecking && <span className="referral-check-loading">Checking...</span>}
                    {!isChecking && isAvailable === true && inputCode.length >= 3 && (
                      <span className="referral-check-ok"><FiCheck /> Available</span>
                    )}
                    {!isChecking && isAvailable === false && (
                      <span className="referral-check-taken"><FiAlertCircle /> Taken</span>
                    )}
                  </div>
                </div>

                <p className="referral-setup-rules">
                  Only lowercase letters, numbers, underscores, dots and hyphens. Min 3 characters.
                </p>

                {setupError && <div className="referral-setup-error">{setupError}</div>}

                <button
                  className="referral-setup-btn"
                  onClick={proceedToConfirm}
                  disabled={!isAvailable || inputCode.length < 3 || isChecking}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {setupStep === 'confirm' && (
            <>
              <h2 className="referral-setup-title">Confirm your username</h2>
              <p className="referral-setup-desc">
                Type <strong className="referral-setup-confirm-code">{inputCode}</strong> again to confirm. This is permanent.
              </p>

              <div className="referral-setup-input-group">
                <div className="referral-setup-field">
                  <input
                    type="text"
                    className="referral-setup-input"
                    placeholder={`Type "${inputCode}" to confirm`}
                    value={confirmCode}
                    onChange={e => setConfirmCode(sanitizeCode(e.target.value))}
                    maxLength={30}
                    autoFocus
                  />
                  <div className="referral-setup-status">
                    {confirmCode.length > 0 && confirmCode === inputCode && (
                      <span className="referral-check-ok"><FiCheck /> Match</span>
                    )}
                    {confirmCode.length > 0 && confirmCode !== inputCode && (
                      <span className="referral-check-taken"><FiAlertCircle /> Doesn't match</span>
                    )}
                  </div>
                </div>

                {setupError && <div className="referral-setup-error">{setupError}</div>}

                <div className="referral-setup-actions">
                  <button
                    className="referral-setup-btn-secondary"
                    onClick={() => { setSetupStep('input'); setConfirmCode(''); setSetupError(''); }}
                  >
                    ← Back
                  </button>
                  <button
                    className="referral-setup-btn"
                    onClick={saveReferralCode}
                    disabled={confirmCode !== inputCode || isSaving}
                  >
                    {isSaving ? 'Saving...' : (
                      <><FiLock style={{ marginRight: '6px' }} /> Lock Username Forever</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ========== DASHBOARD (after setup) ==========
  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Referrals</h1>
          <p className="portal-page-subtitle">Share your links and track performance</p>
        </div>
      </header>

      {/* Your Links Card */}
      <div className="referral-links-card">
        <div className="referral-links-header">
          <FiLink style={{ color: '#3b82f6' }} />
          <h3>Your Referral Links</h3>
          <span className="referral-locked-badge"><FiLock /> {referralCode}</span>
        </div>

        {PLATFORMS.map(p => {
          const Icon = p.icon;
          const url = `${baseUrl}/download/${p.key}?ref=${referralCode}`;
          return (
            <div key={p.key} className="referral-link-row">
              <div className="referral-link-platform">
                <Icon style={{ color: p.color }} />
                <span>{p.label}</span>
              </div>
              <div className="referral-link-url">{url}</div>
              <button className="referral-copy-btn" onClick={() => copyLink(p.key)}>
                {copiedLink === p.key ? <FiCheck style={{ color: '#4ade80' }} /> : <FiCopy />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Platform Breakdown — percentages only */}
      {clicks.length > 0 && (
        <div className="portal-metric-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiGlobe style={{ color: '#3b82f6' }} /> Traffic Sources
          </h3>
          {platformStats.map(p => {
            const Icon = p.icon;
            const pct = clicks.length > 0 ? ((p.count / clicks.length) * 100) : 0;
            if (pct === 0) return null;
            return (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
                <Icon style={{ color: p.color, fontSize: '18px', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#ccc', width: '90px', fontWeight: 500 }}>{p.label}</span>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#1a1a22', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: p.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '14px', color: '#fff', width: '50px', textAlign: 'right', fontWeight: 600 }}>{pct.toFixed(0)}%</span>
              </div>
            );
          })}
          {(() => {
            const directCount = clicks.filter(c => c.platform === 'direct' || !PLATFORMS.find(pl => pl.key === c.platform)).length;
            const directPct = clicks.length > 0 ? ((directCount / clicks.length) * 100) : 0;
            if (directPct === 0) return null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
                <FiGlobe style={{ color: '#3b82f6', fontSize: '18px', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#ccc', width: '90px', fontWeight: 500 }}>Other</span>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#1a1a22', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${directPct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '14px', color: '#fff', width: '50px', textAlign: 'right', fontWeight: 600 }}>{directPct.toFixed(0)}%</span>
              </div>
            );
          })()}
        </div>
      )}

      {clicks.length === 0 && (
        <div className="portal-metric-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            No clicks yet. Share your links above to start tracking!
          </p>
        </div>
      )}
    </div>
  );
};

export default PortalReferrals;
