import {add,scale} from '../geometry/geometry.js';
import {createDeterministicBModeField,logCompressSignal} from './bmode-field.js';
import {applyBeamAcquisitionPhysics} from './beam-acquisition.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function beamDivergenceSigmaMm(depthMm,{focusDepthMm=35,minSigmaMm=0.18,divergencePerMm=0.018}={}){
  if(!(depthMm>=0)) throw new RangeError('depthMm must be >= 0');
  if(!(minSigmaMm>=0)) throw new RangeError('minSigmaMm must be >= 0');
  if(!(divergencePerMm>=0)) throw new RangeError('divergencePerMm must be >= 0');
  return minSigmaMm+Math.abs(depthMm-focusDepthMm)*divergencePerMm;
}

export function elevationalSensitivity(offsetMm,{sliceThicknessMm=4}={}){
  if(!(sliceThicknessMm>0)) throw new RangeError('sliceThicknessMm must be > 0');
  const sigma=sliceThicknessMm/2.355;
  return Math.exp(-0.5*(offsetMm*offsetMm)/(sigma*sigma));
}

export function specularAngleFactor({normalLateral=0,normalDepth=1},{beamLateral=0,beamDepth=1,power=4,minFactor=0.08}={}){
  const nLen=Math.hypot(normalLateral,normalDepth);
  const bLen=Math.hypot(beamLateral,beamDepth);
  if(!(nLen>0&&bLen>0)) return minFactor;
  const cosine=Math.abs((normalLateral*beamLateral+normalDepth*beamDepth)/(nLen*bLen));
  return clamp(minFactor+(1-minFactor)*Math.pow(cosine,power),minFactor,1);
}

export function reverberationReplicaDepths(interfaceDepthMm,{maxDepthMm,orders=3}={}){
  if(!(interfaceDepthMm>0)) return Object.freeze([]);
  if(!(maxDepthMm>0)) throw new RangeError('maxDepthMm must be > 0');
  const depths=[];
  for(let order=2;order<=orders+1;order++){
    const depth=interfaceDepthMm*order;
    if(depth<=maxDepthMm) depths.push(depth);
  }
  return Object.freeze(depths);
}

function shiftedPlane(scanPlane,offsetMm){
  return Object.freeze({...scanPlane,originMm:add(scanPlane.originMm,scale(scanPlane.normal,offsetMm))});
}

function boundaryNormal(structureIds,widthPx,heightPx,x,y){
  const at=(xx,yy)=>structureIds[clamp(yy,0,heightPx-1)*widthPx+clamp(xx,0,widthPx-1)];
  const center=at(x,y);
  if(center==null) return null;
  const gx=(at(x+1,y)===center?0:1)-(at(x-1,y)===center?0:1);
  const gy=(at(x,y+1)===center?0:1)-(at(x,y-1)===center?0:1);
  if(gx===0&&gy===0) return null;
  return {normalLateral:gx,normalDepth:gy};
}

function applyDivergence(raw,widthPx,heightPx,widthMm,depthMm,focusDepthMm,options){
  const dx=widthMm/widthPx,dy=depthMm/heightPx;
  const out=new Array(raw.length).fill(0);
  for(let y=0;y<heightPx;y++){
    const depth=(y+0.5)*dy;
    const sigma=beamDivergenceSigmaMm(depth,{focusDepthMm,...options});
    const radius=Math.max(1,Math.ceil(3*sigma/dx));
    for(let x=0;x<widthPx;x++){
      let sum=0,weightSum=0;
      for(let ox=-radius;ox<=radius;ox++){
        const xx=x+ox;
        if(xx<0||xx>=widthPx) continue;
        const delta=ox*dx;
        const w=Math.exp(-0.5*(delta*delta)/(sigma*sigma||1e-12));
        sum+=raw[y*widthPx+xx]*w;
        weightSum+=w;
      }
      out[y*widthPx+x]=weightSum>0?sum/weightSum:0;
    }
  }
  return out;
}

