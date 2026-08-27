import {vec3,quat,quatFromAxisAngle} from '../geometry/geometry.js';
import {createProbeState} from '../../../shared/contracts/regional-anesthesia/probe.js';

export const ADDUCTOR_CANAL_GOLDEN_POSE_ID=Object.freeze({
  TRANSVERSE_TARGET:'ACB_TRANSVERSE_TARGET',
  TRANSVERSE_OFF_TARGET:'ACB_TRANSVERSE_OFF_TARGET',
  OBLIQUE_TARGET:'ACB_OBLIQUE_TARGET'
});

const DEFINITIONS=Object.freeze({
  [ADDUCTOR_CANAL_GOLDEN_POSE_ID.TRANSVERSE_TARGET]:Object.freeze({
    description:'Transverse reference pose centered over the engineering-seed target region.',
    positionMm:vec3(0,0,0),contactPoint:vec3(0,0,0),orientation:quat(),widthMm:70,depthMm:70
  }),
  [ADDUCTOR_CANAL_GOLDEN_POSE_ID.TRANSVERSE_OFF_TARGET]:Object.freeze({
    description:'Longitudinal slide away from the target for negative regression.',
    positionMm:vec3(0,0,80),contactPoint:vec3(0,0,80),orientation:quat(),widthMm:70,depthMm:70
  }),
  [ADDUCTOR_CANAL_GOLDEN_POSE_ID.OBLIQUE_TARGET]:Object.freeze({
    description:'Oblique target-containing reference pose for deterministic geometry regression.',
    positionMm:vec3(0,0,0),contactPoint:vec3(0,0,0),orientation:quatFromAxisAngle(vec3(0,1,0),Math.PI/12),widthMm:70,depthMm:70
  })
});

export function getAdductorCanalGoldenPose(id=ADDUCTOR_CANAL_GOLDEN_POSE_ID.TRANSVERSE_TARGET){
  const d=DEFINITIONS[id];
  if(!d) throw new RangeError(`Unknown adductor canal golden pose: ${id}`);
  return Object.freeze({
    id,
    description:d.description,
    probeState:createProbeState({positionMm:d.positionMm,contactPoint:d.contactPoint,orientation:d.orientation,contact:true}),
    scanSettings:Object.freeze({widthMm:d.widthMm,depthMm:d.depthMm})
  });
}

export function listAdductorCanalGoldenPoses(){
  return Object.freeze(Object.values(ADDUCTOR_CANAL_GOLDEN_POSE_ID).map(getAdductorCanalGoldenPose));
}
