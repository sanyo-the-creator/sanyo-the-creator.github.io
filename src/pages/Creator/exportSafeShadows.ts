/**
 * Safari drops a box-shadow's blur radius when it rasterises an SVG
 * foreignObject — the shape keeps its spread but loses the falloff, so the
 * black hole's soft glow came out of the exporter as hard concentric rings
 * (visible in the gaps between cards as a pink wedge). Chrome renders it
 * correctly, so this runs on WebKit only and leaves Chrome exports untouched.
 *
 * The workaround stacks many spread-only shadows instead: each is a shape
 * Safari renders faithfully, and layering them with a fraction of the original
 * alpha rebuilds the falloff the blur would have produced.
 */

const RINGS = 28;

// Safari (and iOS browsers, which are all WebKit) but not Chrome/Edge/Chromium.
export const needsShadowWorkaround = (): boolean => {
  const ua = navigator.userAgent;
  const isWebKit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  return isWebKit;
};

type Shadow = { color: string; x: number; y: number; blur: number; spread: number };

/** Splits a computed box-shadow into its comma-separated layers. */
const splitLayers = (value: string): string[] => {
  const layers: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) { layers.push(current.trim()); current = ''; continue; }
    current += char;
  }
  if (current.trim()) layers.push(current.trim());
  return layers;
};

const parseLayer = (layer: string): Shadow | null => {
  // Computed values always lead with the colour, e.g. "rgb(255, 11, 107) 0px 0px 140px 90px".
  const colorMatch = layer.match(/^(rgba?\([^)]*\)|#[0-9a-f]+|[a-z]+)/i);
  if (!colorMatch) return null;
  const color = colorMatch[1];
  const lengths = layer.slice(color.length).trim().match(/-?[\d.]+px/g);
  if (!lengths || lengths.length < 3) return null;
  const [x, y, blur, spread] = lengths.map(l => parseFloat(l));
  if (!blur) return null; // Nothing to rebuild when there is no blur.
  return { color, x, y, blur, spread: spread || 0 };
};

const withAlpha = (color: string, factor: number): string => {
  const rgba = color.match(/rgba?\(([^)]+)\)/);
  if (!rgba) return color;
  const parts = rgba[1].split(',').map(p => parseFloat(p));
  const [r, g, b] = parts;
  const a = parts.length > 3 ? parts[3] : 1;
  return `rgba(${r}, ${g}, ${b}, ${(a * factor).toFixed(4)})`;
};

/** Rebuilds one blurred shadow as a stack of spread-only rings. */
const flattenShadow = (shadow: Shadow): string[] => {
  const rings: string[] = [];
  for (let i = 0; i < RINGS; i++) {
    // Rings run from just inside the blur's reach to its outer edge.
    const spread = shadow.spread - shadow.blur / 2 + (shadow.blur * (i + 1)) / RINGS;
    rings.push(`${shadow.x}px ${shadow.y}px 0 ${spread.toFixed(2)}px ${withAlpha(shadow.color, 1 / RINGS)}`);
  }
  return rings;
};

export function makeShadowsExportSafe(root: HTMLElement): () => void {
  if (!needsShadowWorkaround()) return () => { };

  const rules: string[] = [];
  const marked: Element[] = [];
  let index = 0;

  const visit = (el: Element) => {
    const key = `cap-shadow-${index++}`;
    let used = false;

    for (const pseudo of ['', '::before', '::after']) {
      const computed = getComputedStyle(el, pseudo || undefined);
      const value = computed.boxShadow;
      if (!value || value === 'none') continue;

      const rebuilt: string[] = [];
      let changed = false;
      for (const layer of splitLayers(value)) {
        const parsed = parseLayer(layer);
        if (parsed && !/inset/.test(layer)) {
          rebuilt.push(...flattenShadow(parsed));
          changed = true;
        } else {
          rebuilt.push(layer);
        }
      }
      if (!changed) continue;

      rules.push(`[data-export-shadow="${key}"]${pseudo}{box-shadow:${rebuilt.join(',')} !important;}`);
      used = true;
    }

    if (used) { el.setAttribute('data-export-shadow', key); marked.push(el); }
    Array.from(el.children).forEach(visit);
  };

  visit(root);
  if (!rules.length) return () => { };

  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  document.head.appendChild(style);

  return () => {
    style.remove();
    marked.forEach(el => el.removeAttribute('data-export-shadow'));
  };
}
