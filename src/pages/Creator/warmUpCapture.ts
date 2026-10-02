import { toPng } from 'html-to-image';

/**
 * html-to-image inlines every <img> into its clone on each call, and the first
 * renders often go out before those copies have decoded - so the photo and
 * app icons were missing from the opening frames of a video. Wait for the
 * page's own images, then run a couple of throwaway renders so frame 0 already
 * has everything in it.
 */
export async function warmUpCapture(node: HTMLElement, pixelRatio: number): Promise<void> {
  await Promise.all(
    Array.from(node.querySelectorAll('img')).map(img => img.decode().catch(() => undefined))
  );
  for (let i = 0; i < 2; i++) {
    await toPng(node, { cacheBust: false, pixelRatio, style: { transform: 'scale(1)', margin: '0' } }).catch(() => undefined);
  }
}
