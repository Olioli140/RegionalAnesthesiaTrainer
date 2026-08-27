import {dot,length,sub} from '../geometry/geometry.js';
import {ADDUCTOR_CANAL_IDS} from '../anatomy/adductor-canal-dataset.js';
import {resolveAnatomyCrossSections} from './anatomy-cross-section-resolver.js';
import {signedDistanceToPlane} from './scan-plane-resolver.js';

const EPS=1e-9;

function polygonArea(points){
  if(points.length<3) return 0;
  let area=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    area+=a.lateralMm*b.depthMm-b.lateralMm*a.depthMm;
  }
  return Math.abs(area)/2;
}

function clipAgainst(points,inside,intersection){
  if(!points.length) return [];
  const out=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    const aIn=inside(a),bIn=inside(b);
    if(aIn&&bIn) out.push(b);
    else if(aIn&&!bIn) out.push(intersection(a,b));
    else if(!aIn&&bIn){ out.push(intersection(a,b)); out.push(b); }
  }
  return out;
}

function lerpAt(a,b,key,value){
  const denom=b[key]-a[key];
  const t=Math.abs(denom)<=EPS?0:(value-a[key])/denom;
  return {
    lateralMm:a.lateralMm+(b.lateralMm-a.lateralMm)*t,
    depthMm:a.depthMm+(b.depthMm-a.depthMm)*t
  };
}

export function clipSectionToViewport(section,plane){
  if(!section?.intersects || !section.points?.length) return Object.freeze([]);
  const half=plane.widthMm/2;
  let points=section.points.map(p=>({lateralMm:p.lateralMm,depthMm:p.depthMm}));
  points=clipAgainst(points,p=>p.lateralMm>=-half-EPS,(a,b)=>lerpAt(a,b,'lateralMm',-half));
  points=clipAgainst(points,p=>p.lateralMm<=half+EPS,(a,b)=>lerpAt(a,b,'lateralMm',half));
  points=clipAgainst(points,p=>p.depthMm>=-EPS,(a,b)=>lerpAt(a,b,'depthMm',0));
  points=clipAgainst(points,p=>p.depthMm<=plane.depthMm+EPS,(a,b)=>lerpAt(a,b,'depthMm',plane.depthMm));
  return Object.freeze(points.map(p=>Object.freeze(p)));
}

export function sectionViewportCoverage(section,plane){
  if(!section?.intersects || !(section.areaMm2>EPS)) return 0;
  const clipped=clipSectionToViewport(section,plane);
  const ratio=Math.max(0,Math.min(1,polygonArea(clipped)/section.areaMm2));
  if(Math.abs(1-ratio)<=EPS) return 1;
  if(ratio<=EPS) return 0;
  return ratio;
}

export function resolveProbeToStructureRelationship(structure,plane,probeState){
  if(!structure?.transform?.positionMm) throw new TypeError('structure transform is required');
  const center=structure.transform.positionMm;
  const delta=sub(center,plane.originMm);
  const lateralMm=dot(delta,plane.lateralAxis);
  const depthMm=dot(delta,plane.depthAxis);
  const planeDistanceMm=Math.abs(signedDistanceToPlane(center,plane));
  const probePoint=probeState?.contactPoint||probeState?.positionMm||plane.originMm;
  return Object.freeze({
    structureId:structure.id,
    lateralMm,
    depthMm,
    planeDistanceMm,
    probeDistanceMm:length(sub(center,probePoint)),
    centerInViewport:Math.abs(lateralMm)<=plane.widthMm/2+EPS&&depthMm>=-EPS&&depthMm<=plane.depthMm+EPS
  });
}

export function resolveAnatomyQueryMetrics(dataset,plane,probeState,{landmarkIds}={}){
  const sections=resolveAnatomyCrossSections(dataset,plane,{includeOutOfView:true});
  const byId=new Map(sections.map(s=>[s.structureId,s]));
  const targetId=dataset.targetRegionId||ADDUCTOR_CANAL_IDS.TARGET_REGION;
  const targetSection=byId.get(targetId);
  const targetRegionCoverage=sectionViewportCoverage(targetSection,plane);
  const defaultLandmarks=[
    ADDUCTOR_CANAL_IDS.SARTORIUS,
    ADDUCTOR_CANAL_IDS.VASTUS_MEDIALIS,
    ADDUCTOR_CANAL_IDS.FEMORAL_ARTERY,
    ADDUCTOR_CANAL_IDS.FEMORAL_VEIN,
    ADDUCTOR_CANAL_IDS.SAPHENOUS_NERVE
  ];
  const ids=landmarkIds||defaultLandmarks;
  const landmarkDetails=ids.map(id=>{
    const section=byId.get(id);
    return Object.freeze({structureId:id,coverage:sectionViewportCoverage(section,plane),intersects:Boolean(section?.intersects)});
  });
  const relevantLandmarkCoverage=landmarkDetails.length?landmarkDetails.filter(x=>x.coverage>EPS).length/landmarkDetails.length:1;
  const targetStructure=dataset.structures.find(s=>s.id===targetId);
  return Object.freeze({
    targetRegionId:targetId,
    targetRegionCoverage,
    relevantLandmarkCoverage,
    landmarkDetails:Object.freeze(landmarkDetails),
    targetRelationship:resolveProbeToStructureRelationship(targetStructure,plane,probeState),
    visibleStructureIds:Object.freeze(sections.filter(s=>sectionViewportCoverage(s,plane)>EPS).map(s=>s.structureId).sort())
  });
}
