import {STRUCTURE_TYPE,validateAnatomicalStructure} from '../../../shared/contracts/regional-anesthesia/anatomy.js';
import {quat,vec3} from '../geometry/geometry.js';

export const ADDUCTOR_CANAL_PRESET = Object.freeze({
  STANDARD:'STANDARD',
  HIGH_BMI:'HIGH_BMI',
  LOW_MUSCLE_MASS:'LOW_MUSCLE_MASS'
});

export const ADDUCTOR_CANAL_IDS = Object.freeze({
  SKIN:'ac.skin',
  SUBCUTANEOUS_FAT:'ac.subcutaneous-fat',
  FASCIA_LATA:'ac.fascia-lata',
  SARTORIUS:'ac.sartorius',
  VASTUS_MEDIALIS:'ac.vastus-medialis',
  ADDUCTOR_LONGUS:'ac.adductor-longus',
  ADDUCTOR_MAGNUS:'ac.adductor-magnus',
  FEMORAL_ARTERY:'ac.femoral-artery',
  FEMORAL_VEIN:'ac.femoral-vein',
  SAPHENOUS_NERVE:'ac.saphenous-nerve',
  TARGET_REGION:'ac.target-region'
});

const q=()=>quat();
const structure=(id,displayName,type,geometryId,positionMm,properties={})=>validateAnatomicalStructure({
  id,displayName,type,geometryId,transform:{positionMm,orientation:q()},properties:Object.freeze({...properties})
});

const GEOMETRY = Object.freeze({
  'geom.ac.skin':{kind:'layer',thicknessMm:2,widthMm:110,lengthMm:180},
  'geom.ac.fat.standard':{kind:'layer',thicknessMm:12,widthMm:110,lengthMm:180},
  'geom.ac.fat.high-bmi':{kind:'layer',thicknessMm:32,widthMm:120,lengthMm:190},
  'geom.ac.fat.low-muscle':{kind:'layer',thicknessMm:9,widthMm:105,lengthMm:170},
  'geom.ac.fascia-lata':{kind:'layer',thicknessMm:1,widthMm:100,lengthMm:170},
  'geom.ac.sartorius.standard':{kind:'ellipsoid',radiiMm:vec3(22,7,55)},
  'geom.ac.sartorius.high-bmi':{kind:'ellipsoid',radiiMm:vec3(24,8,58)},
  'geom.ac.sartorius.low-muscle':{kind:'ellipsoid',radiiMm:vec3(17,5,48)},
  'geom.ac.vastus-medialis.standard':{kind:'ellipsoid',radiiMm:vec3(30,18,70)},
  'geom.ac.vastus-medialis.high-bmi':{kind:'ellipsoid',radiiMm:vec3(32,19,72)},
  'geom.ac.vastus-medialis.low-muscle':{kind:'ellipsoid',radiiMm:vec3(23,12,60)},
  'geom.ac.adductor-longus':{kind:'ellipsoid',radiiMm:vec3(26,14,62)},
  'geom.ac.adductor-magnus.standard':{kind:'ellipsoid',radiiMm:vec3(31,18,72)},
  'geom.ac.adductor-magnus.low-muscle':{kind:'ellipsoid',radiiMm:vec3(25,13,64)},
  'geom.ac.artery':{kind:'cylinder',radiusMm:3.8,lengthMm:150,axis:'z'},
  'geom.ac.vein':{kind:'cylinder',radiusMm:4.6,lengthMm:150,axis:'z'},
  'geom.ac.saphenous-nerve':{kind:'cylinder',radiusMm:1.6,lengthMm:135,axis:'z'},
  'geom.ac.target':{kind:'ellipsoid',radiiMm:vec3(8,5,18)}
});

const PRESETS = Object.freeze({
  STANDARD:Object.freeze({fatGeometryId:'geom.ac.fat.standard',depthOffsetMm:0,sartoriusGeometryId:'geom.ac.sartorius.standard',vastusGeometryId:'geom.ac.vastus-medialis.standard',magnusGeometryId:'geom.ac.adductor-magnus.standard'}),
  HIGH_BMI:Object.freeze({fatGeometryId:'geom.ac.fat.high-bmi',depthOffsetMm:20,sartoriusGeometryId:'geom.ac.sartorius.high-bmi',vastusGeometryId:'geom.ac.vastus-medialis.high-bmi',magnusGeometryId:'geom.ac.adductor-magnus.standard'}),
  LOW_MUSCLE_MASS:Object.freeze({fatGeometryId:'geom.ac.fat.low-muscle',depthOffsetMm:-3,sartoriusGeometryId:'geom.ac.sartorius.low-muscle',vastusGeometryId:'geom.ac.vastus-medialis.low-muscle',magnusGeometryId:'geom.ac.adductor-magnus.low-muscle'})
});

