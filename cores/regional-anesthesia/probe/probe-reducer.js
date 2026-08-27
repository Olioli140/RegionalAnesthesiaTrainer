import {REGIONAL_ACTION,createProbeState,validateProbeState} from '../../../shared/contracts/regional-anesthesia/probe.js';
import {add,vec3,quatFromAxisAngle,quatMultiply,rotateVector,normalizeQuat} from '../geometry/geometry.js';

export function applyProbeAction(state,action){
  validateProbeState(state);
  if(!action || typeof action.type!=='string') throw new TypeError('Action type is required');
  const p=action.payload||{};
  const next={...state,positionMm:{...state.positionMm},orientation:{...state.orientation},contactPoint:state.contactPoint?{...state.contactPoint}:undefined};
  switch(action.type){
    case REGIONAL_ACTION.PROBE_PLACE:
      next.positionMm={...(p.positionMm||next.positionMm)};
      next.contact=true;
      next.contactPoint={...(p.contactPoint||next.positionMm)};
      if(p.orientation) next.orientation=normalizeQuat(p.orientation);
      if(Number.isFinite(p.pressure)) next.pressure=Math.max(0,p.pressure);
      break;
    case REGIONAL_ACTION.PROBE_REMOVE:
      next.contact=false; next.contactPoint=undefined; next.pressure=0; break;
    case REGIONAL_ACTION.PROBE_SLIDE:
      if(!p.deltaMm) throw new TypeError('PROBE_SLIDE requires payload.deltaMm');
      next.positionMm=add(next.positionMm,p.deltaMm);
      if(next.contactPoint) next.contactPoint=add(next.contactPoint,p.deltaMm);
      break;
    case REGIONAL_ACTION.PROBE_ROTATE: {
      const d=Number(p.deltaRad); if(!Number.isFinite(d)) throw new TypeError('PROBE_ROTATE requires finite deltaRad');
      const surfaceNormal=vec3(0,1,0);
      next.orientation=quatMultiply(quatFromAxisAngle(surfaceNormal,d),next.orientation);
      next.rotationRad+=d; break;
    }
    case REGIONAL_ACTION.PROBE_TILT: {
      const d=Number(p.deltaRad); if(!Number.isFinite(d)) throw new TypeError('PROBE_TILT requires finite deltaRad');
      const lateral=rotateVector(next.orientation,vec3(1,0,0));
      next.orientation=quatMultiply(quatFromAxisAngle(lateral,d),next.orientation);
      next.tiltRad+=d; break;
    }
    case REGIONAL_ACTION.PROBE_ROCK: {
      const d=Number(p.deltaRad); if(!Number.isFinite(d)) throw new TypeError('PROBE_ROCK requires finite deltaRad');
      const longAxis=rotateVector(next.orientation,vec3(0,0,1));
      next.orientation=quatMultiply(quatFromAxisAngle(longAxis,d),next.orientation);
      next.rockRad+=d; break;
    }
    case REGIONAL_ACTION.PROBE_PRESSURE_SET: {
      const pressure=Number(p.pressure); if(!Number.isFinite(pressure)||pressure<0) throw new RangeError('PROBE_PRESSURE_SET requires pressure >= 0');
      next.pressure=pressure; break;
    }
    case REGIONAL_ACTION.PROBE_SELECT:
      if(typeof p.probeId==='string'&&p.probeId) next.probeId=p.probeId;
      break;
    default:
      throw new RangeError(`Unsupported regional probe action: ${action.type}`);
  }
  return validateProbeState(next);
}

export function reduceProbeActions(initialState=createProbeState(),actions=[]){
  return actions.reduce((state,action)=>applyProbeAction(state,action),initialState);
}
