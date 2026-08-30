import React, { useEffect, useRef } from 'react';
import type { ImagingSnapshot, UltrasoundFrame } from '../protocol';
import { getAdductorReferenceAsset } from '../visual/ultrasound/hybridReference';
import './hybridUltrasound.css';

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string) {
  const existing = imageCache.get(src);
  if (existing) return existing;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ultrasound reference asset: ${src}`));
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function workerDisplayValue(normalized: number) {
  const clamped = Math.max(0, Math.min(1, normalized));
  return (8 + 235 * Math.pow(clamped, 1.5)) / 255;
}

function drawSyntheticFallback(ctx: CanvasRenderingContext2D, frame: UltrasoundFrame) {
  const image = ctx.createImageData(frame.widthPx, frame.heightPx);
  for (let i = 0; i < frame.pixels.length; i++) {
    const value = Math.round(workerDisplayValue(frame.pixels[i]) * 255);
    const offset = i * 4;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function drawHybridReference(
  ctx: CanvasRenderingContext2D,
  frame: UltrasoundFrame,
  reference: HTMLImageElement,
) {
  const referenceCanvas = document.createElement('canvas');
  referenceCanvas.width = frame.widthPx;
  referenceCanvas.height = frame.heightPx;
  const referenceCtx = referenceCanvas.getContext('2d');
  if (!referenceCtx) {
    drawSyntheticFallback(ctx, frame);
    return;
  }

  referenceCtx.imageSmoothingEnabled = true;
  referenceCtx.imageSmoothingQuality = 'high';
  referenceCtx.drawImage(reference, 0, 0, frame.widthPx, frame.heightPx);
  const referencePixels = referenceCtx.getImageData(0, 0, frame.widthPx, frame.heightPx);
  const output = ctx.createImageData(frame.widthPx, frame.heightPx);

  for (let i = 0; i < frame.pixels.length; i++) {
    const offset = i * 4;
    const referenceValue = referencePixels.data[offset] / 255;
    const canonicalValue = workerDisplayValue(frame.pixels[i]);

    // The asset supplies high-frequency visual realism. Worker-owned pixels remain
    // the dynamic signal and modulate the image so needle, injection and operator
    // controls are still visible. This is presentation compositing only.
    const modulation = 0.78 + canonicalValue * 0.42;
    const canonicalLift = Math.max(0, canonicalValue - 0.48) * 0.28;
    const combined = Math.max(0, Math.min(1, referenceValue * modulation + canonicalLift));
    const value = Math.round(combined * 255);

    output.data[offset] = value;
    output.data[offset + 1] = value;
    output.data[offset + 2] = value;
    output.data[offset + 3] = 255;
  }

  ctx.putImageData(output, 0, 0);
}

export function UltrasoundCanvas({ frame, imaging, busy }: { frame: UltrasoundFrame; imaging: ImagingSnapshot; busy: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = frame.widthPx;
    canvas.height = frame.heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Never leave the viewport blank while the external presentation asset loads.
    drawSyntheticFallback(ctx, frame);

    let cancelled = false;
    const asset = getAdductorReferenceAsset('mid');
    loadImage(asset.src)
      .then((image) => {
        if (!cancelled) drawHybridReference(ctx, frame, image);
      })
      .catch(() => {
        // The canonical synthetic frame already rendered above is the safe fallback.
      });

    return () => {
      cancelled = true;
    };
  }, [frame]);

  const focusPercent = Math.max(0, Math.min(100, imaging.focusDepthMm / imaging.depthMm * 100));
  return <div className="ultrasound-viewport">
    <canvas ref={ref} className="ultrasound-canvas" aria-label="Hybrid reference and canonical ultrasound B-mode" />
    <div className="hybrid-mode-badge" aria-label="Hybrid ultrasound presentation mode">HYBRID</div>
    <div className={`image-progress ${busy ? 'visible' : ''}`} aria-hidden={!busy}><i /></div>
    <div className="depth-scale" aria-label={`Depth scale 0 to ${imaging.depthMm} millimeters`}>
      <span style={{ top: '0%' }}>0</span><span style={{ top: '50%' }}>{Math.round(imaging.depthMm / 2)}</span><span style={{ top: '100%' }}>{imaging.depthMm}</span>
    </div>
    <div className="focus-marker" style={{ top: `${focusPercent}%` }} aria-label={`Focus ${imaging.focusDepthMm} millimeters`}><i /><span>F</span></div>
  </div>;
}
