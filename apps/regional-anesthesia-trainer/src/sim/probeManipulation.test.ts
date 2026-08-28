import { describe, expect, it } from 'vitest';
import { RegionalTrainerEngine } from './coreAdapter';

function frameDelta(a:number[], b:number[]){
  let sum=0;
  for(let i=0;i<a.length;i++) sum+=Math.abs(a[i]-b[i]);
  return sum;
}

describe('Trainer A2 probe manipulation',()=>{
  it('changes canonical probe pose and ultrasound after longitudinal slide',()=>{
    const engine=new RegionalTrainerEngine();
    const before=engine.snapshot();
    const after=engine.dispatch({type:'PROBE_SLIDE',deltaMm:20});
    expect(after.probe.slideMm).toBe(20);
    expect(after.probe.positionMm.z).toBe(20);
    expect(frameDelta(before.ultrasound.pixels,after.ultrasound.pixels)).toBeGreaterThan(1);
  });

  it('changes scan-plane orientation and ultrasound after rotation/tilt/rock',()=>{
    const engine=new RegionalTrainerEngine();
    const before=engine.snapshot();
    engine.dispatch({type:'PROBE_ROTATE',deltaDeg:12});
    engine.dispatch({type:'PROBE_TILT',deltaDeg:8});
    const after=engine.dispatch({type:'PROBE_ROCK',deltaDeg:-6});
    expect(after.probe.rotationDeg).toBe(12);
    expect(after.probe.tiltDeg).toBe(8);
    expect(after.probe.rockDeg).toBe(-6);
    expect(frameDelta(before.ultrasound.pixels,after.ultrasound.pixels)).toBeGreaterThan(1);
  },15000);

  it('replays a mixed probe/needle/injection sequence deterministically',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'PROBE_SLIDE',deltaMm:15});
    engine.dispatch({type:'PROBE_ROTATE',deltaDeg:9});
    engine.dispatch({type:'PROBE_TILT',deltaDeg:-4});
    engine.dispatch({type:'PROBE_PRESSURE_SET',pressure:0.7});
    engine.dispatch({type:'SET_INSERTION_FRACTION',fraction:0.62});
    engine.dispatch({type:'SET_REQUESTED_FLOW',flowMlPerMin:10});
    engine.dispatch({type:'START_INJECTION'});
    engine.dispatch({type:'ADVANCE_TIME',deltaSec:4});
    const replay=engine.dispatch({type:'REPLAY'});
    expect(replay.replayMatches).toBe(true);
  },15000);

  it('clamps probe manipulation to the A2 safety envelope',()=>{
    const engine=new RegionalTrainerEngine();
    let snapshot=engine.dispatch({type:'PROBE_SLIDE',deltaMm:1000});
    expect(snapshot.probe.slideMm).toBe(90);
    snapshot=engine.dispatch({type:'PROBE_ROTATE',deltaDeg:1000});
    expect(snapshot.probe.rotationDeg).toBe(45);
    snapshot=engine.dispatch({type:'PROBE_TILT',deltaDeg:-1000});
    expect(snapshot.probe.tiltDeg).toBe(-25);
    snapshot=engine.dispatch({type:'PROBE_ROCK',deltaDeg:1000});
    expect(snapshot.probe.rockDeg).toBe(25);
  });
});
