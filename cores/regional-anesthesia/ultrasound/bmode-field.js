import {STRUCTURE_TYPE} from '../../../shared/contracts/regional-anesthesia/anatomy.js';
import {dot,normalize,rotateVector,vec3} from '../geometry/geometry.js';
import {getAdductorCanalGeometry} from '../anatomy/adductor-canal-dataset.js';
import {resolveAnatomyCrossSections} from '../scan-plane/anatomy-cross-section-resolver.js';
import {acousticPropertiesForStructure,depthAttenuationFactor,interfaceEchoResponse,nerveAnisotropyFactor} from './acoustic-model.js';

const clamp01=(x)=>Math.max(0,Math.min(1,x));
const smooth=(t)=>t*t*(3-2*t);

function hash32(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){ h^=text.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}
function lattice(seed,x,y){ return (hash32(`${seed}|${x}|${y}`)/0xffffffff)*2-1; }

export function deterministicSpatialSpeckle({seed='regional-mvp-b2',lateralMm,depthMm,correlationLengthMm=2.5,scatterFraction=0.25}={}){
  if(!(correlationLengthMm>0)) throw new RangeError('correlationLengthMm must be > 0');
  const gx=lateralMm/correlationLengthMm,gy=depthMm/correlationLengthMm;
  const x0=Math.floor(gx),y0=Math.floor(gy),tx=smooth(gx-x0),ty=smooth(gy-y0);
  const a=lattice(seed,x0,y0),b=lattice(seed,x0+1,y0),c=lattice(seed,x0,y0+1),d=lattice(seed,x0+1,y0+1);
  const top=a+(b-a)*tx,bottom=c+(d-c)*tx;
  const noise=top+(bottom-top)*ty;
  return Math.max(0,1+noise*scatterFraction);
}

export function logCompressSignal(signal,{referenceSignal=1,dynamicRangeDb=60}={}){
  if(!(referenceSignal>0)) throw new RangeError('referenceSignal must be > 0');
  if(!(dynamicRangeDb>0)) throw new RangeError('dynamicRangeDb must be > 0');
  if(!(signal>0)) return 0;
  const db=20*Math.log10(signal/referenceSignal);
  return clamp01((db+dynamicRangeDb)/dynamicRangeDb);
}

function pointInPolygon(point,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    const intersect=((a.depthMm>point.depthMm)!==(b.depthMm>point.depthMm)) &&
      point.lateralMm<(b.lateralMm-a.lateralMm)*(point.depthMm-a.depthMm)/((b.depthMm-a.depthMm)||1e-12)+a.lateralMm;
    if(intersect) inside=!inside;
  }
  return inside;
}

function distanceToSegment(p,a,b){
  const vx=b.lateralMm-a.lateralMm,vy=b.depthMm-a.depthMm;
  const wx=p.lateralMm-a.lateralMm,wy=p.depthMm-a.depthMm;
  const vv=vx*vx+vy*vy;
  const t=vv>0?Math.max(0,Math.min(1,(wx*vx+wy*vy)/vv)):0;
  return Math.hypot(p.lateralMm-(a.lateralMm+t*vx),p.depthMm-(a.depthMm+t*vy));
}
function distanceToBoundary(point,points){
  let best=Infinity;
  for(let i=0;i<points.length;i++) best=Math.min(best,distanceToSegment(point,points[i],points[(i+1)%points.length]));
  return best;
}
function contains(section,point){
  if(!section?.intersects||!section?.inView||!section.points?.length) return false;
  const b=section.bounds;
  if(point.lateralMm<b.minLateralMm||point.lateralMm>b.maxLateralMm||point.depthMm<b.minDepthMm||point.depthMm>b.maxDepthMm) return false;
  return pointInPolygon(point,section.points);
}
function worldFiberDirection(structure,geometry){
  if(structure?.properties?.fiberAxis) return normalize(rotateVector(structure.transform.orientation,structure.properties.fiberAxis));
  if(geometry?.kind==='cylinder'&&geometry.axis==='z') return normalize(rotateVector(structure.transform.orientation,vec3(0,0,1)));
  return null;
}
function pickOccupant(candidates,point){
  const hits=candidates.filter(x=>contains(x.section,point));
  if(!hits.length) return null;
  hits.sort((a,b)=>a.section.areaMm2-b.section.areaMm2||a.structure.id.localeCompare(b.structure.id));
  return hits[0];
}

