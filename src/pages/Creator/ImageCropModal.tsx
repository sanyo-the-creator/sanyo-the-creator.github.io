import React, { useEffect, useRef, useState } from 'react';
import { RiCloseLine as _RiCloseLine } from 'react-icons/ri';

const RiCloseLine = _RiCloseLine as any;

// Side of the square crop stage on screen, and of the exported image.
const STAGE = 320;
const OUTPUT = 640;

type Props = {
  src: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
};

/**
 * Instagram-style profile picture cropper: the photo is panned and zoomed
 * behind a circular mask, then exported as a square so it can never end up
 * stretched in the mockup.
 */
const ImageCropModal: React.FC<Props> = ({ src, onCancel, onConfirm }) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Scale at which the image exactly covers the stage; zoom multiplies it.
  const baseScale = natural ? Math.max(STAGE / natural.w, STAGE / natural.h) : 1;
  const drawW = natural ? natural.w * baseScale * zoom : 0;
  const drawH = natural ? natural.h * baseScale * zoom : 0;

  // Keep the stage covered: the image may never be dragged past its edges.
  const clamp = (o: { x: number; y: number }, w: number, h: number) => {
    const maxX = Math.max(0, (w - STAGE) / 2);
    const maxY = Math.max(0, (h - STAGE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, o.x)),
      y: Math.min(maxY, Math.max(-maxY, o.y)),
    };
  };

  const startDrag = (clientX: number, clientY: number) => {
    dragRef.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset(clamp({ x: d.ox + (clientX - d.x), y: d.oy + (clientY - d.y) }, drawW, drawH));
  };

  const endDrag = () => { dragRef.current = null; };

  const changeZoom = (next: number) => {
    if (!natural) return;
    const z = Math.min(4, Math.max(1, next));
    setZoom(z);
    setOffset(prev => clamp(prev, natural.w * baseScale * z, natural.h * baseScale * z));
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !natural) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const k = OUTPUT / STAGE;
    ctx.drawImage(
      img,
      (OUTPUT - drawW * k) / 2 + offset.x * k,
      (OUTPUT - drawH * k) / 2 + offset.y * k,
      drawW * k,
      drawH * k
    );
    onConfirm(canvas.toDataURL('image/png'));
  };

  return (
    <div className="crop-modal-overlay" onMouseUp={endDrag} onMouseLeave={endDrag}
         onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-head">
          <h3>Position your picture</h3>
          <button className="crop-close" onClick={onCancel} aria-label="Cancel"><RiCloseLine /></button>
        </div>

        <div
          className="crop-stage"
          style={{ width: STAGE, height: STAGE }}
          onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
          onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={endDrag}
          onWheel={(e) => changeZoom(zoom - e.deltaY * 0.002)}
        >
          {natural && (
            <img
              src={src}
              alt="Crop preview"
              draggable={false}
              style={{
                width: drawW,
                height: drawH,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          <div className="crop-mask" />
        </div>

        <div className="crop-zoom">
          <span className="slider-label">Zoom</span>
          <input
            type="range"
            className="upshift-slider"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(e) => changeZoom(parseFloat(e.target.value))}
          />
        </div>

        <p className="crop-hint">Drag the photo to reposition it. Scroll or use the slider to zoom.</p>

        <div className="crop-actions">
          <button className="crop-btn ghost" onClick={onCancel}>Cancel</button>
          <button className="crop-btn primary" onClick={confirm} disabled={!natural}>Use photo</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
