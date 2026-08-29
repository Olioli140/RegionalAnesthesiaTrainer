import React, { useEffect, useRef } from 'react';
import type { ImagingSnapshot, UltrasoundFrame } from '../protocol';

export function UltrasoundCanvas({ frame, imaging }: { frame: UltrasoundFrame; imaging: ImagingSnapshot }) {
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

  const focusPercent=Math.max(0,Math.min(100,imaging.focusDepthMm/imaging.depthMm*100));
  return <div className="ultrasound-viewport">
    <canvas ref={ref} className="ultrasound-canvas" aria-label="Synthetic ultrasound B-mode" />
    <div className="depth-scale" aria-label={`Depth scale 0 to ${imaging.depthMm} millimeters`}>
      <span style={{top:'0%'}}>0</span><span style={{top:'50%'}}>{Math.round(imaging.depthMm/2)}</span><span style={{top:'100%'}}>{imaging.depthMm}</span>
    </div>
    <div className="focus-marker" style={{top:`${focusPercent}%`}} aria-label={`Focus ${imaging.focusDepthMm} millimeters`}><i/><span>F</span></div>
  </div>;
}
