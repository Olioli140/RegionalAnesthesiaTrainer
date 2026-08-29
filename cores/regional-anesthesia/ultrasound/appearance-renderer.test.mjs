import assert from 'node:assert/strict';
import {createDeterministicUltrasoundAppearanceField,ULTRASOUND_APPEARANCE_PROFILE} from './appearance-renderer.js';

const source=Object.freeze({
  kind:'DETERMINISTIC_ULTRASOUND_FLUID_OVERLAY_FIELD',
  widthPx:3,heightPx:3,widthMm:30,depthMm:45,
  pixels:Object.freeze([0,.1,.2,.3,.4,.5,.6,.7,1])
});

const a=createDeterministicUltrasoundAppearanceField({sourceField:source});
const b=createDeterministicUltrasoundAppearanceField({sourceField:source});
assert.equal(a.kind,'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD');
assert.equal(a.version,'A6.1');
assert.equal(a.profileId,ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1);
assert.equal(a.sourceKind,source.kind);
assert.deepEqual(a,b);
assert.deepEqual(source.pixels,[0,.1,.2,.3,.4,.5,.6,.7,1]);
assert(a.pixels.every(value=>value>=0&&value<=1));
assert.notDeepEqual(a.pixels,source.pixels);
assert.throws(()=>createDeterministicUltrasoundAppearanceField({sourceField:source,profileId:'UNKNOWN'}),/unknown ultrasound appearance profile/);
console.log('A6.1 APPEARANCE RENDERER PASS');
