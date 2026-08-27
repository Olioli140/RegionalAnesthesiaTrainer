import {vec3,quat} from '../../../cores/regional-anesthesia/geometry/geometry.js';

export const REGIONAL_ACTION = Object.freeze({
  PROBE_SELECT:'PROBE_SELECT',
  PROBE_PLACE:'PROBE_PLACE',
  PROBE_REMOVE:'PROBE_REMOVE',
  PROBE_SLIDE:'PROBE_SLIDE',
  PROBE_ROTATE:'PROBE_ROTATE',
  PROBE_TILT:'PROBE_TILT',
  PROBE_ROCK:'PROBE_ROCK',
  PROBE_PRESSURE_SET:'PROBE_PRESSURE_SET',
  US_SET_DEPTH:'US_SET_DEPTH'
});

export function createProbeState({probeId='linear-01',positionMm=vec3(),orientation=quat(),contact=false,contactPoint,pressure=0,tiltRad=0,rotationRad=0,rockRad=0}={}){
  return {probeId,positionMm:{...positionMm},orientation:{...orientation},contact,contactPoint:contactPoint?{...contactPoint}:undefined,pressure,tiltRad,rotationRad,rockRad};
}

export function validateProbeState(state){
  if(typeof state?.probeId!=='string' || !state.probeId) throw new TypeError('ProbeState.probeId is required');
  if(!state.positionMm || !state.orientation) throw new TypeError('ProbeState pose is required');
  if(!Number.isFinite(state.pressure) || state.pressure<0) throw new RangeError('ProbeState.pressure must be finite and >= 0');
  return state;
}
