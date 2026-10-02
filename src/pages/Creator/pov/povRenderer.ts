/**
 * Draws every frame of a POV video on a 1080x1920 canvas: the Upshift screen
 * time onboarding (guess, scan, reality, reality check, most toxic apps)
 * filling the screen, with an optional facecam bubble of the character
 * reacting while they go through it.
 *
 * The onboarding screens mirror MockRealityCheckFlowView in the mock iOS app.
 * Everything is a pure function of time, so the preview and the MP4 export
 * render exactly the same frames.
 */

export const OUT_W = 1080;
export const OUT_H = 1920;

// The app is laid out in iPhone points (390 wide), scaled up to 1080px.
const S = OUT_W / 390;
const W = 390;
const H = OUT_H / S;

export type PovLayout = 'recording' | 'safe';

// 'safe': TikTok's UI covers the top tabs, the right-hand buttons and the
// caption, so app content stays inside this box.
// Measured on a real TikTok screenshot: "Explore | Following | For You"
// reaches ~14% down (270px of 1920), the caption starts at ~86%.
const TIKTOK_SAFE = { top: 100, bottom: H - 140, left: 20, right: 340 };
// 'recording': just the app screens, no phone UI, nudged left of TikTok's
// like / comment / share column (measured at ~85% across on a screenshot).
const FULL = { top: 100, bottom: H - 110, left: 16, right: 318 };

// Set at the start of every frame from the chosen layout.
let SAFE = TIKTOK_SAFE;
let CX = (SAFE.left + SAFE.right) / 2;
let CW = SAFE.right - SAFE.left;
let TITLE_Y = SAFE.top + 48;

