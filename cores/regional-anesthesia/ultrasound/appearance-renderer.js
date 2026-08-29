const clamp01=(value)=>Math.max(0,Math.min(1,value));

export const ULTRASOUND_APPEARANCE_PROFILE=Object.freeze({
  A6_ADDUCTOR_CANAL_V1:'A6_ADDUCTOR_CANAL_V1',
  A6_ADDUCTOR_CANAL_V2:'A6_ADDUCTOR_CANAL_V2'
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
  })
});

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

export function createDeterministicUltrasoundAppearanceField({
  sourceField,
  profileId=ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V2
}={}){
  validateField(sourceField);
  const profile=PROFILES[profileId];
  if(!profile) throw new RangeError(`unknown ultrasound appearance profile ${profileId}`);
  const {widthPx,heightPx}=sourceField;
  const tissueClasses=sourceField.baseTissueClasses||sourceField.tissueClasses||null;
  if(tissueClasses&&tissueClasses.length!==sourceField.pixels.length) throw new RangeError('tissue class dimensions do not match');
  const toneMapped=sourceField.pixels.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    return tissueMap(toneMap(value,(y+.5)/heightPx,profile),tissueClasses?.[index],profile);
  });
  const pixels=toneMapped.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    if(y===0||y===heightPx-1) return value;
    const axialMean=(toneMapped[index-widthPx]+toneMapped[index+widthPx])*.5;
    return clamp01(value*(1-profile.axialSmoothing)+axialMean*profile.axialSmoothing);
  });
  return Object.freeze({
    kind:'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD',
    version:profile.tissueSignatures?'A6.2':'A6.1',
    profileId,
    sourceKind:sourceField.kind,
    widthPx:sourceField.widthPx,
    heightPx:sourceField.heightPx,
    widthMm:sourceField.widthMm,
    depthMm:sourceField.depthMm,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    tissueSignatureStatus:profile.tissueSignatures?'TISSUE_CLASS_MAPPED':'DISABLED',
    tissueClasses:tissueClasses?Object.freeze(Array.from(tissueClasses)):null,
    pixels:Object.freeze(pixels)
  });
}
