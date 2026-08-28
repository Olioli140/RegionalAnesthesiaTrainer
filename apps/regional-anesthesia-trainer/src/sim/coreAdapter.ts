import { vec3, quat, quatFromAxisAngle, quatMultiply } from '../../../../cores/regional-anesthesia/geometry/geometry.js';
import { createProbeState } from '../../../../shared/contracts/regional-anesthesia/probe.js';
import { createNeedleGeometry } from '../../../../shared/contracts/regional-anesthesia/needle.js';
import { createAdductorCanalAnatomy, ADDUCTOR_CANAL_PRESET } from '../../../../cores/regional-anesthesia/anatomy/adductor-canal-dataset.js';
import { resolveScanPlane } from '../../../../cores/regional-anesthesia/scan-plane/scan-plane-resolver.js';
import { createCompletedUltrasoundPhysicsField } from '../../../../cores/regional-anesthesia/ultrasound/ultrasound-physics-completion.js';
import { pointAlongNeedle } from '../../../../cores/regional-anesthesia/needle/needle-geometry.js';
import { createNeedleInteractionSnapshot } from '../../../../cores/regional-anesthesia/needle/needle-interaction.js';
import { createInjectionActionState, INJECTION_ACTION } from '../../../../cores/regional-anesthesia/injection/injection-actions.js';
import { createPressureFlowState, reducePressureFlowAction } from '../../../../cores/regional-anesthesia/injection/injection-pressure-flow.js';
import { createInjectionSpreadState, advanceInjectionSpread } from '../../../../cores/regional-anesthesia/injection/injection-spread.js';
import { createFluidUltrasoundOverlay } from '../../../../cores/regional-anesthesia/injection/injection-ultrasound-spread.js';
import { TRAINER_PROTOCOL_VERSION, type TrainerAction, type TrainerSnapshot } from '../protocol';

const core = {
  createProbeState: createProbeState as (...args: any[]) => any,
  resolveScanPlane: resolveScanPlane as (...args: any[]) => any,
  createCompletedUltrasoundPhysicsField: createCompletedUltrasoundPhysicsField as (...args: any[]) => any,
  createNeedleGeometry: createNeedleGeometry as (...args: any[]) => any,
  createNeedleInteractionSnapshot: createNeedleInteractionSnapshot as (...args: any[]) => any,
  createInjectionActionState: createInjectionActionState as (...args: any[]) => any,
  createPressureFlowState: createPressureFlowState as (...args: any[]) => any,
  reducePressureFlowAction: reducePressureFlowAction as (...args: any[]) => any,
  createInjectionSpreadState: createInjectionSpreadState as (...args: any[]) => any,
  advanceInjectionSpread: advanceInjectionSpread as (...args: any[]) => any,
  createFluidUltrasoundOverlay: createFluidUltrasoundOverlay as (...args: any[]) => any,
  pointAlongNeedle: pointAlongNeedle as (...args: any[]) => any
};

const CASE_ID = 'ACB_TECHNICAL_SANDBOX_V1' as const;
const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const rad = (deg:number)=>deg*Math.PI/180;

interface EngineState {
  insertionFraction:number; timeSec:number; pressureFlowState:any; spreadState:any; replayMatches:boolean|null;
  probe:{slideMm:number;rotationDeg:number;tiltDeg:number;rockDeg:number;pressure:number};
}

