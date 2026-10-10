import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiArrowLeftLine as _RiArrowLeftLine,
  RiVideoLine as _RiVideoLine,
  RiPlayFill as _RiPlayFill,
  RiPauseFill as _RiPauseFill,
  RiDeleteBinLine as _RiDeleteBinLine,
  RiVideoUploadLine as _RiVideoUploadLine,
} from 'react-icons/ri';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import './Creator.css';

const RiArrowLeftLine = _RiArrowLeftLine as any;
const RiVideoLine = _RiVideoLine as any;
const RiPlayFill = _RiPlayFill as any;
const RiPauseFill = _RiPauseFill as any;
const RiDeleteBinLine = _RiDeleteBinLine as any;
const RiVideoUploadLine = _RiVideoUploadLine as any;

const OUT_W = 1080;
const OUT_H = 1920;
const FPS = 30;

const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Snapchat's caption: a translucent black bar across the full width. */
type TextItem = { id: number; kind: 'text'; text: string; y: number };
/** Snapchat's digital time sticker. */
type TimeItem = { id: number; kind: 'time'; time: string; ampm: boolean; x: number; y: number; scale: number };
type SnapItem = TextItem | TimeItem;

type Clip = { url: string; file: File; duration: number; name: string };
type Box = { id: number; x: number; y: number; w: number; h: number };

const nowTime = () => {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
};

// MARK: - Rendering

const CAPTION_SIZE = 44;
const CAPTION_LINE = 1.3;
const CAPTION_PAD_Y = 18;
const CAPTION_PAD_X = 32;

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) =>
  text.split('\n').flatMap(paragraph => {
    const lines: string[] = [];
    let line = '';
    for (const word of paragraph.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
    return lines;
  });

function drawCaption(ctx: CanvasRenderingContext2D, item: TextItem): Box | null {
  if (!item.text.trim()) return null;
  ctx.save();
  ctx.font = `500 ${CAPTION_SIZE}px ${FONT}`;
  const lines = wrap(ctx, item.text, OUT_W - CAPTION_PAD_X * 2);
  const lineH = CAPTION_SIZE * CAPTION_LINE;
  const h = lines.length * lineH + CAPTION_PAD_Y * 2;
  const top = item.y * OUT_H - h / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, top, OUT_W, h);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, OUT_W / 2, top + CAPTION_PAD_Y + lineH * (i + 0.5)));
  ctx.restore();
  return { id: item.id, x: 0, y: top, w: OUT_W, h };
}

function drawTime(ctx: CanvasRenderingContext2D, item: TimeItem): Box | null {
  const raw = item.time.trim();
  if (!raw) return null;
  // The sticker sets the AM / PM smaller, beside the digits.
  const match = raw.match(/^(.*?)\s*(AM|PM)$/i);
  const digits = match ? match[1] : raw;
  const suffix = item.ampm && match ? match[2].toUpperCase() : '';

  const size = 150 * item.scale;
  const small = size * 0.36;
  ctx.save();
  ctx.font = `800 ${size}px ${FONT}`;
  const dw = ctx.measureText(digits).width;
  ctx.font = `800 ${small}px ${FONT}`;
  const gap = suffix ? size * 0.08 : 0;
  const sw = suffix ? ctx.measureText(suffix).width : 0;
  const w = dw + gap + sw;
  const cx = item.x * OUT_W;
  const cy = item.y * OUT_H;
  const left = cx - w / 2;

  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = size * 0.08;
  ctx.shadowOffsetY = size * 0.02;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const baseline = cy + size * 0.36;
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.fillText(digits, left, baseline);
  if (suffix) {
    ctx.font = `800 ${small}px ${FONT}`;
    ctx.fillText(suffix, left + dw + gap, baseline);
  }
  ctx.restore();
  return { id: item.id, x: left, y: cy - size * 0.5, w, h: size };
}

