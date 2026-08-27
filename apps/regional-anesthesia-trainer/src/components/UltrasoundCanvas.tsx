import React, { useEffect, useRef } from 'react';
import type { UltrasoundFrame } from '../protocol';

export function UltrasoundCanvas({ frame }: { frame: UltrasoundFrame }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = frame.widthPx;
    canvas.height = frame.heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(frame.widthPx, frame.heightPx);
    for (let i = 0; i < frame.pixels.length; i++) {
      const value = Math.max(0, Math.min(255, Math.round(frame.pixels[i] * 255)));
      const offset = i * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [frame]);

  return <canvas ref={ref} className="ultrasound-canvas" aria-label="Synthetic ultrasound B-mode" />;
}
