import {vec3,rotateVector,normalize,cross,dot,sub,scale,add,length} from '../geometry/geometry.js';
import {createScanPlane} from '../../../shared/contracts/regional-anesthesia/scan-plane.js';

const clamp01=(value)=>Math.max(0,Math.min(1,value));

export function resolveScanPlane(probeState,{widthMm=50,depthMm=60}={}){
  if(!probeState?.positionMm || !probeState?.orientation) throw new TypeError('ProbeState pose is required');
  const lateralAxis=normalize(rotateVector(probeState.orientation,vec3(1,0,0)));
  const depthAxis=normalize(rotateVector(probeState.orientation,vec3(0,1,0)));
  const normal=normalize(cross(lateralAxis,depthAxis));
  const plane=createScanPlane({originMm:probeState.contactPoint||probeState.positionMm,normal,lateralAxis,depthAxis,widthMm,depthMm});
  const probePressure=Number.isFinite(probeState.pressure)?clamp01(probeState.pressure):0;
  return Object.freeze({...plane,probePressure});
}

export function signedDistanceToPlane(point,plane){
  return dot(sub(point,plane.originMm),plane.normal);
}

export function intersectSphereWithPlane({centerMm,radiusMm},plane){
  if(!(radiusMm>=0)) throw new RangeError('Sphere radius must be >= 0');
  const signed=signedDistanceToPlane(centerMm,plane);
  const distance=Math.abs(signed);
  if(distance>radiusMm) return {intersects:false,distanceMm:distance};
  const projectedCenterMm=add(centerMm,scale(plane.normal,-signed));
  const radiusInPlaneMm=Math.sqrt(Math.max(0,radiusMm*radiusMm-distance*distance));
  return {intersects:true,distanceMm:distance,centerMm:projectedCenterMm,radiusMm:radiusInPlaneMm};
}

export function validateScanPlaneOrthonormal(plane,eps=1e-9){
  const unit=Math.abs(length(plane.normal)-1)<=eps&&Math.abs(length(plane.lateralAxis)-1)<=eps&&Math.abs(length(plane.depthAxis)-1)<=eps;
  const orthogonal=Math.abs(dot(plane.normal,plane.lateralAxis))<=eps&&Math.abs(dot(plane.normal,plane.depthAxis))<=eps&&Math.abs(dot(plane.lateralAxis,plane.depthAxis))<=eps;
  return unit&&orthogonal;
}