function applyLayout(layout: PovLayout) {
  SAFE = layout === 'safe' ? TIKTOK_SAFE : FULL;
  CX = (SAFE.left + SAFE.right) / 2;
  CW = SAFE.right - SAFE.left;
  TITLE_Y = layout === 'safe' ? SAFE.top + 48 : SAFE.top + 12;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const ROUNDED = 'ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif';

const BLUE = '#4d99ff';
const RED = '#ff3b30';
const GREEN = '#34c759';
const GRAY = '#8e8e93';
const PINK = '#D43A9C';
const CORAL = '#F4574B';

export type PovApp = { id: string; minutes: number };

export type FaceShape = 'circle' | 'square';

export type PovSettings = {
  guessHours: number;
  apps: PovApp[];
  /** Ids that never count as toxic (messaging, browsers, productivity). */
  productiveIds: string[];
  names: Record<string, string>;
  showLabel: boolean;
  layout: PovLayout;
  /** Facecam bubble, in 1080x1920 pixels: centre and width. */
  faceShape: FaceShape;
  faceSize: number;
  faceX: number;
  faceY: number;
  /** Second of the clip the video starts from. */
  faceStart: number;
  /** App content scale while a facecam is showing, so the bubble has room. */
  appScale: number;
};

export type PovAssets = {
  face?: HTMLVideoElement | null;
  icons: Record<string, HTMLImageElement | undefined>;
};

export type SceneKind = 'guess' | 'scan' | 'comparison' | 'reality' | 'toxic';
export type Scene = { kind: SceneKind; start: number; duration: number };

const APP_SCENES: { kind: SceneKind; duration: number }[] = [
  { kind: 'guess', duration: 2.4 },
  { kind: 'scan', duration: 3.2 },
  { kind: 'comparison', duration: 2.8 },
  { kind: 'reality', duration: 3.4 },
  { kind: 'toxic', duration: 3.6 },
];

const FADE = 0.3; // crossfade between app screens

export function buildTimeline(): Scene[] {
  let t = 0;
  return APP_SCENES.map(a => { const sc = { kind: a.kind, start: t, duration: a.duration }; t += a.duration; return sc; });
}

export const timelineDuration = (scenes: Scene[]) =>
  scenes.length ? scenes[scenes.length - 1].start + scenes[scenes.length - 1].duration : 0;

/** Where the facecam clip should be at time t; it loops if it's shorter than the video. */
export function faceTimeAt(s: PovSettings, t: number, clipDuration: number): number {
  const usable = Math.max(0.1, clipDuration - s.faceStart - 0.05);
  return s.faceStart + (t % usable);
}

// MARK: - Math

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const prog = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOutBack = (p: number) => { const c = 1.4; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

const formatHM = (minutes: number) => {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

// MARK: - Frame

/**
 * Renders time `t` onto `out` (a 1080x1920 context). `scratch` is an
 * offscreen 1080x1920 canvas used for the fades between screens.
 */
export function renderFrame(
  out: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  scenes: Scene[],
  t: number,
  s: PovSettings,
  assets: PovAssets,
) {
  const i = Math.max(0, scenes.findIndex(sc => t >= sc.start && t < sc.start + sc.duration));
  const sc = scenes[i] ?? scenes[scenes.length - 1];
  const u = t - sc.start;
  const prev = scenes[i - 1];
  const hasFace = !!assets.face;
  applyLayout(s.layout);

  if (prev && u < FADE) {
    const sctx = scratch.getContext('2d')!;
    drawScene(sctx, sc, u, s, assets, hasFace);
    drawScene(out, prev, prev.duration, s, assets, hasFace);
    out.save();
    out.globalAlpha = easeInOut(u / FADE);
    out.drawImage(scratch, 0, 0);
    out.restore();
  } else {
    drawScene(out, sc, u, s, assets, hasFace);
  }

  // The facecam stays put across screens, on top of everything.
  if (hasFace) drawFacecam(out, assets.face!, s);
}

function drawScene(ctx: CanvasRenderingContext2D, sc: Scene, u: number, s: PovSettings, a: PovAssets, shrink: boolean) {
  ctx.save();
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  const red = sc.kind === 'reality' || sc.kind === 'toxic';
  drawGlow(ctx, sc.start + u, red);

  // With a facecam the app shrinks toward the top so the bubble has room.
  if (shrink && s.appScale < 1) {
    ctx.translate(CX, SAFE.top);
    ctx.scale(s.appScale, s.appScale);
    ctx.translate(-CX, -SAFE.top);
  }
  if (s.layout === 'safe' && s.showLabel) drawLabel(ctx, a);

  const d = derive(s);
  switch (sc.kind) {
    case 'guess': drawGuess(ctx, u, s); break;
    case 'scan': drawScan(ctx, u, d, a); break;
    case 'comparison': drawComparison(ctx, u, s, d); break;
    case 'reality': drawReality(ctx, u, d); break;
    case 'toxic': drawToxic(ctx, u, d, a); break;
  }
  ctx.restore();
}

type Derived = {
  total: number;
  toxic: PovApp[];
  scanIds: string[];
  names: Record<string, string>;
};

function derive(s: PovSettings): Derived {
  const apps = s.apps.filter(x => x.minutes > 0);
  const total = apps.reduce((n, x) => n + x.minutes, 0);
  const sorted = [...apps].sort((x, y) => y.minutes - x.minutes);
  const toxic = sorted.filter(x => !s.productiveIds.includes(x.id));
  const rest = sorted.filter(x => s.productiveIds.includes(x.id));
  return { total, toxic, scanIds: [...toxic, ...rest].slice(0, 6).map(x => x.id), names: s.names };
}

// MARK: - Facecam

/** The character's clip in a circle or rounded square, like a selfie-cam bubble. */
function drawFacecam(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, s: PovSettings) {
  const size = s.faceSize;
  const x = s.faceX - size / 2;
  const y = s.faceY - size / 2;
  const clip = () => {
    ctx.beginPath();
    if (s.faceShape === 'circle') ctx.arc(s.faceX, s.faceY, size / 2, 0, Math.PI * 2);
    else roundRect(ctx, x, y, size, size, size * 0.18);
  };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 10;
  clip();
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.save();
  clip();
  ctx.clip();
  if (video.readyState >= 2 && video.videoWidth) {
    // Cover-fit, keeping the top of the frame where faces usually are.
    const vr = video.videoWidth / video.videoHeight;
    let w = size, h = size;
    if (vr > 1) w = size * vr; else h = size / vr;
    ctx.drawImage(video, x + (size - w) / 2, y + (size - h) * 0.3, w, h);
  }
  ctx.restore();

  clip();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.restore();
}

// MARK: - Chrome

function drawGlow(ctx: CanvasRenderingContext2D, t: number, red: boolean) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const pulse = 0.5 + 0.5 * Math.sin(t * (Math.PI / 2.5));
  const r = 350 + pulse * 50;
  const g = ctx.createRadialGradient(W / 2, -50, 0, W / 2, -50, r);
  const [c1, c2] = red
    ? [`rgba(${lerp(230, 255, pulse)}, ${lerp(26, 51, pulse)}, ${lerp(26, 51, pulse)}, ${lerp(0.8, 0.95, pulse)})`, 'rgba(153, 13, 13, 0.5)']
    : [`rgba(${lerp(26, 51, pulse)}, ${lerp(77, 102, pulse)}, ${lerp(230, 255, pulse)}, ${lerp(0.8, 0.95, pulse)})`, 'rgba(13, 38, 153, 0.5)'];
  g.addColorStop(0, c1);
  g.addColorStop(0.35, c2);
  g.addColorStop(0.7, 'rgba(5, 13, 51, 0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.filter = `blur(${30 * S}px)`;
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, r + 60);
  ctx.restore();
}

/** "Upshift" label at the top of the app screens, like FaceKit's in Luke's video. */
function drawLabel(ctx: CanvasRenderingContext2D, a: PovAssets) {
  const y = SAFE.top + 6;
  ctx.font = `600 15px ${FONT}`;
  const text = 'Upshift App';
  const tw = ctx.measureText(text).width;
  const w = tw + 20 + 22;
  const x = CX - w / 2;
  const icon = a.icons.upshift;
  if (icon) {
    ctx.save();
    roundRect(ctx, x, y, 22, 22, 6);
    ctx.clip();
    ctx.drawImage(icon, x, y, 22, 22);
    ctx.restore();
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, x + 30, y + 11);
  ctx.shadowBlur = 0;
}


/** Onboarding title (28pt bold, centred) and optional grey subtitle. Returns the bottom y. */
function drawTitle(ctx: CanvasRenderingContext2D, title: string, subtitle?: string, top = TITLE_Y): number {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `700 27px ${FONT}`;
  const lines = wrap(ctx, title, CW);
  lines.forEach((l, i) => ctx.fillText(l, CX, top + i * 33));
  let y = top + lines.length * 33;
  if (subtitle) {
    ctx.font = `400 15px ${FONT}`;
    ctx.fillStyle = GRAY;
    const sl = wrap(ctx, subtitle, CW);
    sl.forEach((l, i) => ctx.fillText(l, CX, y + 6 + i * 19));
    y += 6 + sl.length * 19;
  }
  return y;
}

// MARK: - 1. Guess

function drawGuess(ctx: CanvasRenderingContext2D, u: number, s: PovSettings) {
  const bottom = drawTitle(ctx, 'How much time do you spend on your phone every day?');
  const p = easeInOut(prog(u, 0.35, 1.7));
  const hours = Math.round(p * s.guessHours);

  ctx.font = `700 46px ${ROUNDED}`;
  ctx.fillStyle = BLUE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${hours}h`, CX, bottom + 22);

  const sw = 80, sh = 240;
  const sx = CX - sw / 2, sy = bottom + 88;
  roundRect(ctx, sx, sy, sw, sh, 25);
  ctx.fillStyle = 'rgba(0, 122, 255, 0.3)';
  ctx.fill();
  const fh = sh * (p * s.guessHours) / 16;
  if (fh > 0) {
    const g = ctx.createLinearGradient(0, sy + sh, 0, sy + sh - fh);
    g.addColorStop(0, '#007aff');
    g.addColorStop(1, 'rgba(0, 122, 255, 0.7)');
    ctx.save();
    roundRect(ctx, sx, sy, sw, sh, 25);
    ctx.clip();
    roundRect(ctx, sx, sy + sh - fh, sw, fh, 25);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  // A fingertip dragging the slider, so it reads as someone using the app.
  const touch = prog(u, 0.2, 0.35) * (1 - prog(u, 1.8, 2.0));
  if (touch > 0) {
    ctx.beginPath();
    ctx.arc(CX, sy + sh - Math.max(fh, 18), 22, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.28 * touch})`;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * touch})`;
    ctx.stroke();
  }
}

// MARK: - Scan

const SCAN_STATUSES = ['Reading your Screen Time', 'Finding your most used apps', 'Detecting toxic apps', 'Calculating the damage'];

function drawScan(ctx: CanvasRenderingContext2D, u: number, d: Derived, a: PovAssets) {
  const bottom = drawTitle(ctx, 'Scanning your phone');
  const dur = 3.0;
  const k = 0.88; // scale so the orbit fits the safe area
  const cy = bottom + 40 + 170 * k;
  const ring = 115 * k;
  const orbit = 148 * k;

  // Guide rings
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  [1, 0.72, 0.44].forEach(f => { ctx.beginPath(); ctx.arc(CX, cy, ring * f, 0, Math.PI * 2); ctx.stroke(); });

  // Radar sweep
  const angle = (u / 1.4) * Math.PI * 2;
  const cg = ctx.createConicGradient(angle, CX, cy);
  cg.addColorStop(0, 'rgba(77,153,255,0)');
  cg.addColorStop(0.5, 'rgba(77,153,255,0)');
  cg.addColorStop(0.75, 'rgba(77,153,255,0.05)');
  cg.addColorStop(1, 'rgba(77,153,255,0.45)');
  ctx.beginPath();
  ctx.arc(CX, cy, ring, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();

  // Progress ring
  const p = easeInOut(prog(u, 0, dur));
  if (p > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(77,153,255,0.8)';
    ctx.shadowBlur = 12;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    const lg = ctx.createLinearGradient(CX - ring, cy, CX + ring, cy);
    lg.addColorStop(0, '#1a4de6');
    lg.addColorStop(1, BLUE);
    ctx.strokeStyle = lg;
    ctx.beginPath();
    ctx.arc(CX, cy, ring, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Centre label
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = `700 48px ${ROUNDED}`;
  ctx.fillText(`${Math.round(p * 100)}%`, CX, cy + 12);
  ctx.font = `600 11px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(spaced('SCANNING'), CX, cy + 32);

  // Apps around the scanner, picked up one by one
  const ids = d.scanIds;
  const step = dur / (ids.length + 1);
  const toxicCount = Math.min(3, d.toxic.length);
  ids.forEach((id, i) => {
    const ang = (i / Math.max(ids.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const hitP = prog(u, step * (i + 1), step * (i + 1) + 0.35);
    const hit = hitP > 0;
    const scale = hit ? lerp(0.9, 1.1, easeOutBack(hitP)) : 0.9;
    const size = 38 * scale;
    const x = CX + Math.cos(ang) * orbit - size / 2;
    const y = cy + Math.sin(ang) * orbit - size / 2;
    const isToxic = i < toxicCount;
    if (hit) {
      ctx.save();
      ctx.shadowColor = isToxic ? 'rgba(244,87,75,0.85)' : 'rgba(77,153,255,0.85)';
      ctx.shadowBlur = 10 * hitP;
      roundRect(ctx, x - 3, y - 3, size + 6, size + 6, 12);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isToxic ? phoneGradient(ctx, x, x + size) : BLUE;
      ctx.globalAlpha = hitP;
      ctx.stroke();
      ctx.restore();
    }
    drawAppIcon(ctx, a, id, x, y, size, { gray: !hit, alpha: hit ? 1 : 0.35 });
  });

  // Status line
  const si = Math.min(SCAN_STATUSES.length - 1, Math.floor((u / dur) * SCAN_STATUSES.length));
  const since = u - (si * dur) / SCAN_STATUSES.length;
  ctx.globalAlpha = si === 0 ? 1 : clamp01(since / 0.3);
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(SCAN_STATUSES[si], CX, cy + orbit + 42 + (1 - ctx.globalAlpha) * 8);
  ctx.globalAlpha = 1;
}

// MARK: - 2. Guess vs reality (copy of WeeklyAverageView)

function drawComparison(ctx: CanvasRenderingContext2D, u: number, s: PovSettings, d: Derived) {
  const guess = s.guessHours;
  const actual = d.total / 60;
  const more = actual > guess;
  // Truncated like Swift's Int(), so the numbers match the app.
  const pct = guess > 0 ? Math.abs(Math.trunc(((actual - guess) / guess) * 100)) : 0;
  const tint = more ? RED : GREEN;

  const bottom = drawTitle(ctx, more ? 'More screen time than you thought!' : 'Less screen time than you thought',
    more ? undefined : "Nice surprise - you're more in control than you realized.");

  // Arrow circle
  const cy = bottom + 44;
  ctx.beginPath();
  ctx.arc(CX, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = tint;
  ctx.fill();
  drawArrow(ctx, CX, cy, more);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.font = `700 46px ${ROUNDED}`;
  ctx.fillText(formatHM(actual * 60), CX, cy + 46);
  ctx.font = `500 16px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(`${pct}% ${more ? 'more' : 'less'} than your guess`, CX, cy + 108);

  // Bars
  const grow = easeOut(prog(u, 0.2, 1.1));
  const top = cy + 150;
  const bh = 110;
  const pad = 32 - 12;
  const colW = (CW - pad * 2 - 24) / 2;
  const x1 = SAFE.left + pad, x2 = x1 + colW + 24;
  const max = Math.max(guess, actual, 0.01);
  drawScreenTimeBar(ctx, x1, top + bh, colW, (guess / max) * bh * grow, null);
  drawScreenTimeBar(ctx, x2, top + bh, colW, (actual / max) * bh * grow, tint);

  ctx.textBaseline = 'top';
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText(formatHM(guess * 60), x1, top + bh + 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = tint;
  ctx.fillText(formatHM(actual * 60), x2 + colW, top + bh + 16);
  ctx.font = `400 14px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.textAlign = 'left';
  ctx.fillText('Your guess', x1, top + bh + 36);
  ctx.textAlign = 'right';
  ctx.fillText('Last week avg.', x2 + colW, top + bh + 36);
}

/** SF Symbols' arrow.up.right / arrow.down.right, in white. */
function drawArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, up: boolean) {
  const d = up ? -1 : 1;
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 8 * d);
  ctx.lineTo(cx + 8, cy + 8 * d);
  ctx.moveTo(cx - 2, cy + 8 * d);
  ctx.lineTo(cx + 8, cy + 8 * d);
  ctx.lineTo(cx + 8, cy - 2 * d);
  ctx.stroke();
  ctx.restore();
}

/** The bar from the real screen: flat 30% fill with a solid 5pt line on top. */
function drawScreenTimeBar(ctx: CanvasRenderingContext2D, x: number, bottom: number, w: number, h: number, tint: string | null) {
  if (h <= 0) return;
  ctx.fillStyle = tint ? withAlpha(tint, 0.3) : 'rgba(64,64,64,0.5)';
  ctx.fillRect(x, bottom - h, w, h);
  ctx.fillStyle = tint ?? 'rgba(255,255,255,0.3)';
  ctx.fillRect(x, bottom - h, w, Math.min(5, h));
}

// MARK: - 3. Reality check

function drawReality(ctx: CanvasRenderingContext2D, u: number, d: Derived) {
  const bottom = drawTitle(ctx, "You're always on your phone.");
  const years = (d.total / (24 * 60)) * 60;
  const waking = Math.min(100, (d.total / (16 * 60)) * 100);
  const days = (d.total * 365) / 60 / 24;

  const shown = years * easeOut(prog(u, 0.3, 2.1));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 100px ${ROUNDED}`;
  const numY = bottom + 98;
  const tw = ctx.measureText(shown.toFixed(1)).width;
  ctx.save();
  ctx.shadowColor = 'rgba(244,87,75,0.45)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = phoneGradient(ctx, CX - tw / 2, CX + tw / 2);
  ctx.fillText(shown.toFixed(1), CX, numY);
  ctx.restore();

  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.font = `600 19px ${FONT}`;
  ctx.fillText('years of your life', CX, numY + 16);
  ctx.fillStyle = GRAY;
  ctx.font = `400 14px ${FONT}`;
  ctx.fillText('gone to your phone if nothing changes', CX, numY + 40);

  // Life grid: 60 years, the phone's share filling in
  const dot = 14, gap = 7, cols = 12, rows = 5;
  const gw = cols * dot + (cols - 1) * gap;
  const gx = CX - gw / 2, gy = numY + 70;
  const target = Math.min(60, Math.round(years));
  const filled = Math.floor(clamp01((u - 0.5) / (0.045 * Math.max(target, 1))) * target);
  for (let i = 0; i < cols * rows; i++) {
    const x = gx + (i % cols) * (dot + gap) + dot / 2;
    const y = gy + Math.floor(i / cols) * (dot + gap) + dot / 2;
    const on = i < filled;
    ctx.beginPath();
    ctx.arc(x, y, (dot / 2) * (on ? 1 : 0.85), 0, Math.PI * 2);
    if (on) {
      ctx.save();
      ctx.shadowColor = 'rgba(244,87,75,0.6)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = phoneGradient(ctx, x - dot / 2, x + dot / 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
    }
  }
  const ly = gy + rows * (dot + gap) + 4;
  ctx.font = `500 12px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const legend = [['Phone', true], ['Your actual life', false]] as const;
  const widths = legend.map(([l]) => 15 + ctx.measureText(l).width);
  let lx = CX - (widths[0] + 14 + widths[1]) / 2;
  legend.forEach(([label, on], i) => {
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly + 6, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = on ? phoneGradient(ctx, lx, lx + 9) : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.fillStyle = GRAY;
    ctx.fillText(label, lx + 15, ly + 6);
    lx += widths[i] + 14;
  });

  // Two onboarding cards
  const cardY = ly + 24, cardH = 70, cardW = (CW - 12) / 2;
  [[`${Math.trunc(waking * easeOut(prog(u, 0.6, 2.0)))}%`, 'of your waking hours'],
   [`${Math.trunc(days * easeOut(prog(u, 0.8, 2.2)))}`, 'full days a year']].forEach(([v, l], i) => {
    const x = SAFE.left + i * (cardW + 12);
    drawCard(ctx, x, cardY, cardW, cardH);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.font = `700 26px ${ROUNDED}`;
    ctx.fillText(v, x + cardW / 2, cardY + 12);
    ctx.fillStyle = GRAY;
    ctx.font = `400 13px ${FONT}`;
    ctx.fillText(l, x + cardW / 2, cardY + 45);
  });
}

// MARK: - 4. Most toxic apps: podium

function drawToxic(ctx: CanvasRenderingContext2D, u: number, d: Derived, a: PovAssets) {
  drawTitle(ctx, 'Your most toxic apps', 'The winners of stealing your life.');
  const top3 = d.toxic.slice(0, 3);
  if (!top3.length) return;

  const base = SAFE.bottom - 36;
  const heights = [150, 108, 78];
  const gap = 10;
  const colW = (CW - gap * 2) / 3;
  const order = [1, 0, 2];
  const revealAt = [1.15, 0.7, 0.25]; // by rank: winner last

  order.forEach((rank, slot) => {
    const item = top3[rank];
    if (!item) return;
    const p = clamp01((u - revealAt[rank]) / 0.55);
    if (p <= 0) return;
    const e = easeOutBack(p);
    const x = SAFE.left + slot * (colW + gap);
    const cx = x + colW / 2;
    const isFirst = rank === 0;
    const h = heights[rank] * Math.min(1, e);
    const lift = (1 - easeOut(p)) * 30;

    ctx.save();
    ctx.globalAlpha = easeOut(p);
    ctx.translate(0, lift);

    drawScreenTimeBar(ctx, x, base, colW, h, isFirst ? RED : null);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, base - h, colW, h);
    ctx.clip();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255,255,255,${isFirst ? 0.95 : 0.5})`;
    ctx.font = `700 ${isFirst ? 50 : 38}px ${ROUNDED}`;
    ctx.fillText(`${rank + 1}`, cx, base - heights[rank] + 16);
    ctx.restore();

    // Label stack above the step
    let y = base - h - 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `700 ${isFirst ? 15 : 13}px ${ROUNDED}`;
    ctx.fillStyle = isFirst ? RED : GRAY;
    ctx.fillText(`${formatHM(item.minutes)}/day`, cx, y);
    y -= 19;
    ctx.font = `700 ${isFirst ? 16 : 14}px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(fit(ctx, d.names[item.id] ?? item.id, colW), cx, y);
    y -= 22;
    const size = isFirst ? 66 : 52;
    ctx.save();
    ctx.shadowColor = `rgba(244,87,75,${isFirst ? 0.6 : 0.25})`;
    ctx.shadowBlur = isFirst ? 18 : 8;
    drawAppIcon(ctx, a, item.id, cx - size / 2, y - size, size, {});
    ctx.restore();
    if (isFirst) drawCrown(ctx, cx, y - size - 8);
    ctx.restore();
  });

  const first = top3[0];
  const fp = prog(u, 1.7, 2.1);
  if (fp > 0) {
    ctx.globalAlpha = fp;
    const days = Math.floor((first.minutes * 365) / 60 / 24);
    const parts: [string, string, string][] = [
      [d.names[first.id] ?? first.id, '#fff', '700'],
      [' alone takes ', 'rgba(255,255,255,0.85)', '400'],
      [`${days} full days`, CORAL, '700'],
      [' of your year.', 'rgba(255,255,255,0.85)', '400'],
    ];
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const widths = parts.map(([txt, , w]) => { ctx.font = `${w} 15px ${FONT}`; return ctx.measureText(txt).width; });
    let x = CX - widths.reduce((n, w) => n + w, 0) / 2;
    parts.forEach(([txt, color, w], i) => {
      ctx.font = `${w} 15px ${FONT}`;
      ctx.fillStyle = color;
      ctx.fillText(txt, x, base + 14);
      x += widths[i];
    });
    ctx.globalAlpha = 1;
  }
}

