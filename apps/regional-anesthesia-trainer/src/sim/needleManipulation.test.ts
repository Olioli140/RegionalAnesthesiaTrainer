import { describe, expect, it } from 'vitest';
import { RegionalTrainerEngine } from './coreAdapter';

function frameDelta(a:number[],b:number[]){let d=0;for(let i=0;i<a.length;i++)d+=Math.abs(a[i]-b[i]);return d;}

describe('Trainer A3 spatial needle manipulation',()=>{
  it('moves the canonical entry point and recomputes needle acoustics',()=>{
    const engine=new RegionalTrainerEngine();
    const before=engine.snapshot();
    const after=engine.dispatch({type:'NEEDLE_ENTRY_MOVE',deltaXmm:8,deltaZmm:4});
    expect(after.needle.entryPointMm.x).toBeCloseTo(before.needle.entryPointMm.x+8,9);
    expect(after.needle.entryPointMm.z).toBeCloseTo(before.needle.entryPointMm.z+4,9);
    expect(frameDelta(before.ultrasound.pixels,after.ultrasound.pixels)).toBeGreaterThan(1);
  },15000);

  it('changes direction and scan-plane relation with in/out-of-plane steering',()=>{
    const engine=new RegionalTrainerEngine();
    const before=engine.snapshot();
    engine.dispatch({type:'NEEDLE_ANGLE_IN_PLANE',deltaDeg:12});
    const after=engine.dispatch({type:'NEEDLE_ANGLE_OUT_OF_PLANE',deltaDeg:15});
    expect(after.needle.inPlaneAngleDeg).toBeCloseTo(before.needle.inPlaneAngleDeg+12,9);
    expect(after.needle.outOfPlaneAngleDeg).toBe(15);
    expect(after.needle.direction).not.toEqual(before.needle.direction);
    expect(frameDelta(before.ultrasound.pixels,after.ultrasound.pixels)).toBeGreaterThan(1);
  },15000);

  it('advances the tip along the canonical geometry without moving entry point',()=>{
    const engine=new RegionalTrainerEngine();
    const before=engine.snapshot();
    const after=engine.dispatch({type:'SET_INSERTION_FRACTION',fraction:.8});
    expect(after.needle.entryPointMm).toEqual(before.needle.entryPointMm);
    expect(after.needle.advanceFraction).toBe(.8);
    expect(after.needle.tipPointMm).not.toEqual(before.needle.tipPointMm);
  },15000);

  it('replays mixed probe needle and injection actions deterministically',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'PROBE_SLIDE',deltaMm:10});
    engine.dispatch({type:'NEEDLE_ENTRY_MOVE',deltaXmm:5,deltaZmm:-3});
    engine.dispatch({type:'NEEDLE_ANGLE_IN_PLANE',deltaDeg:6});
    engine.dispatch({type:'NEEDLE_ANGLE_OUT_OF_PLANE',deltaDeg:5});
    engine.dispatch({type:'SET_INSERTION_FRACTION',fraction:.66});
    engine.dispatch({type:'SET_REQUESTED_FLOW',flowMlPerMin:8});
    engine.dispatch({type:'START_INJECTION'});
    engine.dispatch({type:'ADVANCE_TIME',deltaSec:3});
    expect(engine.dispatch({type:'REPLAY'}).replayMatches).toBe(true);
  },25000);

  it('clamps needle geometry to the A3 engineering envelope',()=>{
    const engine=new RegionalTrainerEngine();
    let s=engine.dispatch({type:'NEEDLE_ENTRY_MOVE',deltaXmm:999,deltaZmm:-999});
    expect(s.needle.entryPointMm.x).toBe(20);expect(s.needle.entryPointMm.z).toBe(-60);
    s=engine.dispatch({type:'NEEDLE_ANGLE_IN_PLANE',deltaDeg:999});expect(s.needle.inPlaneAngleDeg).toBe(80);
    s=engine.dispatch({type:'NEEDLE_ANGLE_OUT_OF_PLANE',deltaDeg:-999});expect(s.needle.outOfPlaneAngleDeg).toBe(-30);
    s=engine.dispatch({type:'NEEDLE_LENGTH_SET',lengthMm:999});expect(s.needle.lengthMm).toBe(100);
  },20000);
});
