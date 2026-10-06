/**
 * Draws every frame of a POV video on a 1080x1920 canvas: the Upshift screen
 * time onboarding (guess, scan, reality, reality check, most toxic apps)
 * filling the screen, then committing to block the top app and hitting it
 * (the iOS Screen Time shield, or a blocked page in Safari), with an optional facecam bubble of the character
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

/** Upshift's block types, each with its own shield. */
export type ShieldKind = 'timeLimit' | 'walk' | 'quest' | 'appBlocked' | 'focus';

type ShieldConfig = {
  label: string;
  /** Key of the character image in PovAssets.icons. */
  icon: string;
  /** ShieldConfiguration.backgroundColor, laid over the dark blur. */
  tint: string;
  title: string;
  subtitle: string;
  subtitleColor: string;
  button: string;
};

const LIGHT_GRAY = '#aaaaaa'; // UIColor.lightGray

/** Copied from ShieldConfigurationExtension.swift in the iOS app. */
export const SHIELDS: Record<ShieldKind, ShieldConfig> = {
  timeLimit: {
    label: 'Time limit', icon: 'shield_hodziny', tint: 'rgba(25,25,25,0.5)',
    title: 'Time Limit Reached',
    subtitle: 'Come back tomorrow and use your screen time wisely!',
    subtitleColor: '#fff', button: 'See you tomorrow!',
  },
  walk: {
    label: 'Walk', icon: 'shield_earthTuxedoWalk', tint: 'rgba(25,51,25,0.5)',
    title: 'Time to Walk! 🏃',
    subtitle: '\nApp is blocked until you walk more steps.\n\nKeep moving to earn more screen time!',
    subtitleColor: LIGHT_GRAY, button: "Let's Go!",
  },
  quest: {
    label: 'Quest', icon: 'shield_earthShhh', tint: 'rgba(25,25,25,0.5)',
    title: 'Complete Quests',
    subtitle: '\nApp is blocked by a quest block 👀\n\n1. Open Upshift app\n2. Complete assigned quests\n3. Apps will unlock after completion',
    subtitleColor: LIGHT_GRAY, button: 'Back to quests!',
  },
  appBlocked: {
    label: 'App blocked', icon: 'shield_shrug', tint: 'rgba(25,25,25,0.5)',
    title: '\nApp Blocked',
    subtitle: 'This app is currently restricted by you :)',
    subtitleColor: LIGHT_GRAY, button: 'I understand..',
  },
  focus: {
    label: 'Focus mode', icon: 'shield_work', tint: 'rgba(25,25,51,0.5)',
    title: 'Focus Mode 🧠',
    subtitle: "\nYou're in Focus Mode! Stay focused on what's important right now.",
    subtitleColor: LIGHT_GRAY, button: "I'm focusing 💪",
  },
};

/** How the video ends: the top app's shield, the top site blocked in Safari, or no ending. */
export type PovEnding = 'app' | 'web' | 'none';

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
  ending: PovEnding;
  /** Which block's shield the app ending shows. */
  shield: ShieldKind;
};

export type PovAssets = {
  face?: HTMLVideoElement | null;
  icons: Record<string, HTMLImageElement | undefined>;
};

export type SceneKind = 'guess' | 'scan' | 'comparison' | 'reality' | 'toxic' | 'commit' | 'blockApp' | 'blockWeb';
export type Scene = { kind: SceneKind; start: number; duration: number };

const APP_SCENES: { kind: SceneKind; duration: number }[] = [
  { kind: 'guess', duration: 2.4 },
  { kind: 'scan', duration: 3.2 },
  { kind: 'comparison', duration: 2.8 },
  { kind: 'reality', duration: 3.4 },
  { kind: 'toxic', duration: 3.6 },
];

const ENDING_SCENES: Record<PovEnding, { kind: SceneKind; duration: number }[]> = {
  app: [{ kind: 'commit', duration: 3.2 }, { kind: 'blockApp', duration: 3.4 }],
  web: [{ kind: 'commit', duration: 3.2 }, { kind: 'blockWeb', duration: 4.8 }],
  none: [],
};

/** Chapter names for the preview's timeline. */
export const SCENE_LABELS: Record<SceneKind, string> = {
  guess: 'Guess',
  scan: 'Scan',
  comparison: 'Comparison',
  reality: 'Reality check',
  toxic: 'Toxic apps',
  commit: 'Commit',
  blockApp: 'App blocked',
  blockWeb: 'Site blocked',
};

