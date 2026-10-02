import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiArrowLeftLine as _RiArrowLeftLine,
  RiVideoLine as _RiVideoLine,
  RiPlayFill as _RiPlayFill,
  RiPauseFill as _RiPauseFill,
  RiDeleteBinLine as _RiDeleteBinLine,
  RiAddLine as _RiAddLine,
  RiVideoUploadLine as _RiVideoUploadLine,
} from 'react-icons/ri';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import upshiftIcon from '../../assets/icons/icon.png';
import './Creator.css';
import { AVAILABLE_APPS, PRODUCTIVE_IDS } from './ScreenTime';
import {
  OUT_W, OUT_H, PovApp, PovAssets, PovSettings, FaceShape, PovLayout,
  buildTimeline, faceTimeAt, drawSafeZones, renderFrame, timelineDuration,
} from './pov/povRenderer';

const RiArrowLeftLine = _RiArrowLeftLine as any;
const RiVideoLine = _RiVideoLine as any;
const RiPlayFill = _RiPlayFill as any;
const RiPauseFill = _RiPauseFill as any;
const RiDeleteBinLine = _RiDeleteBinLine as any;
const RiAddLine = _RiAddLine as any;
const RiVideoUploadLine = _RiVideoUploadLine as any;

const FPS = 30;

// Proper-case names for the podium; AVAILABLE_APPS stores them in capitals.
const NICE_NAMES: Record<string, string> = {
  tiktok: 'TikTok', onlyfans: 'OnlyFans', pornhub: 'Cornhub', youtube: 'YouTube', twitter: 'X',
  instagram: 'Instagram', snapchat: 'Snapchat', facebook: 'Facebook', reddit: 'Reddit',
};
const appName = (id: string) => {
  if (NICE_NAMES[id]) return NICE_NAMES[id];
  const raw = AVAILABLE_APPS.find(a => a.id === id)?.name ?? id;
  return raw.charAt(0) + raw.slice(1).toLowerCase();
};

/** 11h a day, led by the three apps that make people stop scrolling. */
const DEFAULT_APPS: PovApp[] = [
  { id: 'tiktok', minutes: 251 },
  { id: 'pornhub', minutes: 163 },
  { id: 'onlyfans', minutes: 118 },
  { id: 'instagram', minutes: 72 },
  { id: 'safari', minutes: 56 },
];

type Clip = { url: string; duration: number; name: string };

/**
 * Bubble positions in 1080x1920 pixels, above TikTok's caption and left of
 * its like / comment / share buttons.
 */
const facePresets = (layout: PovLayout): Record<string, Pick<PovSettings, 'faceX' | 'faceY'>> => {
  const faceY = layout === 'recording' ? 1430 : 1385;
  return {
    'bottom-left': { faceX: 210, faceY },
    'bottom-center': { faceX: 460, faceY },
    'bottom-right': { faceX: 740, faceY },
  };
};

