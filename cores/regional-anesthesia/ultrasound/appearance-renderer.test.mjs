import assert from 'node:assert/strict';
import {createDeterministicUltrasoundAppearanceField,ULTRASOUND_APPEARANCE_PROFILE} from './appearance-renderer.js';

const source=Object.freeze({
  kind:'DETERMINISTIC_ULTRASOUND_FLUID_OVERLAY_FIELD',
  widthPx:3,heightPx:3,widthMm:30,depthMm:45,
  pixels:Object.freeze([0,.1,.2,.3,.4,.5,.6,.7,1]),
  baseTissueClasses:Object.freeze(['skin','fat','fascia','muscle','artery','vein','nerve','other',null]),
  baseStructureIds:Object.freeze(['skin','fat','fascia','muscle','artery','vein','nerve','other','background'])
});

const plane=(z=0)=>Object.freeze({
  originMm:Object.freeze({x:0,y:0,z}),
  lateralAxis:Object.freeze({x:1,y:0,z:0}),
  depthAxis:Object.freeze({x:0,y:1,z:0})
});
const a=createDeterministicUltrasoundAppearanceField({sourceField:source,scanPlane:plane()});
const b=createDeterministicUltrasoundAppearanceField({sourceField:source,scanPlane:plane()});
assert.equal(a.kind,'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD');
assert.equal(a.version,'A6.4');
assert.equal(a.profileId,ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V4);
assert.equal(a.sourceKind,source.kind);
assert.deepEqual(a,b);
assert.deepEqual(source.pixels,[0,.1,.2,.3,.4,.5,.6,.7,1]);
assert(a.pixels.every(value=>value>=0&&value<=1));
assert.notDeepEqual(a.pixels,source.pixels);
assert.equal(a.tissueSignatureStatus,'TISSUE_CLASS_MAPPED');
assert.equal(a.poseContinuityStatus,'WORLD_COORDINATE_COHERENT');
assert.equal(a.angleResponseStatus,'NERVE_FASCIA_ANGLE_DEPENDENT');
assert.equal(a.needleAngleResponseStatus,'CANONICAL_NEEDLE_CORE');
assert.equal(a.posteriorArtifactStatus,'VESSEL_ENHANCEMENT_FASCIA_SHADOW');
assert.deepEqual(a.tissueClasses,source.baseTissueClasses);
const equalSignal=Object.freeze({kind:'TEST',widthPx:7,heightPx:2,widthMm:7,depthMm:2,pixels:Object.freeze(new Array(14).fill(.45)),baseTissueClasses:Object.freeze(['fat','muscle','fascia','artery','vein','nerve','other','fat','muscle','fascia','artery','vein','nerve','other']),baseStructureIds:Object.freeze(new Array(14).fill('signature-test'))});
const signatures=createDeterministicUltrasoundAppearanceField({sourceField:equalSignal,scanPlane:plane()});
assert(signatures.pixels[2]>signatures.pixels[0]);
assert(signatures.pixels[5]>signatures.pixels[1]);
assert(signatures.pixels[3]<signatures.pixels[1]);
assert(signatures.pixels[4]<signatures.pixels[3]);
const legacy=createDeterministicUltrasoundAppearanceField({sourceField:source,profileId:ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1});
assert.equal(legacy.version,'A6.1');
assert.equal(legacy.tissueSignatureStatus,'DISABLED');
assert.throws(()=>createDeterministicUltrasoundAppearanceField({sourceField:source,profileId:'UNKNOWN'}),/unknown ultrasound appearance profile/);

const continuitySource=Object.freeze({
  kind:'CONTINUITY_TEST',widthPx:16,heightPx:16,widthMm:32,depthMm:32,
  pixels:Object.freeze(new Array(256).fill(.45)),
  baseTissueClasses:Object.freeze(new Array(256).fill('muscle')),
  baseStructureIds:Object.freeze(new Array(256).fill('ac.vastus-medialis'))
});
const renderAt=(z)=>createDeterministicUltrasoundAppearanceField({sourceField:continuitySource,scanPlane:plane(z)});
const atOrigin=renderAt(0),atOriginAgain=renderAt(0),smallShift=renderAt(.2),largeShift=renderAt(5);
const meanAbsoluteDifference=(left,right)=>left.pixels.reduce((sum,value,index)=>sum+Math.abs(value-right.pixels[index]),0)/left.pixels.length;
const smallDifference=meanAbsoluteDifference(atOrigin,smallShift);
const largeDifference=meanAbsoluteDifference(atOrigin,largeShift);
assert.deepEqual(atOrigin,atOriginAgain);
assert(smallDifference>0);
assert(smallDifference<largeDifference);

const orientedPlane=(depthAxis)=>Object.freeze({originMm:Object.freeze({x:0,y:0,z:0}),lateralAxis:Object.freeze({x:1,y:0,z:0}),depthAxis:Object.freeze(depthAxis)});
const angleSource=(tissue)=>Object.freeze({kind:'ANGLE_TEST',widthPx:1,heightPx:1,widthMm:1,depthMm:1,pixels:Object.freeze([.45]),baseTissueClasses:Object.freeze([tissue]),baseStructureIds:Object.freeze([`angle.${tissue}`])});
const nerveTransverse=createDeterministicUltrasoundAppearanceField({sourceField:angleSource('nerve'),scanPlane:orientedPlane({x:0,y:1,z:0})});
const nerveLongitudinal=createDeterministicUltrasoundAppearanceField({sourceField:angleSource('nerve'),scanPlane:orientedPlane({x:0,y:0,z:1})});
const fasciaNormal=createDeterministicUltrasoundAppearanceField({sourceField:angleSource('fascia'),scanPlane:orientedPlane({x:0,y:1,z:0})});
const fasciaGrazing=createDeterministicUltrasoundAppearanceField({sourceField:angleSource('fascia'),scanPlane:orientedPlane({x:0,y:0,z:1})});
assert(nerveTransverse.pixels[0]>nerveLongitudinal.pixels[0]);
assert(fasciaNormal.pixels[0]>fasciaGrazing.pixels[0]);

const artifactSource=(middle)=>Object.freeze({kind:'ARTIFACT_TEST',widthPx:1,heightPx:3,widthMm:1,depthMm:3,pixels:Object.freeze([.45,.45,.45]),baseTissueClasses:Object.freeze(['muscle',middle,'muscle']),baseStructureIds:Object.freeze(['top',middle,'bottom'])});
const renderArtifact=(middle,profileId)=>createDeterministicUltrasoundAppearanceField({sourceField:artifactSource(middle),scanPlane:plane(),profileId});
const arteryV4=renderArtifact('artery',ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V4),arteryV3=renderArtifact('artery',ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V3);
const fasciaV4=renderArtifact('fascia',ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V4),fasciaV3=renderArtifact('fascia',ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V3);
assert(arteryV4.pixels[2]>arteryV3.pixels[2]);
assert(fasciaV4.pixels[2]<fasciaV3.pixels[2]);
console.log('A6.4 ACOUSTIC PHENOMENA RENDERER PASS');
