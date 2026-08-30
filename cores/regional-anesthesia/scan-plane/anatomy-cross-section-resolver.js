import {add,cross,dot,length,normalize,rotateVector,scale,sub,vec3} from '../geometry/geometry.js';
import {getAdductorCanalGeometry} from '../anatomy/adductor-canal-dataset.js';
import {signedDistanceToPlane} from './scan-plane-resolver.js';

const EPS=1e-8;
const SAMPLE_COUNT=64;

function conjugate(q){ return {w:q.w,x:-q.x,y:-q.y,z:-q.z}; }
function worldToLocalVector(structure,v){ return rotateVector(conjugate(structure.transform.orientation),v); }
function localToWorldPoint(structure,p){ return add(structure.transform.positionMm,rotateVector(structure.transform.orientation,p)); }
function projectToScan(point,plane){
  const d=sub(point,plane.originMm);
  return {lateralMm:dot(d,plane.lateralAxis),depthMm:dot(d,plane.depthAxis)};
}
function uniquePoints(points,eps=1e-6){
  const out=[];
  for(const p of points){
    if(!out.some(q=>Math.abs(p.x-q.x)<=eps&&Math.abs(p.y-q.y)<=eps&&Math.abs(p.z-q.z)<=eps)) out.push(p);
  }
  return out;
}
function polygonArea(points){
  let area=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    area+=a.lateralMm*b.depthMm-b.lateralMm*a.depthMm;
  }
  return Math.abs(area)/2;
}
function sortAroundCentroid(points){
  const c=points.reduce((a,p)=>({lateralMm:a.lateralMm+p.lateralMm,depthMm:a.depthMm+p.depthMm}),{lateralMm:0,depthMm:0});
  c.lateralMm/=points.length||1; c.depthMm/=points.length||1;
  return [...points].sort((a,b)=>Math.atan2(a.depthMm-c.depthMm,a.lateralMm-c.lateralMm)-Math.atan2(b.depthMm-c.depthMm,b.lateralMm-c.lateralMm));
}
function summarize(structure,geometry,plane,worldPoints,shape){
  const points2d=sortAroundCentroid(worldPoints.map(p=>projectToScan(p,plane)));
  if(!points2d.length) return {structureId:structure.id,geometryId:structure.geometryId,geometryKind:geometry.kind,intersects:false,inView:false,shape:null,points:[],areaMm2:0};
  const lateral=points2d.map(p=>p.lateralMm),depth=points2d.map(p=>p.depthMm);
  const bounds={minLateralMm:Math.min(...lateral),maxLateralMm:Math.max(...lateral),minDepthMm:Math.min(...depth),maxDepthMm:Math.max(...depth)};
  const inView=bounds.maxLateralMm>=-plane.widthMm/2-EPS && bounds.minLateralMm<=plane.widthMm/2+EPS && bounds.maxDepthMm>=-EPS && bounds.minDepthMm<=plane.depthMm+EPS;
  return Object.freeze({
    structureId:structure.id,
    geometryId:structure.geometryId,
    geometryKind:geometry.kind,
    intersects:true,
    inView,
    shape,
    points:Object.freeze(points2d.map(p=>Object.freeze({...p}))),
    bounds:Object.freeze(bounds),
    centroid:Object.freeze({lateralMm:lateral.reduce((a,b)=>a+b,0)/lateral.length,depthMm:depth.reduce((a,b)=>a+b,0)/depth.length}),
    areaMm2:polygonArea(points2d)
  });
}

function intersectBox(structure,geometry,plane){
  const hx=geometry.widthMm/2,hy=geometry.thicknessMm/2,hz=geometry.lengthMm/2;
  const corners=[
    vec3(-hx,-hy,-hz),vec3(hx,-hy,-hz),vec3(hx,hy,-hz),vec3(-hx,hy,-hz),
    vec3(-hx,-hy,hz),vec3(hx,-hy,hz),vec3(hx,hy,hz),vec3(-hx,hy,hz)
  ].map(p=>localToWorldPoint(structure,p));
  const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const hits=[];
  for(const [ia,ib] of edges){
    const a=corners[ia],b=corners[ib],da=signedDistanceToPlane(a,plane),db=signedDistanceToPlane(b,plane);
    if(Math.abs(da)<=EPS) hits.push(a);
    if(Math.abs(db)<=EPS) hits.push(b);
    if(da*db<0){ const t=da/(da-db); hits.push(add(a,scale(sub(b,a),t))); }
  }
  return summarize(structure,geometry,plane,uniquePoints(hits),'polygon');
}

function perpendicularBasis(n){
  const ref=Math.abs(n.z)<0.9?vec3(0,0,1):vec3(0,1,0);
  const e1=normalize(cross(n,ref));
  return [e1,normalize(cross(n,e1))];
}

