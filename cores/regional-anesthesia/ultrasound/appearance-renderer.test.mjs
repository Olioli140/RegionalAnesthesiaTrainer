import assert from 'node:assert/strict';
import {createDeterministicUltrasoundAppearanceField,ULTRASOUND_APPEARANCE_PROFILE} from './appearance-renderer.js';

const source=Object.freeze({
  kind:'DETERMINISTIC_ULTRASOUND_FLUID_OVERLAY_FIELD',
  widthPx:3,heightPx:3,widthMm:30,depthMm:45,
  pixels:Object.freeze([0,.1,.2,.3,.4,.5,.6,.7,1]),
  baseTissueClasses:Object.freeze(['skin','fat','fascia','muscle','artery','vein','nerve','other',null])
});

const a=createDeterministicUltrasoundAppearanceField({sourceField:source});
const b=createDeterministicUltrasoundAppearanceField({sourceField:source});
assert.equal(a.kind,'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD');
assert.equal(a.version,'A6.2');
assert.equal(a.profileId,ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V2);
assert.equal(a.sourceKind,source.kind);
assert.deepEqual(a,b);
assert.deepEqual(source.pixels,[0,.1,.2,.3,.4,.5,.6,.7,1]);
assert(a.pixels.every(value=>value>=0&&value<=1));
assert.notDeepEqual(a.pixels,source.pixels);
assert.equal(a.tissueSignatureStatus,'TISSUE_CLASS_MAPPED');
assert.deepEqual(a.tissueClasses,source.baseTissueClasses);
const equalSignal=Object.freeze({kind:'TEST',widthPx:7,heightPx:2,widthMm:7,depthMm:2,pixels:Object.freeze(new Array(14).fill(.45)),baseTissueClasses:Object.freeze(['fat','muscle','fascia','artery','vein','nerve','other','fat','muscle','fascia','artery','vein','nerve','other'])});
const signatures=createDeterministicUltrasoundAppearanceField({sourceField:equalSignal});
assert(signatures.pixels[2]>signatures.pixels[0]);
assert(signatures.pixels[5]>signatures.pixels[1]);
assert(signatures.pixels[3]<signatures.pixels[1]);
assert(signatures.pixels[4]<signatures.pixels[3]);
const legacy=createDeterministicUltrasoundAppearanceField({sourceField:source,profileId:ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1});
assert.equal(legacy.version,'A6.1');
assert.equal(legacy.tissueSignatureStatus,'DISABLED');
assert.throws(()=>createDeterministicUltrasoundAppearanceField({sourceField:source,profileId:'UNKNOWN'}),/unknown ultrasound appearance profile/);
console.log('A6.2 TISSUE SIGNATURE RENDERER PASS');
