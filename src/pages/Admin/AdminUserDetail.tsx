import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { sendPayoutNotification } from '../../utils/emailUtils';
import {
  FiArrowLeft as _FiArrowLeft,
  FiMousePointer as _FiMousePointer,
  FiDownload as _FiDownload,
  FiDollarSign as _FiDollarSign,
  FiUsers as _FiUsers,
  FiVideo as _FiVideo,
  FiEye as _FiEye,
  FiExternalLink as _FiExternalLink,
  FiCalendar as _FiCalendar,
  FiSettings as _FiSettings,
  FiTrendingUp as _FiTrendingUp,
  FiShoppingBag as _FiShoppingBag,
  FiArrowLeftCircle as _FiArrowLeftCircle,
  FiGlobe as _FiGlobe,
  FiSmartphone as _FiSmartphone,
  FiMonitor as _FiMonitor,
  FiFilter as _FiFilter,
  FiCopy as _FiCopy,
  FiCheck as _FiCheck
} from 'react-icons/fi';
import {
  SiTiktok as _SiTiktok,
  SiInstagram as _SiInstagram,
  SiYoutube as _SiYoutube,
  SiSnapchat as _SiSnapchat
} from 'react-icons/si';
import './AdminUserDetail.css';

const FiArrowLeft = _FiArrowLeft as React.ElementType;
const FiMousePointer = _FiMousePointer as React.ElementType;
const FiDownload = _FiDownload as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
const FiUsers = _FiUsers as React.ElementType;
const FiVideo = _FiVideo as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiExternalLink = _FiExternalLink as React.ElementType;
const FiCalendar = _FiCalendar as React.ElementType;
const FiSettings = _FiSettings as React.ElementType;
const FiTrendingUp = _FiTrendingUp as React.ElementType;
const FiShoppingBag = _FiShoppingBag as React.ElementType;
const FiArrowLeftCircle = _FiArrowLeftCircle as React.ElementType;
const FiGlobe = _FiGlobe as React.ElementType;
const FiSmartphone = _FiSmartphone as React.ElementType;
const FiMonitor = _FiMonitor as React.ElementType;
const FiFilter = _FiFilter as React.ElementType;
const FiCopy = _FiCopy as React.ElementType;
const FiCheck = _FiCheck as React.ElementType;
const SiTiktok = _SiTiktok as React.ElementType;
const SiInstagram = _SiInstagram as React.ElementType;
const SiYoutube = _SiYoutube as React.ElementType;
const SiSnapchat = _SiSnapchat as React.ElementType;

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#ff0050',
  instagram: '#E1306C',
  youtube: '#FF0000',
  x: '#1DA1F2',
  snapchat: '#FFFC00',
  direct: '#3b82f6',
};

const DEVICE_COLORS: Record<string, string> = {
  iPhone: '#3b82f6',
  Android: '#4ade80',
  Desktop: '#f59e0b',
};

// Map 2-letter codes to full names for old DB records. New records already store full names.
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France', CA: 'Canada',
  AU: 'Australia', IN: 'India', BR: 'Brazil', JP: 'Japan', KR: 'South Korea',
  MX: 'Mexico', ES: 'Spain', IT: 'Italy', NL: 'Netherlands', PL: 'Poland',
  SE: 'Sweden', SK: 'Slovakia', CZ: 'Czech Republic', AT: 'Austria', CH: 'Switzerland',
  RU: 'Russia', UA: 'Ukraine', PH: 'Philippines', ID: 'Indonesia', TH: 'Thailand',
  VN: 'Vietnam', NG: 'Nigeria', ZA: 'South Africa', EG: 'Egypt', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PT: 'Portugal', IE: 'Ireland', NO: 'Norway',
  DK: 'Denmark', FI: 'Finland', BE: 'Belgium', HU: 'Hungary', RO: 'Romania',
  GR: 'Greece', TR: 'Turkey', IL: 'Israel', AE: 'UAE', SA: 'Saudi Arabia',
  SG: 'Singapore', MY: 'Malaysia', NZ: 'New Zealand', HR: 'Croatia', RS: 'Serbia',
};
const countryName = (raw: string) => COUNTRY_NAMES[raw] || raw; // Pass through if already a full name

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  tiktok: SiTiktok,
  instagram: SiInstagram,
  youtube: SiYoutube,
  snapchat: SiSnapchat,
  x: FiGlobe,
  direct: FiGlobe,
};

type DateRange = '7d' | '30d' | '90d' | 'all';

const AdminUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [clicks, setClicks] = useState<any[]>([]);
  const [installs, setInstalls] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'android' | 'ios' | 'desktop'>('all');
  const [activeSection, setActiveSection] = useState<'overview' | 'videos' | 'clicks' | 'devices' | 'sales' | 'settings' | 'traffic' | 'log'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); setLoading(false); return; }

      const { data: adminData } = await supabase
        .from('admin_users').select('id').eq('id', user.id).single();
      if (!adminData) { setIsAdmin(false); setLoading(false); return; }
      setIsAdmin(true);

      // Load profile
      const { data: profileData } = await supabase
        .from('admin_user_overview').select('*').eq('user_id', userId).single();
      setProfile(profileData);

      if (profileData?.referral_code) {
        const code = profileData.referral_code;

        // Load all clicks
        const { data: clicksData } = await supabase
          .from('referral_clicks').select('*').eq('referral_code', code)
          .order('created_at', { ascending: true });
        setClicks(clicksData || []);

        // Load installs
        const { data: installsData } = await supabase
          .from('referral_installs').select('*').eq('referral_code', code)
          .order('installed_at', { ascending: true });
        setInstalls(installsData || []);

        // Load sales
        const { data: salesData } = await supabase
          .from('referral_sales').select('*').eq('referral_code', code)
          .order('created_at', { ascending: true });
        setSales(salesData || []);

        // Load trials
        const { data: trialsData } = await supabase
          .from('referral_trials').select('*').eq('referral_code', code)
          .order('created_at', { ascending: true });
        setTrials(trialsData || []);

        // Load refunds
        const { data: refundsData } = await supabase
          .from('referral_refunds').select('*').eq('referral_code', code)
          .order('refunded_at', { ascending: true });
        setRefunds(refundsData || []);
      }

      // Load videos
      const { data: videosData } = await supabase
        .from('videos').select('*').eq('user_id', userId)
        .order('submitted_at', { ascending: false });
      setVideos(videosData || []);

    } catch (err) {
      console.error('Error loading user detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAffiliate = async () => {
    if (!profile) return;
    const newVal = !profile.is_sales_affiliate;
    const { error } = await supabase
      .from('referral_profiles')
      .update({ is_sales_affiliate: newVal })
      .eq('id', userId);
    if (error) alert(error.message);
    else loadData();
  };

  const handleUpdateCommission = async (rate: string) => {
    const numRate = parseFloat(rate) / 100;
    if (isNaN(numRate)) return;
    const { error } = await supabase
      .from('referral_profiles')
      .update({ commission_rate: numRate })
      .eq('id', userId);
    if (error) alert(error.message);
    else loadData();
  };

  // Filter data by date range
  const filterByDate = (items: any[], dateField: string) => {
    if ((dateRange as any) === 'all') return items;
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return items.filter(item => new Date(item[dateField]) >= cutoff);
  };

  const filteredClicks = useMemo(() => filterByDate(clicks, 'created_at'), [clicks, dateRange]);
  const filteredInstalls = useMemo(() => filterByDate(installs, 'installed_at'), [installs, dateRange]);
  const filteredSales = useMemo(() => filterByDate(sales, 'created_at'), [sales, dateRange]);
  const filteredTrials = useMemo(() => filterByDate(trials, 'created_at'), [trials, dateRange]);
  const filteredRefunds = useMemo(() => filterByDate(refunds, 'refunded_at'), [refunds, dateRange]);

  // ===== CHART DATA COMPUTATION =====

  // Clicks per day timeline
  const clicksTimeline = useMemo(() => {
    const map: Record<string, { clicks: number; installs: number; sales: number; converted: number; refunds: number }> = {};

    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 60;
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().substring(0, 10);
      map[key] = { clicks: 0, installs: 0, sales: 0, converted: 0, refunds: 0 };
    }

    filteredClicks.forEach(c => {
      const key = new Date(c.created_at).toISOString().substring(0, 10);
      if (map[key]) map[key].clicks++;
    });

    filteredInstalls.forEach(i => {
      const key = new Date(i.installed_at).toISOString().substring(0, 10);
      if (map[key]) map[key].installs++;
    });

    // Split sales: trial=true => converted trial, otherwise direct sale
    filteredSales.forEach(s => {
      const key = new Date(s.created_at).toISOString().substring(0, 10);
      if (map[key]) { if (s.trial) map[key].converted++; else map[key].sales++; }
    });

    filteredRefunds.forEach(r => {
      const key = new Date(r.refunded_at).toISOString().substring(0, 10);
      if (map[key]) map[key].refunds++;
    });

    return Object.entries(map).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: date,
      ...data,
      trials: filteredTrials.filter(tr => new Date(tr.created_at).toISOString().substring(0, 10) === date).length,
    }));
  }, [filteredClicks, filteredInstalls, filteredTrials, filteredSales, filteredRefunds, dateRange]);

  // Sales per day
  const salesTimeline = useMemo(() => {
    const map: Record<string, number> = {};
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 60;
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      map[d.toISOString().substring(0, 10)] = 0;
    }
    filteredSales.forEach(s => {
      const key = new Date(s.created_at).toISOString().substring(0, 10);
      if (map[key] !== undefined) map[key] += (s.amount_cents || 0) / 100;
    });
    return Object.entries(map).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue,
    }));
  }, [filteredSales, dateRange]);

  // Platform breakdown
  const platformData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredClicks.forEach(c => {
      const p = c.platform || 'direct';
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: PLATFORM_COLORS[name] || '#666' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredClicks]);

  // Platform clicks count for bar chart
  const platformClicks = useMemo(() => {
    const map: Record<string, number> = {};
    filteredClicks.forEach(c => {
      const p = c.platform || 'direct';
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map)
      .map(([platform, clicks]) => ({
        platform,
        clicks,
        color: PLATFORM_COLORS[platform] || '#666',
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [filteredClicks]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredClicks.forEach(c => {
      const d = c.device_type || 'unknown';
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: DEVICE_COLORS[name] || '#666' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredClicks]);

  // Country breakdown
  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    const filteredForDevice = deviceFilter === 'all' 
      ? filteredClicks 
      : filteredClicks.filter(c => {
          const device = c.device_type?.toLowerCase() || '';
          if (deviceFilter === 'ios') return device.includes('ios') || device.includes('iphone');
          return device.includes(deviceFilter);
        });
    
    filteredForDevice.forEach(c => {
      const countryRaw = c.country || 'Unknown';
      const country = countryRaw !== 'Unknown' ? countryName(countryRaw) : countryRaw;
      map[country] = (map[country] || 0) + 1;
    });
    return Object.entries(map)
      .map(([country, count]) => ({ country, count, pct: filteredForDevice.length > 0 ? ((count / filteredForDevice.length) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [filteredClicks, deviceFilter]);




  // Split sales into direct purchases vs converted trials (trial = true)
  const directSales = useMemo(() => filteredSales.filter((s: any) => !s.trial), [filteredSales]);
  const convertedTrials = useMemo(() => filteredSales.filter((s: any) => s.trial), [filteredSales]);
  const directSalesCents = directSales.reduce((sum: number, s: any) => sum + (s.amount_cents || 0), 0);
  const convertedTrialsCents = convertedTrials.reduce((sum: number, s: any) => sum + (s.amount_cents || 0), 0);

  // Conversion funnel: Click → Install → Started Trial → Converted Trial → Sale
  const funnel = useMemo(() => {
    const totalClicks = filteredClicks.length;
    const totalInstalls = filteredInstalls.length;
    const totalTrialsCount = filteredTrials.length;

    return [
      { step: 'Link Clicks', value: totalClicks, pct: 100 },
      { step: 'App Installs', value: totalInstalls, pct: totalClicks > 0 ? (totalInstalls / totalClicks) * 100 : 0 },
      { step: 'Started Trials', value: totalTrialsCount, pct: totalClicks > 0 ? (totalTrialsCount / totalClicks) * 100 : 0 },
      { step: 'Converted Trials', value: convertedTrials.length, pct: totalClicks > 0 ? (convertedTrials.length / totalClicks) * 100 : 0 },
      { step: 'Sales', value: directSales.length, pct: totalClicks > 0 ? (directSales.length / totalClicks) * 100 : 0 },
    ];
  }, [filteredClicks, filteredInstalls, filteredTrials, directSales, convertedTrials]);

  // Summary stats
  const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + (s.amount_cents || 0), 0);
  const totalCost = videos.reduce((sum: number, v: any) => 
    (v.status === 'approved' || v.status === 'paid') ? sum + (v.earnings_cents || 0) : sum, 0);
  const totalPaid = videos.reduce((sum: number, v: any) => 
    v.status === 'paid' ? sum + (v.earnings_cents || 0) : sum, 0);
  const totalPendingPayout = videos.reduce((sum: number, v: any) => 
    v.status === 'approved' ? sum + (v.earnings_cents || 0) : sum, 0);
  const netProfit = totalRevenue - totalCost;
  const isProfitable = netProfit > 0;

  const uniqueVisitors = new Set(filteredClicks.map((c: any) => c.visitor_id).filter(Boolean)).size;

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatNum = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const copyLink = () => {
    if (!profile?.referral_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/download/tiktok?ref=${profile.referral_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="aud"><div className="aud-loader">Loading user analytics...</div></div>;
  }

  if (!isAdmin) {
    return (
      <div className="aud">
        <div className="aud-unauthorized">
          <h1>Access Denied</h1>
          <a href="/admin" className="aud-back">← Back</a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="aud">
        <div className="aud-unauthorized">
          <h1>User Not Found</h1>
          <p>This user doesn't have a referral profile yet.</p>
          <a href="/admin" className="aud-back">← Back to Admin</a>
        </div>
      </div>
    );
  }

  const SECTIONS: { key: typeof activeSection; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'traffic', label: 'Traffic Sources' },
    { key: 'devices', label: 'Devices & Geo' },
    { key: 'sales', label: 'Sales' },
    { key: 'videos', label: 'Videos' },
    { key: 'settings', label: 'Settings' },
    { key: 'log', label: 'Activity Log' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="aud-tooltip">
        <div className="aud-tooltip-label">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="aud-tooltip-row">
            <span className="aud-tooltip-dot" style={{ backgroundColor: p.color }} />
            <span>{p.name}: <strong>{p.name === 'revenue' ? `$${p.value.toFixed(2)}` : p.value}</strong></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="aud">
      {/* Top bar */}
      <div className="aud-topbar">
        <button className="aud-back-btn" onClick={() => navigate('/admin')}>
          <FiArrowLeft /> Back to Admin
        </button>
        <div className="aud-datefilter">
          <FiCalendar />
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map(r => (
            <button key={r} className={`aud-range-btn ${dateRange === r ? 'active' : ''}`} onClick={() => setDateRange(r as any)}>
              {r === 'all' ? 'All Time' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* User Header */}
      <div className="aud-user-header">
        <img
          src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
          alt="" className="aud-avatar"
        />
        <div className="aud-user-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 className="aud-title">{profile?.display_name || 'User Detail'}</h1>
          <span style={{ 
            fontSize: '11px', 
            padding: '4px 10px', 
            borderRadius: '100px', 
            background: profile?.is_sales_affiliate ? 'rgba(59, 130, 246, 0.15)' : 'rgba(74, 222, 128, 0.15)',
            color: profile?.is_sales_affiliate ? '#3b82f6' : '#4ade80',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {profile?.is_sales_affiliate ? 'Sales Affiliate' : 'Video Creator'} ({((profile?.commission_rate > 1 ? profile.commission_rate : (profile?.commission_rate || 0.15) * 100)).toFixed(0)}%)
          </span>
        </div>
          <div className="aud-user-meta">
            <span className="aud-refcode">
              /u/{profile.referral_code}
              <button className="aud-copy-mini" onClick={copyLink}>
                {copied ? <FiCheck style={{ color: '#4ade80' }} /> : <FiCopy />}
              </button>
            </span>
            <span className="aud-joined">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* ===== PAYOUT DASHBOARD ===== */}
      {activeSection === 'overview' && totalPendingPayout > 0 && (
        <div className="aud-payout-banner" style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fff' }}>Pending Payout: {formatMoney(totalPendingPayout)}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
              User has {videos.filter(v => v.status === 'approved').length} approved videos waiting for payment.
            </p>
            <div style={{ marginTop: '10px', fontSize: '12px', display: 'flex', gap: '15px' }}>
              {profile.paypal_email && <span title="PayPal">📧 {profile.paypal_email}</span>}
              {profile.cashapp_tag && <span title="Cash App">💸 {profile.cashapp_tag}</span>}
              {profile.crypto_address && <span title="Crypto">🔗 {profile.crypto_address.substring(0, 10)}...</span>}
              {!profile.paypal_email && !profile.cashapp_tag && !profile.crypto_address && (
                <span style={{ color: '#f87171' }}>⚠️ No payment method set!</span>
              )}
            </div>
          </div>
          <button 
            onClick={async () => {
              const approvedVids = videos.filter(v => v.status === 'approved');
              if (approvedVids.length === 0) return;
              
              const summary = `Invoice Summary for ${profile.display_name}:\n` +
                `- Videos: ${approvedVids.length}\n` +
                `- Total Amount: ${formatMoney(totalPendingPayout)}\n` +
                `- Payment Method: ${profile.paypal_email || profile.cashapp_tag || profile.crypto_address || 'NOT SET'}\n\n` +
                `Mark all as PAID?`;

              if (!window.confirm(summary)) return;

              // 1. Create Invoice Record
              const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                  user_id: userId,
                  amount_cents: totalPendingPayout,
                  video_ids: approvedVids.map(v => v.id),
                  payment_method: profile.paypal_email ? 'PayPal' : profile.cashapp_tag ? 'Cash App' : profile.crypto_address ? 'Crypto' : 'Manual',
                  payment_details: profile.paypal_email || profile.cashapp_tag || profile.crypto_address || 'Manual Payout',
                  status: 'paid'
                })
                .select()
                .single();

              if (invoiceError) {
                alert('Error creating invoice: ' + invoiceError.message);
                return;
              }

              // 2. Update Videos
              const { error: videoError } = await supabase
                .from('videos')
                .update({ 
                  status: 'paid', 
                  moderated_at: new Date().toISOString(),
                  invoice_id: invoiceData.id
                })
                .eq('user_id', userId)
                .eq('status', 'approved');

              if (videoError) alert('Error updating videos: ' + videoError.message);
              else {
                // 3. Send Notification Email
                if (profile?.email) {
                  await sendPayoutNotification({
                    recipientName: profile.display_name || 'Creator',
                    recipientEmail: profile.email,
                    amount: formatMoney(totalPendingPayout),
                    invoiceId: invoiceData.id,
                    payoutMethod: profile.paypal_email ? 'PayPal' : profile.cashapp_tag ? 'Cash App' : profile.crypto_address ? 'Crypto' : 'Manual'
                  });
                }
                
                alert('Payout processed, invoice created, and videos linked successfully!');
                loadData();
              }
            }}
            style={{ 
              background: '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Pay All Approved
          </button>
        </div>
      )}

      {/* Section nav */}
      <div className="aud-section-nav">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={`aud-section-btn ${activeSection === s.key ? 'active' : ''}`}
            onClick={() => setActiveSection(s.key as any)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeSection === 'overview' && (
        <>
          <div className="aud-stats-row">
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#3b82f6', background: 'rgba(59,130,246,.1)' }}><FiMousePointer /></div>
              <div className="aud-stat-num">{formatNum(filteredClicks.length)}</div>
              <div className="aud-stat-lbl">Total Clicks</div>
              <div className="aud-stat-sub">{uniqueVisitors} unique</div>
            </div>
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#4ade80', background: 'rgba(74,222,128,.1)' }}><FiUsers /></div>
              <div className="aud-stat-num">{filteredInstalls.length}</div>
              <div className="aud-stat-lbl">App Installs</div>
              <div className="aud-stat-sub">{filteredClicks.length > 0 ? ((filteredInstalls.length / filteredClicks.length) * 100).toFixed(1) : 0}% of clicks</div>
            </div>
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#ec4899', background: 'rgba(236,72,153,.1)' }}><FiDollarSign /></div>
              <div className="aud-stat-num">{formatMoney(totalRevenue)}</div>
              <div className="aud-stat-lbl">Revenue</div>
              <div className="aud-stat-sub">{directSales.length} sales · {convertedTrials.length} converted trials</div>
            </div>
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#0ea5e9', background: 'rgba(14,165,233,.1)' }}><FiTrendingUp /></div>
              <div className="aud-stat-num">{filteredTrials.length}</div>
              <div className="aud-stat-lbl">Started Trials</div>
              <div className="aud-stat-sub">{convertedTrials.length} converted ({filteredTrials.length > 0 ? ((convertedTrials.length / filteredTrials.length) * 100).toFixed(0) : 0}%)</div>
            </div>
          </div>

          <div className="aud-stats-grid" style={{ marginBottom: '30px' }}>
        {profile?.is_sales_affiliate ? (
          <>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Total Revenue Generated</div>
              <div className="aud-stat-value">${(profile.total_sales_cents / 100).toFixed(2)}</div>
              <div className="aud-stat-icon"><FiShoppingBag /></div>
            </div>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Net Commission ({((profile.commission_rate || 0.15) * 100).toFixed(0)}%)</div>
              <div className="aud-stat-value" style={{ color: '#4ade80' }}>
                ${((profile.total_sales_cents * (profile.commission_rate > 1 ? profile.commission_rate / 100 : (profile.commission_rate || 0.15))) / 100).toFixed(2)}
              </div>
              <div className="aud-stat-icon" style={{ color: '#4ade80' }}><FiTrendingUp /></div>
            </div>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Total Refunds</div>
              <div className="aud-stat-value" style={{ color: '#ef4444' }}>-${(profile.total_refunded_cents / 100).toFixed(2)}</div>
              <div className="aud-stat-icon" style={{ color: '#ef4444' }}><FiArrowLeftCircle /></div>
            </div>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Affiliate Since</div>
              <div className="aud-stat-value" style={{ fontSize: '18px' }}>{new Date(profile.joined_at).toLocaleDateString()}</div>
              <div className="aud-stat-icon"><FiCalendar /></div>
            </div>
          </>
        ) : (
          <>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Total Video Earnings</div>
              <div className="aud-stat-value">${(profile?.total_video_earnings_cents / 100).toFixed(2)}</div>
              <div className="aud-stat-icon"><FiDollarSign /></div>
            </div>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Approved Videos</div>
              <div className="aud-stat-value">{profile?.approved_videos}</div>
              <div className="aud-stat-icon"><FiCheck /></div>
            </div>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Pending Videos</div>
              <div className="aud-stat-value">{profile?.pending_videos}</div>
              <div className="aud-stat-icon"><FiCalendar /></div>
            </div>
            <div className="aud-stat-card">
              <div className="aud-stat-label">Total Views</div>
              <div className="aud-stat-value">{profile?.total_views?.toLocaleString()}</div>
              <div className="aud-stat-icon"><FiEye /></div>
            </div>
          </>
        )}
      </div>

          {/* Clicks / Downloads / Installs timeline */}
          <div className="aud-chart-card">
            <div className="aud-chart-header">
              <h3><FiTrendingUp /> Clicks & Conversions Over Time</h3>
            </div>
            <div className="aud-chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={clicksTimeline}>
                  <defs>
                    <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradInstalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="date" stroke="#555" fontSize={11} tickLine={false} axisLine={false}
                    interval={dateRange === '7d' ? 0 : dateRange === '30d' ? 4 : 9} />
                  <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fill="url(#gradClicks)" strokeWidth={2} name="Clicks" />
                  <Area type="monotone" dataKey="installs" stroke="#4ade80" fill="url(#gradInstalls)" strokeWidth={2} name="Installs" />
                  <Area type="monotone" dataKey="trials" stroke="#0ea5e9" fillOpacity={0} strokeWidth={2} name="Started Trials" />
                  <Area type="monotone" dataKey="converted" stroke="#a855f7" fillOpacity={0} strokeWidth={2} name="Converted Trials" />
                  <Area type="monotone" dataKey="sales" stroke="#ec4899" fillOpacity={0} strokeWidth={2} name="Sales" />
                  <Area type="monotone" dataKey="refunds" stroke="#ef4444" fillOpacity={0} strokeWidth={2} strokeDasharray="4 3" name="Refunds" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="aud-chart-card">
            <div className="aud-chart-header"><h3>Conversion Funnel</h3></div>
            <div className="aud-funnel">
              {funnel.map((step, i) => (
                <div key={step.step} className="aud-funnel-step">
                  <div className="aud-funnel-bar-track">
                    <div
                      className="aud-funnel-bar-fill"
                      style={{
                        width: `${Math.max(step.pct, 2)}%`,
                        background: ['#3b82f6', '#4ade80', '#0ea5e9', '#a855f7', '#ec4899'][i],
                      }}
                    />
                  </div>
                  <div className="aud-funnel-info">
                    <span className="aud-funnel-label">{step.step}</span>
                    <span className="aud-funnel-value">{step.value}</span>
                    <span className="aud-funnel-pct">{step.pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== TRAFFIC SOURCES ===== */}
      {activeSection === 'traffic' && (
        <>
          <div className="aud-grid-2">
            {/* Platform pie chart */}
            <div className="aud-chart-card">
              <div className="aud-chart-header"><h3>Clicks by Platform</h3></div>
              <div className="aud-chart-body" style={{ display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {platformData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="aud-pie-legend">
                  {platformData.map(p => {
                    const Icon = PLATFORM_ICONS[p.name] || FiGlobe;
                    return (
                      <div key={p.name} className="aud-pie-legend-row">
                        <Icon style={{ color: p.color, fontSize: '14px' }} />
                        <span className="aud-pie-legend-name">{p.name}</span>
                        <span className="aud-pie-legend-val">{p.value}</span>
                        <span className="aud-pie-legend-pct">{filteredClicks.length > 0 ? ((p.value / filteredClicks.length) * 100).toFixed(0) : 0}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Platform clicks bar chart */}
            <div className="aud-chart-card">
              <div className="aud-chart-header"><h3>Clicks by Platform</h3></div>
              <div className="aud-chart-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={platformClicks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="platform" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== DEVICES & GEO ===== */}
      {activeSection === 'devices' && (
        <>
          <div className="aud-grid-2">
            {/* Device pie */}
            <div className="aud-chart-card">
              <div className="aud-chart-header"><h3><FiSmartphone /> Device Breakdown</h3></div>
              <div className="aud-chart-body" style={{ display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {deviceData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="aud-pie-legend">
                  {deviceData.map(d => (
                    <div key={d.name} className="aud-pie-legend-row">
                      <span className="aud-pie-dot" style={{ background: d.color }} />
                      <span className="aud-pie-legend-name">{d.name}</span>
                      <span className="aud-pie-legend-val">{d.value}</span>
                      <span className="aud-pie-legend-pct">{filteredClicks.length > 0 ? ((d.value / filteredClicks.length) * 100).toFixed(0) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Country */}
            <div className="aud-chart-card">
              <div className="aud-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3><FiGlobe /> Top Countries</h3>
                <div style={{ display: 'flex', gap: '4px', background: '#222', padding: '2px', borderRadius: '6px' }}>
                  {(['all', 'android', 'ios', 'desktop'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDeviceFilter(d)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '4px',
                        background: deviceFilter === d ? '#3b82f6' : 'transparent',
                        color: deviceFilter === d ? '#fff' : '#666',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {d === 'ios' ? 'iPhone' : d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="aud-chart-body aud-country-list">
                {countryData.length === 0 ? (
                  <div className="aud-empty-mini">No country data for this filter</div>
                ) : countryData.map((c, i) => (
                  <div key={c.country} className="aud-country-row">
                    <span className="aud-country-rank">#{i + 1}</span>
                    <span className="aud-country-flag">🌍</span>
                    <span className="aud-country-name">{c.country}</span>
                    <div className="aud-country-bar-track">
                      <div className="aud-country-bar-fill" style={{ width: `${parseFloat(c.pct)}%` }} />
                    </div>
                    <span className="aud-country-count">{c.count}</span>
                    <span className="aud-country-pct">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


        </>
      )}

      {/* ===== SALES ===== */}
      {activeSection === 'sales' && (
        <>
          <div className="aud-chart-card">
            <div className="aud-chart-header"><h3><FiDollarSign /> Revenue Over Time</h3></div>
            <div className="aud-chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesTimeline}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="date" stroke="#555" fontSize={11} tickLine={false} axisLine={false}
                    interval={dateRange === '7d' ? 0 : dateRange === '30d' ? 4 : 9} />
                  <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="url(#gradRev)" radius={[4, 4, 0, 0]} name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trials list */}
          <div className="aud-chart-card">
            <div className="aud-chart-header"><h3>Started Trials ({filteredTrials.length}) · {convertedTrials.length} converted</h3></div>
            <div className="aud-chart-body">
              {filteredTrials.length === 0 ? (
                <div className="aud-empty-mini">No trials recorded yet</div>
              ) : (
                <div className="aud-detail-tbl">
                  <div className="aud-detail-tbl-head">
                    <span>Date</span><span>Install ID</span>
                  </div>
                  {filteredTrials.map((t: any) => (
                    <div key={t.id} className="aud-detail-tbl-row">
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>{t.install_id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sales list */}
          <div className="aud-chart-card">
            <div className="aud-chart-header">
              <h3>All Sales ({filteredSales.length})</h3>
              <span style={{ fontSize: '12px', color: '#888' }}>
                Direct {formatMoney(directSalesCents)} · Converted trials {formatMoney(convertedTrialsCents)}
              </span>
            </div>
            <div className="aud-chart-body">
              {filteredSales.length === 0 ? (
                <div className="aud-empty-mini">No sales recorded yet</div>
              ) : (
                <div className="aud-detail-tbl">
                  <div className="aud-detail-tbl-head" style={{ gridTemplateColumns: '1fr 120px 100px 80px' }}>
                    <span>Date</span><span>Type</span><span>Amount</span><span>Currency</span>
                  </div>
                  {filteredSales.map((s: any) => (
                    <div key={s.id} className="aud-detail-tbl-row" style={{ gridTemplateColumns: '1fr 120px 100px 80px' }}>
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      <span>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          background: s.trial ? 'rgba(168,85,247,0.15)' : 'rgba(236,72,153,0.15)',
                          color: s.trial ? '#a855f7' : '#ec4899',
                        }}>
                          {s.trial ? 'Converted Trial' : 'Direct Sale'}
                        </span>
                      </span>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>{formatMoney(s.amount_cents)}</span>
                      <span>{s.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== VIDEOS ===== */}
      {activeSection === 'videos' && (
        <div className="aud-chart-card">
          <div className="aud-chart-header"><h3><FiVideo /> Submitted Videos ({videos.length})</h3></div>
          <div className="aud-chart-body">
            {videos.length === 0 ? (
              <div className="aud-empty-mini">No videos submitted</div>
            ) : (
              <div className="aud-detail-tbl">
                <div className="aud-detail-tbl-head" style={{ gridTemplateColumns: '2fr 100px 100px 100px 120px 100px' }}>
                  <span>URL</span><span>Platform</span><span>Views</span><span>Status</span><span>Submitted</span><span>Actions</span>
                </div>
                {videos.map((v: any) => (
                  <div key={v.id} className="aud-detail-tbl-row" style={{ gridTemplateColumns: '2fr 100px 100px 100px 120px 100px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="aud-link">
                        {v.video_url.substring(0, 50)}... <FiExternalLink />
                      </a>
                    </span>
                    <span className="aud-badge">{v.platform}</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{formatNum(v.views || 0)}</span>
                    <span className={`aud-status ${v.status}`}>{v.status}</span>
                    <span>{new Date(v.submitted_at).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', gap: '5px' }}>
                      {v.status === 'pending' ? (
                        <>
                          <button 
                            onClick={async () => {
                              const earnings = prompt('Enter earnings in USD (e.g. 5.50):', (v.views / 1000).toFixed(2));
                              if (earnings === null) return;
                              const cents = Math.round(parseFloat(earnings) * 100);
                              const { error } = await supabase.from('videos').update({ 
                                status: 'approved', 
                                earnings_cents: cents,
                                moderated_at: new Date().toISOString()
                              }).eq('id', v.id);
                              if (error) alert('Error: ' + error.message);
                              else loadData();
                            }}
                            style={{ background: '#059669', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={async () => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason === null) return;
                              const { error } = await supabase.from('videos').update({ 
                                status: 'rejected', 
                                rejection_reason: reason,
                                moderated_at: new Date().toISOString()
                              }).eq('id', v.id);
                              if (error) alert('Error: ' + error.message);
                              else loadData();
                            }}
                            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </>
                      ) : v.status === 'approved' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', opacity: 0.8, color: '#4ade80' }}>
                            Approved: ${(v.earnings_cents / 100).toFixed(2)}
                          </span>
                          <button 
                            onClick={async () => {
                              if (!window.confirm('Mark this video as PAID? This means you have sent the money.')) return;
                              const { error } = await supabase.from('videos').update({ 
                                status: 'paid',
                                moderated_at: new Date().toISOString()
                              }).eq('id', v.id);
                              if (error) alert('Error: ' + error.message);
                              else loadData();
                            }}
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '9px', cursor: 'pointer' }}
                          >
                            Mark Paid
                          </button>
                        </div>
                      ) : v.status === 'paid' ? (
                        <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 'bold' }}>
                          PAID: ${(v.earnings_cents / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', opacity: 0.5 }}>
                          Rejected
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS ===== */}
      {activeSection === 'settings' && (
        <div style={{ maxWidth: '600px' }}>
          <div className="aud-chart-card">
            <div className="aud-chart-header"><h3><FiSettings /> Account Configuration</h3></div>
            <div className="aud-chart-body" style={{ padding: '0 20px' }}>
              <div className="aud-config-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>Affiliate Mode</div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Earn commission on sales instead of views</div>
                </div>
                <button 
                  onClick={handleToggleAffiliate}
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    border: 'none',
                    background: profile?.is_sales_affiliate ? '#dc2626' : '#3b82f6',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {profile?.is_sales_affiliate ? 'Disable Affiliate' : 'Enable Affiliate'}
                </button>
              </div>

              {profile?.is_sales_affiliate && (
                <div className="aud-config-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>Commission Rate</div>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Custom percentage for this affiliate</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="number" 
                      defaultValue={(profile.commission_rate > 1 ? profile.commission_rate : profile.commission_rate * 100).toFixed(0)} 
                      onBlur={(e) => handleUpdateCommission(e.target.value)}
                      style={{ 
                        width: '70px', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        background: '#0f172a', 
                        border: '1px solid #1e293b', 
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '15px',
                        fontWeight: 'bold'
                      }}
                    />
                    <span style={{ fontWeight: 'bold', color: '#888', fontSize: '18px' }}>%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="aud-chart-card" style={{ marginTop: '24px' }}>
            <div className="aud-chart-header"><h3>Payment Methods</h3></div>
            <div className="aud-chart-body" style={{ padding: '0 20px' }}>
              <div style={{ padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>PayPal</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{profile.paypal_email || '—'}</span>
              </div>
              <div style={{ padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Cash App</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{profile.cashapp_tag || '—'}</span>
              </div>
              <div style={{ padding: '15px 0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Crypto</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>{profile.crypto_address || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTIVITY LOG ===== */}
      {activeSection === 'log' && (
        <div className="aud-chart-card">
          <div className="aud-chart-header"><h3>Recent Activity (Last 50 Clicks)</h3></div>
          <div className="aud-chart-body">
            <div className="aud-detail-tbl">
              <div className="aud-detail-tbl-head">
                <span>Time</span><span>Platform</span><span>Device</span><span>Country</span>
              </div>
              {[...filteredClicks].reverse().slice(0, 50).map((c: any) => (
                <div key={c.id} className="aud-detail-tbl-row">
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                  <span className="aud-badge">{c.platform}</span>
                  <span>{c.device_type}</span>
                  <span>{c.country ? countryName(c.country) : '—'}</span>
                </div>
              ))}
              {filteredClicks.length === 0 && <div className="aud-empty-mini">No clicks recorded</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetail;
