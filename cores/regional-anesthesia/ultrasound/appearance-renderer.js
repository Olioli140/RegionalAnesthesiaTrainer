const clamp01=(value)=>Math.max(0,Math.min(1,value));

export const ULTRASOUND_APPEARANCE_PROFILE=Object.freeze({
  A6_ADDUCTOR_CANAL_V1:'A6_ADDUCTOR_CANAL_V1'
});

const PROFILES=Object.freeze({
  [ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1]:Object.freeze({
    blackLevel:0.025,
    gain:1.08,
    gamma:0.86,
    deepGain:0.12,
    contrast:1.12,
    axialSmoothing:0.08
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

export function createDeterministicUltrasoundAppearanceField({
  sourceField,
  profileId=ULTRASOUND_APPEARANCE_PROFILE.A6_ADDUCTOR_CANAL_V1
}={}){
  validateField(sourceField);
  const profile=PROFILES[profileId];
  if(!profile) throw new RangeError(`unknown ultrasound appearance profile ${profileId}`);
  const {widthPx,heightPx}=sourceField;
  const toneMapped=sourceField.pixels.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    return toneMap(value,(y+.5)/heightPx,profile);
  });
  const pixels=toneMapped.map((value,index)=>{
    const y=Math.floor(index/widthPx);
    if(y===0||y===heightPx-1) return value;
    const axialMean=(toneMapped[index-widthPx]+toneMapped[index+widthPx])*.5;
    return clamp01(value*(1-profile.axialSmoothing)+axialMean*profile.axialSmoothing);
  });
  return Object.freeze({
    kind:'DETERMINISTIC_ULTRASOUND_APPEARANCE_FIELD',
    version:'A6.1',
    profileId,
    sourceKind:sourceField.kind,
    widthPx:sourceField.widthPx,
    heightPx:sourceField.heightPx,
    widthMm:sourceField.widthMm,
    depthMm:sourceField.depthMm,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    pixels:Object.freeze(pixels)
  });
}