function drawCrown(ctx: CanvasRenderingContext2D, cx: number, bottom: number) {
  const w = 30, h = 20;
  const x = cx - w / 2, y = bottom - h;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#ffd94d');
  g.addColorStop(1, '#ff991a');
  ctx.save();
  ctx.shadowColor = 'rgba(255,153,26,0.6)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + 1, y + 5);
  ctx.lineTo(x + w * 0.3, y + h * 0.55);
  ctx.lineTo(cx, y);
  ctx.lineTo(x + w * 0.7, y + h * 0.55);
  ctx.lineTo(x + w - 1, y + 5);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

// MARK: - Drawing helpers

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundRect(ctx, x, y, w, h, 20);
  ctx.fillStyle = 'rgba(26,26,26,0.5)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.stroke();
}

function phoneGradient(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, PINK);
  g.addColorStop(1, CORAL);
  return g;
}

// TikTok's note on a 24x24 grid (Simple Icons).
const TIKTOK_PATH = new Path2D('M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z');

export function drawAppIcon(
  ctx: CanvasRenderingContext2D, a: PovAssets, id: string,
  x: number, y: number, size: number, opts: { gray?: boolean; alpha?: number },
) {
  ctx.save();
  ctx.globalAlpha *= opts.alpha ?? 1;
  if (opts.gray) ctx.filter = 'grayscale(1)';
  const r = size * 0.22;
  if (id === 'tiktok') {
    // Its favicon is only 32px, so draw the logo as a vector to stay sharp at 1080p.
    roundRect(ctx, x, y, size, size, r);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
    const k = (size * 0.6) / 24;
    const note = (dx: number, dy: number, color: string) => {
      ctx.save();
      ctx.translate(x + size * 0.2 + dx * size, y + size * 0.2 + dy * size);
      ctx.scale(k, k);
      ctx.fillStyle = color;
      ctx.fill(TIKTOK_PATH);
      ctx.restore();
    };
    note(-0.02, -0.02, '#25F4EE');
    note(0.02, 0.02, '#FE2C55');
    note(0, 0, '#fff');
  } else if (id === 'pornhub' || id === 'onlyfans') {
    // Drawn from the logos, like the mock app does.
    roundRect(ctx, x, y, size, size, r);
    ctx.fillStyle = id === 'pornhub' ? '#000' : '#00AFF0';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (id === 'pornhub') {
      ctx.font = `800 ${size * 0.26}px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText('Corn', x + size / 2, y + size * 0.36);
      const hw = ctx.measureText('hub').width + size * 0.12;
      roundRect(ctx, x + size / 2 - hw / 2, y + size * 0.52, hw, size * 0.3, size * 0.05);
      ctx.fillStyle = '#FF9900';
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillText('hub', x + size / 2, y + size * 0.675);
    } else {
      ctx.font = `900 ${size * 0.32}px ${FONT}`;
      ctx.fillStyle = '#fff';
      ctx.fillText('OF', x + size / 2 + size * 0.08, y + size / 2);
      drawLock(ctx, x + size * 0.24, y + size / 2, size * 0.16);
    }
  } else {
    const img = a.icons[id];
    ctx.save();
    roundRect(ctx, x, y, size, size, r);
    ctx.clip();
    if (img && img.complete && img.naturalWidth) {
      // Some favicons are transparent; give them the dark tile an app icon has.
      ctx.fillStyle = '#161616';
      ctx.fillRect(x, y, size, size);
      ctx.drawImage(img, x, y, size, size);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
    roundRect(ctx, x, y, size, size, r);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }
  ctx.restore();
}

function drawLock(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.fillStyle = '#fff';
  roundRect(ctx, cx - s / 2, cy - s * 0.1, s, s * 0.75, s * 0.15);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.1, s * 0.3, Math.PI, 0);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach(w => {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) { lines.push(line); line = w; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

const spaced = (t: string) => t.split('').join(' ');

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** TikTok's UI, drawn over the preview only, to check nothing important is covered. */
export function drawSafeZones(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(255, 0, 80, 0.18)';
  ctx.fillRect(0, 0, OUT_W, TIKTOK_SAFE.top * S);
  ctx.fillRect(0, TIKTOK_SAFE.bottom * S, OUT_W, OUT_H - TIKTOK_SAFE.bottom * S);
  ctx.fillRect(TIKTOK_SAFE.right * S + 20, 640, OUT_W - TIKTOK_SAFE.right * S - 20, TIKTOK_SAFE.bottom * S - 640);
  ctx.strokeStyle = 'rgba(255, 0, 80, 0.6)';
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 3;
  ctx.strokeRect(TIKTOK_SAFE.left * S, TIKTOK_SAFE.top * S, (TIKTOK_SAFE.right - TIKTOK_SAFE.left) * S, (TIKTOK_SAFE.bottom - TIKTOK_SAFE.top) * S);
  ctx.restore();
}

export { H as APP_HEIGHT };
export { TIKTOK_SAFE };
