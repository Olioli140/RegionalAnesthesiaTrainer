import {STRUCTURE_TYPE} from '../../../shared/contracts/regional-anesthesia/anatomy.js';
import {TISSUE_ACOUSTIC_PROFILES} from './acoustic-model.js';
import {logCompressSignal} from './bmode-field.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function frequencyScale(frequencyMHz,{referenceFrequencyMHz=10}={}){
  if(!(frequencyMHz>0)) throw new RangeError('frequencyMHz must be > 0');
  if(!(referenceFrequencyMHz>0)) throw new RangeError('referenceFrequencyMHz must be > 0');
  return frequencyMHz/referenceFrequencyMHz;
}

export function resolutionModel({frequencyMHz=10,depthMm=40,focusDepthMm=35,referenceFrequencyMHz=10}={}){
  const f=frequencyScale(frequencyMHz,{referenceFrequencyMHz});
  const focusPenalty=1+0.012*Math.abs(depthMm-focusDepthMm);
  return Object.freeze({
    axialSigmaMm:0.42/f*focusPenalty,
    lateralSigmaMm:0.95/f*focusPenalty,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

export function frequencyDepthAttenuationFactor(depthMm,frequencyMHz,{referenceFrequencyMHz=10,extraDbPerCmAtReference=0.18}={}){
  if(!(depthMm>=0)) throw new RangeError('depthMm must be >= 0');
  const f=frequencyScale(frequencyMHz,{referenceFrequencyMHz});
  const lossDb=extraDbPerCmAtReference*f*(depthMm/10);
  return Math.pow(10,-lossDb/20);
}

export function propagationStepFactor(tissueClass,{referenceAttenuationDbPerCm=0.60,stepMm=1,shadowStrength=0.42,enhancementStrength=0.30}={}){
  const profile=Object.values(TISSUE_ACOUSTIC_PROFILES).find(p=>p.tissueClass===tissueClass);
  if(!profile) return 1;
  const delta=profile.attenuationDbPerCm-referenceAttenuationDbPerCm;
  const signedStrength=delta>=0?shadowStrength:enhancementStrength;
  return Math.exp(-signedStrength*delta*(stepMm/10));
}

function gaussianWeight(deltaMm,sigmaMm){
  if(!(sigmaMm>0)) return deltaMm===0?1:0;
  return Math.exp(-0.5*(deltaMm*deltaMm)/(sigmaMm*sigmaMm));
}

function sampleBlurred(field,x,y,dx,dy,{frequencyMHz,focusDepthMm,referenceFrequencyMHz}){
  const depthMm=(y+0.5)*dy;
  const r=resolutionModel({frequencyMHz,depthMm,focusDepthMm,referenceFrequencyMHz});
  const rx=Math.max(1,Math.ceil(3*r.lateralSigmaMm/dx));
  const ry=Math.max(1,Math.ceil(3*r.axialSigmaMm/dy));
  let sum=0,weightSum=0;
  for(let oy=-ry;oy<=ry;oy++){
    const yy=y+oy;
    if(yy<0||yy>=field.heightPx) continue;
    for(let ox=-rx;ox<=rx;ox++){
      const xx=x+ox;
      if(xx<0||xx>=field.widthPx) continue;
      const w=gaussianWeight(ox*dx,r.lateralSigmaMm)*gaussianWeight(oy*dy,r.axialSigmaMm);
      sum+=field.rawSignals[yy*field.widthPx+xx]*w;
      weightSum+=w;
    }
  }
  return weightSum>0?sum/weightSum:0;
}

export function applyBeamAcquisitionPhysics({field,frequencyMHz=10,focusDepthMm=35,referenceFrequencyMHz=10,dynamicRangeDb=60,referenceSignal=1}={}){
  if(!field||field.kind!=='DETERMINISTIC_BMODE_SIGNAL_FIELD') throw new TypeError('B2 deterministic signal field is required');
  const {widthPx,heightPx,widthMm,depthMm}=field;
  const dx=widthMm/widthPx,dy=depthMm/heightPx;
  const acquiredRaw=new Array(widthPx*heightPx).fill(0);
  const pixels=new Array(widthPx*heightPx).fill(0);
  const propagationFactors=new Array(widthPx*heightPx).fill(1);

  for(let x=0;x<widthPx;x++){
    let cumulativePropagation=1;
    for(let y=0;y<heightPx;y++){
      const index=y*widthPx+x;
      const depth=(y+0.5)*dy;
      const tissueClass=field.tissueClasses[index];
      if(tissueClass) cumulativePropagation*=propagationStepFactor(tissueClass,{stepMm:dy});
      cumulativePropagation=clamp(cumulativePropagation,0.35,1.65);
      propagationFactors[index]=cumulativePropagation;
      const blurred=sampleBlurred(field,x,y,dx,dy,{frequencyMHz,focusDepthMm,referenceFrequencyMHz});
      const frequencyAttenuation=frequencyDepthAttenuationFactor(depth,frequencyMHz,{referenceFrequencyMHz});
      const signal=Math.max(0,blurred*frequencyAttenuation*cumulativePropagation);
      acquiredRaw[index]=signal;
      pixels[index]=logCompressSignal(signal,{referenceSignal,dynamicRangeDb});
    }
  }

  return Object.freeze({
    kind:'DETERMINISTIC_BMODE_ACQUISITION_FIELD',
    widthPx,heightPx,widthMm,depthMm,seed:field.seed,frequencyMHz,focusDepthMm,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    pixels:Object.freeze(pixels),rawSignals:Object.freeze(acquiredRaw),
    propagationFactors:Object.freeze(propagationFactors),
    structureIds:field.structureIds,tissueClasses:field.tissueClasses
  });
}

export function impulsePointSpread({widthPx=81,heightPx=81,widthMm=40,depthMm=40,frequencyMHz=10,focusDepthMm=20}={}){
  const rawSignals=new Array(widthPx*heightPx).fill(0);
  rawSignals[Math.floor(heightPx/2)*widthPx+Math.floor(widthPx/2)]=1;
  const nulls=Object.freeze(new Array(widthPx*heightPx).fill(null));
  const field=Object.freeze({kind:'DETERMINISTIC_BMODE_SIGNAL_FIELD',widthPx,heightPx,widthMm,depthMm,seed:'impulse',rawSignals:Object.freeze(rawSignals),pixels:Object.freeze([...rawSignals]),structureIds:nulls,tissueClasses:nulls});
  return applyBeamAcquisitionPhysics({field,frequencyMHz,focusDepthMm,referenceSignal:1});
}

export const B3_STRUCTURE_TYPES=Object.freeze({ARTERY:STRUCTURE_TYPE.ARTERY,VEIN:STRUCTURE_TYPE.VEIN,FASCIA:STRUCTURE_TYPE.FASCIA});
