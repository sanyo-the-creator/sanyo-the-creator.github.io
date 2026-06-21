import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiLink as _FiLink,
  FiCopy as _FiCopy,
  FiCheck as _FiCheck,
  FiGlobe as _FiGlobe,
  FiAlertCircle as _FiAlertCircle,
  FiLock as _FiLock,
  FiTrendingUp as _FiTrendingUp,
  FiRepeat as _FiRepeat,
  FiShoppingBag as _FiShoppingBag,
  FiDollarSign as _FiDollarSign
} from 'react-icons/fi';
import {
  SiTiktok as _SiTiktok,
  SiInstagram as _SiInstagram,
} from 'react-icons/si';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';

const FiLink = _FiLink as React.ElementType;
const FiCopy = _FiCopy as React.ElementType;
const FiCheck = _FiCheck as React.ElementType;
const FiGlobe = _FiGlobe as React.ElementType;
const FiAlertCircle = _FiAlertCircle as React.ElementType;
const FiLock = _FiLock as React.ElementType;
const FiTrendingUp = _FiTrendingUp as React.ElementType;
const FiRepeat = _FiRepeat as React.ElementType;
const FiShoppingBag = _FiShoppingBag as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
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
  const [installs, setInstalls] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
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

        // Affiliates also get the full funnel (installs / trials / sales)
        if (profileData.is_sales_affiliate) {
          const code = profileData.referral_code;
          const [{ data: installsData }, { data: trialsData }, { data: salesData }, { data: refundsData }] = await Promise.all([
            supabase.from('referral_installs').select('*').eq('referral_code', code),
            supabase.from('referral_trials').select('*').eq('referral_code', code),
            supabase.from('referral_sales').select('*').eq('referral_code', code),
            supabase.from('referral_refunds').select('*').eq('referral_code', code),
          ]);
          setInstalls(installsData || []);
          setTrials(trialsData || []);
          setSales(salesData || []);
          setRefunds(refundsData || []);
        }
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

  // ===== Affiliate funnel analytics =====
  const isAffiliate = !!profile?.is_sales_affiliate;

  // Normalize commission rate (stored as 0.15 or 15)
  const commissionRate = profile?.commission_rate
    ? (profile.commission_rate > 1 ? profile.commission_rate / 100 : profile.commission_rate)
    : 0.15;

  const aff = useMemo(() => {
    const directSales = sales.filter(s => !s.trial);
    const convertedTrials = sales.filter(s => s.trial);
    const directCents = directSales.reduce((a, s) => a + (s.amount_cents || 0), 0);
    const convertedCents = convertedTrials.reduce((a, s) => a + (s.amount_cents || 0), 0);
    const totalCents = directCents + convertedCents;
    const refundsCents = refunds.reduce((a, r) => a + (r.amount_cents || 0), 0);
    const netCents = Math.max(totalCents - refundsCents, 0);
    return {
      directCount: directSales.length,
      directCents,
      convertedCount: convertedTrials.length,
      convertedCents,
      startedTrials: trials.length,
      totalCents,
      refundsCount: refunds.length,
      refundsCents,
      commissionCents: Math.round(netCents * commissionRate),
      convertedCommissionCents: Math.round(convertedCents * commissionRate),
    };
  }, [sales, trials, refunds, commissionRate]);

  const funnel = useMemo(() => {
    const c = clicks.length;
    return [
      { step: 'Link Clicks', value: clicks.length, color: '#3b82f6' },
      { step: 'App Installs', value: installs.length, color: '#4ade80' },
      { step: 'Started Trials', value: aff.startedTrials, color: '#0ea5e9' },
      { step: 'Converted Trials', value: aff.convertedCount, color: '#a855f7' },
      { step: 'Sales', value: aff.directCount, color: '#ec4899' },
    ].map(s => ({ ...s, pct: c > 0 ? (s.value / c) * 100 : 0 }));
  }, [clicks, installs, aff]);

  const timeline = useMemo(() => {
    const days = 30;
    const map: Record<string, any> = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(now.getTime() - i * 86400000).toISOString().substring(0, 10);
      map[key] = { clicks: 0, installs: 0, trials: 0, converted: 0, sales: 0, refunds: 0 };
    }
    const bump = (arr: any[], field: string, dateField: string) => {
      arr.forEach(x => {
        const key = new Date(x[dateField]).toISOString().substring(0, 10);
        if (map[key]) map[key][field]++;
      });
    };
    bump(clicks, 'clicks', 'created_at');
    bump(installs, 'installs', 'installed_at');
    bump(trials, 'trials', 'created_at');
    bump(sales.filter(s => s.trial), 'converted', 'created_at');
    bump(sales.filter(s => !s.trial), 'sales', 'created_at');
    bump(refunds, 'refunds', 'refunded_at');
    return Object.entries(map).map(([date, d]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...d,
    }));
  }, [clicks, installs, trials, sales, refunds]);

  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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

      {/* ===== AFFILIATE FUNNEL ANALYTICS ===== */}
      {isAffiliate && (
        <>
          {/* Summary cards */}
          <div className="portal-metrics-grid" style={{ marginBottom: '24px' }}>
            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Started Trials</span>
                  <div className="portal-metric-value">{aff.startedTrials}</div>
                  <div className="portal-metric-subtext">People who started a free trial</div>
                </div>
                <div className="portal-metric-icon-wrapper" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                  <FiTrendingUp />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Converted Trials</span>
                  <div className="portal-metric-value" style={{ color: '#a855f7' }}>{aff.convertedCount}</div>
                  <div className="portal-metric-subtext">
                    {money(aff.convertedCents)} in sales · you earn {money(aff.convertedCommissionCents)}
                  </div>
                </div>
                <div className="portal-metric-icon-wrapper" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                  <FiRepeat />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Direct Sales</span>
                  <div className="portal-metric-value">{aff.directCount}</div>
                  <div className="portal-metric-subtext">{money(aff.directCents)} in sales</div>
                </div>
                <div className="portal-metric-icon-wrapper" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>
                  <FiShoppingBag />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Your Commission ({(commissionRate * 100).toFixed(0)}%)</span>
                  <div className="portal-metric-value highlight">{money(aff.commissionCents)}</div>
                  <div className="portal-metric-subtext">From sales + converted trials</div>
                </div>
                <div className="portal-metric-icon-wrapper" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                  <FiDollarSign />
                </div>
              </div>
            </div>
          </div>

          {/* Note so affiliates know trials earn */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#cbd5e1'
          }}>
            <FiRepeat style={{ color: '#a855f7', flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#fff' }}>Trials earn too.</strong> When a free trial you referred converts to a paid plan,
              it counts as a <strong style={{ color: '#a855f7' }}>Converted Trial</strong> and you get your full commission on it.
            </span>
          </div>

          {/* Clicks & conversions over time */}
          <div className="portal-metric-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiTrendingUp style={{ color: '#3b82f6' }} /> Clicks & Conversions Over Time
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="refClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="refInstalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="date" stroke="#555" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fill="url(#refClicks)" strokeWidth={2} name="Clicks" />
                <Area type="monotone" dataKey="installs" stroke="#4ade80" fill="url(#refInstalls)" strokeWidth={2} name="Installs" />
                <Area type="monotone" dataKey="trials" stroke="#0ea5e9" fillOpacity={0} strokeWidth={2} name="Started Trials" />
                <Area type="monotone" dataKey="converted" stroke="#a855f7" fillOpacity={0} strokeWidth={2} name="Converted Trials" />
                <Area type="monotone" dataKey="sales" stroke="#ec4899" fillOpacity={0} strokeWidth={2} name="Sales" />
                <Area type="monotone" dataKey="refunds" stroke="#ef4444" fillOpacity={0} strokeWidth={2} strokeDasharray="4 3" name="Refunds" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion funnel */}
          <div className="portal-metric-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>Conversion Funnel</h3>
            {funnel.map(step => (
              <div key={step.step} style={{ marginBottom: '14px' }}>
                <div style={{ height: '10px', background: '#1a1a22', borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${Math.max(step.pct, 1.5)}%`, height: '100%', background: step.color, borderRadius: '5px', transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#ccc', fontWeight: 500 }}>{step.step}</span>
                  <span>
                    <strong style={{ color: '#fff' }}>{step.value}</strong>
                    <span style={{ color: '#666', marginLeft: '8px' }}>{step.pct.toFixed(1)}%</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