/** Draws the video, cropped to fill 9:16, and the Snapchat elements on top. */
function renderFrame(ctx: CanvasRenderingContext2D, video: HTMLVideoElement | null, items: SnapItem[]): Box[] {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  if (video && video.videoWidth) {
    const k = Math.max(OUT_W / video.videoWidth, OUT_H / video.videoHeight);
    const w = video.videoWidth * k;
    const h = video.videoHeight * k;
    ctx.drawImage(video, (OUT_W - w) / 2, (OUT_H - h) / 2, w, h);
  }
  const boxes: Box[] = [];
  for (const item of items) {
    const box = item.kind === 'text' ? drawCaption(ctx, item) : drawTime(ctx, item);
    if (box) boxes.push(box);
  }
  return boxes;
}

// MARK: - Audio

/** Encodes the clip's own sound track (first two channels) to AAC. */
async function addAudio(duration: number, muxer: Muxer<ArrayBufferTarget>, sampleRate: number, channels: number, buffer: AudioBuffer) {
  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => console.error('AudioEncoder error:', e),
  });
  encoder.configure({ codec: 'mp4a.40.2', sampleRate, numberOfChannels: channels, bitrate: 192_000 });
  const total = Math.min(buffer.length, Math.floor(duration * sampleRate));
  const CHUNK = 1024;
  for (let start = 0; start < total; start += CHUNK) {
    const n = Math.min(CHUNK, total - start);
    const data = new Float32Array(n * channels);
    for (let c = 0; c < channels; c++) data.set(buffer.getChannelData(c).subarray(start, start + n), c * n);
    const audio = new AudioData({
      format: 'f32-planar', sampleRate, numberOfFrames: n, numberOfChannels: channels,
      timestamp: Math.round((start / sampleRate) * 1_000_000), data,
    });
    encoder.encode(audio);
    audio.close();
  }
  await encoder.flush();
}

async function decodeAudio(file: File): Promise<AudioBuffer | null> {
  try {
    const ac = new AudioContext();
    const buffer = await ac.decodeAudioData(await file.arrayBuffer());
    ac.close();
    return buffer;
  } catch {
    return null; // no sound track
  }
}

// MARK: - Component

let nextId = 1;

