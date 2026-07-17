import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiArrowLeftLine as _RiArrowLeftLine,
  RiRefreshLine as _RiRefreshLine,
  RiLoader4Line as _RiLoader4Line,
  RiFileCopyLine as _RiFileCopyLine,
  RiCheckLine as _RiCheckLine
} from 'react-icons/ri';
import './Creator.css';
import './Rewrite.css';

const RiArrowLeftLine = _RiArrowLeftLine as any;
const RiRefreshLine = _RiRefreshLine as any;
const RiLoader4Line = _RiLoader4Line as any;
const RiFileCopyLine = _RiFileCopyLine as any;
const RiCheckLine = _RiCheckLine as any;

type Rewritten = { title: string; body: string };

const Rewrite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<Rewritten | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'title' | 'body' | null>(null);

  const generate = async () => {
    setError(null);
    if (!title.trim() && !body.trim()) {
      setError('Add a title or body first.');
      return;
    }
    setBusy(true);
    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api/reddit-rewrite'
        : '/api/reddit-rewrite';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
      setResult({ title: String(data.title || ''), body: String(data.body || '') });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (which: 'title' | 'body', text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="rewrite-tool">
      <header className="creator-header">
        <Link to={`/creator${fromPortal ? '?from=portal' : ''}`} className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <div className="rewrite-inner">
        <h1 className="rewrite-title">Post Rewriter</h1>
        <p className="rewrite-subtitle">
          Drop in an existing Reddit post and get a fresh human-sounding rewrite — same idea,
          different words. Regenerate for a new take.
        </p>

        <div className="rewrite-card">
          <span className="rewrite-label">Original</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="rewrite-input"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Post body (optional)"
            rows={5}
            className="rewrite-textarea"
          />
          <button className="rewrite-btn" onClick={generate} disabled={busy}>
            {busy
              ? <><RiLoader4Line className="spin" /> Writing…</>
              : <><RiRefreshLine /> {result ? 'Regenerate' : 'Generate rewrite'}</>}
          </button>
          {error && <p className="rewrite-error">{error}</p>}
        </div>

        {result && (
          <div className="rewrite-card rewrite-result">
            <span className="rewrite-label rewrite-label-ok">Rewrite</span>
            <Field
              label="Title"
              value={result.title}
              copied={copied === 'title'}
              onCopy={() => copy('title', result.title)}
            />
            {result.body && (
              <Field
                label="Body"
                value={result.body}
                multiline
                copied={copied === 'body'}
                onCopy={() => copy('body', result.body)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function Field({
  label,
  value,
  multiline,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rewrite-field">
      <div className="rewrite-field-head">
        <span className="rewrite-field-label">{label}</span>
        <button className="rewrite-copy" onClick={onCopy}>
          {copied ? <RiCheckLine className="ok" /> : <RiFileCopyLine />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className={`rewrite-field-value ${multiline ? '' : 'strong'}`}>{value}</div>
    </div>
  );
}

export default Rewrite;