function ellipsoidContourScale(geometry,t,centerU){
  if(!Array.isArray(geometry.contourHarmonics)||geometry.contourHarmonics.length===0) return 1;
  const twist=(Number(geometry.contourTwistRadPerUnit)||0)*centerU.z;
  let factor=1;
  for(const term of geometry.contourHarmonics){
    const frequency=Math.max(1,Math.round(Number(term.frequency)||1));
    const amplitude=Math.max(-0.12,Math.min(0.12,Number(term.amplitude)||0));
    const phase=Number(term.phaseRad)||0;
    factor+=amplitude*Math.cos(frequency*t+phase+twist);
  }
  return Math.max(0.80,Math.min(1.20,factor));
}

function intersectEllipsoid(structure,geometry,plane){
  const r=geometry.radiiMm;
  const n=worldToLocalVector(structure,plane.normal);
  const originLocal=worldToLocalVector(structure,sub(plane.originMm,structure.transform.positionMm));
  const k=dot(n,originLocal);
  const m=vec3(n.x*r.x,n.y*r.y,n.z*r.z);
  const ml=length(m);
  if(ml<=EPS) throw new RangeError('Degenerate ellipsoid/plane transform');
  const d=k/ml;
  if(Math.abs(d)>1+EPS) return summarize(structure,geometry,plane,[],'ellipse');
  const nh=scale(m,1/ml),centerU=scale(nh,d),circleRadius=Math.sqrt(Math.max(0,1-d*d));
  const [e1,e2]=perpendicularBasis(nh),points=[];
  for(let i=0;i<SAMPLE_COUNT;i++){
    const t=2*Math.PI*i/SAMPLE_COUNT;
    const contourScale=ellipsoidContourScale(geometry,t,centerU);
    const u=add(centerU,add(scale(e1,circleRadius*contourScale*Math.cos(t)),scale(e2,circleRadius*contourScale*Math.sin(t))));
    points.push(localToWorldPoint(structure,vec3(u.x*r.x,u.y*r.y,u.z*r.z)));
  }
  return summarize(structure,geometry,plane,points,geometry.contourHarmonics?.length?'irregular-ellipse':'ellipse');
}

function intersectCylinder(structure,geometry,plane){
  if(geometry.axis!=='z') throw new RangeError(`Unsupported cylinder axis: ${geometry.axis}`);
  const n=worldToLocalVector(structure,plane.normal);
  const originLocal=worldToLocalVector(structure,sub(plane.originMm,structure.transform.positionMm));
  const k=dot(n,originLocal),half=geometry.lengthMm/2,points=[];
  if(Math.abs(n.z)>EPS){
    for(let i=0;i<SAMPLE_COUNT;i++){
      const t=2*Math.PI*i/SAMPLE_COUNT,x=geometry.radiusMm*Math.cos(t),y=geometry.radiusMm*Math.sin(t);
      const z=(k-n.x*x-n.y*y)/n.z;
      if(z>=-half-EPS&&z<=half+EPS) points.push(localToWorldPoint(structure,vec3(x,y,z)));
    }
  } else {
    const radial=Math.hypot(n.x,n.y);
    if(radial<=EPS || Math.abs(k)/radial>geometry.radiusMm+EPS) return summarize(structure,geometry,plane,[],'cylinder-section');
    const nh=vec3(n.x/radial,n.y/radial,0),tangent=vec3(-nh.y,nh.x,0),offset=k/radial;
    const span=Math.sqrt(Math.max(0,geometry.radiusMm*geometry.radiusMm-offset*offset));
    for(const s of [-1,1]) for(const z of [-half,half]) points.push(localToWorldPoint(structure,add(scale(nh,offset),add(scale(tangent,s*span),vec3(0,0,z)))));
  }
  return summarize(structure,geometry,plane,points,'cylinder-section');
}

export function resolveStructureCrossSection(dataset,structure,plane){
  if(!dataset||!structure||!plane) throw new TypeError('dataset, structure and scan plane are required');
  const geometry=getAdductorCanalGeometry(dataset,structure.geometryId);
  switch(geometry.kind){
    case 'layer': return intersectBox(structure,geometry,plane);
    case 'ellipsoid': return intersectEllipsoid(structure,geometry,plane);
    case 'cylinder': return intersectCylinder(structure,geometry,plane);
    default: throw new RangeError(`Unsupported geometry kind: ${geometry.kind}`);
  }
}

export function resolveAnatomyCrossSections(dataset,plane,{includeOutOfView=false}={}){
  const sections=(dataset.structures||[]).map(s=>resolveStructureCrossSection(dataset,s,plane));
  return Object.freeze((includeOutOfView?sections:sections.filter(s=>s.intersects&&s.inView)).map(s=>s));
}
