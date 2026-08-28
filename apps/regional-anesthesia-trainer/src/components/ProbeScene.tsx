import React from 'react';
import type { NeedleSnapshot, ProbeSnapshot } from '../protocol';

export function ProbeScene({probe,needle,onSlide}:{probe:ProbeSnapshot;needle:NeedleSnapshot;onSlide:(deltaMm:number)=>void}){
  const zPct=50+probe.slideMm/2.4;
  const entryPct=Math.max(5,Math.min(95,50+needle.entryPointMm.x));
  const visibleLength=Math.max(8,needle.lengthMm*needle.advanceFraction*1.6);
  return <div className="probe-scene" aria-label="Synchronized patient probe and needle scene">
    <div className="scene-label">Patient / probe / needle spatial view</div>
    <div className="leg">
      <div className="landmark femur">F</div><div className="landmark artery">A</div><div className="landmark nerve">N</div>
      <button className="probe" style={{left:`${Math.max(10,Math.min(90,zPct))}%`,transform:`translateX(-50%) rotate(${probe.rotationDeg}deg) skewX(${probe.tiltDeg/2}deg)`}} onClick={()=>onSlide(5)} title="Click to slide +5 mm"><span className="probe-head"/><span className="probe-handle"/></button>
      <div className="needle-entry" style={{left:`${entryPct}%`}}/>
      <div className="needle-line" style={{left:`${entryPct}%`,width:`${visibleLength}px`,transform:`rotate(${needle.inPlaneAngleDeg-90}deg) skewY(${needle.outOfPlaneAngleDeg/5}deg)`}}/>
    </div>
    <div className="scene-readout">probe slide {probe.slideMm.toFixed(0)} mm · needle entry X {needle.entryPointMm.x.toFixed(0)} mm · {needle.inPlaneAngleDeg.toFixed(0)}° / {needle.outOfPlaneAngleDeg.toFixed(0)}° · advance {Math.round(needle.advanceFraction*100)}%</div>
  </div>;
}
