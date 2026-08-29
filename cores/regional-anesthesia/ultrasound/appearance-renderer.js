const clamp01=(value)=>Math.max(0,Math.min(1,value));

export const ULTRASOUND_APPEARANCE_PROFILE=Object.freeze({
  A6_ADDUCTOR_CANAL_V1:'A6_ADDUCTOR_CANAL_V1',
  A6_ADDUCTOR_CANAL_V2:'A6_ADDUCTOR_CANAL_V2',
  A6_ADDUCTOR_CANAL_V3:'A6_ADDUCTOR_CANAL_V3',
  A6_ADDUCTOR_CANAL_V4:'A6_ADDUCTOR_CANAL_V4',
  A6_ADDUCTOR_CANAL_V5:'A6_ADDUCTOR_CANAL_V5'
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
  }),
  [ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V4]:Object.freeze({
    ...BASE_PROFILE,tissueSignatures:TISSUE_SIGNATURES,
    worldSpeckle:Object.freeze({seed:'a6-adductor-canal-world-speckle-v1',correlationLengthMm:2.8,strength:0.10}),
    angleResponse:Object.freeze({nerveMin:0.55,nervePower:3,fasciaMin:0.55,fasciaPower:4}),
    posteriorArtifacts:Object.freeze({arteryEnhancement:0.12,veinEnhancement:0.10,enhancementDecayMm:18,fasciaShadow:0.06,shadowDecayMm:10})
  }),
  [ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V5]:Object.freeze({
    ...BASE_PROFILE,tissueSignatures:TISSUE_SIGNATURES,
    worldSpeckle:Object.freeze({seed:'a6-adductor-canal-world-speckle-v1',correlationLengthMm:2.8,strength:0.10}),
    angleResponse:Object.freeze({nerveMin:0.55,nervePower:3,fasciaMin:0.55,fasciaPower:4}),
    posteriorArtifacts:Object.freeze({arteryEnhancement:0.12,veinEnhancement:0.10,enhancementDecayMm:18,fasciaShadow:0.06,shadowDecayMm:10}),
    operatorControls:true
  })
});