function applySpecularAndReverberation(raw,structureIds,widthPx,heightPx,depthMm,{specularStrength=0.55,reverberationThreshold=0.24,reverberationGain=0.16,reverberationOrders=3}={}){
  const dy=depthMm/heightPx;
  const out=[...raw];
  const specularFactors=new Array(raw.length).fill(1);
  const reverberationContributions=new Array(raw.length).fill(0);
  for(let y=0;y<heightPx;y++){
    const interfaceDepth=(y+0.5)*dy;
    for(let x=0;x<widthPx;x++){
      const index=y*widthPx+x;
      const normal=boundaryNormal(structureIds,widthPx,heightPx,x,y);
      if(!normal) continue;
      const angleFactor=specularAngleFactor(normal);
      const applied=1-specularStrength*(1-angleFactor);
      specularFactors[index]=applied;
      out[index]*=applied;
      if(out[index]<reverberationThreshold) continue;
      const replicas=reverberationReplicaDepths(interfaceDepth,{maxDepthMm:depthMm,orders:reverberationOrders});
      replicas.forEach((replicaDepth,orderIndex)=>{
        const yy=clamp(Math.floor(replicaDepth/dy),0,heightPx-1);
        const target=yy*widthPx+x;
        const contribution=out[index]*reverberationGain/Math.pow(orderIndex+2,1.35);
        out[target]+=contribution;
        reverberationContributions[target]+=contribution;
      });
    }
  }
  return {raw:out,specularFactors,reverberationContributions};
}

export function createCompletedUltrasoundPhysicsField({
  dataset,scanPlane,seed='regional-mvp-b4',widthPx=64,heightPx=64,
  frequencyMHz=10,focusDepthMm=35,sliceThicknessMm=4,elevationalSamples=3,
  dynamicRangeDb=60,referenceSignal=1,
  divergenceOptions={},artifactOptions={}
}={}){
  if(!dataset||!scanPlane) throw new TypeError('dataset and scanPlane are required');
  if(!Number.isInteger(elevationalSamples)||elevationalSamples<1||elevationalSamples%2===0) throw new RangeError('elevationalSamples must be an odd integer >= 1');

  const half=(elevationalSamples-1)/2;
  const offsets=[];
  for(let i=-half;i<=half;i++) offsets.push(half===0?0:(i/half)*(sliceThicknessMm/2));
  const acquisitions=[];
  let weightSum=0;
  for(const offsetMm of offsets){
    const weight=elevationalSensitivity(offsetMm,{sliceThicknessMm});
    const plane=shiftedPlane(scanPlane,offsetMm);
    const b2=createDeterministicBModeField({dataset,scanPlane:plane,seed:`${seed}|elev:${offsetMm.toFixed(4)}`,widthPx,heightPx,dynamicRangeDb,referenceSignal});
    const b3=applyBeamAcquisitionPhysics({field:b2,frequencyMHz,focusDepthMm,dynamicRangeDb,referenceSignal});
    acquisitions.push({offsetMm,weight,field:b3});
    weightSum+=weight;
  }

  const center=acquisitions[half].field;
  const compounded=new Array(widthPx*heightPx).fill(0);
  for(const sample of acquisitions){
    for(let i=0;i<compounded.length;i++) compounded[i]+=sample.field.rawSignals[i]*sample.weight;
  }
  for(let i=0;i<compounded.length;i++) compounded[i]/=weightSum;

  const diverged=applyDivergence(compounded,widthPx,heightPx,scanPlane.widthMm,scanPlane.depthMm,focusDepthMm,divergenceOptions);
  const artifacts=applySpecularAndReverberation(diverged,center.structureIds,widthPx,heightPx,scanPlane.depthMm,artifactOptions);
  const pixels=artifacts.raw.map(signal=>logCompressSignal(signal,{referenceSignal,dynamicRangeDb}));

  return Object.freeze({
    kind:'DETERMINISTIC_COMPLETED_ULTRASOUND_PHYSICS_FIELD',
    widthPx,heightPx,widthMm:scanPlane.widthMm,depthMm:scanPlane.depthMm,seed,
    frequencyMHz,focusDepthMm,sliceThicknessMm,elevationalSamples,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    pixels:Object.freeze(pixels),rawSignals:Object.freeze(artifacts.raw),
    specularFactors:Object.freeze(artifacts.specularFactors),
    reverberationContributions:Object.freeze(artifacts.reverberationContributions),
    elevationalOffsetsMm:Object.freeze(offsets),
    structureIds:center.structureIds,tissueClasses:center.tissueClasses
  });
}
