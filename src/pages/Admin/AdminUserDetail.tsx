import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
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
  FiTrendingUp as _FiTrendingUp,
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
const FiTrendingUp = _FiTrendingUp as React.ElementType;
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
  const [videos, setVideos] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

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
        .from('referral_profiles').select('*').eq('id', userId).single();
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

  // Filter data by date range
  const filterByDate = (items: any[], dateField: string) => {
    if (dateRange === 'all') return items;
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return items.filter(item => new Date(item[dateField]) >= cutoff);
  };

  const filteredClicks = useMemo(() => filterByDate(clicks, 'created_at'), [clicks, dateRange]);
  const filteredInstalls = useMemo(() => filterByDate(installs, 'installed_at'), [installs, dateRange]);
  const filteredSales = useMemo(() => filterByDate(sales, 'created_at'), [sales, dateRange]);
  const filteredTrials = useMemo(() => filterByDate(trials, 'created_at'), [trials, dateRange]);

  // ===== CHART DATA COMPUTATION =====

  // Clicks per day timeline
  const clicksTimeline = useMemo(() => {
    const map: Record<string, { clicks: number; installs: number; sales: number }> = {};
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 60;
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().substring(0, 10);
      map[key] = { clicks: 0, installs: 0, sales: 0 };
    }

    filteredClicks.forEach(c => {
      const key = new Date(c.created_at).toISOString().substring(0, 10);
      if (map[key]) map[key].clicks++;
    });

    filteredInstalls.forEach(i => {
      const key = new Date(i.installed_at).toISOString().substring(0, 10);
      if (map[key]) map[key].installs++;
    });

    filteredSales.forEach(s => {
      const key = new Date(s.created_at).toISOString().substring(0, 10);
      if (map[key]) map[key].sales++;
    });

    return Object.entries(map).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: date,
      ...data,
      trials: filteredTrials.filter(tr => new Date(tr.created_at).toISOString().substring(0, 10) === date).length,
    }));
  }, [filteredClicks, filteredInstalls, filteredTrials, filteredSales, dateRange]);

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
    filteredClicks.forEach(c => {
      const countryRaw = c.country || 'Unknown';
      const country = countryRaw !== 'Unknown' ? countryName(countryRaw) : countryRaw;
      map[country] = (map[country] || 0) + 1;
    });
    return Object.entries(map)
      .map(([country, count]) => ({ country, count, pct: filteredClicks.length > 0 ? ((count / filteredClicks.length) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [filteredClicks]);




  // Conversion funnel: Click → Install → Purchase
  const funnel = useMemo(() => {
    const totalClicks = filteredClicks.length;
    const totalInstalls = filteredInstalls.length;
    const totalTrialsCount = filteredTrials.length;
    const totalSalesCount = filteredSales.length;

    return [
      { step: 'Link Clicks', value: totalClicks, pct: 100 },
      { step: 'App Installs', value: totalInstalls, pct: totalClicks > 0 ? (totalInstalls / totalClicks) * 100 : 0 },
      { step: 'Trials', value: totalTrialsCount, pct: totalClicks > 0 ? (totalTrialsCount / totalClicks) * 100 : 0 },
      { step: 'Purchases', value: totalSalesCount, pct: totalClicks > 0 ? (totalSalesCount / totalClicks) * 100 : 0 },
    ];
  }, [filteredClicks, filteredInstalls, filteredTrials, filteredSales]);

  // Summary stats
  const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + (s.amount_cents || 0), 0);
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

  const SECTIONS = [
    { key: 'overview', label: 'Overview' },
    { key: 'traffic', label: 'Traffic Sources' },
    { key: 'devices', label: 'Devices & Geo' },
    { key: 'sales', label: 'Sales' },
    { key: 'videos', label: 'Videos' },
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
            <button key={r} className={`aud-range-btn ${dateRange === r ? 'active' : ''}`} onClick={() => setDateRange(r)}>
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
          <h1 className="aud-user-name">{profile.display_name || 'Unknown'}</h1>
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

      {/* Section nav */}
      <div className="aud-section-nav">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={`aud-section-btn ${activeSection === s.key ? 'active' : ''}`}
            onClick={() => setActiveSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeSection === 'overview' && (
        <>
          {/* Stat cards */}
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
              <div className="aud-stat-sub">{filteredSales.length} transactions</div>
            </div>
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#0ea5e9', background: 'rgba(14,165,233,.1)' }}><FiTrendingUp /></div>
              <div className="aud-stat-num">{filteredTrials.length}</div>
              <div className="aud-stat-lbl">Trials</div>
              <div className="aud-stat-sub">{filteredInstalls.length > 0 ? ((filteredTrials.length / filteredInstalls.length) * 100).toFixed(1) : 0}% of installs</div>
            </div>
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,.1)' }}><FiVideo /></div>
              <div className="aud-stat-num">{videos.length}</div>
              <div className="aud-stat-lbl">Videos</div>
              <div className="aud-stat-sub">{videos.filter(v => v.status === 'approved').length} approved</div>
            </div>
            <div className="aud-stat">
              <div className="aud-stat-icon" style={{ color: '#06b6d4', background: 'rgba(6,182,212,.1)' }}><FiEye /></div>
              <div className="aud-stat-num">{formatNum(videos.reduce((s: number, v: any) => s + (v.views || 0), 0))}</div>
              <div className="aud-stat-lbl">Total Views</div>
              <div className="aud-stat-sub">Across all videos</div>
            </div>
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
                  <Area type="monotone" dataKey="trials" stroke="#0ea5e9" fillOpacity={0} strokeWidth={2} name="Trials" />
                  <Area type="monotone" dataKey="sales" stroke="#ec4899" fillOpacity={0} strokeWidth={2} name="Sales" />
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
                        background: ['#3b82f6', '#4ade80', '#0ea5e9', '#ec4899'][i],
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
              <div className="aud-chart-header"><h3><FiGlobe /> Top Countries</h3></div>
              <div className="aud-chart-body aud-country-list">
                {countryData.length === 0 ? (
                  <div className="aud-empty-mini">No country data yet</div>
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
            <div className="aud-chart-header"><h3>All Trials ({filteredTrials.length})</h3></div>
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
            <div className="aud-chart-header"><h3>All Sales ({filteredSales.length})</h3></div>
            <div className="aud-chart-body">
              {filteredSales.length === 0 ? (
                <div className="aud-empty-mini">No sales recorded yet</div>
              ) : (
                <div className="aud-detail-tbl">
                  <div className="aud-detail-tbl-head">
                    <span>Date</span><span>Amount</span><span>Currency</span>
                  </div>
                  {filteredSales.map((s: any) => (
                    <div key={s.id} className="aud-detail-tbl-row">
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
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
                      ) : (
                        <span style={{ fontSize: '10px', opacity: 0.5 }}>
                          {v.status === 'approved' ? `$${(v.earnings_cents / 100).toFixed(2)}` : 'Rejected'}
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
