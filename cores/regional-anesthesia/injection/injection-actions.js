const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export const INJECTION_ACTION=Object.freeze({
  ASPIRATE:'ASPIRATE',
  SET_REQUESTED_FLOW:'SET_REQUESTED_FLOW',
  START_INJECTION:'START_INJECTION',
  STOP_INJECTION:'STOP_INJECTION',
  ADVANCE_TIME:'ADVANCE_TIME'
});

export const ASPIRATION_RESULT=Object.freeze({
  BLOOD_RETURN:'BLOOD_RETURN',
  DRY:'DRY'
});

function activeStructureTypes(needleInteraction){
  const ids=new Set(needleInteraction?.insertion?.activeStructureIds||[]);
  const types=new Set();
  for(const interval of needleInteraction?.traversal?.intervals||[]){
    if(ids.has(interval.structureId)) types.add(interval.type);
  }
  return Object.freeze([...types].sort());
}

export function resolveAspirationResult(needleInteraction){
  if(needleInteraction?.kind!=='FROZEN_NEEDLE_INTERACTION_STATE') throw new TypeError('frozen needle interaction state is required');
  const structureTypes=activeStructureTypes(needleInteraction);
  const intravascular=structureTypes.includes('artery')||structureTypes.includes('vein');
  return Object.freeze({
    kind:'DETERMINISTIC_ASPIRATION_RESULT',
    result:intravascular?ASPIRATION_RESULT.BLOOD_RETURN:ASPIRATION_RESULT.DRY,
    needleId:needleInteraction.needleId,
    insertionFraction:needleInteraction.insertionFraction,
    activeStructureIds:needleInteraction.insertion.activeStructureIds,
    activeStructureTypes:structureTypes,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

export function createInjectionActionState({needleInteraction,syringeCapacityMl=20,initialVolumeMl=syringeCapacityMl,requestedFlowMlPerMin=5}={}){
  if(needleInteraction?.kind!=='FROZEN_NEEDLE_INTERACTION_STATE') throw new TypeError('frozen needle interaction state is required');
  if(!(syringeCapacityMl>0)) throw new RangeError('syringeCapacityMl must be > 0');
  if(!(initialVolumeMl>=0&&initialVolumeMl<=syringeCapacityMl)) throw new RangeError('initialVolumeMl must be within syringe capacity');
  if(!(requestedFlowMlPerMin>=0)) throw new RangeError('requestedFlowMlPerMin must be >= 0');
  return Object.freeze({
    kind:'DETERMINISTIC_INJECTION_ACTION_STATE',
    version:'D1.1',
    needleInteraction,
    syringe:Object.freeze({capacityMl:syringeCapacityMl,remainingVolumeMl:initialVolumeMl,deliveredVolumeMl:0}),
    requestedFlowMlPerMin,
    injectionActive:false,
    elapsedInjectionTimeSec:0,
    lastAspiration:null,
    actionCount:0,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

function nextState(state,patch){
  return Object.freeze({...state,...patch,actionCount:state.actionCount+1});
}

export function reduceInjectionAction(state,action,{needleInteraction=state?.needleInteraction}={}){
  if(state?.kind!=='DETERMINISTIC_INJECTION_ACTION_STATE') throw new TypeError('injection action state is required');
  if(needleInteraction?.kind!=='FROZEN_NEEDLE_INTERACTION_STATE') throw new TypeError('frozen needle interaction state is required');
  if(!action?.type) throw new TypeError('injection action type is required');

  if(action.type===INJECTION_ACTION.ASPIRATE){
    return nextState(state,{needleInteraction,lastAspiration:resolveAspirationResult(needleInteraction)});
  }
  if(action.type===INJECTION_ACTION.SET_REQUESTED_FLOW){
    if(!(action.flowMlPerMin>=0)) throw new RangeError('flowMlPerMin must be >= 0');
    return nextState(state,{needleInteraction,requestedFlowMlPerMin:action.flowMlPerMin});
  }
  if(action.type===INJECTION_ACTION.START_INJECTION){
    return nextState(state,{needleInteraction,injectionActive:state.syringe.remainingVolumeMl>0&&state.requestedFlowMlPerMin>0});
  }
  if(action.type===INJECTION_ACTION.STOP_INJECTION){
    return nextState(state,{needleInteraction,injectionActive:false});
  }
  if(action.type===INJECTION_ACTION.ADVANCE_TIME){
    if(!(action.deltaSec>=0)) throw new RangeError('deltaSec must be >= 0');
    if(!state.injectionActive||action.deltaSec===0) return nextState(state,{needleInteraction});
    const requestedMl=state.requestedFlowMlPerMin*action.deltaSec/60;
    const deliveredMl=Math.min(state.syringe.remainingVolumeMl,requestedMl);
    const remaining=Math.max(0,state.syringe.remainingVolumeMl-deliveredMl);
    const syringe=Object.freeze({capacityMl:state.syringe.capacityMl,remainingVolumeMl:remaining,deliveredVolumeMl:state.syringe.deliveredVolumeMl+deliveredMl});
    return nextState(state,{needleInteraction,syringe,injectionActive:remaining>0&&state.requestedFlowMlPerMin>0,elapsedInjectionTimeSec:state.elapsedInjectionTimeSec+action.deltaSec});
  }
  throw new TypeError(`unsupported injection action: ${action.type}`);
}

export function replayInjectionActions({initialState,actions=[],needleInteractionProvider}={}){
  if(initialState?.kind!=='DETERMINISTIC_INJECTION_ACTION_STATE') throw new TypeError('initialState is required');
  let state=initialState;
  for(let i=0;i<actions.length;i++){
    const needleInteraction=needleInteractionProvider?needleInteractionProvider(i,actions[i],state):state.needleInteraction;
    state=reduceInjectionAction(state,actions[i],{needleInteraction});
  }
  return state;
}