function anatomyForPreset(preset){
  const p=PRESETS[preset];
  if(!p) throw new TypeError(`Unsupported adductor canal preset: ${preset}`);
  const d=p.depthOffsetMm;
  const structures=[
    structure(ADDUCTOR_CANAL_IDS.SKIN,'Skin',STRUCTURE_TYPE.SKIN,'geom.ac.skin',vec3(0,0,0),{compressible:false}),
    structure(ADDUCTOR_CANAL_IDS.SUBCUTANEOUS_FAT,'Subcutaneous tissue',STRUCTURE_TYPE.FAT,p.fatGeometryId,vec3(0,7+d/2,0),{compressible:true}),
    structure(ADDUCTOR_CANAL_IDS.FASCIA_LATA,'Fascia lata',STRUCTURE_TYPE.FASCIA,'geom.ac.fascia-lata',vec3(0,16+d,0),{compressible:false}),
    structure(ADDUCTOR_CANAL_IDS.SARTORIUS,'Sartorius',STRUCTURE_TYPE.MUSCLE,p.sartoriusGeometryId,vec3(0,27+d,0),{fiberAxis:vec3(0,0,1)}),
    structure(ADDUCTOR_CANAL_IDS.VASTUS_MEDIALIS,'Vastus medialis',STRUCTURE_TYPE.MUSCLE,p.vastusGeometryId,vec3(-28,42+d,0),{fiberAxis:vec3(0,0,1)}),
    structure(ADDUCTOR_CANAL_IDS.ADDUCTOR_LONGUS,'Adductor longus',STRUCTURE_TYPE.MUSCLE,'geom.ac.adductor-longus',vec3(24,45+d,-10),{fiberAxis:vec3(0,0,1)}),
    structure(ADDUCTOR_CANAL_IDS.ADDUCTOR_MAGNUS,'Adductor magnus',STRUCTURE_TYPE.MUSCLE,p.magnusGeometryId,vec3(18,58+d,12),{fiberAxis:vec3(0,0,1)}),
    structure(ADDUCTOR_CANAL_IDS.FEMORAL_ARTERY,'Femoral artery',STRUCTURE_TYPE.ARTERY,'geom.ac.artery',vec3(1,43+d,0),{compressible:false,pulsatile:true}),
    structure(ADDUCTOR_CANAL_IDS.FEMORAL_VEIN,'Femoral vein',STRUCTURE_TYPE.VEIN,'geom.ac.vein',vec3(8,47+d,0),{compressible:true,pulsatile:false}),
    structure(ADDUCTOR_CANAL_IDS.SAPHENOUS_NERVE,'Saphenous nerve',STRUCTURE_TYPE.NERVE,'geom.ac.saphenous-nerve',vec3(-6,40+d,0),{anisotropic:true,target:true}),
    structure(ADDUCTOR_CANAL_IDS.TARGET_REGION,'Adductor canal target region',STRUCTURE_TYPE.OTHER,'geom.ac.target',vec3(-3,42+d,0),{trainingTarget:true})
  ];
  return Object.freeze({
    id:`adductor-canal.${preset.toLowerCase()}.v1`,
    regionId:'ADDUCTOR_CANAL',
    preset,
    coordinateSystem:Object.freeze({units:'mm',surfaceAxis:'+y',longitudinalAxis:'+z',medialAxis:'+x'}),
    geometryRegistry:GEOMETRY,
    targetRegionId:ADDUCTOR_CANAL_IDS.TARGET_REGION,
    requiredStructureIds:Object.freeze(Object.values(ADDUCTOR_CANAL_IDS)),
    structures:Object.freeze(structures)
  });
}

export function createAdductorCanalAnatomy(preset=ADDUCTOR_CANAL_PRESET.STANDARD){
  return anatomyForPreset(preset);
}

export function getAdductorCanalGeometry(dataset,geometryId){
  const geometry=dataset?.geometryRegistry?.[geometryId];
  if(!geometry) throw new TypeError(`Unknown geometryId: ${geometryId}`);
  return geometry;
}

export function validateAdductorCanalDataset(dataset){
  if(dataset?.regionId!=='ADDUCTOR_CANAL') throw new TypeError('Dataset region must be ADDUCTOR_CANAL');
  if(!Object.values(ADDUCTOR_CANAL_PRESET).includes(dataset.preset)) throw new TypeError('Unsupported dataset preset');
  const ids=new Set();
  for(const s of dataset.structures||[]){
    validateAnatomicalStructure(s);
    if(ids.has(s.id)) throw new TypeError(`Duplicate anatomical structure id: ${s.id}`);
    ids.add(s.id);
    getAdductorCanalGeometry(dataset,s.geometryId);
  }
  for(const requiredId of Object.values(ADDUCTOR_CANAL_IDS)) if(!ids.has(requiredId)) throw new TypeError(`Missing required anatomical structure: ${requiredId}`);
  if(dataset.targetRegionId!==ADDUCTOR_CANAL_IDS.TARGET_REGION) throw new TypeError('Unexpected target region');
  return true;
}
