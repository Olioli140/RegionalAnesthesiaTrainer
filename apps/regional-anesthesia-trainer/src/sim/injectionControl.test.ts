import { describe, expect, it } from 'vitest';
import { RegionalTrainerEngine } from './coreAdapter';

describe('Trainer A4 injection control',()=>{
  it('exposes canonical D2 pressure and resistance mechanics',()=>{
    const engine=new RegionalTrainerEngine();
    const s=engine.snapshot();
    expect(s.injection.pressureLimitKPa).toBe(20);
    expect(s.injection.maxFlowMlPerMin).toBeGreaterThan(0);
    expect(s.injection.totalResistanceKPaPerMlMin).toBeGreaterThan(0);
    expect(s.injection.dominantEnvironment.length).toBeGreaterThan(0);
  });

  it('starts, advances and stops injection while preserving syringe balance',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'SET_REQUESTED_FLOW',flowMlPerMin:12});
    engine.dispatch({type:'START_INJECTION'});
    const before=engine.snapshot();
    const during=engine.dispatch({type:'ADVANCE_TIME',deltaSec:5});
    expect(before.injection.active).toBe(true);
    expect(during.injection.deliveredVolumeMl).toBeGreaterThan(before.injection.deliveredVolumeMl);
    expect(during.injection.remainingVolumeMl).toBeLessThan(before.injection.remainingVolumeMl);
    expect(during.injection.deliveredVolumeMl+during.injection.remainingVolumeMl).toBeCloseTo(20,8);
    const stopped=engine.dispatch({type:'STOP_INJECTION'});
    expect(stopped.injection.active).toBe(false);
  });

  it('uses actual pressure-limited flow for D3 spread and D4 overlay state',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'SET_REQUESTED_FLOW',flowMlPerMin:30});
    engine.dispatch({type:'START_INJECTION'});
    const s=engine.dispatch({type:'ADVANCE_TIME',deltaSec:10});
    expect(s.injection.actualFlowMlPerMin).toBeLessThanOrEqual(s.injection.requestedFlowMlPerMin);
    expect(s.injection.spreadVolumeMl).toBeGreaterThan(0);
    expect(s.injection.depotCount).toBeGreaterThan(0);
    expect(s.ultrasound.pixels.length).toBe(s.ultrasound.widthPx*s.ultrasound.heightPx);
  });

  it('replays a complete injection sequence deterministically',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'ASPIRATE'});
    engine.dispatch({type:'SET_REQUESTED_FLOW',flowMlPerMin:9});
    engine.dispatch({type:'START_INJECTION'});
    engine.dispatch({type:'ADVANCE_TIME',deltaSec:3});
    engine.dispatch({type:'STOP_INJECTION'});
    const replay=engine.dispatch({type:'REPLAY'});
    expect(replay.replayMatches).toBe(true);
  },15000);
});
