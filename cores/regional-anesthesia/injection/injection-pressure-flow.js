import {INJECTION_ACTION,reduceInjectionAction} from './injection-actions.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export const TISSUE_INJECTION_MECHANICS=Object.freeze({
  none:Object.freeze({resistanceKPaPerMlMin:0.22,openingPressureKPa:0.4}),
  fat:Object.freeze({resistanceKPaPerMlMin:0.28,openingPressureKPa:0.7}),
  muscle:Object.freeze({resistanceKPaPerMlMin:0.52,openingPressureKPa:1.4}),
  fascia:Object.freeze({resistanceKPaPerMlMin:1.25,openingPressureKPa:4.0}),
  skin:Object.freeze({resistanceKPaPerMlMin:0.95,openingPressureKPa:3.0}),
  artery:Object.freeze({resistanceKPaPerMlMin:0.10,openingPressureKPa:0.2}),
  vein:Object.freeze({resistanceKPaPerMlMin:0.08,openingPressureKPa:0.15}),
  nerve:Object.freeze({resistanceKPaPerMlMin:1.55,openingPressureKPa:4.5}),
  other:Object.freeze({resistanceKPaPerMlMin:0.40,openingPressureKPa:1.0})
});

const PRIORITY=['artery','vein','nerve','fascia','skin','muscle','fat','other'];

function activeStructureTypes(needleInteraction){
  const ids=new Set(needleInteraction?.insertion?.activeStructureIds||[]);
  const types=new Set();
  for(const interval of needleInteraction?.traversal?.intervals||[]) if(ids.has(interval.structureId)) types.add(interval.type);
  return Object.freeze([...types].sort());
}

export function resolveTipInjectionEnvironment(needleInteraction){
  if(needleInteraction?.kind!=='FROZEN_NEEDLE_INTERACTION_STATE') throw new TypeError('frozen needle interaction state is required');
  const activeTypes=activeStructureTypes(needleInteraction);
  const dominantType=PRIORITY.find(type=>activeTypes.includes(type))||'none';
  const mechanics=TISSUE_INJECTION_MECHANICS[dominantType]||TISSUE_INJECTION_MECHANICS.other;
  return Object.freeze({kind:'DETERMINISTIC_TIP_INJECTION_ENVIRONMENT',dominantType,activeStructureTypes:activeTypes,...mechanics,calibrationStatus:'ENGINEERING_CALIBRATION'});
}

export function computeNeedleHydraulicResistance(needleInteraction,{referenceDiameterMm=0.8,referenceLengthMm=50,referenceResistanceKPaPerMlMin=0.42}={}){
  if(needleInteraction?.kind!=='FROZEN_NEEDLE_INTERACTION_STATE') throw new TypeError('frozen needle interaction state is required');
  const diameterMm=needleInteraction.geometry?.diameterMm;
  const lengthMm=needleInteraction.geometry?.insertedLengthMm;
  if(!(diameterMm>0&&lengthMm>0)) throw new RangeError('needle geometry must have positive diameter and length');
  return referenceResistanceKPaPerMlMin*(lengthMm/referenceLengthMm)*Math.pow(referenceDiameterMm/diameterMm,4);
}

