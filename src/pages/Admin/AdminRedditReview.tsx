import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  FiCheck as _FiCheck, FiX as _FiX, FiExternalLink as _FiExternalLink,
  FiDollarSign as _FiDollarSign, FiSearch as _FiSearch, FiUser as _FiUser,
  FiArrowLeft as _FiArrowLeft, FiEye as _FiEye, FiPlayCircle as _FiPlayCircle,
} from 'react-icons/fi';
import { FaReddit as _FaReddit } from 'react-icons/fa';
import './AdminDashboard.css';

const FiCheck = _FiCheck as React.ElementType;
const FiX = _FiX as React.ElementType;
const FiExternalLink = _FiExternalLink as React.ElementType;
const FiDollarSign = _FiDollarSign as React.ElementType;
const FiSearch = _FiSearch as React.ElementType;
const FiUser = _FiUser as React.ElementType;
const FiArrowLeft = _FiArrowLeft as React.ElementType;
const FiEye = _FiEye as React.ElementType;
const FiPlayCircle = _FiPlayCircle as React.ElementType;
const FaReddit = _FaReddit as React.ElementType;

// Same cumulative payout tiers as the submission form
function payoutForViews(views: number): number {
  if (views >= 500000) return 50;
  if (views >= 200000) return 20;
  if (views >= 40000) return 10;
  return 0;
}