const FADE = 0.3; // crossfade between app screens

export function buildTimeline(ending: PovEnding): Scene[] {
  let t = 0;
  return [...APP_SCENES, ...ENDING_SCENES[ending]].map(a => {
    const sc = { kind: a.kind, start: t, duration: a.duration };
    t += a.duration;
    return sc;
  });
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

  // The shield cuts in like an app launch rather than crossfading.
  if (prev && u < FADE && sc.kind !== 'blockApp') {
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
  // The shield is fullscreen, so its backdrop goes on before the facecam shrink.
  if (sc.kind === 'blockApp') drawShieldBackdrop(ctx, u, SHIELDS[s.shield]);
  else drawGlow(ctx, sc.start + u, red);

  // With a facecam the app shrinks toward the top so the bubble has room.
  if (shrink && s.appScale < 1) {
    ctx.translate(CX, SAFE.top);
    ctx.scale(s.appScale, s.appScale);
    ctx.translate(-CX, -SAFE.top);
  }
  if (s.layout === 'safe' && s.showLabel && sc.kind !== 'blockApp') drawLabel(ctx, a);

  const d = derive(s);
  switch (sc.kind) {
    case 'guess': drawGuess(ctx, u, s); break;
    case 'scan': drawScan(ctx, u, d, a); break;
    case 'comparison': drawComparison(ctx, u, s, d); break;
    case 'reality': drawReality(ctx, u, d); break;
    case 'toxic': drawToxic(ctx, u, d, a); break;
    case 'commit': drawCommit(ctx, u, d, a); break;
    case 'blockApp': drawBlockApp(ctx, u, a, SHIELDS[s.shield]); break;
    case 'blockWeb': drawBlockWeb(ctx, u, d, a); break;
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

// MARK: - 6. Blocked


// Sites shown in Safari's address bar; anything else is "<id>.com".
const DOMAINS: Record<string, string> = { pornhub: 'cornhub.com', twitter: 'x.com' };
const domainFor = (id: string) => DOMAINS[id] ?? `${id}.com`;

/** Upshift asks them to block their #1 app; they hold the fingerprint until it's done. */
function drawCommit(ctx: CanvasRenderingContext2D, u: number, d: Derived, a: PovAssets) {
  const item = d.toxic[0] ?? { id: 'tiktok', minutes: 0 };
  const name = d.names[item.id] ?? item.id;
  const bottom = drawTitle(ctx, 'Ready to take your life back?', `Block ${name}, your #1 time thief.`);
  const hold = prog(u, 1.0, 2.2);
  const done = prog(u, 2.2, 2.4);

  // The app, which locks once the hold completes.
  const cx = SAFE.left + 10, cw = CW - 20, ch = 80;
  let y = bottom + 20;
  drawCard(ctx, cx, y, cw, ch);
  drawAppIcon(ctx, a, item.id, cx + 16, y + 14, 52, { gray: done >= 1 });
  if (done > 0) {
    ctx.save();
    ctx.globalAlpha = done;
    ctx.beginPath();
    ctx.arc(cx + 64, y + 62, 12, 0, Math.PI * 2);
    ctx.fillStyle = GREEN;
    ctx.fill();
    drawLock(ctx, cx + 64, y + 62, 10);
    ctx.restore();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText(name, cx + 84, y + 20);
  ctx.font = `600 15px ${ROUNDED}`;
  ctx.fillStyle = done >= 1 ? GREEN : RED;
  ctx.fillText(done >= 1 ? 'Blocked' : `${formatHM(item.minutes)}/day`, cx + 84, y + 44);

  // The hook: wanting it isn't the same as doing it.
  y += ch + 18;
  ctx.save();
  ctx.globalAlpha = prog(u, 0.3, 0.7);
  ctx.textAlign = 'center';
  ctx.font = `400 15px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Most people say they want to quit.', CX, y);
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText('Only 1 in 5 actually do it.', CX, y + 22);
  ctx.restore();

  // Fingerprint in the middle, with a ring that fills while it's held.
  const r = 62;
  const fy = Math.max(y + 44 + r + 20, (SAFE.top + SAFE.bottom) / 2);
  const pulse = 1 + 0.06 * Math.sin(done * Math.PI);
  ctx.save();
  ctx.translate(CX, fy);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = done > 0 ? withAlpha(GREEN, 0.12 * done) : 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.stroke();
  if (hold > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + hold * Math.PI * 2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = done > 0 ? GREEN : phoneGradient(ctx, -r, r);
    ctx.stroke();
  }
  drawFingerprint(ctx, r * 0.68, hold, done);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = done >= 1 ? GREEN : '#fff';
  ctx.fillText(done >= 1 ? `✓ ${name} blocked` : `Hold to block ${name}`, CX, fy + r + 16);
  ctx.save();
  ctx.globalAlpha = 0.55 * (1 - done);
  ctx.fillStyle = GRAY;
  ctx.font = `500 14px ${FONT}`;
  ctx.fillText('Maybe later', CX, fy + r + 44);
  ctx.restore();

  drawTouch(ctx, CX + 4, fy + 6, prog(u, 0.75, 0.95) * (1 - prog(u, 2.3, 2.5)));
}

// Touch ID ridges: radius (0-1) and the arc in degrees, 270 being the top.
const RIDGES: [number, number, number][] = [
  [0.12, 140, 400], [0.27, 150, 330], [0.27, 350, 400], [0.42, 165, 390],
  [0.57, 135, 300], [0.57, 320, 405], [0.72, 170, 380], [0.87, 195, 345],
  [1.0, 215, 325],
];

/** A fingerprint glyph centred on 0,0 that colours in from the bottom as it's held. */
function drawFingerprint(ctx: CanvasRenderingContext2D, size: number, hold: number, done: number) {
  const ridges = () => {
    ctx.beginPath();
    RIDGES.forEach(([k, a0, a1]) => {
      const rx = size * k * 0.82, ry = size * k;
      ctx.moveTo(rx * Math.cos((a0 * Math.PI) / 180), size * 0.12 + ry * Math.sin((a0 * Math.PI) / 180));
      ctx.ellipse(0, size * 0.12, rx, ry, 0, (a0 * Math.PI) / 180, (a1 * Math.PI) / 180);
    });
  };
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ridges();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.stroke();
  if (hold <= 0) return;
  ctx.save();
  const top = size * 1.15 - hold * size * 2.3;
  ctx.beginPath();
  ctx.rect(-size * 1.2, top, size * 2.4, size * 2.4);
  ctx.clip();
  ridges();
  ctx.strokeStyle = done > 0 ? GREEN : phoneGradient(ctx, -size, size);
  ctx.stroke();
  ctx.restore();
}

/**
 * The Screen Time shield exactly as iOS shows an Upshift block: dark blur with
 * the block's tint over the app, its character, title, subtitle, white button.
 * The backdrop fills the frame; the content stays inside the safe area.
 */
function drawShieldBackdrop(ctx: CanvasRenderingContext2D, u: number, cfg: ShieldConfig) {
  const full = { x: 0, y: 0, w: W, h: H };
  ctx.save();
  ctx.filter = `blur(${30 * S}px)`;
  drawFeed(ctx, full, u);
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; // .dark blur material
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = cfg.tint;
  ctx.fillRect(0, 0, W, H);
  drawStatusBar(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  roundRect(ctx, W / 2 - 67, H - 13, 134, 5, 2.5);
  ctx.fill();
}

function drawBlockApp(ctx: CanvasRenderingContext2D, u: number, a: PovAssets, cfg: ShieldConfig) {
  // Laid out in iPhone points (16pt margins, so 358 wide) and scaled to fit
  // the safe area, so line breaks and proportions match a real phone.
  const k = CW / 358;
  const vh = (SAFE.bottom - SAFE.top) / k;
  const open = easeOut(prog(u, 0, 0.35));
  ctx.save();
  ctx.globalAlpha = open;
  ctx.translate(CX, SAFE.top + (SAFE.bottom - SAFE.top) / 2);
  ctx.scale(k * lerp(0.92, 1, open), k * lerp(0.92, 1, open));
  ctx.translate(0, -vh / 2);

  const bh = 50, by = vh - 16 - bh;
  const icon = 76;
  // UIKit keeps "\n"s as empty lines, including a leading one.
  const split = (text: string, font: string) => {
    ctx.font = font;
    return text.split('\n').flatMap(p => (p ? wrap(ctx, p, 340) : ['']));
  };
  const titleFont = `700 22px ${FONT}`, subFont = `400 17px ${FONT}`;
  const titleLines = split(cfg.title, titleFont);
  const lines = split(cfg.subtitle, subFont);
  const th = 28, lh = 22;
  const blockH = icon + 18 + titleLines.length * th + 6 + lines.length * lh;
  let y = (by - 20 - blockH) / 2;

  const img = a.icons[cfg.icon];
  if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -icon / 2, y, icon, icon);
  y += icon + 18;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.font = titleFont;
  titleLines.forEach(l => { if (l) ctx.fillText(l, 0, y); y += th; });
  y += 6;
  ctx.font = subFont;
  ctx.fillStyle = cfg.subtitleColor;
  lines.forEach(l => { if (l) ctx.fillText(l, 0, y); y += lh; });

  drawButton(ctx, cfg.button, 0, by, 358, bh, prog(u, 2.45, 2.6) * (1 - prog(u, 2.75, 2.9)));
  drawTouch(ctx, 36, by + bh / 2, prog(u, 2.25, 2.4) * (1 - prog(u, 2.85, 3.05)));
  ctx.restore();
}

/** A short-video feed, enough to read as the app being open behind the shield. */
function drawFeed(ctx: CanvasRenderingContext2D, p: { x: number; y: number; w: number; h: number }, u: number) {
  ctx.fillStyle = '#000';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  const drift = Math.sin(u * 1.5) * 10;
  const blob = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  };
  blob(p.x + p.w * 0.35 + drift, p.y + p.h * 0.4, p.w * 0.7, 'rgba(254,44,85,0.75)');
  blob(p.x + p.w * 0.7 - drift, p.y + p.h * 0.6, p.w * 0.6, 'rgba(37,244,238,0.55)');
  blob(p.x + p.w * 0.5, p.y + p.h * 0.25, p.w * 0.45, 'rgba(255,200,90,0.45)');
}

/** iPhone status bar across the top of the frame: time, Dynamic Island, battery. */
function drawStatusBar(ctx: CanvasRenderingContext2D) {
  roundRect(ctx, W / 2 - 63, 11, 126, 37, 18.5);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `600 17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('9:41', 64, 30);
  const bx = W - 62, by = 24;
  roundRect(ctx, bx, by, 26, 12, 3.5);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.stroke();
  roundRect(ctx, bx + 2, by + 2, 18, 8, 2);
  ctx.fill();
}

/** The top site typed into Safari, landing on Upshift's blocked page. */
function drawBlockWeb(ctx: CanvasRenderingContext2D, u: number, d: Derived, a: PovAssets) {
  const target = d.toxic[0]?.id ?? 'pornhub';
  const domain = domainFor(target);
  const bottom = drawTitle(ctx, 'The next night, 3am.', 'Just one quick look…');

  const x = SAFE.left, w = CW, top = bottom + 18, bot = SAFE.bottom;
  ctx.save();
  roundRect(ctx, x, top, w, bot - top, 24);
  ctx.fillStyle = '#1c1c1e';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();
  ctx.clip();

  const barH = 40, barX = x + 12, barW = w - 24, barY = bot - barH - 12;
  const pageBottom = barY - 10;
  const loaded = easeOut(prog(u, 2.0, 2.35));

  // Start page with blank favourites
  if (loaded < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - loaded;
    ctx.fillStyle = '#fff';
    ctx.font = `700 18px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Favorites', x + 18, top + 22);
    const gap = 14;
    const tile = (w - 36 - gap * 3) / 4;
    for (let i = 0; i < 8; i++) {
      const c = i % 4, r = Math.floor(i / 4);
      roundRect(ctx, x + 18 + c * (tile + gap), top + 56 + r * (tile + 30), tile, tile, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
    }
    ctx.restore();
  }

  // Upshift's blocked page
  if (loaded > 0) {
    ctx.save();
    ctx.globalAlpha = loaded;
    const g = ctx.createLinearGradient(0, top, 0, pageBottom);
    g.addColorStop(0, 'rgba(77,153,255,0.28)');
    g.addColorStop(0.65, 'rgba(28,28,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, top, w, pageBottom - top);
    ctx.translate(0, (1 - loaded) * 16);

    let y = top + 20;
    drawUpshiftIcon(ctx, a, CX - 26, y, 52);
    y += 62;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText('Not today. 🧠', CX, y);
    y += 36;
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = 'rgba(235,235,245,0.6)';
    [`${domain} is blocked by Upshift.`, "The urge passes in a few minutes. Your streak doesn't come back."].forEach((para, i) => {
      if (i) y += 8;
      wrap(ctx, para, w - 50).forEach(l => { ctx.fillText(l, CX, y); y += 19; });
    });

    y += 14;
    ctx.font = `600 14px ${ROUNDED}`;
    const streak = '🔥 12 day streak';
    const pw = ctx.measureText(streak).width + 28;
    roundRect(ctx, CX - pw / 2, y, pw, 30, 15);
    ctx.fillStyle = 'rgba(255,149,0,0.18)';
    ctx.fill();
    ctx.fillStyle = '#ff9f0a';
    ctx.textBaseline = 'middle';
    ctx.fillText(streak, CX, y + 15);

    const by = pageBottom - 54;
    drawButton(ctx, 'Back to my quests', CX, by, w - 60, 46, prog(u, 3.7, 3.85) * (1 - prog(u, 4.0, 4.15)));
    drawTouch(ctx, CX + 40, by + 24, prog(u, 3.5, 3.65) * (1 - prog(u, 4.1, 4.3)));
    ctx.restore();
  }

  // Address bar: tap, type the site, go, load.
  roundRect(ctx, barX, barY, barW, barH, 12);
  ctx.fillStyle = '#2c2c2e';
  ctx.fill();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const cy = barY + barH / 2;
  if (u < 1.5) {
    const typed = domain.slice(0, Math.round(prog(u, 0.55, 1.35) * domain.length));
    ctx.font = `400 16px ${FONT}`;
    ctx.fillStyle = typed ? '#fff' : GRAY;
    const text = typed || 'Search or enter website name';
    ctx.fillText(text, CX, cy);
    if (u > 0.4 && Math.floor(u * 3) % 2 === 0) {
      const cx = typed ? CX + ctx.measureText(text).width / 2 + 2 : CX - ctx.measureText(text).width / 2 - 4;
      ctx.fillStyle = BLUE;
      ctx.fillRect(cx, cy - 10, 2, 20);
    }
  } else {
    ctx.font = `600 15px ${FONT}`;
    ctx.fillStyle = '#fff';
    const tw = ctx.measureText(domain).width;
    ctx.fillText(domain, CX + 8, cy);
    ctx.save();
    ctx.globalAlpha *= 0.6;
    drawLock(ctx, CX - tw / 2 - 6, cy, 9);
    ctx.restore();
    const load = easeOut(prog(u, 1.5, 2.0));
    const fade = 1 - prog(u, 2.05, 2.25);
    if (fade > 0) {
      ctx.fillStyle = withAlpha(BLUE, fade);
      ctx.fillRect(barX + 10, barY + barH - 3, (barW - 20) * load, 2.5);
    }
  }
  drawTouch(ctx, CX + 20, cy, prog(u, 0.1, 0.25) * (1 - prog(u, 0.4, 0.55)));
  drawTouch(ctx, CX + 110, cy, prog(u, 1.35, 1.42) * (1 - prog(u, 1.5, 1.6)));
  ctx.restore();
}

/** A fingertip on the glass. */
function drawTouch(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.28 * alpha})`;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = `rgba(255,255,255,${0.5 * alpha})`;
  ctx.stroke();
  ctx.restore();
}

/** White button like the shield's primary one; `press` shrinks it a touch. */
function drawButton(ctx: CanvasRenderingContext2D, label: string, cx: number, y: number, w: number, h: number, press: number) {
  ctx.save();
  ctx.translate(cx, y + h / 2);
  const k = 1 - 0.04 * press;
  ctx.scale(k, k);
  roundRect(ctx, -w / 2, -h / 2, w, h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = `600 17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1);
  ctx.restore();
}

function drawUpshiftIcon(ctx: CanvasRenderingContext2D, a: PovAssets, x: number, y: number, size: number) {
  const icon = a.icons.upshift;
  ctx.save();
  roundRect(ctx, x, y, size, size, size * 0.22);
  ctx.clip();
  if (icon && icon.complete && icon.naturalWidth) ctx.drawImage(icon, x, y, size, size);
  else { ctx.fillStyle = '#333'; ctx.fill(); }
  ctx.restore();
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
