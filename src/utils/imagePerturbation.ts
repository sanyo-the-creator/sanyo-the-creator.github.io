// imagePerturbation.ts
// -----------------------------------------------------------------------------
// Adversarial image-transform engine for testing / hardening an image-detection
// model. Every transform is independently toggleable with a strength control and
// randomized per-image, so a batch produces varied "hard negatives" you can feed
// back into a detector for adversarial training.
//
// All processing is client-side via <canvas>. Re-encoding through canvas already
// strips EXIF / GPS / ICC metadata as a side effect.
// -----------------------------------------------------------------------------

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface PerturbOptions {
  // Geometry
  cropEnabled: boolean;
  cropStrength: number; // 0..1  -> up to ~4% of the shorter edge trimmed per side
  rotateEnabled: boolean;
  rotateStrength: number; // 0..1 -> up to ±0.8 degrees
  scaleEnabled: boolean;
  scaleStrength: number; // 0..1 -> up to ±2% zoom
  aspectEnabled: boolean;
  aspectStrength: number; // 0..1 -> up to ±1.2% non-uniform stretch

  // Photometric
  photoEnabled: boolean;
  photoStrength: number; // 0..1 -> brightness/contrast/gamma/hue/saturation jitter

  // Noise
  noiseEnabled: boolean;
  noiseStrength: number; // 0..1 -> per-channel gaussian amplitude
  fixedPatternEnabled: boolean;
  fixedPatternStrength: number; // 0..1 -> subtle static "sensor" fingerprint

  // Invisible watermark (LSB) — survives PNG/WebP-lossless, destroyed by JPEG
  lsbEnabled: boolean;

  // Vignette / shadow
  vignetteEnabled: boolean;
  vignetteStrength: number; // 0..1 -> imperceptible luminance gradient

  // Output
  format: OutputFormat;
  jpegQualityJitter: boolean; // randomize quality in a plausible camera range
  jpegQuality: number; // 0..1 base quality when jitter is off
}

export const DEFAULT_OPTIONS: PerturbOptions = {
  cropEnabled: true,
  cropStrength: 0.4,
  rotateEnabled: true,
  rotateStrength: 0.35,
  scaleEnabled: true,
  scaleStrength: 0.3,
  aspectEnabled: true,
  aspectStrength: 0.3,

  photoEnabled: true,
  photoStrength: 0.45,

  noiseEnabled: true,
  noiseStrength: 0.4,
  fixedPatternEnabled: true,
  fixedPatternStrength: 0.35,

  lsbEnabled: true,

  vignetteEnabled: true,
  vignetteStrength: 0.4,

  format: 'image/jpeg',
  jpegQualityJitter: true,
  jpegQuality: 0.92,
};

// Roll a fresh, fully-randomized option set for a single image. Every transform
// is on, each strength is jittered independently, and the output format/quality
// vary too — so a batch of the same source never yields two identical outputs.
export function randomOptions(): PerturbOptions {
  const r = () => Math.random();
  const s = (lo: number, hi: number) => lo + r() * (hi - lo);
  const formats: OutputFormat[] = ['image/jpeg', 'image/jpeg', 'image/webp']; // weight toward jpeg
  return {
    cropEnabled: true,
    cropStrength: s(0.25, 1),
    rotateEnabled: true,
    rotateStrength: s(0.2, 1),
    scaleEnabled: true,
    scaleStrength: s(0.2, 1),
    aspectEnabled: true,
    aspectStrength: s(0.15, 0.8),

    photoEnabled: true,
    photoStrength: s(0.3, 1),

    noiseEnabled: true,
    noiseStrength: s(0.25, 0.9),
    fixedPatternEnabled: true,
    fixedPatternStrength: s(0.2, 0.8),

    lsbEnabled: true,

    vignetteEnabled: true,
    vignetteStrength: s(0.25, 0.9),

    format: formats[Math.floor(r() * formats.length)],
    jpegQualityJitter: true,
    jpegQuality: 0.92,
  };
}

