import React from 'react';
import type { ProbeSnapshot } from '../protocol';

export function ProbeScene({ probe, onSlide }: { probe: ProbeSnapshot; onSlide: (deltaMm:number)=>void }) {
  const zPct=50+probe.slideMm/2.4;
  return <div className="probe-scene" aria-label="Synchronized patient and probe scene">
    <div className="scene-label">Patient / probe spatial view</div>
    <div className="leg">
      <div className="landmark femur">F</div><div className="landmark artery">A</div><div className="landmark nerve">N</div>
      <button className="probe" style={{left:`${Math.max(10,Math.min(90,zPct))}%`,transform:`translateX(-50%) rotate(${probe.rotationDeg}deg) skewX(${probe.tiltDeg/2}deg)`}} onClick={()=>onSlide(5)} title="Click to slide +5 mm">
        <span className="probe-head"/><span className="probe-handle"/>
      </button>
    </div>
    <div className="scene-readout">slide {probe.slideMm.toFixed(0)} mm · rotate {probe.rotationDeg.toFixed(0)}° · tilt {probe.tiltDeg.toFixed(0)}° · rock {probe.rockDeg.toFixed(0)}°</div>
  </div>;
}
