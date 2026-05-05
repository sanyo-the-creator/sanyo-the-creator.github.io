import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  FiVideo as _FiVideo, FiCheck as _FiCheck, FiX as _FiX, FiExternalLink as _FiExternalLink, 
  FiClock as _FiClock, FiDollarSign as _FiDollarSign, FiSearch as _FiSearch, 
  FiFilter as _FiFilter, FiUser as _FiUser, FiInfo as _FiInfo,
  FiArrowLeft as _FiArrowLeft, FiEye as _FiEye
} from 'react-icons/fi';
import './AdminDashboard.css'; // Reusing some styles

const FiVideo = _FiVideo as React.ElementType;
const FiCheck = _FiCheck as React.ElementType;
const FiX = _FiX as React.ElementType;
const FiExternalLink = _FiExternalLink as React.ElementType;
const FiClock = _FiClock as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
const FiSearch = _FiSearch as React.ElementType;
const FiFilter = _FiFilter as React.ElementType;
const FiUser = _FiUser as React.ElementType;
const FiInfo = _FiInfo as React.ElementType;
const FiArrowLeft = _FiArrowLeft as React.ElementType;
const FiEye = _FiEye as React.ElementType;

const AdminVideoReview: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'payouts'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalData, setModalData] = useState<{ type: 'approve' | 'reject', video: any } | null>(null);
  const [reason, setReason] = useState('');
  const [earnings, setEarnings] = useState('');
  const [viewsValue, setViewsValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, [filter]);

  const checkAdminAndLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }

      const { data: adminData } = await supabase
        .from('admin_users').select('id').eq('id', user.id).single();
      
      if (!adminData) { setIsAdmin(false); return; }
      setIsAdmin(true);

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*, referral_profiles(id, display_name, avatar_url, paypal_email, cashapp_tag, crypto_address)')
        .ilike('status', filter === 'payouts' ? 'approved' : filter)
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVideos(data || []);
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!modalData) return;
    setProcessing(true);
    
    try {
      const { data: { user: admin } } = await supabase.auth.getUser();
      const updates: any = {
        status: modalData.type === 'approve' ? 'approved' : 'rejected',
        moderated_at: new Date().toISOString(),
        moderated_by: admin?.id,
      };

      if (modalData.type === 'approve') {
        updates.earnings_cents = Math.round(parseFloat(earnings) * 100) || 0;
        updates.views = parseInt(viewsValue) || 0;
        updates.rejection_reason = reason; // Reuse this column for approval message
      } else {
        updates.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', modalData.video.id);

      if (error) throw error;

      // Update local state
      setVideos(videos.filter(v => v.id !== modalData.video.id));
      setModalData(null);
      setReason('');
      setEarnings('');
      setViewsValue('');
    } catch (err) {
      alert('Failed to update video status');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading && videos.length === 0) {
    return <div className="admin-dashboard"><div className="admin-loader">Loading videos...</div></div>;
  }

  if (isAdmin === false) {
    return <div className="admin-dashboard"><div className="admin-unauthorized">Access Denied</div></div>;
  }

  const filteredVideos = videos.filter(v => 
    (v.video_url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.referral_profiles?.display_name || 'Unknown Creator').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/admin')} className="admin-back-btn" style={{ padding: '8px' }}>
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="admin-title">Video Moderation</h1>
            <p className="admin-subtitle">Review submitted TikToks and Instagram Reels <span style={{ fontSize: '10px', opacity: 0.3 }}>(v1.0.3-manual-join)</span></p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-toolbar" style={{ justifyContent: 'flex-start', gap: '20px' }}>
        <div className="admin-sort-bar">
          {(['pending', 'approved', 'rejected', 'payouts'] as const).map(t => (
            <button 
              key={t}
              className={`admin-sort-btn ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
              style={{ textTransform: 'capitalize' }}
            >
              {t === 'payouts' ? 'Awaiting Payouts' : t} {filter === t ? `(${videos.length})` : ''}
            </button>
          ))}
        </div>
        
        <div className="admin-search-bar" style={{ maxWidth: '400px', flex: 1 }}>
          <FiSearch className="admin-search-icon" />
          <input 
            type="text" 
            className="admin-search-input" 
            placeholder="Search by URL or Creator..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '20px', margin: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444' }}>
          <strong>Error:</strong> {error}
          <button onClick={() => checkAdminAndLoad()} style={{ marginLeft: '15px', padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      <div className="admin-users-table">
        {filter === 'payouts' ? (
          <>
            <div className="admin-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 120px' }}>
              <span>CREATOR</span>
              <span>PAYMENT METHODS</span>
              <span>PENDING AMOUNT</span>
              <span>ACTIONS</span>
            </div>
            {Object.values(videos.reduce((acc, v) => {
              const uid = v.user_id;
              if (!acc[uid]) {
                acc[uid] = { 
                  profile: v.referral_profiles, 
                  total_cents: 0, 
                  video_ids: [],
                  vids: []
                };
              }
              acc[uid].total_cents += v.earnings_cents || 0;
              acc[uid].video_ids.push(v.id);
              acc[uid].vids.push(v);
              return acc;
            }, {} as any)).length === 0 ? (
              <div className="admin-empty">No pending payouts found</div>
            ) : (
              Object.values(videos.reduce((acc, v) => {
                const uid = v.user_id;
                if (!acc[uid]) {
                  acc[uid] = { profile: v.referral_profiles, total_cents: 0, video_ids: [], vids: [] };
                }
                acc[uid].total_cents += v.earnings_cents || 0;
                acc[uid].video_ids.push(v.id);
                acc[uid].vids.push(v);
                return acc;
              }, {} as any)).map((group: any) => (
                <div key={group.profile.id} className="admin-user-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 120px', cursor: 'default', padding: '15px 20px' }}>
                  <div className="admin-col-user">
                    <img src={group.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.profile.id}`} alt="" className="admin-user-avatar" />
                    <div>
                      <div className="admin-user-name">{group.profile.display_name}</div>
                      <div className="admin-user-email">UID: {group.profile.id.substring(0, 8)}</div>
                    </div>
                  </div>
                  <div className="admin-col-stat" style={{ fontSize: '11px', color: '#888', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {group.profile.paypal_email && <span>📧 {group.profile.paypal_email}</span>}
                    {group.profile.cashapp_tag && <span>💸 {group.profile.cashapp_tag}</span>}
                    {group.profile.crypto_address && <span title={group.profile.crypto_address}>🔗 {group.profile.crypto_address.substring(0, 8)}...</span>}
                    {!group.profile.paypal_email && !group.profile.cashapp_tag && !group.profile.crypto_address && <span style={{ color: '#ef4444' }}>No method set</span>}
                  </div>
                  <div className="admin-col-stat" style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '16px' }}>
                    ${(group.total_cents / 100).toFixed(2)}
                  </div>
                  <div className="admin-col-expand">
                    <button 
                      onClick={async () => {
                        const summary = `Pay ${(group.total_cents / 100).toFixed(2)} to ${group.profile.display_name}?\n` +
                          `Method: ${group.profile.paypal_email || group.profile.cashapp_tag || group.profile.crypto_address || 'NOT SET'}`;
                        
                        if (!window.confirm(summary)) return;

                        // 1. Create Invoice
                        const { error: invErr } = await supabase.from('invoices').insert({
                          user_id: group.profile.id,
                          amount_cents: group.total_cents,
                          video_ids: group.video_ids,
                          payment_method: group.profile.paypal_email ? 'PayPal' : group.profile.cashapp_tag ? 'Cash App' : group.profile.crypto_address ? 'Crypto' : 'Manual',
                          payment_details: group.profile.paypal_email || group.profile.cashapp_tag || group.profile.crypto_address || 'Manual',
                          status: 'paid'
                        });

                        if (invErr) { alert('Invoice Error: ' + invErr.message); return; }

                        // 2. Mark Paid
                        const { error: vidErr } = await supabase
                          .from('videos')
                          .update({ status: 'paid' })
                          .in('id', group.video_ids);

                        if (vidErr) alert('Error: ' + vidErr.message);
                        else {
                          alert('Payout successful!');
                          checkAdminAndLoad();
                        }
                      }}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className="admin-table-header" style={{ gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 120px' }}>
              <span>PREVIEW</span>
              <span>VIDEO / CREATOR</span>
              <span>PLATFORM</span>
              <span>VIEWS</span>
              <span>SUBMITTED</span>
              <span>ACTIONS</span>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="admin-empty">No {filter} videos found</div>
            ) : (
              filteredVideos.map(video => (
                <div key={video.id} className="admin-user-row" style={{ gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 120px', cursor: 'default', padding: '12px 20px' }}>
                  <div className="admin-col-stat">
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt="thumb" 
                        style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x60?text=Video'; }}
                      />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '4px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiVideo color="#555" />
                      </div>
                    )}
                  </div>
                  <div className="admin-col-user">
                    <div style={{ overflow: 'hidden' }}>
                      <a href={video.video_url} target="_blank" rel="noreferrer" className="admin-user-name" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        View Video <FiExternalLink size={12} />
                      </a>
                      <div className="admin-user-email" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FiUser size={12} /> {video.referral_profiles?.display_name || 'Unknown Creator'}
                      </div>
                    </div>
                  </div>
                  <div className="admin-col-stat">
                    <span className="admin-badge" style={{ background: video.platform === 'tiktok' ? 'rgba(0,0,0,0.3)' : 'rgba(225,48,108,0.2)', color: video.platform === 'tiktok' ? '#fff' : '#E1306C' }}>
                      {video.platform}
                    </span>
                  </div>
                  <div className="admin-col-stat" style={{ fontWeight: 'bold' }}>
                    {video.views?.toLocaleString() || 0}
                  </div>
                  <div className="admin-col-stat">
                    {new Date(video.submitted_at).toLocaleDateString()}
                  </div>
                  <div className="admin-col-expand" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {filter === 'pending' ? (
                      <>
                        <button 
                          className="admin-action-btn approve" 
                          onClick={() => {
                            setModalData({ type: 'approve', video });
                            setViewsValue(video.views?.toString() || '0');
                            setEarnings((video.views / 1000).toFixed(2)); // Default suggestion: $1 per 1k views
                          }}
                          title="Approve"
                          style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <FiCheck />
                        </button>
                        <button 
                          className="admin-action-btn reject" 
                          onClick={() => setModalData({ type: 'reject', video })}
                          title="Reject"
                          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <FiX />
                        </button>
                      </>
                    ) : (
                       <div style={{ fontSize: '12px', opacity: 0.6, textAlign: 'right' }}>
                         {filter === 'approved' ? `$${(video.earnings_cents / 100).toFixed(2)}` : 'Rejected'}
                       </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Action Modal */}
      {modalData && (
        <div className="admin-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="admin-modal" style={{
            background: '#1a1a2e', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px',
            border: '1px solid #333', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {modalData.type === 'approve' ? <><FiCheck color="#059669" /> Approve Video</> : <><FiX color="#dc2626" /> Reject Video</>}
            </h2>
            
            <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '20px' }}>
              Confirming action for video by <strong>{modalData.video.referral_profiles?.display_name}</strong>
            </p>

            {modalData.type === 'approve' ? (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>VIEWS</label>
                  <div style={{ position: 'relative' }}>
                    <FiEye style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                    <input 
                      type="number" 
                      value={viewsValue}
                      onChange={e => setViewsValue(e.target.value)}
                      style={{ width: '100%', padding: '10px 10px 10px 35px', background: '#0f0f1a', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                      placeholder="0"
                    />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>EARNINGS (USD)</label>
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                  <FiDollarSign style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input 
                    type="number" 
                    value={earnings}
                    onChange={e => setEarnings(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 35px', background: '#0f0f1a', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                    placeholder="0.00"
                  />
                </div>

                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>MESSAGE FOR USER (OPTIONAL)</label>
                <textarea 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', minHeight: '60px', resize: 'vertical', fontSize: '13px' }}
                  placeholder="e.g. Great video! Bonus added for high engagement."
                />
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>REJECTION REASON</label>
                <textarea 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0f0f1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', minHeight: '100px', resize: 'vertical' }}
                  placeholder="e.g. Video is private, @upshift tag missing, views too low..."
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {[
                    'Missing @upshift tag', 
                    'Video is private', 
                    'Wrong caption', 
                    'Missing caption', 
                    'Missing URL in profile', 
                    'Wrong referral link', 
                    'Upshift video cropped/invisible',
                    'Upshift clip too short (< 2s)',
                    'Upshift clip not in first 15s',
                    'Invalid views'
                  ].map(r => (
                    <button 
                      key={r} 
                      onClick={() => {
                        setReason(prev => {
                          if (!prev) return r;
                          if (prev.includes(r)) return prev;
                          return `${prev}, ${r}`;
                        });
                      }}
                      style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '6px', background: '#333', border: '1px solid #444', color: '#ccc', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#444')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#333')}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setModalData(null)}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={processing || (modalData.type === 'approve' ? !earnings : !reason)}
                style={{ 
                  flex: 1, padding: '10px', 
                  background: modalData.type === 'approve' ? '#059669' : '#dc2626', 
                  border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                  opacity: processing || (modalData.type === 'approve' ? !earnings : !reason) ? 0.5 : 1
                }}
              >
                {processing ? 'Processing...' : modalData.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideoReview;