const Pov: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from') === 'portal';

  const [face, setFace] = useState<Clip | null>(null);
  const [settings, setSettings] = useState<PovSettings>({
    guessHours: 3,
    apps: DEFAULT_APPS,
    productiveIds: PRODUCTIVE_IDS,
    names: {},
    showLabel: true,
    layout: 'recording',
    ...facePresets('recording')['bottom-left'],
    faceShape: 'circle',
    faceSize: 300,
    faceStart: 0,
    appScale: 0.76,
  });
  const [playing, setPlaying] = useState(true);
  const [showSafe, setShowSafe] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [time, setTime] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const faceVideo = useRef<HTMLVideoElement>(null);
  const iconsRef = useRef<Record<string, HTMLImageElement>>({});
  const clockRef = useRef({ start: performance.now(), offset: 0 });

  const isIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const supportsExport = !isIphone && typeof (window as any).VideoEncoder !== 'undefined';

  const fullSettings = useMemo<PovSettings>(() => ({
    ...settings,
    names: Object.fromEntries(settings.apps.map(a => [a.id, appName(a.id)])),
  }), [settings]);

  const scenes = useMemo(() => buildTimeline(), []);
  const total = timelineDuration(scenes);

  // Icons for every app that can appear, loaded with CORS so the canvas stays exportable.
  useEffect(() => {
    const load = (id: string, src: string) => {
      if (iconsRef.current[id]) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      iconsRef.current[id] = img;
    };
    load('upshift', upshiftIcon);
    settings.apps.forEach(a => {
      const def = AVAILABLE_APPS.find(x => x.id === a.id);
      if (def) load(a.id, def.imageUrl);
    });
  }, [settings.apps]);

  const assets = useCallback((): PovAssets => ({
    face: face ? faceVideo.current : null,
    icons: iconsRef.current,
  }), [face]);

  const scratch = () => {
    if (!scratchRef.current) {
      const c = document.createElement('canvas');
      c.width = OUT_W;
      c.height = OUT_H;
      scratchRef.current = c;
    }
    return scratchRef.current;
  };

  // Preview loop
  useEffect(() => {
    if (exporting) return;
    let raf = 0;
    const tick = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && total > 0) {
        const clock = clockRef.current;
        const t = playing ? ((performance.now() - clock.start) / 1000 + clock.offset) % total : clock.offset;
        syncFace(t, playing);
        renderFrame(ctx, scratch(), scenes, t, fullSettings, assets());
        if (showSafe) drawSafeZones(ctx);
        setTime(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, fullSettings, playing, showSafe, exporting, total, assets]);

  /** Keeps the facecam <video> playing in step with the preview clock. */
  const syncFace = (t: number, isPlaying: boolean) => {
    const video = faceVideo.current;
    if (!video || !face) return;
    const target = faceTimeAt(fullSettings, t, face.duration);
    if (Math.abs(video.currentTime - target) > 0.3) video.currentTime = target;
    if (isPlaying && video.paused) video.play().catch(() => undefined);
    if (!isPlaying && !video.paused) video.pause();
  };

  const togglePlay = () => {
    const clock = clockRef.current;
    if (playing) {
      clock.offset = ((performance.now() - clock.start) / 1000 + clock.offset) % Math.max(total, 0.01);
    } else {
      clock.start = performance.now();
    }
    setPlaying(!playing);
  };

  const restart = () => {
    clockRef.current = { start: performance.now(), offset: 0 };
    if (!playing) setPlaying(true);
  };

  const onClip = (setter: (c: Clip | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => setter({ url, duration: probe.duration, name: file.name });
    probe.src = url;
    e.target.value = '';
    restart();
  };

  const update = (patch: Partial<PovSettings>) => setSettings(prev => ({ ...prev, ...patch }));
  const updateApp = (i: number, patch: Partial<PovApp>) =>
    setSettings(prev => ({ ...prev, apps: prev.apps.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));

  const totalMinutes = settings.apps.reduce((n, a) => n + (a.minutes || 0), 0);

  const slider = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, unit: string) => (
    <div className="slider-item">
      <div className="slider-meta">
        <span className="slider-label">{label}</span>
        <span className="slider-value-box">{unit === 's' ? value.toFixed(1) : value}{unit}</span>
      </div>
      <input type="range" className="upshift-slider" min={min} max={max} step={step}
        value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );

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
    if (!supportsExport || exporting) return;
    setExporting(true);
    setPlaying(false);
    faceVideo.current?.pause();
    try {
      const out = document.createElement('canvas');
      out.width = OUT_W;
      out.height = OUT_H;
      const ctx = out.getContext('2d', { alpha: false })!;

      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: OUT_W, height: OUT_H, frameRate: FPS },
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

      const frames = Math.ceil(total * FPS);
      for (let fi = 0; fi < frames; fi++) {
        const t = fi / FPS;
        if (face && faceVideo.current) await seek(faceVideo.current, faceTimeAt(fullSettings, t, face.duration));
        renderFrame(ctx, scratch(), scenes, t, fullSettings, assets());
        const frame = new VideoFrame(out, { timestamp: Math.round((fi * 1_000_000) / FPS), duration: Math.round(1_000_000 / FPS) });
        encoder.encode(frame, { keyFrame: fi % FPS === 0 });
        frame.close();
        if (encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 0));
        if (fi % 5 === 0) setExportProgress(fi / frames);
      }
      await encoder.flush();
      muxer.finalize();

      const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'upshift-pov.mp4';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(`Export failed: ${(e as Error).message}`);
    } finally {
      setExporting(false);
      setExportProgress(0);
      clockRef.current = { start: performance.now(), offset: 0 };
      setPlaying(true);
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
          <h1>POV Preview</h1>
          <div className="pov-preview">
            <canvas ref={canvasRef} width={OUT_W} height={OUT_H} className="pov-canvas" />
          </div>
          <div className="pov-transport">
            <button className="pov-icon-btn" onClick={togglePlay} disabled={exporting}>
              {playing ? <RiPauseFill /> : <RiPlayFill />}
            </button>
            <button className="pov-text-btn" onClick={restart} disabled={exporting}>Restart</button>
            <span className="pov-time">{time.toFixed(1)}s / {total.toFixed(1)}s</span>
            <label className="pov-check">
              <input type="checkbox" checked={showSafe} onChange={e => setShowSafe(e.target.checked)} />
              Show TikTok UI
            </label>
          </div>
          <p className="pov-hint">1080 x 1920 (9:16). The red TikTok UI areas only show in the preview, never in the video.</p>

          {/* Facecam source: hidden, drawn onto the canvas */}
          <video ref={faceVideo} src={face?.url} muted playsInline preload="auto" style={{ display: 'none' }} />
        </section>

        <section className="controls-column">
          <h2>POV Video</h2>

          <div className="adjust-box">
            <h3 className="adjust-title">Layout</h3>
            <div className="gender-toggle">
              {([['recording', 'Clean'], ['safe', 'With Upshift label']] as [PovLayout, string][]).map(([key, label]) => (
                <button key={key} className={`toggle-opt ${settings.layout === key ? 'active' : ''}`}
                  onClick={() => update({ layout: key, ...facePresets(key)['bottom-left'] })}>
                  {label}
                </button>
              ))}
            </div>
            <p className="pov-hint">
              {settings.layout === 'recording'
                ? 'Just the app screens, clear of TikTok\'s tabs, buttons and caption.'
                : 'Same, with an "Upshift App" label on top.'}
            </p>
          </div>

          <div className="adjust-box">
            <h3 className="adjust-title">1. Character facecam (optional)</h3>
            {face ? (
              <>
                <div className="pov-clip-row">
                  <span className="pov-clip-name">{face.name}</span>
                  <button className="pov-icon-btn" onClick={() => setFace(null)} title="Remove clip"><RiDeleteBinLine /></button>
                </div>

                <div className="gender-toggle">
                  {(['circle', 'square'] as FaceShape[]).map(shape => (
                    <button key={shape} className={`toggle-opt ${settings.faceShape === shape ? 'active' : ''}`}
                      onClick={() => update({ faceShape: shape })}>
                      {shape === 'circle' ? 'Circle' : 'Square'}
                    </button>
                  ))}
                </div>

                <div className="pov-presets">
                  {Object.entries(facePresets(settings.layout)).map(([key, pos]) => (
                    <button key={key} className="pov-text-btn" onClick={() => update(pos)}>
                      {key.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                {slider('Size', settings.faceSize, 200, 520, 10, v => update({ faceSize: v }), 'px')}
                {slider('Horizontal', settings.faceX, 120, 960, 5, v => update({ faceX: v }), 'px')}
                {slider('Vertical', settings.faceY, 200, 1720, 5, v => update({ faceY: v }), 'px')}
                {slider('App size', Math.round(settings.appScale * 100), 60, 100, 1, v => update({ appScale: v / 100 }), '%')}
                {slider('Clip starts at', settings.faceStart, 0, Math.max(0, face.duration - 0.5), 0.1, v => update({ faceStart: v }), 's')}
                <p className="pov-hint">The clip plays under the whole onboarding and loops if it's shorter. A selfie of them staring at the phone works best.</p>
              </>
            ) : (
              <>
                <label className="upload-card-btn">
                  <RiVideoUploadLine /> Upload facecam clip
                  <input type="file" hidden accept="video/*" onChange={onClip(setFace)} />
                </label>
                <p className="pov-hint">Leave it empty to export just the onboarding, full size.</p>
              </>
            )}
          </div>

          <div className="adjust-box">
            <h3 className="adjust-title">2. Onboarding</h3>
            <div className="slider-item">
              <div className="slider-meta">
                <span className="slider-label">Their guess</span>
                <span className="slider-value-box">{settings.guessHours}h</span>
              </div>
              <input type="range" className="upshift-slider" min={1} max={12} step={1}
                value={settings.guessHours} onChange={e => update({ guessHours: parseInt(e.target.value) })} />
            </div>

            <div className="pov-apps-head">
              <span>Screen time per app</span>
              <span className="pov-total">Total {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
            </div>
            {settings.apps.map((app, i) => (
              <div key={i} className="pov-app-row">
                <select className="name-input" value={app.id} onChange={e => updateApp(i, { id: e.target.value })}>
                  {AVAILABLE_APPS.map(a => <option key={a.id} value={a.id}>{appName(a.id)}</option>)}
                </select>
                <input className="name-input pov-minutes" type="number" min={0} value={app.minutes}
                  onChange={e => updateApp(i, { minutes: Math.max(0, parseInt(e.target.value) || 0) })} />
                <span className="pov-unit">min</span>
                <button className="pov-icon-btn" onClick={() => update({ apps: settings.apps.filter((_, j) => j !== i) })}>
                  <RiDeleteBinLine />
                </button>
              </div>
            ))}
            {settings.apps.length < 8 && (
              <button className="pov-text-btn" onClick={() => update({ apps: [...settings.apps, { id: 'youtube', minutes: 30 }] })}>
                <RiAddLine /> Add app
              </button>
            )}
            <p className="pov-hint">The top 3 apps that aren't messaging, browsers or productivity go on the podium.</p>

            {settings.layout === 'safe' && (
              <label className="pov-check">
                <input type="checkbox" checked={settings.showLabel} onChange={e => update({ showLabel: e.target.checked })} />
                "Upshift App" label on the app screens
              </label>
            )}
          </div>

          <div className="download-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {!supportsExport ? (
              <div className="pov-hint" style={{ textAlign: 'center' }}>MP4 export needs a desktop browser (Chrome works best).</div>
            ) : (
              <button
                className="download-pill-btn"
                style={{ borderColor: 'rgb(117, 255, 241)', color: 'rgb(117, 255, 241)' }}
                onClick={exportVideo}
                disabled={exporting}
              >
                {exporting ? `Generating MP4 (${Math.round(exportProgress * 100)}%)...` : 'Download Video (MP4)'} <RiVideoLine />
              </button>
            )}
            <p className="pov-hint">No sound: add your music in CapCut.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pov;
