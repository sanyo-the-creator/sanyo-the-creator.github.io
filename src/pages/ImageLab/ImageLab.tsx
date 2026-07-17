import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadImageFromFile,
  perturbImage,
  randomOptions,
  OutputFormat,
} from '../../utils/imagePerturbation';
import UpshiftMenu from '../../components/common/UpshiftMenu';
import './ImageLab.css';

const MAX_IMAGES = 20;

type Item = {
  id: string;
  file: File;
  origUrl: string;
  outUrl: string | null;
  outBlob: Blob | null;
  token: string | null;
  format: OutputFormat;
  status: 'processing' | 'done' | 'error';
  error?: string;
};

const extFor = (fmt: OutputFormat) =>
  fmt === 'image/png' ? 'png' : fmt === 'image/webp' ? 'webp' : 'jpg';

const ImageLab: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef<Set<string>>(new Set());

  // Process a single file with its own freshly-rolled random options.
  const processFile = useCallback(async (id: string, file: File) => {
    try {
      const img = await loadImageFromFile(file);
      const opts = randomOptions();
      const res = await perturbImage(img, opts);
      const outUrl = URL.createObjectURL(res.blob);
      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'done', outUrl, outBlob: res.blob, token: res.token, format: opts.format }
            : p
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'error', error: err?.message || 'failed' } : p))
      );
    }
  }, []);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (picked.length === 0) return;
    // Pure updater: only append, capped at MAX_IMAGES. Processing is started
    // separately by the effect below so this stays side-effect-free (safe under
    // React StrictMode's double-invocation).
    setItems((prev) => {
      const room = Math.max(0, MAX_IMAGES - prev.length);
      const incoming: Item[] = picked.slice(0, room).map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        origUrl: URL.createObjectURL(f),
        outUrl: null,
        outBlob: null,
        token: null,
        format: 'image/jpeg' as OutputFormat,
        status: 'processing' as const,
      }));
      return incoming.length ? [...prev, ...incoming] : prev;
    });
  }, []);

  // Start processing any item that hasn't been started yet — exactly once each.
  useEffect(() => {
    items.forEach((it) => {
      if (it.status === 'processing' && !startedRef.current.has(it.id)) {
        startedRef.current.add(it.id);
        processFile(it.id, it.file);
      }
    });
  }, [items, processFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const it = prev.find((p) => p.id === id);
      if (it) {
        URL.revokeObjectURL(it.origUrl);
        if (it.outUrl) URL.revokeObjectURL(it.outUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.origUrl);
      if (it.outUrl) URL.revokeObjectURL(it.outUrl);
    });
    setItems([]);
  };

  const downloadOne = (it: Item) => {
    if (!it.outBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(it.outBlob);
    a.download = `clean-${it.token || 'out'}.${extFor(it.format)}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const downloadAll = () => {
    items.filter((i) => i.outBlob).forEach((it, idx) => setTimeout(() => downloadOne(it), idx * 200));
  };

  const doneCount = items.filter((i) => i.status === 'done').length;
  const processingCount = items.filter((i) => i.status === 'processing').length;

  return (
    <div className="imagelab">
      <UpshiftMenu />
      <header className="il-header">
        <h1>Image Cleaner</h1>
        <p>
          Drop images and each one is automatically stripped of metadata and given its own randomized set of
          imperceptible transforms — no two outputs are alike. Everything runs locally in your browser; nothing
          is uploaded. Up to {MAX_IMAGES} images per session.
        </p>
      </header>

      <div
        className="il-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
        <span>
          Drop images here or click to browse — {items.length}/{MAX_IMAGES}
        </span>
      </div>

      <div className="il-actions">
        <button className="il-btn primary" disabled={doneCount === 0} onClick={downloadAll}>
          Download all ({doneCount})
        </button>
        <button className="il-btn ghost" disabled={items.length === 0} onClick={clearAll}>
          Clear
        </button>
        {processingCount > 0 && <span className="il-status">Processing {processingCount}…</span>}
      </div>

      <div className="il-grid">
        {items.map((it) => (
          <div className={`il-card ${it.status}`} key={it.id}>
            <button className="il-remove" onClick={() => removeItem(it.id)} aria-label="Remove">
              ×
            </button>
            <div className="il-thumbs">
              <div className="il-thumb">
                <img src={it.origUrl} alt="original" />
                <span>original</span>
              </div>
              <div className="il-thumb">
                {it.outUrl ? <img src={it.outUrl} alt="processed" /> : <div className="il-placeholder" />}
                <span>{it.status === 'processing' ? 'processing…' : it.outUrl ? 'cleaned' : 'pending'}</span>
              </div>
            </div>
            <div className="il-card-foot">
              {it.status === 'done' && (
                <>
                  <code title="fingerprint token">{it.token}</code>
                  <button className="il-btn small" onClick={() => downloadOne(it)}>
                    Download
                  </button>
                </>
              )}
              {it.status === 'error' && <span className="il-err">⚠ {it.error}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageLab;