export function resolvePressureLimitedFlow({needleInteraction,requestedFlowMlPerMin,pressureLimitKPa=20,needleSettings={}}={}){
  if(!(requestedFlowMlPerMin>=0)) throw new RangeError('requestedFlowMlPerMin must be >= 0');
  if(!(pressureLimitKPa>0)) throw new RangeError('pressureLimitKPa must be > 0');
  const environment=resolveTipInjectionEnvironment(needleInteraction);
  const needleResistanceKPaPerMlMin=computeNeedleHydraulicResistance(needleInteraction,needleSettings);
  const totalResistanceKPaPerMlMin=environment.resistanceKPaPerMlMin+needleResistanceKPaPerMlMin;
  const availablePressureKPa=Math.max(0,pressureLimitKPa-environment.openingPressureKPa);
  const maxFlowMlPerMin=totalResistanceKPaPerMlMin>0?availablePressureKPa/totalResistanceKPaPerMlMin:requestedFlowMlPerMin;
  const actualFlowMlPerMin=Math.min(requestedFlowMlPerMin,maxFlowMlPerMin);
  const steadyPressureKPa=actualFlowMlPerMin<=0?0:environment.openingPressureKPa+actualFlowMlPerMin*totalResistanceKPaPerMlMin;
  return Object.freeze({
    kind:'DETERMINISTIC_PRESSURE_FLOW_SOLUTION',requestedFlowMlPerMin,actualFlowMlPerMin,maxFlowMlPerMin,
    pressureLimited:actualFlowMlPerMin+1e-12<requestedFlowMlPerMin,
    pressureLimitKPa,steadyPressureKPa:Math.min(pressureLimitKPa,steadyPressureKPa),
    needleResistanceKPaPerMlMin,totalResistanceKPaPerMlMin,environment,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

export function createPressureFlowState({injectionState,pressureLimitKPa=20,pressureTimeConstantSec=0.35,needleSettings={}}={}){
  if(injectionState?.kind!=='DETERMINISTIC_INJECTION_ACTION_STATE') throw new TypeError('D1 injection action state is required');
  if(!(pressureLimitKPa>0)) throw new RangeError('pressureLimitKPa must be > 0');
  if(!(pressureTimeConstantSec>0)) throw new RangeError('pressureTimeConstantSec must be > 0');
  const solution=resolvePressureLimitedFlow({needleInteraction:injectionState.needleInteraction,requestedFlowMlPerMin:injectionState.requestedFlowMlPerMin,pressureLimitKPa,needleSettings});
  return Object.freeze({kind:'DETERMINISTIC_INJECTION_PRESSURE_FLOW_STATE',version:'D2.1',injectionState,pressureLimitKPa,pressureTimeConstantSec,linePressureKPa:0,lastFlowSolution:solution,needleSettings:Object.freeze({...needleSettings}),actionCount:0,calibrationStatus:'ENGINEERING_CALIBRATION'});
}

function wrap(state,injectionState,linePressureKPa,lastFlowSolution){
  return Object.freeze({...state,injectionState,linePressureKPa,lastFlowSolution,actionCount:state.actionCount+1});
}

export function reducePressureFlowAction(state,action,{needleInteraction=state?.injectionState?.needleInteraction}={}){
  if(state?.kind!=='DETERMINISTIC_INJECTION_PRESSURE_FLOW_STATE') throw new TypeError('D2 pressure flow state is required');
  if(needleInteraction?.kind!=='FROZEN_NEEDLE_INTERACTION_STATE') throw new TypeError('frozen needle interaction state is required');
  if(!action?.type) throw new TypeError('action type is required');

  if(action.type!==INJECTION_ACTION.ADVANCE_TIME){
    const nextInjection=reduceInjectionAction(state.injectionState,action,{needleInteraction});
    const solution=resolvePressureLimitedFlow({needleInteraction,requestedFlowMlPerMin:nextInjection.requestedFlowMlPerMin,pressureLimitKPa:state.pressureLimitKPa,needleSettings:state.needleSettings});
    const pressure=nextInjection.injectionActive?state.linePressureKPa:0;
    return wrap(state,nextInjection,pressure,solution);
  }

  if(!(action.deltaSec>=0)) throw new RangeError('deltaSec must be >= 0');
  const solution=resolvePressureLimitedFlow({needleInteraction,requestedFlowMlPerMin:state.injectionState.requestedFlowMlPerMin,pressureLimitKPa:state.pressureLimitKPa,needleSettings:state.needleSettings});
  const effectiveFlow=state.injectionState.injectionActive?solution.actualFlowMlPerMin:0;
  const requested=state.injectionState.requestedFlowMlPerMin;
  const temporary=Object.freeze({...state.injectionState,needleInteraction,requestedFlowMlPerMin:effectiveFlow});
  let delivered=reduceInjectionAction(temporary,action,{needleInteraction});
  delivered=Object.freeze({...delivered,requestedFlowMlPerMin:requested});
  const targetPressure=delivered.injectionActive||effectiveFlow>0?solution.steadyPressureKPa:0;
  const alpha=action.deltaSec===0?0:1-Math.exp(-action.deltaSec/state.pressureTimeConstantSec);
  const linePressureKPa=clamp(state.linePressureKPa+(targetPressure-state.linePressureKPa)*alpha,0,state.pressureLimitKPa);
  return wrap(state,delivered,linePressureKPa,solution);
}

export function replayPressureFlowActions({initialState,actions=[],needleInteractionProvider}={}){
  if(initialState?.kind!=='DETERMINISTIC_INJECTION_PRESSURE_FLOW_STATE') throw new TypeError('initialState is required');
  let state=initialState;
  for(let i=0;i<actions.length;i++){
    const needleInteraction=needleInteractionProvider?needleInteractionProvider(i,actions[i],state):state.injectionState.needleInteraction;
    state=reducePressureFlowAction(state,actions[i],{needleInteraction});
  }
  return state;
}