const Snap: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  const [clip, setClip] = useState<Clip | null>(null);
  const [items, setItems] = useState<SnapItem[]>([
    { id: nextId++, kind: 'text', text: 'POV: you finally blocked TikTok', y: 0.62 },
  ]);
  const [playing, setPlaying] = useState(true);
  const [keepSound, setKeepSound] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxesRef = useRef<Box[]>([]);
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);

  const isIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const supportsExport = !isIphone && typeof (window as any).VideoEncoder !== 'undefined';

  // Preview loop
  useEffect(() => {
    if (exporting) return;
    let raf = 0;
    const tick = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) boxesRef.current = renderFrame(ctx, clip ? videoRef.current : null, items);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items, clip, exporting]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip || exporting) return;
    if (playing) video.play().catch(() => undefined);
    else video.pause();
  }, [playing, clip, exporting]);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (clip) URL.revokeObjectURL(clip.url);
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => setClip({ url, file, duration: probe.duration, name: file.name });
    probe.src = url;
    setPlaying(true);
  };

  const update = (id: number, patch: Partial<TextItem> | Partial<TimeItem>) =>
    setItems(prev => prev.map(it => (it.id === id ? ({ ...it, ...patch } as SnapItem) : it)));
  const remove = (id: number) => setItems(prev => prev.filter(it => it.id !== id));
  const addText = () => setItems(prev => [...prev, { id: nextId++, kind: 'text', text: 'Your text', y: 0.5 }]);
  const addTime = () =>
    setItems(prev => [...prev, { id: nextId++, kind: 'time', time: nowTime(), ampm: true, x: 0.5, y: 0.3, scale: 1 }]);

  // MARK: - Dragging on the preview

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * OUT_W, y: ((e.clientY - rect.top) / rect.height) * OUT_H };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (exporting) return;
    const p = toCanvas(e);
    // Topmost element first.
    const hit = [...boxesRef.current].reverse().find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    if (!hit) return;
    const item = items.find(it => it.id === hit.id)!;
    const ix = item.kind === 'time' ? item.x * OUT_W : p.x;
    dragRef.current = { id: hit.id, dx: p.x - ix, dy: p.y - item.y * OUT_H };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = toCanvas(e);
    const clamp = (v: number) => Math.min(Math.max(v, 0.03), 0.97);
    const item = items.find(it => it.id === drag.id);
    if (!item) return;
    const y = clamp((p.y - drag.dy) / OUT_H);
    if (item.kind === 'time') update(item.id, { x: clamp((p.x - drag.dx) / OUT_W), y });
    else update(item.id, { y });
  };

  const endDrag = () => { dragRef.current = null; };

  // MARK: - Export

  const seek = (video: HTMLVideoElement, time: number) =>
    new Promise<void>(resolve => {
      const target = Math.min(Math.max(time, 0), Math.max(video.duration - 0.05, 0));
      if (Math.abs(video.currentTime - target) < 0.001) return resolve();
      const done = () => { video.removeEventListener('seeked', done); resolve(); };
      video.addEventListener('seeked', done);
      video.currentTime = target;
    });

  const exportVideo = async () => {
    const video = videoRef.current;
    if (!supportsExport || exporting || !clip || !video) return;
    setExporting(true);
    video.pause();
    try {
      const out = document.createElement('canvas');
      out.width = OUT_W;
      out.height = OUT_H;
      const ctx = out.getContext('2d', { alpha: false })!;

      // Sound, when the clip has some and the browser can encode AAC.
      let audio: { buffer: AudioBuffer; sampleRate: number; channels: number } | null = null;
      if (keepSound && typeof (window as any).AudioEncoder !== 'undefined') {
        const buffer = await decodeAudio(clip.file);
        if (buffer) {
          const sampleRate = buffer.sampleRate;
          const channels = Math.min(buffer.numberOfChannels, 2);
          const ok = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate, numberOfChannels: channels, bitrate: 192_000 })
            .then(s => !!s.supported).catch(() => false);
          if (ok) audio = { buffer, sampleRate, channels };
        }
      }

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: OUT_W, height: OUT_H, frameRate: FPS },
        ...(audio ? { audio: { codec: 'aac' as const, sampleRate: audio.sampleRate, numberOfChannels: audio.channels } } : {}),
        fastStart: 'in-memory',
      });
      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => console.error('VideoEncoder error:', e),
      });
      const candidates: VideoEncoderConfig[] = ['avc1.640028', 'avc1.4D0028', 'avc1.42E028'].map(codec => ({
        codec, width: OUT_W, height: OUT_H, bitrate: 16_000_000, framerate: FPS,
      }));
      let configured = false;
      for (const c of candidates) {
        try {
          if ((await VideoEncoder.isConfigSupported(c)).supported) { encoder.configure(c); configured = true; break; }
        } catch { /* try the next one */ }
      }
      if (!configured) throw new Error('No supported H.264 encoder in this browser.');

      const frames = Math.floor(clip.duration * FPS);
      for (let fi = 0; fi < frames; fi++) {
        await seek(video, fi / FPS);
        renderFrame(ctx, video, items);
        const frame = new VideoFrame(out, { timestamp: Math.round((fi * 1_000_000) / FPS), duration: Math.round(1_000_000 / FPS) });
        encoder.encode(frame, { keyFrame: fi % FPS === 0 });
        frame.close();
        if (encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 0));
        if (fi % 5 === 0) setExportProgress(fi / frames);
      }
      await encoder.flush();
      if (audio) {
        await addAudio(frames / FPS, muxer, audio.sampleRate, audio.channels, audio.buffer);
      }
      muxer.finalize();

      const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'upshift-snap.mp4';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(`Export failed: ${(e as Error).message}`);
    } finally {
      setExporting(false);
      setExportProgress(0);
      video.currentTime = 0;
      if (playing) video.play().catch(() => undefined);
    }
  };

  // MARK: - UI

  return (
    <div className="creator-editor-container">
      <header className="creator-header">
        <Link to={`/creator${fromPortal ? '?from=portal' : ''}`} className="back-link">
          <RiArrowLeftLine /> Back
        </Link>
      </header>

      <main className="creator-main">
        <section className="preview-column">
          <h1>Snap Preview</h1>
          <div className="pov-preview">
            <canvas
              ref={canvasRef}
              width={OUT_W}
              height={OUT_H}
              className="pov-canvas snap-canvas"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />
          </div>
          <div className="pov-transport">
            <button className="pov-icon-btn" onClick={() => setPlaying(p => !p)} disabled={exporting || !clip}>
              {playing ? <RiPauseFill /> : <RiPlayFill />}
            </button>
          </div>
          <p className="pov-hint">1080 x 1920 (9:16). Drag the text and the time on the preview to move them.</p>
          <video ref={videoRef} src={clip?.url} muted playsInline loop preload="auto" style={{ display: 'none' }} />
        </section>

        <section className="controls-column">
          <h2>Snap Video</h2>

          <div className="adjust-box">
            <h3 className="adjust-title">1. Video</h3>
            {clip && (
              <div className="pov-clip-row">
                <span className="pov-clip-name">{clip.name}</span>
                <button className="pov-icon-btn" onClick={() => setClip(null)} title="Remove clip"><RiDeleteBinLine /></button>
              </div>
            )}
            <label className="upload-card-btn">
              <RiVideoUploadLine /> {clip ? 'Change Video' : 'Upload Video'}
              <input type="file" hidden accept="video/*" onChange={onUpload} />
            </label>
            <p className="pov-hint">It's cropped to fill 9:16.</p>
          </div>

          <div className="adjust-box">
            <h3 className="adjust-title">2. Snapchat elements</h3>
            <div className="pov-presets">
              <button className="pov-text-btn" onClick={addText}>+ Text</button>
              <button className="pov-text-btn" onClick={addTime}>+ Time</button>
            </div>

            {items.map(item => (
              <div key={item.id} className="snap-item">
                <div className="pov-clip-row">
                  <span className="snap-item-kind">{item.kind === 'text' ? 'Text' : 'Time'}</span>
                  <button className="pov-icon-btn" onClick={() => remove(item.id)} title="Remove"><RiDeleteBinLine /></button>
                </div>
                {item.kind === 'text' ? (
                  <textarea
                    className="snap-input"
                    rows={2}
                    value={item.text}
                    onChange={e => update(item.id, { text: e.target.value })}
                  />
                ) : (
                  <>
                    <input
                      className="snap-input"
                      value={item.time}
                      onChange={e => update(item.id, { time: e.target.value })}
                      placeholder="9:41 PM"
                    />
                    <label className="pov-check">
                      <input type="checkbox" checked={item.ampm} onChange={e => update(item.id, { ampm: e.target.checked })} />
                      Show AM / PM
                    </label>
                    <div className="slider-item">
                      <div className="slider-meta">
                        <span className="slider-label">Size</span>
                        <span className="slider-value-box">{Math.round(item.scale * 100)}%</span>
                      </div>
                      <input type="range" className="upshift-slider" min="40" max="250"
                        value={Math.round(item.scale * 100)}
                        onChange={e => update(item.id, { scale: parseInt(e.target.value) / 100 })} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="download-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <label className="pov-check">
              <input type="checkbox" checked={keepSound} onChange={e => setKeepSound(e.target.checked)} />
              Keep the video's sound
            </label>
            {!supportsExport ? (
              <div className="pov-hint" style={{ textAlign: 'center' }}>MP4 export needs a desktop browser (Chrome works best).</div>
            ) : (
              <button
                className="download-pill-btn"
                style={{ borderColor: 'rgb(117, 255, 241)', color: 'rgb(117, 255, 241)' }}
                onClick={exportVideo}
                disabled={exporting || !clip}
              >
                {exporting ? `Generating MP4 (${Math.round(exportProgress * 100)}%)...` : 'Download Video (MP4)'} <RiVideoLine />
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Snap;