function hash32(text){
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
const smooth=(value)=>value*value*(3-2*value);
const lerp=(a,b,t)=>a+(b-a)*t;
function lattice(seed,x,y,z){
  let hash=seed;
  hash=Math.imul(hash^(x|0),16777619);
  hash=Math.imul(hash^(y|0),16777619);
  hash=Math.imul(hash^(z|0),16777619);
  hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;hash=Math.imul(hash,0x846ca68b);hash^=hash>>>16;
  return (hash>>>0)/0xffffffff*2-1;
}
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

function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
function angleResponseMap(value,tissueClass,scanPlane,profile){
  if(!profile.angleResponse||!tissueClass) return value;
  if(!scanPlane?.depthAxis) throw new TypeError('scanPlane is required for angle-dependent appearance');
  const settings=profile.angleResponse;
  if(tissueClass==='nerve'){
    const longitudinalCosine=Math.min(1,Math.abs(dot(scanPlane.depthAxis,{x:0,y:0,z:1})));
    const transverse=Math.sqrt(Math.max(0,1-longitudinalCosine*longitudinalCosine));
    return clamp01(value*(settings.nerveMin+(1-settings.nerveMin)*Math.pow(transverse,settings.nervePower)));
  }
  if(tissueClass==='fascia'){
    const normalIncidence=Math.min(1,Math.abs(dot(scanPlane.depthAxis,{x:0,y:1,z:0})));
    return clamp01(value*(settings.fasciaMin+(1-settings.fasciaMin)*Math.pow(normalIncidence,settings.fasciaPower)));
  }
  return value;
}

function applyPosteriorArtifacts(pixels,tissueClasses,widthPx,heightPx,depthMm,profile){
  if(!profile.posteriorArtifacts||!tissueClasses) return pixels;
  const settings=profile.posteriorArtifacts,dy=depthMm/heightPx,output=Array.from(pixels);
  const enhancementDecay=Math.exp(-dy/settings.enhancementDecayMm),shadowDecay=Math.exp(-dy/settings.shadowDecayMm);
  for(let x=0;x<widthPx;x++){
    let enhancement=0,shadow=0;
    for(let y=0;y<heightPx;y++){
      const index=y*widthPx+x,tissue=tissueClasses[index];
      output[index]=clamp01(output[index]*(1+enhancement-shadow));
      enhancement*=enhancementDecay;shadow*=shadowDecay;
      if(tissue==='artery') enhancement=Math.max(enhancement,settings.arteryEnhancement);
      else if(tissue==='vein') enhancement=Math.max(enhancement,settings.veinEnhancement);
      else if(tissue==='fascia') shadow=Math.max(shadow,settings.fasciaShadow);
    }
  }
  return output;
}

function coherentSpeckleMap(value,index,sourceField,scanPlane,structureIds,profile,seedCache){
  if(!profile.worldSpeckle) return value;
  if(!scanPlane?.originMm||!scanPlane?.lateralAxis||!scanPlane?.depthAxis) throw new TypeError('scanPlane is required for pose-coherent appearance');
  const settings=profile.worldSpeckle;
  const point=worldPointForPixel(index,sourceField,scanPlane);
  const structureKey=structureIds?.[index]||'background';
  let seed=seedCache.get(structureKey);
  if(seed===undefined){seed=hash32(`${settings.seed}|${structureKey}`);seedCache.set(structureKey,seed);}
  const noise=worldNoise(seed,point,settings.correlationLengthMm);
  return clamp01(value*(1+noise*settings.strength));
}

export function createDeterministicUltrasoundAppearanceField({
  sourceField,
  scanPlane,
  operatorSettings={},
  profileId=ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V5
}={}){
  validateField(sourceField);
  const profile=PROFILES[profileId];
  if(!profile) throw new RangeError(`unknown ultrasound appearance profile ${profileId}`);
  const {widthPx,heightPx}=sourceField;
  const gainDb=profile.operatorControls?Math.max(-18,Math.min(18,Number(operatorSettings.gainDb)||0)):0;
  const operatorGain=Math.pow(10,gainDb/20);
  const tissueClasses=sourceField.baseTissueClasses||sourceField.tissueClasses||null;
  const structureIds=sourceField.baseStructureIds||sourceField.structureIds||null;
  const seedCache=new Map();
  if(tissueClasses&&tissueClasses.length!==sourceField.pixels.length) throw new RangeError('tissue class dimensions do not match');
  if(structureIds&&structureIds.length!==sourceField.pixels.length) throw new RangeError('structure id dimensions do not match');
  const toneMapped=sourceField.pixels.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    const tissueValue=tissueMap(toneMap(value*operatorGain,(y+.5)/heightPx,profile),tissueClasses?.[index],profile);
    const angleValue=angleResponseMap(tissueValue,tissueClasses?.[index],scanPlane,profile);
    return coherentSpeckleMap(angleValue,index,sourceField,scanPlane,structureIds,profile,seedCache);
  });
  const pixels=toneMapped.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    if(y===0||y===heightPx-1) return value;
    const axialMean=(toneMapped[index-widthPx]+toneMapped[index+widthPx])*.5;
    return clamp01(value*(1-profile.axialSmoothing)+axialMean*profile.axialSmoothing);
  });
  const artifactPixels=applyPosteriorArtifacts(pixels,tissueClasses,widthPx,heightPx,sourceField.depthMm,profile);
  return Object.freeze({
    kind:'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD',
    version:profile.operatorControls?'A6.5':profile.posteriorArtifacts?'A6.4':profile.worldSpeckle?'A6.3':profile.tissueSignatures?'A6.2':'A6.1',
    profileId,
    sourceKind:sourceField.kind,
    widthPx:sourceField.widthPx,
    heightPx:sourceField.heightPx,
    widthMm:sourceField.widthMm,
    depthMm:sourceField.depthMm,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    tissueSignatureStatus:profile.tissueSignatures?'TISSUE_CLASS_MAPPED':'DISABLED',
    poseContinuityStatus:profile.worldSpeckle?'WORLD_COORDINATE_COHERENT':'DISABLED',
    angleResponseStatus:profile.angleResponse?'NERVE_FASCIA_ANGLE_DEPENDENT':'DISABLED',
    needleAngleResponseStatus:profile.angleResponse?'CANONICAL_NEEDLE_CORE':'DISABLED',
    posteriorArtifactStatus:profile.posteriorArtifacts?'VESSEL_ENHANCEMENT_FASCIA_SHADOW':'DISABLED',
    operatorControlStatus:profile.operatorControls?'WORKER_CONTROLLED':'DISABLED',
    gainDb,
    tissueClasses:tissueClasses?Object.freeze(Array.from(tissueClasses)):null,
    pixels:Object.freeze(artifactPixels)
  });
}
