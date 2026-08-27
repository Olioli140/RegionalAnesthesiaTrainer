import {sub,add,scale,dot} from '../geometry/geometry.js';
import {getAdductorCanalGeometry} from '../anatomy/adductor-canal-dataset.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const EPS=1e-9;

export const NEEDLE_TISSUE_EVENT=Object.freeze({
  ENTER:'ENTER_STRUCTURE',
  EXIT:'EXIT_STRUCTURE',
  PUNCTURE:'PUNCTURE_INTERFACE'
});

export const TISSUE_MECHANICAL_CLASS=Object.freeze({
  skin:Object.freeze({resistance:0.85,puncture:true}),
  fat:Object.freeze({resistance:0.15,puncture:false}),
  fascia:Object.freeze({resistance:1.0,puncture:true}),
  muscle:Object.freeze({resistance:0.35,puncture:false}),
  artery:Object.freeze({resistance:0.45,puncture:false}),
  vein:Object.freeze({resistance:0.25,puncture:false}),
  nerve:Object.freeze({resistance:0.4,puncture:false}),
  other:Object.freeze({resistance:0.2,puncture:false})
});

function localPoint(point,structure){
  const p=sub(point,structure.transform.positionMm);
  const q=structure.transform.orientation;
  if(!q) return p;
  const conj={w:q.w,x:-q.x,y:-q.y,z:-q.z};
  const rawMul=(a,b)=>({w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w});
  const qp={w:0,x:p.x,y:p.y,z:p.z};
  const r=rawMul(rawMul(conj,qp),q);
  return {x:r.x,y:r.y,z:r.z};
}

function quadraticInterval(a,b,c){
  if(Math.abs(a)<=EPS){
    if(Math.abs(b)<=EPS) return c<=0?[0,1]:null;
    const t=-c/b;
    return [t,t];
  }
  const d=b*b-4*a*c;
  if(d<0) return null;
  const s=Math.sqrt(Math.max(0,d));
  let t0=(-b-s)/(2*a),t1=(-b+s)/(2*a);
  if(t0>t1)[t0,t1]=[t1,t0];
  const lo=Math.max(0,t0),hi=Math.min(1,t1);
  return hi+EPS>=lo?[clamp(lo,0,1),clamp(hi,0,1)]:null;
}

function layerInterval(p0,p1,g){
  const d=sub(p1,p0);
  const bounds=[[-g.widthMm/2,g.widthMm/2],[-g.thicknessMm/2,g.thicknessMm/2],[-g.lengthMm/2,g.lengthMm/2]];
  const vals0=[p0.x,p0.y,p0.z],dv=[d.x,d.y,d.z];
  let lo=0,hi=1;
  for(let i=0;i<3;i++){
    if(Math.abs(dv[i])<=EPS){ if(vals0[i]<bounds[i][0]||vals0[i]>bounds[i][1]) return null; continue; }
    let a=(bounds[i][0]-vals0[i])/dv[i],b=(bounds[i][1]-vals0[i])/dv[i];
    if(a>b)[a,b]=[b,a]; lo=Math.max(lo,a); hi=Math.min(hi,b); if(hi+EPS<lo) return null;
  }
  return [clamp(lo,0,1),clamp(hi,0,1)];
}

function ellipsoidInterval(p0,p1,g){
  const d=sub(p1,p0),r=g.radiiMm;
  const a=(d.x*d.x)/(r.x*r.x)+(d.y*d.y)/(r.y*r.y)+(d.z*d.z)/(r.z*r.z);
  const b=2*((p0.x*d.x)/(r.x*r.x)+(p0.y*d.y)/(r.y*r.y)+(p0.z*d.z)/(r.z*r.z));
  const c=(p0.x*p0.x)/(r.x*r.x)+(p0.y*p0.y)/(r.y*r.y)+(p0.z*p0.z)/(r.z*r.z)-1;
  return quadraticInterval(a,b,c);
}

function cylinderInterval(p0,p1,g){
  if(g.axis!=='z') throw new TypeError('C3 currently supports z-axis cylinders');
  const d=sub(p1,p0),r=g.radiusMm;
  const radial=quadraticInterval(d.x*d.x+d.y*d.y,2*(p0.x*d.x+p0.y*d.y),p0.x*p0.x+p0.y*p0.y-r*r);
  if(!radial) return null;
  const z0=-g.lengthMm/2,z1=g.lengthMm/2;
  let axial;
  if(Math.abs(d.z)<=EPS) axial=(p0.z>=z0&&p0.z<=z1)?[0,1]:null;
  else { let a=(z0-p0.z)/d.z,b=(z1-p0.z)/d.z; if(a>b)[a,b]=[b,a]; axial=[Math.max(0,a),Math.min(1,b)]; }
  if(!axial) return null;
  const lo=Math.max(radial[0],axial[0]),hi=Math.min(radial[1],axial[1]);
  return hi+EPS>=lo?[clamp(lo,0,1),clamp(hi,0,1)]:null;
}

