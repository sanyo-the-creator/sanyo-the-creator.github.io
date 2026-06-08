import React, { useState, useRef } from 'react';
import { IoSend as _IoSend } from 'react-icons/io5';
import { FiUploadCloud as _FiUploadCloud, FiX as _FiX, FiCheckCircle as _FiCheckCircle } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import RedditResultsSlider from './RedditResultsSlider';

const IoSend = _IoSend as React.ElementType;
const FiUploadCloud = _FiUploadCloud as React.ElementType;
const FiX = _FiX as React.ElementType;
const FiCheckCircle = _FiCheckCircle as React.ElementType;

// --- Links the team provides -------------------------------------------------
// The real App Store link creators must reply with:
const APP_STORE_LINK = 'https://apps.apple.com/us/app/upshift-1-productivity-app/id6749509316';
// The mock Upshift TestFlight build used to fake streaks/habits + app blocker.
const TESTFLIGHT_LINK = 'https://testflight.apple.com/join/5CNnTm8Y';
const NOTION_LINK = 'https://app.notion.com/p/Reddit-Marketing-Tutorial-for-Upshift-App-283e593666a98072b125d6599ff9df73?source=copy_link';

// --- Reddit payout tiers (cumulative) ---------------------------------------
const PAYOUT_TIERS = [
  { views: 40000, total: 10, label: '40K views' },
  { views: 200000, total: 20, label: '200K views' },
  { views: 500000, total: 50, label: '500K views' },
];

const MIN_VIEWS = 40000;

function payoutForViews(views: number): number {
  let total = 0;
  for (const tier of PAYOUT_TIERS) {
    if (views >= tier.views) total = tier.total;
  }
  return total;
}

type Upload = { url: string; name: string; uploading: boolean };

