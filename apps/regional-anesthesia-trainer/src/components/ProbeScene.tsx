import React,{useRef}from'react';
import type{NeedleSnapshot,ProbeSnapshot,TrainerAction}from'../protocol';

type Props={probe:ProbeSnapshot;needle:NeedleSnapshot;onAction:(action:TrainerAction)=>void};
type DragMode='probe'|'needle-entry'|'needle-tip'|null;

export function ProbeScene({probe,needle,onAction}:Props){
 const sceneRef=useRef<HTMLDivElement>(null);const drag=useRef<{mode:DragMode;x:number;y:number}>({mode:null,x:0,y:0});
 const zPct=50+probe.slideMm/2.4,entryPct=Math.max(5,Math.min(95,50+needle.entryPointMm.x)),visibleLength=Math.max(8,needle.lengthMm*needle.advanceFraction*1.6);
 const start=(mode:DragMode,e:React.PointerEvent)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={mode,x:e.clientX,y:e.clientY}};
 const move=(e:React.PointerEvent)=>{const d=drag.current;if(!d.mode)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;drag.current={...d,x:e.clientX,y:e.clientY};
  if(d.mode==='probe'){if(Math.abs(dx)>=1)onAction({type:'PROBE_SLIDE',deltaMm:dx*.28});if(Math.abs(dy)>=1)onAction({type:'PROBE_PRESSURE_SET',pressure:Math.max(0,Math.min(1,probe.pressure-dy*.008))});}
  if(d.mode==='needle-entry'&&(Math.abs(dx)>=1||Math.abs(dy)>=1))onAction({type:'NEEDLE_ENTRY_MOVE',deltaXmm:dx*.12,deltaZmm:dy*.12});
  if(d.mode==='needle-tip'){if(Math.abs(dy)>=1)onAction({type:'NEEDLE_ANGLE_IN_PLANE',deltaDeg:dy*.12});if(Math.abs(dx)>=1)onAction({type:'NEEDLE_ANGLE_OUT_OF_PLANE',deltaDeg:dx*.08});}
 };
 const stop=()=>{drag.current.mode=null};
 const wheel=(e:React.WheelEvent)=>{e.preventDefault();onAction({type:'PROBE_ROTATE',deltaDeg:e.deltaY>0?2:-2})};
 return <div ref={sceneRef} className="probe-scene direct-manipulation" aria-label="Direct manipulation patient probe and needle scene" onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
  <div className="scene-label">Direct manipulation · drag probe / needle · wheel probe to rotate</div><div className="leg">
   <div className="landmark femur">F</div><div className="landmark artery">A</div><div className="landmark nerve">N</div>
   <button className="probe manipulable" style={{left:`${Math.max(10,Math.min(90,zPct))}%`,transform:`translateX(-50%) rotate(${probe.rotationDeg}deg) skewX(${probe.tiltDeg/2}deg)`}} onPointerDown={e=>start('probe',e)} onWheel={wheel} title="Drag horizontally to slide, vertically for pressure; wheel to rotate"><span className="probe-head"/><span className="probe-handle"/></button>
   <button aria-label="Needle entry point" className="needle-entry manipulable" style={{left:`${entryPct}%`}} onPointerDown={e=>start('needle-entry',e)}/>
   <div className="needle-line" style={{left:`${entryPct}%`,width:`${visibleLength}px`,transform:`rotate(${needle.inPlaneAngleDeg-90}deg) skewY(${needle.outOfPlaneAngleDeg/5}deg)`}}/>
   <button aria-label="Needle trajectory handle" className="needle-tip-handle manipulable" style={{left:`calc(${entryPct}% + ${visibleLength}px)`}} onPointerDown={e=>start('needle-tip',e)}>+</button>
  </div><div className="scene-readout">probe {probe.slideMm.toFixed(0)} mm · pressure {Math.round(probe.pressure*100)}% · needle X {needle.entryPointMm.x.toFixed(0)} mm · {needle.inPlaneAngleDeg.toFixed(0)}° / {needle.outOfPlaneAngleDeg.toFixed(0)}° · advance {Math.round(needle.advanceFraction*100)}%</div>
 </div>;
}
