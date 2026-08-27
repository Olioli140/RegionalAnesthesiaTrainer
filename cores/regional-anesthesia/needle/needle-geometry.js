import {add,sub,scale,dot,length} from '../geometry/geometry.js';
import {createNeedleGeometry} from '../../../shared/contracts/regional-anesthesia/needle.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function createNeedleFromEntryDirection({id='needle',entryPointMm,direction,insertedLengthMm,diameterMm=0.8}={}){
  if(!entryPointMm||!direction) throw new TypeError('entryPointMm and direction are required');
  if(!(insertedLengthMm>0)) throw new RangeError('insertedLengthMm must be > 0');
  const dLen=length(direction);
  if(!(dLen>0)) throw new RangeError('direction must be non-zero');
  const unit=scale(direction,1/dLen);
  return createNeedleGeometry({id,entryPointMm,tipPointMm:add(entryPointMm,scale(unit,insertedLengthMm)),diameterMm});
}

export function pointAlongNeedle(needle,t){
  if(!needle||needle.kind!=='REGIONAL_NEEDLE_GEOMETRY') throw new TypeError('needle geometry is required');
  return add(needle.entryPointMm,scale(sub(needle.tipPointMm,needle.entryPointMm),clamp(t,0,1)));
}

export function needleScanPlaneIntersection(needle,scanPlane,{parallelEpsilon=1e-9}={}){
  if(!needle||needle.kind!=='REGIONAL_NEEDLE_GEOMETRY') throw new TypeError('needle geometry is required');
  if(!scanPlane?.originMm||!scanPlane?.normal) throw new TypeError('scanPlane is required');
  const segment=sub(needle.tipPointMm,needle.entryPointMm);
  const denominator=dot(scanPlane.normal,segment);
  const entryDistance=dot(scanPlane.normal,sub(needle.entryPointMm,scanPlane.originMm));
  const tipDistance=dot(scanPlane.normal,sub(needle.tipPointMm,scanPlane.originMm));
  if(Math.abs(denominator)<=parallelEpsilon){
    const coplanar=Math.abs(entryDistance)<=parallelEpsilon&&Math.abs(tipDistance)<=parallelEpsilon;
    return Object.freeze({kind:'NEEDLE_SCAN_PLANE_INTERSECTION',classification:coplanar?'COPLANAR':'PARALLEL_OFF_PLANE',intersects:coplanar,t:null,pointMm:null,entrySignedDistanceMm:entryDistance,tipSignedDistanceMm:tipDistance});
  }
  const t=-entryDistance/denominator;
  const intersects=t>=0&&t<=1;
  return Object.freeze({kind:'NEEDLE_SCAN_PLANE_INTERSECTION',classification:intersects?'SEGMENT_INTERSECTION':'LINE_ONLY',intersects,t,pointMm:intersects?Object.freeze(pointAlongNeedle(needle,t)):null,entrySignedDistanceMm:entryDistance,tipSignedDistanceMm:tipDistance});
}

export function projectPointToScanCoordinates(pointMm,scanPlane){
  const delta=sub(pointMm,scanPlane.originMm);
  return Object.freeze({lateralMm:dot(delta,scanPlane.lateralAxis),depthMm:dot(delta,scanPlane.depthAxis),normalMm:dot(delta,scanPlane.normal)});
}

export function needleScanPlaneRelation(needle,scanPlane){
  const intersection=needleScanPlaneIntersection(needle,scanPlane);
  const entryScan=projectPointToScanCoordinates(needle.entryPointMm,scanPlane);
  const tipScan=projectPointToScanCoordinates(needle.tipPointMm,scanPlane);
  const intersectionScan=intersection.pointMm?projectPointToScanCoordinates(intersection.pointMm,scanPlane):null;
  const inViewport=intersectionScan?Math.abs(intersectionScan.lateralMm)<=scanPlane.widthMm/2&&intersectionScan.depthMm>=0&&intersectionScan.depthMm<=scanPlane.depthMm:false;
  return Object.freeze({kind:'DETERMINISTIC_NEEDLE_SCAN_PLANE_RELATION',needleId:needle.id,intersection,entryScan,tipScan,intersectionScan,inViewport,visibleGeometryOnly:false});
}