export function createDeterministicBModeField({dataset,scanPlane,seed='regional-mvp-b2',widthPx=96,heightPx=96,correlationLengthMm=2.5,dynamicRangeDb=60,referenceSignal=1,interfaceThicknessMm=0.8}={}){
  if(!dataset||!scanPlane) throw new TypeError('dataset and scanPlane are required');
  if(!Number.isInteger(widthPx)||widthPx<2||!Number.isInteger(heightPx)||heightPx<2) throw new RangeError('widthPx and heightPx must be integers >= 2');
  const structureById=new Map(dataset.structures.map(s=>[s.id,s]));
  const candidates=resolveAnatomyCrossSections(dataset,scanPlane).map(section=>{
    const structure=structureById.get(section.structureId);
    const properties=structure?acousticPropertiesForStructure(structure):null;
    return {section,structure,properties};
  }).filter(x=>x.structure&&x.properties?.renderable&&x.section.intersects&&x.section.inView);

  const rawSignals=new Array(widthPx*heightPx).fill(0);
  const pixels=new Array(widthPx*heightPx).fill(0);
  const structureIds=new Array(widthPx*heightPx).fill(null);
  const tissueClasses=new Array(widthPx*heightPx).fill(null);
  const dx=scanPlane.widthMm/widthPx,dy=scanPlane.depthMm/heightPx;

  for(let y=0;y<heightPx;y++){
    const depthMm=(y+0.5)*dy;
    for(let x=0;x<widthPx;x++){
      const lateralMm=-scanPlane.widthMm/2+(x+0.5)*dx;
      const point={lateralMm,depthMm};
      const occupant=pickOccupant(candidates,point);
      const index=y*widthPx+x;
      if(!occupant) continue;
      const {section,structure,properties}=occupant;
      structureIds[index]=structure.id;
      tissueClasses[index]=properties.tissueClass;
      const attenuation=depthAttenuationFactor(depthMm,properties.attenuationDbPerCm);
      const speckle=deterministicSpatialSpeckle({seed:`${seed}|${structure.id}`,lateralMm,depthMm,correlationLengthMm,scatterFraction:properties.scatterFraction});
      let backscatter=properties.baselineBackscatter*speckle;
      if(structure.type===STRUCTURE_TYPE.ARTERY||structure.type===STRUCTURE_TYPE.VEIN) backscatter*=properties.lumenSignalScale;
      let anisotropy=1;
      if(structure.type===STRUCTURE_TYPE.NERVE){
        const geometry=getAdductorCanalGeometry(dataset,structure.geometryId);
        const fiber=worldFiberDirection(structure,geometry);
        if(fiber) anisotropy=nerveAnisotropyFactor(fiber,scanPlane.depthAxis,{strength:properties.anisotropyStrength,power:properties.anisotropyPower});
      }
      let boundaryEcho=0;
      if(distanceToBoundary(point,section.points)<=interfaceThicknessMm){
        const probePoint={lateralMm,depthMm:Math.min(scanPlane.depthMm,depthMm+Math.max(dy,interfaceThicknessMm))};
        const neighbor=pickOccupant(candidates.filter(c=>c.structure.id!==structure.id),probePoint);
        if(neighbor) boundaryEcho=interfaceEchoResponse(properties,neighbor.properties);
        else boundaryEcho=0.06*properties.interfaceEchoGain;
      }
      const signal=Math.max(0,(backscatter*anisotropy+boundaryEcho)*attenuation);
      rawSignals[index]=signal;
      pixels[index]=logCompressSignal(signal,{referenceSignal,dynamicRangeDb});
    }
  }

  return Object.freeze({
    kind:'DETERMINISTIC_BMODE_SIGNAL_FIELD',
    widthPx,heightPx,widthMm:scanPlane.widthMm,depthMm:scanPlane.depthMm,seed,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    pixels:Object.freeze(pixels),rawSignals:Object.freeze(rawSignals),structureIds:Object.freeze(structureIds),tissueClasses:Object.freeze(tissueClasses)
  });
}