const PortalSubmitReddit = () => {
  const [redditUrl, setRedditUrl] = useState('');
  const [views, setViews] = useState('');
  const [postedAt, setPostedAt] = useState('');
  const [askCommentUrl, setAskCommentUrl] = useState('');
  const [appLinkReplyUrl, setAppLinkReplyUrl] = useState('');

  const [proofVideo, setProofVideo] = useState<Upload | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const videoInputRef = useRef<HTMLInputElement>(null);

  const viewsNum = parseInt(views.replace(/[^0-9]/g, ''), 10) || 0;
  const estimatedPayout = payoutForViews(viewsNum);

  // ---- Upload helper -------------------------------------------------------
  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to upload.');
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('reddit-proofs').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('reddit-proofs').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Proof video must be under 100MB.' });
      return;
    }
    setProofVideo({ url: '', name: file.name, uploading: true });
    try {
      const url = await uploadFile(file);
      setProofVideo({ url, name: file.name, uploading: false });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Video upload failed: ${err.message || err}` });
      setProofVideo(null);
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const anyUploading = proofVideo?.uploading || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    // Validation
    if (!redditUrl.includes('reddit.com')) {
      setStatus({ type: 'error', message: 'Please enter a valid Reddit post URL (must contain reddit.com).' });
      return;
    }
    if (viewsNum < MIN_VIEWS) {
      setStatus({ type: 'error', message: `Post must have at least ${MIN_VIEWS.toLocaleString()} views to be submitted.` });
      return;
    }
    if (!proofVideo?.url) {
      setStatus({ type: 'error', message: 'A proof video (second device refreshing the post, showing the view count) is required.' });
      return;
    }
    if (!askCommentUrl.includes('reddit.com')) {
      setStatus({ type: 'error', message: 'Add the link to the "what\'s the app?" comment from your second account.' });
      return;
    }
    if (!appLinkReplyUrl.includes('reddit.com')) {
      setStatus({ type: 'error', message: 'Add the link to your reply that contains the App Store link.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to submit.');

      // Duplicate check — same post can't be submitted twice
      const { data: existing } = await supabase
        .from('reddit_posts')
        .select('id, status')
        .eq('reddit_url', redditUrl.trim())
        .maybeSingle();
      if (existing) {
        throw new Error(`This Reddit post has already been submitted and is currently ${existing.status}.`);
      }

      // Ensure base profile row exists (avoids FK error like in video flow)
      const { data: profileExists } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!profileExists) {
        await supabase.from('profiles').insert({ id: user.id });
      }

      const { error } = await supabase.from('reddit_posts').insert({
        user_id: user.id,
        reddit_url: redditUrl.trim(),
        views: viewsNum,
        earnings_cents: Math.round(estimatedPayout * 100),
        proof_video_url: proofVideo.url,
        ask_comment_url: askCommentUrl.trim(),
        app_link_reply_url: appLinkReplyUrl.trim(),
        posted_at: postedAt ? new Date(postedAt).toISOString() : null,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') throw new Error('This Reddit post has already been submitted.');
        if (error.code === '23503') throw new Error('Please set up your Referral Username first in the Referrals tab.');
        throw error;
      }

      setStatus({ type: 'success', message: 'Reddit post submitted! It is now awaiting review.' });
      setRedditUrl('');
      setViews('');
      setPostedAt('');
      setAskCommentUrl('');
      setAppLinkReplyUrl('');
      setProofVideo(null);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="portal-submit-container">
      <header className="portal-header">
        <div>
          <h1 className="portal-page-title">Submit Reddit Post</h1>
          <p className="portal-page-subtitle">Go viral on Reddit with the Upshift habit-streak playbook and get paid per view.</p>
        </div>
      </header>

      {/* Payout tiers */}
      <div className="reddit-tiers-card">
        {PAYOUT_TIERS.map((tier) => {
          const reached = viewsNum >= tier.views;
          return (
            <div key={tier.views} className={`reddit-tier ${reached ? 'reached' : ''}`}>
              <div className="reddit-tier-views">{tier.label}</div>
              <div className="reddit-tier-amount">${tier.total}</div>
            </div>
          );
        })}
      </div>
      <p className="input-help-text" style={{ marginTop: -6, marginBottom: 22, textAlign: 'center' }}>
        Cumulative payout: <strong>$10</strong> at 40K, <strong>$20</strong> at 200K, <strong>$50</strong> at 500K views.
        Final amount is confirmed from your proof video at review.
      </p>

      {/* Submission form */}
      <form className="submission-input-card" onSubmit={handleSubmit}>
        {/* Reddit URL */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Reddit post URL</label>
          <div className="video-url-input-wrapper">
            <input
              type="text"
              className="video-url-input"
              placeholder="https://www.reddit.com/r/.../comments/..."
              value={redditUrl}
              onChange={(e) => setRedditUrl(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Views + posted time */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ flex: '1 1 160px' }}>
            <label className="input-label">Current views</label>
            <div className="video-url-input-wrapper">
              <input
                type="text"
                inputMode="numeric"
                className="video-url-input"
                placeholder="e.g. 47000"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label className="input-label">When did you post it? <span style={{ color: '#666' }}>(optional)</span></label>
            <div className="video-url-input-wrapper">
              <input
                type="datetime-local"
                className="video-url-input"
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Estimated payout preview */}
        {viewsNum > 0 && (
          <div className="reddit-estimate-row">
            <div>
              <div className="reddit-estimate-label">Views entered</div>
              <div className="reddit-estimate-value">{viewsNum.toLocaleString()}</div>
            </div>
            <div className="reddit-estimate-divider" />
            <div>
              <div className="reddit-estimate-label">Estimated payout</div>
              <div className="reddit-estimate-value" style={{ color: viewsNum >= MIN_VIEWS ? '#4ade80' : '#f87171' }}>
                ${estimatedPayout.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Proof video */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">
            Proof video <span style={{ color: '#f59e0b' }}>(required)</span>
          </label>
          <p className="input-help-text" style={{ margin: '4px 0 10px' }}>
            Record with a <strong>second device</strong>: open your post, pull-to-refresh, and clearly show the live view count.
            This is how we confirm your views are real.
          </p>
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoSelect} />
          {!proofVideo ? (
            <button type="button" className="reddit-upload-btn" onClick={() => videoInputRef.current?.click()} disabled={isSubmitting}>
              <FiUploadCloud /> Upload proof video
            </button>
          ) : (
            <div className="reddit-file-chip">
              {proofVideo.uploading ? (
                <span className="reddit-file-uploading">Uploading {proofVideo.name}…</span>
              ) : (
                <>
                  <FiCheckCircle style={{ color: '#4ade80' }} />
                  <a href={proofVideo.url} target="_blank" rel="noreferrer" className="reddit-file-name">{proofVideo.name}</a>
                  <button type="button" className="reddit-file-remove" onClick={() => setProofVideo(null)} aria-label="Remove"><FiX /></button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Second account verification */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">"What's the app?" comment link <span style={{ color: '#f59e0b' }}>(required)</span></label>
          <div className="video-url-input-wrapper">
            <input
              type="text"
              className="video-url-input"
              placeholder="Link to the comment from your SECOND account"
              value={askCommentUrl}
              onChange={(e) => setAskCommentUrl(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <p className="input-help-text" style={{ margin: '6px 0 0' }}>
            Within <strong>1 hour</strong> of posting, ask for the app from a different account. The comment must still be visible while we review.
          </p>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">App-link reply link <span style={{ color: '#f59e0b' }}>(required)</span></label>
          <div className="video-url-input-wrapper">
            <input
              type="text"
              className="video-url-input"
              placeholder="Link to your reply containing the App Store link"
              value={appLinkReplyUrl}
              onChange={(e) => setAppLinkReplyUrl(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <p className="input-help-text" style={{ margin: '6px 0 0' }}>
            Reply within <strong>10 minutes</strong> of that comment with the link (link only — no promo text):<br />
            <a href={APP_STORE_LINK} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>{APP_STORE_LINK}</a>
          </p>
        </div>

        {status.type && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 18,
              fontSize: 14,
              backgroundColor: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: status.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {status.message}
          </div>
        )}

        <button
          className="submit-video-btn"
          type="submit"
          disabled={isSubmitting || anyUploading || viewsNum < MIN_VIEWS}
        >
          <IoSend /> {isSubmitting ? 'Submitting…' : anyUploading ? 'Uploading…' : 'Submit Reddit Post'}
        </button>
        {viewsNum > 0 && viewsNum < MIN_VIEWS && (
          <p style={{ color: '#f87171', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
            ⚠️ Post must have at least {MIN_VIEWS.toLocaleString()} views to be submitted.
          </p>
        )}
      </form>

      {/* Results slider */}
      <div className="requirements-card" style={{ marginBottom: 20 }}>
        <RedditResultsSlider />
      </div>

      {/* How it works */}
      <div className="requirements-card" style={{ marginBottom: 20 }}>
        <h3 className="requirements-title">How it works</h3>
        <ol style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
          <li>
            Download the <strong>mock Upshift TestFlight app</strong> (
            <a href={TESTFLIGHT_LINK} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>get it here</a>
            ) and build whatever habit streaks + app-blocker screens you want for your screenshots.
          </li>
          <li>Post to Reddit. <strong>Image 1</strong> = Upshift home page with your streaks. <strong>Image 2/3</strong> = app blocker.</li>
          <li>
            Within <strong>1 hour</strong>, comment "what's the app?" from a <strong>second account</strong>, then reply within{' '}
            <strong>10 minutes</strong> from your main account with the App Store link (link only).
          </li>
          <li>Engage with the comments like the original poster would — reply, answer questions, keep it alive.</li>
          <li>When you're happy with the views, record the proof video and submit above.</li>
        </ol>
      </div>

      {/* Rules */}
      <div className="requirements-card" style={{ marginBottom: 20 }}>
        <h3 className="requirements-title">Submission rules</h3>
        <ul className="requirements-list">
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text"><strong>Image 1 of the post must be the Upshift home page showing your habit streaks.</strong> Image 2/3 should be the app-blocker screen — it's a big reason these posts go viral. (Both are mock screens you build in the TestFlight app, so streaks/blockers can be anything.)</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">A second account must comment asking for the app <strong>within 1 hour</strong> of posting, and that comment must still be visible during review.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">Reply with the App Store link <strong>within 10 minutes</strong> of that comment — it has to be the link, nothing else.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">A proof video from a second device (refresh showing the live view count) is <strong>required</strong> to submit.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">Each Reddit post can only be submitted <strong>once</strong>.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">Post must have at least <strong>40,000 views</strong> to qualify.</span></li>
        </ul>
      </div>

      {/* Recommendations */}
      <div className="requirements-card">
        <h3 className="requirements-title">Recommended (don't get filtered)</h3>
        <ul className="requirements-list">
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">Keep the post body simple — <strong>no promotion text</strong>. Just tell the story; let the second account ask for the app and reply with the link.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">We share a Notion with caption inspiration (<a href={NOTION_LINK} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>here</a>), but <strong>don't reuse them word-for-word</strong> — Reddit's filters have already seen them. Rewrite in your own words.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">Add the <strong>app-blocker screenshot</strong> as image 2 or 3 — it's a big reason these posts go viral.</span></li>
          <li className="requirement-item"><span className="requirement-bullet">•</span><span className="requirement-text">Reply to comments as the original poster would to keep engagement high.</span></li>
        </ul>
      </div>
    </div>
  );
};

export default PortalSubmitReddit;
