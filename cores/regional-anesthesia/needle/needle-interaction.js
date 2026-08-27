import {createNeedleAcousticOverlay} from './needle-acoustics.js';
import {computeNeedleTissueTraversal,traversalAtInsertionFraction} from './needle-traversal.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export const NEEDLE_INTERACTION_ACTION=Object.freeze({
  SET_INSERTION_FRACTION:'SET_INSERTION_FRACTION'
});

export function createNeedleInteractionSnapshot({dataset,needle,scanPlane,baseField,insertionFraction=1,acousticSettings={}}={}){
  if(!dataset?.structures) throw new TypeError('dataset is required');
  if(!needle||needle.kind!=='REGIONAL_NEEDLE_GEOMETRY') throw new TypeError('needle geometry is required');
  if(!scanPlane?.depthAxis) throw new TypeError('scanPlane is required');
  if(!baseField||baseField.kind!=='DETERMINISTIC_COMPLETED_ULTRASOUND_PHYSICS_FIELD') throw new TypeError('completed ultrasound field is required');
  const fraction=clamp(insertionFraction,0,1);
  const traversal=computeNeedleTissueTraversal({dataset,needle});
  const insertion=traversalAtInsertionFraction(traversal,fraction);
  const acousticOverlay=createNeedleAcousticOverlay({baseField,needle,scanPlane,...acousticSettings});
  return Object.freeze({
    kind:'FROZEN_NEEDLE_INTERACTION_STATE',
    version:'C4.1',
    needleId:needle.id,
    insertionFraction:fraction,
    geometry:Object.freeze({entryPointMm:needle.entryPointMm,tipPointMm:needle.tipPointMm,direction:needle.direction,insertedLengthMm:needle.insertedLengthMm,diameterMm:needle.diameterMm}),
    traversal,
    insertion,
    acoustics:acousticOverlay,
    baseUltrasoundKind:baseField.kind,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

export function reduceNeedleInteraction(state,action,context){
  if(!action||action.type!==NEEDLE_INTERACTION_ACTION.SET_INSERTION_FRACTION) throw new TypeError('unsupported needle interaction action');
  return createNeedleInteractionSnapshot({...context,insertionFraction:action.fraction});
}

export function replayNeedleInteraction({initialFraction=0,actions=[],context}={}){
  let state=createNeedleInteractionSnapshot({...context,insertionFraction:initialFraction});
  for(const action of actions) state=reduceNeedleInteraction(state,action,context);
  return state;
}
