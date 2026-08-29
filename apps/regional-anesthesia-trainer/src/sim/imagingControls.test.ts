import { describe, expect, it } from 'vitest';
import { RegionalTrainerEngine } from './coreAdapter';

const frameDelta=(a:number[],b:number[])=>a.reduce((sum,value,index)=>sum+Math.abs(value-b[index]),0);
const mean=(pixels:number[])=>pixels.reduce((sum,value)=>sum+value,0)/pixels.length;

describe('Trainer A6.5 worker-controlled imaging',()=>{
  it('applies gain, depth, focus and dynamic range through canonical actions',()=>{
    const engine=new RegionalTrainerEngine();
    const initial=engine.snapshot();
    const gain=engine.dispatch({type:'SET_ULTRASOUND_GAIN',gainDb:6});
    expect(gain.imaging.gainDb).toBe(6);
    expect(mean(gain.ultrasound.pixels)).toBeGreaterThan(mean(initial.ultrasound.pixels));
    const depth=engine.dispatch({type:'SET_ULTRASOUND_DEPTH',depthMm:85});
    expect(depth.imaging.depthMm).toBe(85);
    expect(frameDelta(gain.ultrasound.pixels,depth.ultrasound.pixels)).toBeGreaterThan(1);
    const focus=engine.dispatch({type:'SET_ULTRASOUND_FOCUS',focusDepthMm:55});
    expect(focus.imaging.focusDepthMm).toBe(55);
    expect(frameDelta(depth.ultrasound.pixels,focus.ultrasound.pixels)).toBeGreaterThan(0);
    const dynamicRange=engine.dispatch({type:'SET_ULTRASOUND_DYNAMIC_RANGE',dynamicRangeDb:72});
    expect(dynamicRange.imaging.dynamicRangeDb).toBe(72);
    expect(frameDelta(focus.ultrasound.pixels,dynamicRange.ultrasound.pixels)).toBeGreaterThan(.5);
  },20_000);

  it('clamps the engineering envelope and keeps focus inside depth',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'SET_ULTRASOUND_GAIN',gainDb:999});
    engine.dispatch({type:'SET_ULTRASOUND_DEPTH',depthMm:45});
    engine.dispatch({type:'SET_ULTRASOUND_FOCUS',focusDepthMm:999});
    const snapshot=engine.dispatch({type:'SET_ULTRASOUND_DYNAMIC_RANGE',dynamicRangeDb:-999});
    expect(snapshot.imaging).toEqual({presetId:'CUSTOM',gainDb:18,depthMm:45,focusDepthMm:40,dynamicRangeDb:40});
  },15_000);

  it('applies canonical imaging presets and returns to custom on manual adjustment',()=>{
    const engine=new RegionalTrainerEngine();
    const nerve=engine.dispatch({type:'APPLY_ULTRASOUND_PRESET',presetId:'NERVE_DETAIL'});
    expect(nerve.imaging).toEqual({presetId:'NERVE_DETAIL',gainDb:3,depthMm:60,focusDepthMm:40,dynamicRangeDb:58});
    const needle=engine.dispatch({type:'APPLY_ULTRASOUND_PRESET',presetId:'NEEDLE_VISIBILITY'});
    expect(needle.imaging).toEqual({presetId:'NEEDLE_VISIBILITY',gainDb:5,depthMm:70,focusDepthMm:42,dynamicRangeDb:54});
    const overview=engine.dispatch({type:'APPLY_ULTRASOUND_PRESET',presetId:'OVERVIEW'});
    expect(overview.imaging).toEqual({presetId:'OVERVIEW',gainDb:0,depthMm:90,focusDepthMm:55,dynamicRangeDb:68});
    expect(engine.dispatch({type:'SET_ULTRASOUND_GAIN',gainDb:1}).imaging.presetId).toBe('CUSTOM');
  },20_000);

  it('replays imaging adjustments deterministically',()=>{
    const engine=new RegionalTrainerEngine();
    engine.dispatch({type:'SET_ULTRASOUND_GAIN',gainDb:-4});
    engine.dispatch({type:'SET_ULTRASOUND_DEPTH',depthMm:80});
    engine.dispatch({type:'SET_ULTRASOUND_FOCUS',focusDepthMm:48});
    engine.dispatch({type:'SET_ULTRASOUND_DYNAMIC_RANGE',dynamicRangeDb:68});
    expect(engine.dispatch({type:'REPLAY'}).replayMatches).toBe(true);
  },25_000);
});