export class RegionalTrainerEngine {
  private dataset:any; private scanPlane:any; private baseField:any; private needle:any; private state!:EngineState; private actionLog:TrainerAction[]=[];
  constructor(){
    this.dataset=createAdductorCanalAnatomy(ADDUCTOR_CANAL_PRESET.STANDARD);
    this.needle=core.createNeedleGeometry({id:'trainer-a2-needle',entryPointMm:vec3(-22,-5,0),tipPointMm:vec3(1,43,0),diameterMm:0.8});
    this.reset();
  }
  private rebuildImaging(){
    const p=this.state.probe;
    let orientation=quat();
    orientation=quatMultiply(orientation,quatFromAxisAngle(vec3(0,1,0),rad(p.rotationDeg)));
    orientation=quatMultiply(orientation,quatFromAxisAngle(vec3(1,0,0),rad(p.tiltDeg)));
    orientation=quatMultiply(orientation,quatFromAxisAngle(vec3(0,0,1),rad(p.rockDeg)));
    const contactPoint=vec3(0,0,p.slideMm);
    const probeState=core.createProbeState({positionMm:contactPoint,contactPoint,orientation,contact:true,pressure:p.pressure,tiltRad:rad(p.tiltDeg),rotationRad:rad(p.rotationDeg),rockRad:rad(p.rockDeg)});
    this.scanPlane=core.resolveScanPlane(probeState,{widthMm:70,depthMm:70});
    this.baseField=core.createCompletedUltrasoundPhysicsField({dataset:this.dataset,scanPlane:this.scanPlane,seed:'trainer-a2-acb-sandbox',widthPx:160,heightPx:192,elevationalSamples:3,frequencyMHz:12,focusDepthMm:42});
  }
  private needleInteraction(){ return core.createNeedleInteractionSnapshot({dataset:this.dataset,needle:this.needle,scanPlane:this.scanPlane,baseField:this.baseField,insertionFraction:this.state.insertionFraction}); }
  reset():TrainerSnapshot{
    this.state={insertionFraction:0.25,timeSec:0,pressureFlowState:null,spreadState:null,replayMatches:null,probe:{slideMm:0,rotationDeg:0,tiltDeg:0,rockDeg:0,pressure:0.35}};
    this.rebuildImaging();
    const needleInteraction=this.needleInteraction();
    const injectionState=core.createInjectionActionState({needleInteraction,initialVolumeMl:20,requestedFlowMlPerMin:6});
    this.state.pressureFlowState=core.createPressureFlowState({injectionState,pressureLimitKPa:20});
    this.state.spreadState=core.createInjectionSpreadState({pressureFlowState:this.state.pressureFlowState});
    this.actionLog=[]; return this.snapshot();
  }
  dispatch(action:TrainerAction,record=true):TrainerSnapshot{
    if(action.type==='RESET') return this.reset(); if(action.type==='REPLAY') return this.verifyReplay();
    let imagingChanged=false;
    switch(action.type){
      case 'SET_INSERTION_FRACTION': this.state.insertionFraction=clamp(action.fraction,0,1); break;
      case 'PROBE_SLIDE': this.state.probe.slideMm=clamp(this.state.probe.slideMm+action.deltaMm,-90,90); imagingChanged=true; break;
      case 'PROBE_ROTATE': this.state.probe.rotationDeg=clamp(this.state.probe.rotationDeg+action.deltaDeg,-45,45); imagingChanged=true; break;
      case 'PROBE_TILT': this.state.probe.tiltDeg=clamp(this.state.probe.tiltDeg+action.deltaDeg,-25,25); imagingChanged=true; break;
      case 'PROBE_ROCK': this.state.probe.rockDeg=clamp(this.state.probe.rockDeg+action.deltaDeg,-25,25); imagingChanged=true; break;
      case 'PROBE_PRESSURE_SET': this.state.probe.pressure=clamp(action.pressure,0,1); imagingChanged=true; break;
      default: {
        const needleInteraction=this.needleInteraction(); const mapped=this.mapInjectionAction(action);
        this.state.pressureFlowState=core.reducePressureFlowAction(this.state.pressureFlowState,mapped,{needleInteraction});
        if(action.type==='ADVANCE_TIME') this.state.timeSec+=action.deltaSec;
        this.state.spreadState=core.advanceInjectionSpread(this.state.spreadState,this.state.pressureFlowState); break;
      }
    }
    if(imagingChanged) this.rebuildImaging();
    this.state.replayMatches=null; if(record) this.actionLog.push(structuredClone(action)); return this.snapshot();
  }
  private mapInjectionAction(action:any){ switch(action.type){case 'ASPIRATE':return{type:INJECTION_ACTION.ASPIRATE};case 'START_INJECTION':return{type:INJECTION_ACTION.START_INJECTION};case 'STOP_INJECTION':return{type:INJECTION_ACTION.STOP_INJECTION};case 'SET_REQUESTED_FLOW':return{type:INJECTION_ACTION.SET_REQUESTED_FLOW,flowMlPerMin:action.flowMlPerMin};case 'ADVANCE_TIME':return{type:INJECTION_ACTION.ADVANCE_TIME,deltaSec:action.deltaSec};default:throw new Error(`Unsupported injection action ${action.type}`);} }
  private comparableSnapshot(s:TrainerSnapshot){const{replayMatches:_r,developer:_d,...stable}=s;return stable;}
  verifyReplay():TrainerSnapshot{const replay=new RegionalTrainerEngine();for(const a of this.actionLog)replay.dispatch(a,true);this.state.replayMatches=JSON.stringify(this.comparableSnapshot(replay.snapshot()))===JSON.stringify(this.comparableSnapshot(this.snapshot()));return this.snapshot();}
  snapshot():TrainerSnapshot{
    const ni=this.needleInteraction(); const injection=this.state.pressureFlowState.injectionState;
    const ultrasound=core.createFluidUltrasoundOverlay({baseField:ni.acoustics,spreadState:this.state.spreadState,scanPlane:this.scanPlane});
    const tip=core.pointAlongNeedle(this.needle,this.state.insertionFraction); const p=this.state.probe;
    return {protocolVersion:TRAINER_PROTOCOL_VERSION,caseId:CASE_ID,timeSec:this.state.timeSec,probe:{positionMm:{x:0,y:0,z:p.slideMm},contactPointMm:{x:0,y:0,z:p.slideMm},slideMm:p.slideMm,rotationDeg:p.rotationDeg,tiltDeg:p.tiltDeg,rockDeg:p.rockDeg,pressure:p.pressure,contact:true},insertionFraction:this.state.insertionFraction,aspiration:injection.lastAspiration?.result??null,injectionActive:injection.injectionActive,requestedFlowMlPerMin:injection.requestedFlowMlPerMin,actualFlowMlPerMin:this.state.pressureFlowState.lastFlowSolution.actualFlowMlPerMin,linePressureKPa:this.state.pressureFlowState.linePressureKPa,deliveredVolumeMl:injection.syringe.deliveredVolumeMl,remainingVolumeMl:injection.syringe.remainingVolumeMl,spreadVolumeMl:this.state.spreadState.totalSpreadVolumeMl,depotCount:this.state.spreadState.depots.length,actionCount:this.actionLog.length,replayMatches:this.state.replayMatches,ultrasound:{widthPx:ultrasound.widthPx,heightPx:ultrasound.heightPx,pixels:Array.from(ultrasound.pixels)},developer:{probe:{...p,scanPlane:this.scanPlane},needle:{kind:ni.kind,insertionFraction:ni.insertionFraction,activeStructureIds:ni.insertion.activeStructureIds,crossedEvents:ni.insertion.crossedEvents,tipPointMm:tip},pressureFlow:{kind:this.state.pressureFlowState.kind,pressureLimitKPa:this.state.pressureFlowState.pressureLimitKPa,lastFlowSolution:this.state.pressureFlowState.lastFlowSolution},spread:{kind:this.state.spreadState.kind,totalSpreadVolumeMl:this.state.spreadState.totalSpreadVolumeMl,depots:this.state.spreadState.depots}}};
  }
}
