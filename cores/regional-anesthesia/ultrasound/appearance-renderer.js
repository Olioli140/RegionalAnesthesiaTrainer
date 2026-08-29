const clamp01=(value)=>Math.max(0,Math.min(1,value));

export const ULTRASOUND_APPEARANCE_PROFILE=Object.freeze({
  A6_ADDUCTOR_CANAL_V1:'A6_ADDUCTOR_CANAL_V1',
  A6_ADDUCTOR_CANAL_V2:'A6_ADDUCTOR_CANAL_V2',
  A6_ADDUCTOR_CANAL_V3:'A6_ADDUCTOR_CANAL_V3'
});

const BASE_PROFILE=Object.freeze({
  blackLevel:0.025,
  gain:1.08,
  gamma:0.86,
  deepGain:0.12,
  contrast:1.12,
  axialSmoothing:0.08
});

const TISSUE_SIGNATURES=Object.freeze({
  skin:Object.freeze({gain:1.08,gamma:0.94}),
  fat:Object.freeze({gain:1.00,gamma:1.03}),
  fascia:Object.freeze({gain:1.24,gamma:0.86}),
  muscle:Object.freeze({gain:0.91,gamma:1.08}),
  artery:Object.freeze({gain:0.48,gamma:1.18}),
  vein:Object.freeze({gain:0.40,gamma:1.22}),
  nerve:Object.freeze({gain:1.18,gamma:0.90}),
  other:Object.freeze({gain:1,gamma:1})
});

const PROFILES=Object.freeze({
  [ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1]:Object.freeze({
    ...BASE_PROFILE,tissueSignatures:null
  }),
  [ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V2]:Object.freeze({
    ...BASE_PROFILE,tissueSignatures:TISSUE_SIGNATURES
  }),
  [ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V3]:Object.freeze({
    ...BASE_PROFILE,tissueSignatures:TISSUE_SIGNATURES,
    worldSpeckle:Object.freeze({seed:'a6-adductor-canal-world-speckle-v1',correlationLengthMm:2.8,strength:0.10})
  })
});

function hash32(text){
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
const smooth=(value)=>value*value*(3-2*value);
const lerp=(a,b,t)=>a+(b-a)*t;
function lattice(seed,x,y,z){return hash32(`${seed}|${x}|${y}|${z}`)/0xffffffff*2-1;}
function worldNoise(seed,point,correlationLengthMm){
  const gx=point.x/correlationLengthMm,gy=point.y/correlationLengthMm,gz=point.z/correlationLengthMm;
  const x0=Math.floor(gx),y0=Math.floor(gy),z0=Math.floor(gz);
  const tx=smooth(gx-x0),ty=smooth(gy-y0),tz=smooth(gz-z0);
  const layer=(z)=>lerp(
    lerp(lattice(seed,x0,y0,z),lattice(seed,x0+1,y0,z),tx),
    lerp(lattice(seed,x0,y0+1,z),lattice(seed,x0+1,y0+1,z),tx),ty
  );
  return lerp(layer(z0),layer(z0+1),tz);
}
function worldPointForPixel(index,sourceField,scanPlane){
  const x=index%sourceField.widthPx,y=Math.floor(index/sourceField.widthPx);
  const lateral=-sourceField.widthMm/2+(x+.5)*sourceField.widthMm/sourceField.widthPx;
  const depth=(y+.5)*sourceField.depthMm/sourceField.heightPx;
  return {
    x:scanPlane.originMm.x+scanPlane.lateralAxis.x*lateral+scanPlane.depthAxis.x*depth,
    y:scanPlane.originMm.y+scanPlane.lateralAxis.y*lateral+scanPlane.depthAxis.y*depth,
    z:scanPlane.originMm.z+scanPlane.lateralAxis.z*lateral+scanPlane.depthAxis.z*depth
  };
}

function validateField(field){
  if(!field||!Number.isInteger(field.widthPx)||!Number.isInteger(field.heightPx)||!Array.isArray(field.pixels)){
    throw new TypeError('canonical ultrasound field is required');
  }
  if(field.pixels.length!==field.widthPx*field.heightPx) throw new RangeError('field pixel dimensions do not match');
}

function toneMap(value,depthFraction,profile){
  const lifted=Math.max(0,value-profile.blackLevel);
  const gained=lifted*profile.gain*(1+profile.deepGain*depthFraction);
  const curved=Math.pow(clamp01(gained),profile.gamma);
  return clamp01((curved-.5)*profile.contrast+.5);
}

function tissueMap(value,tissueClass,profile){
  if(!profile.tissueSignatures||!tissueClass) return value;
  const signature=profile.tissueSignatures[tissueClass]||profile.tissueSignatures.other;
  return clamp01(Math.pow(clamp01(value*signature.gain),signature.gamma));
}

function coherentSpeckleMap(value,index,sourceField,scanPlane,structureIds,profile){
  if(!profile.worldSpeckle) return value;
  if(!scanPlane?.originMm||!scanPlane?.lateralAxis||!scanPlane?.depthAxis) throw new TypeError('scanPlane is required for pose-coherent appearance');
  const settings=profile.worldSpeckle;
  const point=worldPointForPixel(index,sourceField,scanPlane);
  const structureKey=structureIds?.[index]||'background';
  const noise=worldNoise(`${settings.seed}|${structureKey}`,point,settings.correlationLengthMm);
  return clamp01(value*(1+noise*settings.strength));
}

export function createDeterministicUltrasoundAppearanceField({
  sourceField,
  scanPlane,
  profileId=ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V3
}={}){
  validateField(sourceField);
  const profile=PROFILES[profileId];
  if(!profile) throw new RangeError(`unknown ultrasound appearance profile ${profileId}`);
  const {widthPx,heightPx}=sourceField;
  const tissueClasses=sourceField.baseTissueClasses||sourceField.tissueClasses||null;
  const structureIds=sourceField.baseStructureIds||sourceField.structureIds||null;
  if(tissueClasses&&tissueClasses.length!==sourceField.pixels.length) throw new RangeError('tissue class dimensions do not match');
  if(structureIds&&structureIds.length!==sourceField.pixels.length) throw new RangeError('structure id dimensions do not match');
  const toneMapped=sourceField.pixels.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    const tissueValue=tissueMap(toneMap(value,(y+.5)/heightPx,profile),tissueClasses?.[index],profile);
    return coherentSpeckleMap(tissueValue,index,sourceField,scanPlane,structureIds,profile);
  });
  const pixels=toneMapped.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    if(y===0||y===heightPx-1) return value;
    const axialMean=(toneMapped[index-widthPx]+toneMapped[index+widthPx])*.5;
    return clamp01(value*(1-profile.axialSmoothing)+axialMean*profile.axialSmoothing);
  });
  return Object.freeze({
    kind:'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD',
    version:profile.worldSpeckle?'A6.3':profile.tissueSignatures?'A6.2':'A6.1',
    profileId,
    sourceKind:sourceField.kind,
    widthPx:sourceField.widthPx,
    heightPx:sourceField.heightPx,
    widthMm:sourceField.widthMm,
    depthMm:sourceField.depthMm,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    tissueSignatureStatus:profile.tissueSignatures?'TISSUE_CLASS_MAPPED':'DISABLED',
    poseContinuityStatus:profile.worldSpeckle?'WORLD_COORDINATE_COHERENT':'DISABLED',
    tissueClasses:tissueClasses?Object.freeze(Array.from(tissueClasses)):null,
    pixels:Object.freeze(pixels)
  });
}