const AdminRedditReview: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'payouts'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalData, setModalData] = useState<{ type: 'approve' | 'reject'; post: any } | null>(null);
  const [reason, setReason] = useState('');
  const [earnings, setEarnings] = useState('');
  const [viewsValue, setViewsValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const checkAdminAndLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }

      const { data: adminData } = await supabase.from('admin_users').select('id').eq('id', user.id).single();
      if (!adminData) { setIsAdmin(false); return; }
      setIsAdmin(true);

      const { data, error: fetchError } = await supabase
        .from('reddit_posts')
        .select('*, referral_profiles(id, display_name, avatar_url, paypal_email, cashapp_tag, crypto_address)')
        .ilike('status', filter === 'payouts' ? 'approved' : filter)
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPosts(data || []);
    } catch (err: any) {
      console.error('Error loading reddit posts:', err);
      setError(err.message || 'Failed to load posts');
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
        updates.rejection_reason = reason;
      } else {
        updates.rejection_reason = reason;
      }

      const { error } = await supabase.from('reddit_posts').update(updates).eq('id', modalData.post.id);
      if (error) throw error;

      setPosts(posts.filter((p) => p.id !== modalData.post.id));
      setModalData(null);
      setReason('');
      setEarnings('');
      setViewsValue('');
    } catch (err) {
      alert('Failed to update post status');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading && posts.length === 0) {
    return <div className="admin-dashboard"><div className="admin-loader">Loading posts...</div></div>;
  }
  if (isAdmin === false) {
    return <div className="admin-dashboard"><div className="admin-unauthorized">Access Denied</div></div>;
  }

  const filteredPosts = posts.filter((p) =>
    (p.reddit_url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.referral_profiles?.display_name || 'Unknown Creator').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button onClick={() => navigate('/admin')} className="admin-back-btn" style={{ padding: 8 }}>
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="admin-title">Reddit Moderation</h1>
            <p className="admin-subtitle">Verify proof videos, the second-account comment, and the app-link reply.</p>
          </div>
        </div>
      </header>

      <div className="admin-toolbar" style={{ justifyContent: 'flex-start', gap: 20 }}>
        <div className="admin-sort-bar">
          {(['pending', 'approved', 'rejected', 'payouts'] as const).map((t) => (
            <button key={t} className={`admin-sort-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'payouts' ? 'Awaiting Payouts' : t} {filter === t ? `(${posts.length})` : ''}
            </button>
          ))}
        </div>
        <div className="admin-search-bar" style={{ maxWidth: 400, flex: 1 }}>
          <FiSearch className="admin-search-icon" />
          <input type="text" className="admin-search-input" placeholder="Search by URL or Creator..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ padding: 20, margin: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444' }}>
          <strong>Error:</strong> {error}
          <button onClick={checkAdminAndLoad} style={{ marginLeft: 15, padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      <div className="admin-users-table">
        {filter === 'payouts' ? (
          <>
            <div className="admin-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 120px' }}>
              <span>CREATOR</span><span>PAYMENT METHODS</span><span>PENDING AMOUNT</span><span>ACTIONS</span>
            </div>
            {Object.values(posts.reduce((acc: any, p) => {
              const uid = p.user_id;
              if (!acc[uid]) acc[uid] = { profile: p.referral_profiles, total_cents: 0, post_ids: [] };
              acc[uid].total_cents += p.earnings_cents || 0;
              acc[uid].post_ids.push(p.id);
              return acc;
            }, {})).length === 0 ? (
              <div className="admin-empty">No pending payouts found</div>
            ) : (
              Object.values(posts.reduce((acc: any, p) => {
                const uid = p.user_id;
                if (!acc[uid]) acc[uid] = { profile: p.referral_profiles, total_cents: 0, post_ids: [] };
                acc[uid].total_cents += p.earnings_cents || 0;
                acc[uid].post_ids.push(p.id);
                return acc;
              }, {})).map((group: any) => (
                <div key={group.profile?.id} className="admin-user-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 120px', cursor: 'default', padding: '15px 20px' }}>
                  <div className="admin-col-user">
                    <img src={group.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.profile?.id}`} alt="" className="admin-user-avatar" />
                    <div>
                      <div className="admin-user-name">{group.profile?.display_name}</div>
                      <div className="admin-user-email">UID: {group.profile?.id?.substring(0, 8)}</div>
                    </div>
                  </div>
                  <div className="admin-col-stat" style={{ fontSize: 11, color: '#888', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {group.profile?.paypal_email && <span>📧 {group.profile.paypal_email}</span>}
                    {group.profile?.cashapp_tag && <span>💸 {group.profile.cashapp_tag}</span>}
                    {group.profile?.crypto_address && <span title={group.profile.crypto_address}>🔗 {group.profile.crypto_address.substring(0, 8)}...</span>}
                    {!group.profile?.paypal_email && !group.profile?.cashapp_tag && !group.profile?.crypto_address && <span style={{ color: '#ef4444' }}>No method set</span>}
                  </div>
                  <div className="admin-col-stat" style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: 16 }}>${(group.total_cents / 100).toFixed(2)}</div>
                  <div className="admin-col-expand">
                    <button
                      onClick={async () => {
                        const summary = `Pay ${(group.total_cents / 100).toFixed(2)} to ${group.profile?.display_name}?\nMethod: ${group.profile?.paypal_email || group.profile?.cashapp_tag || group.profile?.crypto_address || 'NOT SET'}`;
                        if (!window.confirm(summary)) return;
                        const { error: invErr } = await supabase.from('invoices').insert({
                          user_id: group.profile.id,
                          amount_cents: group.total_cents,
                          reddit_post_ids: group.post_ids,
                          source: 'reddit',
                          payment_method: group.profile.paypal_email ? 'PayPal' : group.profile.cashapp_tag ? 'Cash App' : group.profile.crypto_address ? 'Crypto' : 'Manual',
                          payment_details: group.profile.paypal_email || group.profile.cashapp_tag || group.profile.crypto_address || 'Manual',
                          status: 'paid',
                        });
                        if (invErr) { alert('Invoice Error: ' + invErr.message); return; }
                        const { error: postErr } = await supabase.from('reddit_posts').update({ status: 'paid' }).in('id', group.post_ids);
                        if (postErr) alert('Error: ' + postErr.message);
                        else { alert('Payout successful!'); checkAdminAndLoad(); }
                      }}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
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
            <div className="admin-table-header" style={{ gridTemplateColumns: '80px 2fr 1.4fr 1fr 100px 120px' }}>
              <span>PREVIEW</span><span>POST / CREATOR</span><span>VERIFICATION</span><span>VIEWS</span><span>SUBMITTED</span><span>ACTIONS</span>
            </div>
            {filteredPosts.length === 0 ? (
              <div className="admin-empty">No {filter} posts found</div>
            ) : (
              filteredPosts.map((post) => {
                const preview = post.screenshot_urls && post.screenshot_urls.length > 0 ? post.screenshot_urls[0] : null;
                return (
                  <div key={post.id} className="admin-user-row" style={{ gridTemplateColumns: '80px 2fr 1.4fr 1fr 100px 120px', cursor: 'default', padding: '12px 20px' }}>
                    <div className="admin-col-stat">
                      {preview ? (
                        <img src={preview} alt="thumb" style={{ width: 60, height: 60, borderRadius: 4, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaReddit color="#ff4500" />
                        </div>
                      )}
                    </div>
                    <div className="admin-col-user">
                      <div style={{ overflow: 'hidden' }}>
                        <a href={post.reddit_url} target="_blank" rel="noreferrer" className="admin-user-name" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 5 }}>
                          Open post <FiExternalLink size={12} />
                        </a>
                        <div className="admin-user-email" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FiUser size={12} /> {post.referral_profiles?.display_name || 'Unknown Creator'}
                        </div>
                        {post.screenshot_urls && post.screenshot_urls.length > 1 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                            {post.screenshot_urls.map((s: string, i: number) => (
                              <a key={i} href={s} target="_blank" rel="noreferrer">
                                <img src={s} alt={`shot ${i + 1}`} style={{ width: 28, height: 28, borderRadius: 3, objectFit: 'cover', border: '1px solid #333' }} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="admin-col-stat" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, fontSize: 11 }}>
                      {post.proof_video_url && (
                        <a href={post.proof_video_url} target="_blank" rel="noreferrer" style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiPlayCircle size={12} /> Proof video
                        </a>
                      )}
                      {post.ask_comment_url && (
                        <a href={post.ask_comment_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                          💬 Ask comment
                        </a>
                      )}
                      {post.app_link_reply_url && (
                        <a href={post.app_link_reply_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                          🔗 Link reply
                        </a>
                      )}
                    </div>
                    <div className="admin-col-stat" style={{ fontWeight: 'bold' }}>{post.views?.toLocaleString() || 0}</div>
                    <div className="admin-col-stat">{new Date(post.submitted_at).toLocaleDateString()}</div>
                    <div className="admin-col-expand" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {filter === 'pending' ? (
                        <>
                          <button
                            className="admin-action-btn approve"
                            onClick={() => {
                              setModalData({ type: 'approve', post });
                              setViewsValue(post.views?.toString() || '0');
                              setEarnings(payoutForViews(post.views || 0).toFixed(2));
                            }}
                            title="Approve"
                            style={{ background: '#059669', color: '#fff', border: 'none', padding: 6, borderRadius: 4, cursor: 'pointer' }}
                          >
                            <FiCheck />
                          </button>
                          <button
                            className="admin-action-btn reject"
                            onClick={() => setModalData({ type: 'reject', post })}
                            title="Reject"
                            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: 6, borderRadius: 4, cursor: 'pointer' }}
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'right' }}>
                          {filter === 'approved' ? `$${(post.earnings_cents / 100).toFixed(2)}` : 'Rejected'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {modalData && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-modal" style={{ background: '#1a1a2e', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400, border: '1px solid #333', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              {modalData.type === 'approve' ? <><FiCheck color="#059669" /> Approve Post</> : <><FiX color="#dc2626" /> Reject Post</>}
            </h2>
            <p style={{ fontSize: 14, color: '#aaa', marginBottom: 20 }}>
              Confirming action for post by <strong>{modalData.post.referral_profiles?.display_name}</strong>
            </p>

            {modalData.type === 'approve' ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>VERIFIED VIEWS</label>
                  <div style={{ position: 'relative' }}>
                    <FiEye style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                    <input type="number" value={viewsValue}
                      onChange={(e) => { setViewsValue(e.target.value); setEarnings(payoutForViews(parseInt(e.target.value) || 0).toFixed(2)); }}
                      style={{ width: '100%', padding: '10px 10px 10px 35px', background: '#0f0f1a', border: '1px solid #333', borderRadius: 6, color: '#fff' }} placeholder="0" />
                  </div>
                </div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>PAYOUT (USD)</label>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <FiDollarSign style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input type="number" value={earnings} onChange={(e) => setEarnings(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 35px', background: '#0f0f1a', border: '1px solid #333', borderRadius: 6, color: '#fff' }} placeholder="0.00" />
                </div>
                <p style={{ fontSize: 11, color: '#666', marginBottom: 15 }}>Tiers: $10 @ 40K · $20 @ 200K · $50 @ 500K (auto-filled from views).</p>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>MESSAGE FOR USER (OPTIONAL)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: 10, background: '#0f0f1a', border: '1px solid #333', borderRadius: 6, color: '#fff', minHeight: 60, resize: 'vertical', fontSize: 13 }}
                  placeholder="e.g. Nice post! Bonus added for high engagement." />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>REJECTION REASON</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: 10, background: '#0f0f1a', border: '1px solid #333', borderRadius: 6, color: '#fff', minHeight: 100, resize: 'vertical' }}
                  placeholder="e.g. Proof video doesn't show views, ask-comment missing, no app link reply..." />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {['Proof video missing/unclear', 'Views don\'t match proof', 'No habit-streak screenshot', 'Ask comment missing/late (>1h)', 'App link reply missing/late (>10m)', 'Promo text in body', 'Reused caption', 'Duplicate post', 'Post deleted/private'].map((r) => (
                    <button key={r} onClick={() => setReason((prev) => (!prev ? r : prev.includes(r) ? prev : `${prev}, ${r}`))}
                      style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, background: '#333', border: '1px solid #444', color: '#ccc', cursor: 'pointer' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalData(null)} style={{ flex: 1, padding: 10, background: 'transparent', border: '1px solid #333', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAction} disabled={processing || (modalData.type === 'approve' ? !earnings : !reason)}
                style={{ flex: 1, padding: 10, background: modalData.type === 'approve' ? '#059669' : '#dc2626', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: processing || (modalData.type === 'approve' ? !earnings : !reason) ? 0.5 : 1 }}>
                {processing ? 'Processing...' : modalData.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRedditReview;
