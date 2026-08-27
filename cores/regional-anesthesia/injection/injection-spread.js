const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export const SPREAD_PROFILE=Object.freeze({
  none:Object.freeze({axes:Object.freeze({x:1.2,y:1.2,z:1.2}),compactness:1}),
  fat:Object.freeze({axes:Object.freeze({x:1.8,y:1.2,z:1.8}),compactness:0.85}),
  muscle:Object.freeze({axes:Object.freeze({x:1.0,y:0.8,z:1.0}),compactness:1.25}),
  fascia:Object.freeze({axes:Object.freeze({x:3.2,y:0.55,z:2.2}),compactness:0.7}),
  skin:Object.freeze({axes:Object.freeze({x:1.6,y:0.45,z:1.6}),compactness:0.9}),
  artery:Object.freeze({axes:Object.freeze({x:0.7,y:0.7,z:0.7}),compactness:1.4}),
  vein:Object.freeze({axes:Object.freeze({x:0.9,y:0.9,z:0.9}),compactness:1.2}),
  nerve:Object.freeze({axes:Object.freeze({x:0.8,y:0.8,z:1.1}),compactness:1.35}),
  other:Object.freeze({axes:Object.freeze({x:1.2,y:1.0,z:1.2}),compactness:1})
});

function freezePoint(p){return Object.freeze({x:p.x,y:p.y,z:p.z});}

function profileFor(state){
  const type=state?.lastFlowSolution?.environment?.dominantType||'none';
  return Object.freeze({type,profile:SPREAD_PROFILE[type]||SPREAD_PROFILE.other});
}

function tipPoint(state){
  const p=state?.injectionState?.needleInteraction?.geometry?.tipPointMm;
  if(!p) throw new TypeError('D2 pressure-flow state with frozen needle geometry is required');
  return freezePoint(p);
}

function gaussianWeight(ix,iy,iz,axes,compactness){
  const q=(ix*ix)/(axes.x*axes.x)+(iy*iy)/(axes.y*axes.y)+(iz*iz)/(axes.z*axes.z);
  return Math.exp(-0.5*q*compactness);
}

function makeKernelCells(center,volumeMl,{voxelSizeMm=2,profile}){
  const radius=2;
  const weighted=[];
  let sum=0;
  for(let iz=-radius;iz<=radius;iz++) for(let iy=-radius;iy<=radius;iy++) for(let ix=-radius;ix<=radius;ix++){
    const w=gaussianWeight(ix,iy,iz,profile.axes,profile.compactness);
    if(w<0.02) continue;
    const cell={positionMm:freezePoint({x:center.x+ix*voxelSizeMm,y:center.y+iy*voxelSizeMm,z:center.z+iz*voxelSizeMm}),weight:w};
    weighted.push(cell); sum+=w;
  }
  return Object.freeze(weighted.map(c=>Object.freeze({positionMm:c.positionMm,volumeMl:volumeMl*c.weight/sum})));
}

function weightedCentroid(cells){
  let v=0,x=0,y=0,z=0;
  for(const c of cells){v+=c.volumeMl;x+=c.positionMm.x*c.volumeMl;y+=c.positionMm.y*c.volumeMl;z+=c.positionMm.z*c.volumeMl;}
  return freezePoint(v>0?{x:x/v,y:y/v,z:z/v}:{x:0,y:0,z:0});
}

export function createInjectionSpreadState({pressureFlowState,voxelSizeMm=2}={}){
  if(pressureFlowState?.kind!=='DETERMINISTIC_INJECTION_PRESSURE_FLOW_STATE') throw new TypeError('D2 pressure-flow state is required');
  if(!(voxelSizeMm>0)) throw new RangeError('voxelSizeMm must be > 0');
  return Object.freeze({
    kind:'PERSISTENT_3D_INJECTION_SPREAD_STATE',version:'D3.1',pressureFlowState,voxelSizeMm,
    depots:Object.freeze([]),lastDeliveredVolumeMl:pressureFlowState.injectionState.syringe.deliveredVolumeMl,
    totalSpreadVolumeMl:0,updateCount:0,calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

export function advanceInjectionSpread(state,nextPressureFlowState,{forceNewDepot=false}={}){
  if(state?.kind!=='PERSISTENT_3D_INJECTION_SPREAD_STATE') throw new TypeError('D3 spread state is required');
  if(nextPressureFlowState?.kind!=='DETERMINISTIC_INJECTION_PRESSURE_FLOW_STATE') throw new TypeError('D2 pressure-flow state is required');
  const delivered=nextPressureFlowState.injectionState.syringe.deliveredVolumeMl;
  const delta=Math.max(0,delivered-state.lastDeliveredVolumeMl);
  if(delta===0) return Object.freeze({...state,pressureFlowState:nextPressureFlowState,lastDeliveredVolumeMl:delivered,updateCount:state.updateCount+1});
  const center=tipPoint(nextPressureFlowState);
  const {type,profile}=profileFor(nextPressureFlowState);
  const cells=makeKernelCells(center,delta,{voxelSizeMm:state.voxelSizeMm,profile});
  const previous=state.depots[state.depots.length-1];
  const sameSource=!forceNewDepot&&previous&&previous.needleId===nextPressureFlowState.injectionState.needleInteraction.needleId&&previous.dominantTissueType===type;
  let depots;
  if(sameSource){
    const mergedCells=Object.freeze([...previous.cells,...cells]);
    const merged=Object.freeze({...previous,cells:mergedCells,volumeMl:previous.volumeMl+delta,centroidMm:weightedCentroid(mergedCells),ageSteps:previous.ageSteps+1});
    depots=Object.freeze([...state.depots.slice(0,-1),merged]);
  }else{
    const depot=Object.freeze({kind:'PERSISTENT_3D_INJECTION_DEPOT',id:`depot-${state.depots.length+1}`,needleId:nextPressureFlowState.injectionState.needleInteraction.needleId,originMm:center,centroidMm:weightedCentroid(cells),dominantTissueType:type,volumeMl:delta,cells,ageSteps:0,calibrationStatus:'ENGINEERING_CALIBRATION'});
    depots=Object.freeze([...state.depots,depot]);
  }
  return Object.freeze({...state,pressureFlowState:nextPressureFlowState,depots,lastDeliveredVolumeMl:delivered,totalSpreadVolumeMl:state.totalSpreadVolumeMl+delta,updateCount:state.updateCount+1});
}

export function spreadBounds(depot){
  if(depot?.kind!=='PERSISTENT_3D_INJECTION_DEPOT') throw new TypeError('D3 depot is required');
  const xs=depot.cells.map(c=>c.positionMm.x),ys=depot.cells.map(c=>c.positionMm.y),zs=depot.cells.map(c=>c.positionMm.z);
  return Object.freeze({min:freezePoint({x:Math.min(...xs),y:Math.min(...ys),z:Math.min(...zs)}),max:freezePoint({x:Math.max(...xs),y:Math.max(...ys),z:Math.max(...zs)})});
}

export function spreadExtentMm(depot){
  const b=spreadBounds(depot);
  return Object.freeze({x:b.max.x-b.min.x,y:b.max.y-b.min.y,z:b.max.z-b.min.z});
}

export function replayInjectionSpread({initialSpreadState,pressureFlowStates=[]}={}){
  if(initialSpreadState?.kind!=='PERSISTENT_3D_INJECTION_SPREAD_STATE') throw new TypeError('initialSpreadState is required');
  let state=initialSpreadState;
  for(const next of pressureFlowStates) state=advanceInjectionSpread(state,next);
  return state;
}
