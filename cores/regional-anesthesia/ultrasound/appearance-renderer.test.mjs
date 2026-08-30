import assert from 'node:assert/strict';
import {createDeterministicUltrasoundAppearanceField,ULTRASOUND_APPEARANCE_PROFILE} from './appearance-renderer.js';

const source=Object.freeze({
  kind:'DETERMINISTIC_ULTRASOUND_FLUID_OVERLAY_FIELD',
  widthPx:3,heightPx:3,widthMm:30,depthMm:45,
  pixels:Object.freeze([0,.1,.2,.3,.4,.5,.6,.7,1]),
  baseTissueClasses:Object.freeze(['skin','fat','fascia','muscle','artery','vein','nerve','other',null]),
  baseStructureIds:Object.freeze(['skin','fat','fascia','muscle','artery','vein','nerve','other','background'])
});

const plane=(z=0,probePressure=0)=>Object.freeze({
  originMm:Object.freeze({x:0,y:0,z}),
  lateralAxis:Object.freeze({x:1,y:0,z:0}),
  depthAxis:Object.freeze({x:0,y:1,z:0}),
  probePressure
});
const a=createDeterministicUltrasoundAppearanceField({sourceField:source,scanPlane:plane()});
const b=createDeterministicUltrasoundAppearanceField({sourceField:source,scanPlane:plane()});
assert.equal(a.kind,'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD');
assert.equal(a.version,'A6.8');
assert.equal(a.profileId,ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V6);
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
assert.equal(a.operatorControlStatus,'WORKER_CONTROLLED');
assert.equal(a.microstructureStatus,'MUSCLE_FASCIA_NERVE_DETERMINISTIC');
assert.equal(a.vesselWallStatus,'ANECHOIC_LUMEN_ECHOGENIC_WALL');
assert.equal(a.pressureResponseStatus,'VEIN_IMAGE_SPACE_COMPRESSION');
assert.equal(a.gainDb,0);
assert.equal(a.probePressure,0);
assert.deepEqual(a.tissueClasses,source.baseTissueClasses);
assert.deepEqual(a.structureIds,source.baseStructureIds);

const equalSignal=Object.freeze({kind:'TEST',widthPx:7,heightPx:2,widthMm:7,depthMm:2,pixels:Object.freeze(new Array(14).fill(.45)),baseTissueClasses:Object.freeze(['fat','muscle','fascia','artery','vein','nerve','other','fat','muscle','fascia','artery','vein','nerve','other']),baseStructureIds:Object.freeze(new Array(14).fill('signature-test'))});
const signatures=createDeterministicUltrasoundAppearanceField({sourceField:equalSignal,scanPlane:plane()});
assert(signatures.pixels[2]>signatures.pixels[0]);
assert(signatures.pixels[5]>signatures.pixels[1]);
assert(signatures.pixels[3]<signatures.pixels[1]);
assert(signatures.pixels[4]<signatures.pixels[3]);

const legacy=createDeterministicUltrasoundAppearanceField({sourceField:source,profileId:ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1});
assert.equal(legacy.version,'A6.1');
assert.equal(legacy.tissueSignatureStatus,'DISABLED');
const v5=createDeterministicUltrasoundAppearanceField({sourceField:source,scanPlane:plane(),profileId:ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V5});
assert.equal(v5.version,'A6.5');
assert.equal(v5.profileId,ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V5);
assert.equal(v5.microstructureStatus,'DISABLED');
assert.equal(v5.pressureResponseStatus,'DISABLED');
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

const orientedPlane=(depthAxis)=>Object.freeze({originMm:Object.freeze({x:0,y:0,z:0}),lateralAxis:Object.freeze({x:1,y:0,z:0}),depthAxis:Object.freeze(depthAxis),probePressure:0});
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
const raisedGain=createDeterministicUltrasoundAppearanceField({sourceField:continuitySource,scanPlane:plane(),operatorSettings:{gainDb:6}});
const loweredGain=createDeterministicUltrasoundAppearanceField({sourceField:continuitySource,scanPlane:plane(),operatorSettings:{gainDb:-6}});
assert(raisedGain.pixels.reduce((sum,value)=>sum+value,0)>loweredGain.pixels.reduce((sum,value)=>sum+value,0));
assert.equal(raisedGain.gainDb,6);

const v5Muscle=createDeterministicUltrasoundAppearanceField({sourceField:continuitySource,scanPlane:plane(),profileId:ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V5});
const v6Muscle=createDeterministicUltrasoundAppearanceField({sourceField:continuitySource,scanPlane:plane(),profileId:ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V6});
assert(meanAbsoluteDifference(v5Muscle,v6Muscle)>0.005);

function tissuePatch(tissue,structureId,size=9,margin=2){
  const pixels=[],tissues=[],structures=[];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const inside=x>=margin&&x<size-margin&&y>=margin&&y<size-margin;
    pixels.push(inside?.12:.42);
    tissues.push(inside?tissue:'muscle');
    structures.push(inside?structureId:'surrounding-muscle');
  }
  return Object.freeze({kind:`${tissue.toUpperCase()}_PATCH`,widthPx:size,heightPx:size,widthMm:size,depthMm:size,pixels:Object.freeze(pixels),baseTissueClasses:Object.freeze(tissues),baseStructureIds:Object.freeze(structures)});
}
const boundaryIndices=(size=9,margin=2)=>{
  const out=[];
  for(let y=margin;y<size-margin;y++) for(let x=margin;x<size-margin;x++){
    if(x===margin||x===size-margin-1||y===margin||y===size-margin-1) out.push(y*size+x);
  }
  return out;
};
const centerIndices=(size=9,margin=2)=>{
  const out=[];
  for(let y=margin+1;y<size-margin-1;y++) for(let x=margin+1;x<size-margin-1;x++) out.push(y*size+x);
  return out;
};
const meanAt=(field,indices)=>indices.reduce((sum,index)=>sum+field.pixels[index],0)/indices.length;

const arteryPatch=tissuePatch('artery','ac.femoral-artery');
const arteryDetailed=createDeterministicUltrasoundAppearanceField({sourceField:arteryPatch,scanPlane:plane()});
assert(meanAt(arteryDetailed,boundaryIndices())>meanAt(arteryDetailed,centerIndices()));

const nervePatch=tissuePatch('nerve','ac.saphenous-nerve');
const nerveDetailed=createDeterministicUltrasoundAppearanceField({sourceField:nervePatch,scanPlane:plane()});
assert(meanAt(nerveDetailed,boundaryIndices())>meanAt(nerveDetailed,centerIndices()));
assert(new Set(nerveDetailed.pixels.slice(20,61).map(value=>value.toFixed(4))).size>5);

const veinPatch=tissuePatch('vein','ac.femoral-vein');
const veinNoPressure=createDeterministicUltrasoundAppearanceField({sourceField:veinPatch,scanPlane:plane(0,0)});
const veinHighPressure=createDeterministicUltrasoundAppearanceField({sourceField:veinPatch,scanPlane:plane(0,1)});
const countVein=(field)=>field.tissueClasses.filter(tissue=>tissue==='vein').length;
assert(countVein(veinHighPressure)<countVein(veinNoPressure));
assert(meanAbsoluteDifference(veinNoPressure,veinHighPressure)>0.01);
assert.equal(veinHighPressure.probePressure,1);

console.log('A6.8 ANATOMY & ULTRASOUND REALISM RENDERER PASS');