function structureInterval(dataset,structure,needle){
  const g=getAdductorCanalGeometry(dataset,structure.geometryId);
  const p0=localPoint(needle.entryPointMm,structure),p1=localPoint(needle.tipPointMm,structure);
  if(g.kind==='layer') return layerInterval(p0,p1,g);
  if(g.kind==='ellipsoid') return ellipsoidInterval(p0,p1,g);
  if(g.kind==='cylinder') return cylinderInterval(p0,p1,g);
  throw new TypeError(`Unsupported geometry kind: ${g.kind}`);
}

function pointAt(needle,t){return add(needle.entryPointMm,scale(sub(needle.tipPointMm,needle.entryPointMm),t));}

export function computeNeedleTissueTraversal({dataset,needle}={}){
  if(!dataset?.structures) throw new TypeError('anatomy dataset is required');
  if(!needle||needle.kind!=='REGIONAL_NEEDLE_GEOMETRY') throw new TypeError('needle geometry is required');
  const intervals=[];
  for(const structure of dataset.structures){
    if(structure.properties?.trainingTarget) continue;
    const interval=structureInterval(dataset,structure,needle);
    if(!interval) continue;
    const [enterT,exitT]=interval;
    intervals.push(Object.freeze({structureId:structure.id,type:structure.type,enterT,exitT,enterPointMm:Object.freeze(pointAt(needle,enterT)),exitPointMm:Object.freeze(pointAt(needle,exitT))}));
  }
  intervals.sort((a,b)=>a.enterT-b.enterT||a.exitT-b.exitT||a.structureId.localeCompare(b.structureId));

  const events=[];
  for(const interval of intervals){
    const mech=TISSUE_MECHANICAL_CLASS[interval.type]||TISSUE_MECHANICAL_CLASS.other;
    events.push(Object.freeze({kind:'NEEDLE_TISSUE_EVENT',eventType:mech.puncture?NEEDLE_TISSUE_EVENT.PUNCTURE:NEEDLE_TISSUE_EVENT.ENTER,structureId:interval.structureId,structureType:interval.type,t:interval.enterT,pointMm:interval.enterPointMm,resistance:mech.resistance,calibrationStatus:'ENGINEERING_CALIBRATION'}));
    if(interval.exitT>interval.enterT+EPS) events.push(Object.freeze({kind:'NEEDLE_TISSUE_EVENT',eventType:NEEDLE_TISSUE_EVENT.EXIT,structureId:interval.structureId,structureType:interval.type,t:interval.exitT,pointMm:interval.exitPointMm,resistance:0,calibrationStatus:'ENGINEERING_CALIBRATION'}));
  }
  events.sort((a,b)=>a.t-b.t||a.eventType.localeCompare(b.eventType)||a.structureId.localeCompare(b.structureId));
  const tipStructures=intervals.filter(x=>x.enterT<=1+EPS&&x.exitT>=1-EPS).map(x=>x.structureId).sort();
  const cumulativeResistance=events.reduce((s,e)=>s+(e.eventType===NEEDLE_TISSUE_EVENT.PUNCTURE?e.resistance:0),0);
  return Object.freeze({kind:'DETERMINISTIC_NEEDLE_TISSUE_TRAVERSAL',needleId:needle.id,intervals:Object.freeze(intervals),events:Object.freeze(events),tipStructureIds:Object.freeze(tipStructures),cumulativePunctureResistance:cumulativeResistance,calibrationStatus:'ENGINEERING_CALIBRATION'});
}

export function traversalAtInsertionFraction(traversal,fraction){
  const f=clamp(fraction,0,1);
  const crossed=traversal.events.filter(e=>e.t<=f+EPS);
  const active=traversal.intervals.filter(x=>x.enterT<=f+EPS&&x.exitT>=f-EPS).map(x=>x.structureId).sort();
  return Object.freeze({kind:'NEEDLE_INSERTION_TRAVERSAL_STATE',fraction:f,crossedEvents:Object.freeze(crossed),activeStructureIds:Object.freeze(active),calibrationStatus:'ENGINEERING_CALIBRATION'});
}