export interface PerturbResult {
  blob: Blob;
  width: number;
  height: number;
  token: string; // per-image random fingerprint token (also LSB-embedded if enabled)
  appliedQuality: number | null;
}

// --- small seedable RNG (mulberry32) so a run is reproducible per token --------
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomToken(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Box–Muller gaussian
function gauss(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Embed an ascii token into the LSBs of the blue channel across the first pixels.
// Invisible to the eye (1-bit change), trivially readable by a program.
function embedLsb(data: Uint8ClampedArray, token: string) {
  const header = `UP:${token};`;
  let bitIndex = 0;
  for (let i = 0; i < header.length; i++) {
    const code = header.charCodeAt(i) & 0xff;
    for (let b = 7; b >= 0; b--) {
      const bit = (code >> b) & 1;
      const px = bitIndex; // one bit per pixel, blue channel (offset 2)
      const off = px * 4 + 2;
      if (off >= data.length) return;
      data[off] = (data[off] & 0xfe) | bit;
      bitIndex++;
    }
  }
}

/**
 * Read back an LSB token embedded by embedLsb — handy for verifying the mark
 * survived a round trip, or for building a "which of my images is this" lookup.
 */
export function readLsbToken(data: Uint8ClampedArray, maxChars = 32): string | null {
  let out = '';
  for (let c = 0; c < maxChars; c++) {
    let code = 0;
    for (let b = 0; b < 8; b++) {
      const px = c * 8 + b;
      const off = px * 4 + 2;
      if (off >= data.length) return null;
      code = (code << 1) | (data[off] & 1);
    }
    const ch = String.fromCharCode(code);
    out += ch;
    if (ch === ';') break;
  }
  const m = out.match(/^UP:([0-9a-f]+);/);
  return m ? m[1] : null;
}

export async function perturbImage(
  img: HTMLImageElement,
  opts: PerturbOptions
): Promise<PerturbResult> {
  const token = randomToken();
  // seed rng from the token so the run is deterministic given the token
  const seed = parseInt(token.slice(0, 8), 16);
  const rng = makeRng(seed);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const shortEdge = Math.min(srcW, srcH);

  // ---- geometry parameters ----
  let cropPx = 0;
  if (opts.cropEnabled) {
    const maxCrop = Math.round(shortEdge * 0.04 * opts.cropStrength);
    cropPx = Math.round(rng() * maxCrop);
  }
  const rot = opts.rotateEnabled ? (rng() * 2 - 1) * 0.8 * opts.rotateStrength * (Math.PI / 180) : 0;
  const scale = opts.scaleEnabled ? 1 + (rng() * 2 - 1) * 0.02 * opts.scaleStrength : 1;
  const aspectX = opts.aspectEnabled ? 1 + (rng() * 2 - 1) * 0.012 * opts.aspectStrength : 1;
  const aspectY = opts.aspectEnabled ? 1 + (rng() * 2 - 1) * 0.012 * opts.aspectStrength : 1;

  // Output keeps (roughly) the cropped size so the pixel grid is genuinely new.
  const outW = Math.max(8, srcW - cropPx * 2);
  const outH = Math.max(8, srcH - cropPx * 2);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw with geometry: translate to center, rotate, scale, aspect-jitter, then
  // draw the (cropped) source centered.
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(rot);
  ctx.scale(scale * aspectX, scale * aspectY);
  ctx.drawImage(
    img,
    cropPx,
    cropPx,
    srcW - cropPx * 2,
    srcH - cropPx * 2,
    -outW / 2,
    -outH / 2,
    outW,
    outH
  );
  ctx.restore();

  // ---- pixel-level pass ----
  const imageData = ctx.getImageData(0, 0, outW, outH);
  const data = imageData.data;

  // Photometric jitter parameters
  const brightness = opts.photoEnabled ? (rng() * 2 - 1) * 6 * opts.photoStrength : 0; // ±6 levels
  const contrast = opts.photoEnabled ? 1 + (rng() * 2 - 1) * 0.04 * opts.photoStrength : 1;
  const gamma = opts.photoEnabled ? 1 + (rng() * 2 - 1) * 0.05 * opts.photoStrength : 1;
  const hueShift = opts.photoEnabled ? (rng() * 2 - 1) * 3 * opts.photoStrength : 0; // degrees
  const satMul = opts.photoEnabled ? 1 + (rng() * 2 - 1) * 0.05 * opts.photoStrength : 1;
  const invGamma = 1 / gamma;

  const noiseAmp = opts.noiseEnabled ? 3.5 * opts.noiseStrength : 0;
  const fpAmp = opts.fixedPatternEnabled ? 2.0 * opts.fixedPatternStrength : 0;
  const vigAmp = opts.vignetteEnabled ? 0.05 * opts.vignetteStrength : 0;

  // Precompute a fixed-pattern "sensor fingerprint": a static per-pixel offset
  // driven by the seed, so it's unique to this token but constant across the frame.
  const fpRng = makeRng((seed ^ 0x9e3779b9) >>> 0);
  const fpPeriod = 64;
  const fpTable = new Float32Array(fpPeriod * fpPeriod);
  if (fpAmp > 0) {
    for (let i = 0; i < fpTable.length; i++) fpTable[i] = (fpRng() * 2 - 1) * fpAmp;
  }

  const cx = outW / 2;
  const cy = outH / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Photometric: contrast around mid-gray, brightness, gamma
      if (opts.photoEnabled) {
        r = (r - 128) * contrast + 128 + brightness;
        g = (g - 128) * contrast + 128 + brightness;
        b = (b - 128) * contrast + 128 + brightness;
        r = 255 * Math.pow(clamp8(r) / 255, invGamma);
        g = 255 * Math.pow(clamp8(g) / 255, invGamma);
        b = 255 * Math.pow(clamp8(b) / 255, invGamma);

        // Cheap hue/sat tweak via luminance mixing
        if (hueShift !== 0 || satMul !== 1) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = lum + (r - lum) * satMul;
          g = lum + (g - lum) * satMul;
          b = lum + (b - lum) * satMul;
          if (hueShift !== 0) {
            const h = hueShift / 60;
            r += h * (g - b) * 0.15;
            g += h * (b - r) * 0.15;
            b += h * (r - g) * 0.15;
          }
        }
      }

      // Vignette / imperceptible shadow gradient
      if (vigAmp > 0) {
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy) / maxDist;
        const factor = 1 - vigAmp * d * d;
        r *= factor;
        g *= factor;
        b *= factor;
      }

      // Fixed-pattern "sensor" fingerprint (static offset)
      if (fpAmp > 0) {
        const fp = fpTable[(y % fpPeriod) * fpPeriod + (x % fpPeriod)];
        r += fp;
        g += fp;
        b += fp;
      }

      // Random per-channel gaussian noise
      if (noiseAmp > 0) {
        r += gauss(rng) * noiseAmp;
        g += gauss(rng) * noiseAmp;
        b += gauss(rng) * noiseAmp;
      }

      data[idx] = clamp8(r);
      data[idx + 1] = clamp8(g);
      data[idx + 2] = clamp8(b);
    }
  }

  // Invisible LSB watermark (do this last so noise doesn't overwrite it)
  if (opts.lsbEnabled) {
    embedLsb(data, token);
  }

  ctx.putImageData(imageData, 0, 0);

  // ---- encode ----
  let quality: number | null = null;
  if (opts.format === 'image/jpeg' || opts.format === 'image/webp') {
    quality = opts.jpegQualityJitter
      ? 0.86 + rng() * 0.1 // 0.86..0.96 plausible-camera range
      : opts.jpegQuality;
  }

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas encode failed'))),
      opts.format,
      quality ?? undefined
    );
  });

  return { blob, width: outW, height: outH, token, appliedQuality: quality };
}
