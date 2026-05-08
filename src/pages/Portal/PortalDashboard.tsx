import React, { useState, useEffect } from 'react';
import { FiClock as _FiClock, FiDollarSign as _FiDollarSign, FiVideo as _FiVideo, FiEye as _FiEye, FiGift as _FiGift, FiTrendingUp as _FiTrendingUp, FiShoppingBag as _FiShoppingBag, FiArrowLeftCircle as _FiArrowLeftCircle } from 'react-icons/fi';
import { BiCalendar as _BiCalendar } from 'react-icons/bi';
import { supabase } from '../../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FiClock = _FiClock as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
const FiVideo = _FiVideo as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiGift = _FiGift as React.ElementType;
const FiTrendingUp = _FiTrendingUp as React.ElementType;
const FiShoppingBag = _FiShoppingBag as React.ElementType;
const FiArrowLeftCircle = _FiArrowLeftCircle as React.ElementType;
const BiCalendar = _BiCalendar as React.ElementType;

const PortalDashboard = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 17, h: 18, m: 53, s: 8 });
  const [stats, setStats] = useState<any>({
    verified: 0,
    unverified: 0,
    totalPosts: 0,
    totalViews: 0,
    totalSales: 0,
    totalRefunds: 0,
    commissionEarned: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [salesTimeline, setSalesTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('referral_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        if (profileData?.is_sales_affiliate) {
          // Fetch Sales and Refunds for Affiliate
          const { data: sales } = await supabase
            .from('referral_sales')
            .select('*')
            .eq('referral_code', profileData.referral_code);
          
          const { data: refunds } = await supabase
            .from('referral_refunds')
            .select('*')
            .eq('referral_code', profileData.referral_code);

          const totalSalesCents = (sales || []).reduce((acc, s) => acc + (s.amount_cents || 0), 0);
          const totalRefundsCents = (refunds || []).reduce((acc, r) => acc + (r.amount_cents || 0), 0);
          const netSalesCents = totalSalesCents - totalRefundsCents;
          const commission = netSalesCents * (profileData.commission_rate || 0.15);

          setStats({
            totalSales: totalSalesCents,
            totalRefunds: totalRefundsCents,
            commissionEarned: commission,
            salesCount: (sales || []).length,
            refundsCount: (refunds || []).length
          });

          // Generate simple timeline data
          const timeline = (sales || []).slice(-10).map(s => ({
            date: new Date(s.created_at).toLocaleDateString(),
            amount: s.amount_cents / 100
          }));
          setSalesTimeline(timeline);

        } else {
          // Fetch Videos for Creator
          const { data: videos, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          const aggregated = (videos || []).reduce((acc, v) => {
            if (v.status === 'approved') {
              acc.verified += (v.earnings_cents || 0);
            } else if (v.status === 'pending') {
              acc.unverified += (v.earnings_cents || 0);
            }
            acc.totalPosts += 1;
            acc.totalViews += (v.views || 0);
            return acc;
          }, { verified: 0, unverified: 0, totalPosts: 0, totalViews: 0 });

          setStats(aggregated);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { d, h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
            else {
              h = 23;
              if (d > 0) d--;
            }
          }
        }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="portal-dashboard">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Dashboard</h1>
          <p className="portal-page-subtitle">Track your performance and earnings</p>
        </div>
        <div className="portal-date-selector">
          <BiCalendar className="portal-date-icon" />
          <span>April 2026</span>
          <span className="portal-badge-current">Current</span>
          <svg className="portal-chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </header>

      <div className="portal-countdown-banner">
        <FiClock className="portal-countdown-icon" />
        <div className="portal-countdown-timer">
          <span className="portal-time-block">{String(timeLeft.d).padStart(2, '0')}</span><span className="portal-time-label">d</span><span className="portal-time-sep">:</span>
          <span className="portal-time-block">{String(timeLeft.h).padStart(2, '0')}</span><span className="portal-time-label">h</span><span className="portal-time-sep">:</span>
          <span className="portal-time-block">{String(timeLeft.m).padStart(2, '0')}</span><span className="portal-time-label">m</span><span className="portal-time-sep">:</span>
          <span className="portal-time-block">{String(timeLeft.s).padStart(2, '0')}</span><span className="portal-time-label">s</span>
        </div>
        <span className="portal-countdown-text">until monthly payouts finalize (PST)</span>
        {/* <div className="portal-info-icon-small">i</div> */}
      </div>

      <div className="portal-metrics-grid">
        {profile?.is_sales_affiliate ? (
          <>
            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Total Sales</span>
                  <div className="portal-metric-value">${(stats.totalSales / 100).toFixed(2)}</div>
                  <div className="portal-metric-subtext">{stats.salesCount} conversions</div>
                </div>
                <div className="portal-metric-icon-wrapper verified-icon">
                  <FiShoppingBag />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Commission ({((profile?.commission_rate > 1 ? profile.commission_rate : (profile?.commission_rate || 0.15) * 100)).toFixed(0)}%)</span>
                  <div className="portal-metric-value highlight">${(stats.commissionEarned / 100).toFixed(2)}</div>
                  <div className="portal-metric-subtext">Net earnings</div>
                </div>
                <div className="portal-metric-icon-wrapper unverified-icon">
                  <FiTrendingUp />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Refunds</span>
                  <div className="portal-metric-value" style={{ color: '#ef4444' }}>-${(stats.totalRefunds / 100).toFixed(2)}</div>
                  <div className="portal-metric-subtext">{stats.refundsCount} total refunds</div>
                </div>
                <div className="portal-metric-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <FiArrowLeftCircle />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Conversion Rate</span>
                  <div className="portal-metric-value">{(stats.totalSales > 0 ? (stats.salesCount / 100).toFixed(1) : 0)}%</div>
                  <div className="portal-metric-subtext">Average performance</div>
                </div>
                <div className="portal-metric-icon-wrapper views-icon">
                  <FiTrendingUp />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Verified Earnings</span>
                  <div className="portal-metric-value">${(stats.verified / 100).toFixed(2)}</div>
                  <div className="portal-metric-subtext">April 2026</div>
                </div>
                <div className="portal-metric-icon-wrapper verified-icon">
                  <FiDollarSign />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Unverified Earnings</span>
                  <div className="portal-metric-value highlight">${(stats.unverified / 100).toFixed(2)}</div>
                  <div className="portal-metric-subtext">Awaiting review</div>
                </div>
                <div className="portal-metric-icon-wrapper unverified-icon">
                  <FiClock />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Total Posts</span>
                  <div className="portal-metric-value">{stats.totalPosts}</div>
                  <div className="portal-metric-subtext">Submitted videos</div>
                </div>
                <div className="portal-metric-icon-wrapper posts-icon">
                  <FiVideo />
                </div>
              </div>
            </div>

            <div className="portal-metric-card">
              <div className="portal-metric-content-wrapper">
                <div className="portal-metric-left">
                  <span className="portal-metric-title">Total Views</span>
                  <div className="portal-metric-value">{stats.totalViews.toLocaleString()}</div>
                  <div className="portal-metric-subtext">Across all videos</div>
                </div>
                <div className="portal-metric-icon-wrapper views-icon">
                  <FiEye />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {profile?.is_sales_affiliate ? (
        <div className="portal-payout-deal-card affiliate-performance">
          <div className="portal-deal-header">
            <div className="portal-deal-icon">
              <FiTrendingUp />
            </div>
            <div>
              <h3 className="portal-deal-title">Sales Performance</h3>
              <p className="portal-deal-subtitle">Your recent sales activity and growth</p>
            </div>
          </div>
          <div className="affiliate-chart-container" style={{ height: '300px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTimeline}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip 
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="portal-payout-deal-card">
          <div className="portal-deal-header">
            <div className="portal-deal-icon">
              <FiGift />
            </div>
            <div>
              <h3 className="portal-deal-title">Your Payout Deal</h3>
              <p className="portal-deal-subtitle">$20 per video that reaches 40k+ views</p>
            </div>
          </div>

          <div className="portal-deal-base">
            <div>
              <div className="portal-deal-label">Base Rate</div>
              <div className="portal-deal-amount">$20</div>
            </div>
            <div className="portal-deal-right">
              <div className="portal-deal-label right-align">per video that reaches</div>
              <div className="portal-deal-target">40K+ views</div>
            </div>
          </div>

          <div className="portal-deal-bonus-section">
            <h4 className="portal-deal-bonus-title">Bonus Tiers</h4>

            <div className="portal-deal-bonus-row">
              <div className="portal-deal-bonus-amt"><span className="bullet">•</span> <span className="portal-deal-bonus-amt-text">+$30</span></div>
              <div className="portal-deal-bonus-req">500K views</div>
            </div>

            <div className="portal-deal-bonus-row">
              <div className="portal-deal-bonus-amt"><span className="bullet">•</span> <span className="portal-deal-bonus-amt-text">+$50</span></div>
              <div className="portal-deal-bonus-req">1M views</div>
            </div>
          </div>

          <div className="portal-deal-footer">
            Maximum earnings per video: $100
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalDashboard;
