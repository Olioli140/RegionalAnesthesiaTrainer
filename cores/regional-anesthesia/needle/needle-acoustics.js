import {dot,length,scale} from '../geometry/geometry.js';
import {projectPointToScanCoordinates,pointAlongNeedle} from './needle-geometry.js';
import {logCompressSignal} from '../ultrasound/bmode-field.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function needleBeamAngleFactor(needleDirection,beamDirection,{power=2,minFactor=0.03}={}){
  const needleLength=length(needleDirection);
  const beamLength=length(beamDirection);
  if(!(needleLength>0&&beamLength>0)) throw new RangeError('needleDirection and beamDirection must be non-zero');
  const n=scale(needleDirection,1/needleLength);
  const b=scale(beamDirection,1/beamLength);
  const cosine=clamp(Math.abs(dot(n,b)),0,1);
  const perpendicular=Math.sqrt(Math.max(0,1-cosine*cosine));
  return clamp(minFactor+(1-minFactor)*Math.pow(perpendicular,power),minFactor,1);
}

export function needleElevationalFactor(normalDistanceMm,{sliceThicknessMm=4}={}){
  if(!(sliceThicknessMm>0)) throw new RangeError('sliceThicknessMm must be > 0');
  const sigma=sliceThicknessMm/2.355;
  return Math.exp(-0.5*(normalDistanceMm*normalDistanceMm)/(sigma*sigma));
}

export function needleDepthFactor(depthMm,{referenceDepthMm=20,attenuationPerCm=0.18}={}){
  if(!(depthMm>=0)) return 0;
  const extraDepthCm=Math.max(0,depthMm-referenceDepthMm)/10;
  return Math.pow(10,-attenuationPerCm*extraDepthCm/20);
}

export function needleAcousticVisibility({needle,scanPlane,sliceThicknessMm=4,shaftGain=0.55,tipGain=0.9,anglePower=2}={}){
  if(!needle||needle.kind!=='REGIONAL_NEEDLE_GEOMETRY') throw new TypeError('needle geometry is required');
  if(!scanPlane?.depthAxis||!scanPlane?.normal) throw new TypeError('scanPlane is required');
  const angleFactor=needleBeamAngleFactor(needle.direction,scanPlane.depthAxis,{power:anglePower});
  const tipScan=projectPointToScanCoordinates(needle.tipPointMm,scanPlane);
  const tipElevational=needleElevationalFactor(tipScan.normalMm,{sliceThicknessMm});
  const tipDepth=needleDepthFactor(tipScan.depthMm);
  return Object.freeze({
    kind:'GENERIC_NEEDLE_ACOUSTIC_VISIBILITY',
    needleId:needle.id,
    angleFactor,
    shaftResponse:shaftGain*angleFactor,
    tipResponse:tipGain*Math.sqrt(angleFactor)*tipElevational*tipDepth,
    tipScan,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}

function depositGaussian(buffer,widthPx,heightPx,cx,cy,amplitude,{sigmaX=0.7,sigmaY=0.55}={}){
  if(!(amplitude>0)) return;
  const rx=Math.max(1,Math.ceil(3*sigmaX));
  const ry=Math.max(1,Math.ceil(3*sigmaY));
  for(let oy=-ry;oy<=ry;oy++){
    const y=cy+oy;
    if(y<0||y>=heightPx) continue;
    for(let ox=-rx;ox<=rx;ox++){
      const x=cx+ox;
      if(x<0||x>=widthPx) continue;
      const w=Math.exp(-0.5*((ox*ox)/(sigmaX*sigmaX)+(oy*oy)/(sigmaY*sigmaY)));
      buffer[y*widthPx+x]+=amplitude*w;
    }
  }
}

export function createNeedleAcousticOverlay({
  baseField,needle,scanPlane,sliceThicknessMm=4,sampleSpacingMm=0.75,
  shaftGain=0.55,tipGain=0.9,anglePower=2,dynamicRangeDb=60,referenceSignal=1
}={}){
  if(!baseField||baseField.kind!=='DETERMINISTIC_COMPLETED_ULTRASOUND_PHYSICS_FIELD') throw new TypeError('frozen completed ultrasound field is required');
  if(!needle||needle.kind!=='REGIONAL_NEEDLE_GEOMETRY') throw new TypeError('needle geometry is required');
  if(!(sampleSpacingMm>0)) throw new RangeError('sampleSpacingMm must be > 0');
  const {widthPx,heightPx,widthMm,depthMm}=baseField;
  const dx=widthMm/widthPx,dy=depthMm/heightPx;
  const contributions=new Array(widthPx*heightPx).fill(0);
  const angleFactor=needleBeamAngleFactor(needle.direction,scanPlane.depthAxis,{power:anglePower});
  const samples=Math.max(2,Math.ceil(needle.insertedLengthMm/sampleSpacingMm)+1);

  for(let i=0;i<samples;i++){
    const t=i/(samples-1);
    const point=pointAlongNeedle(needle,t);
    const scan=projectPointToScanCoordinates(point,scanPlane);
    if(scan.depthMm<0||scan.depthMm>depthMm||Math.abs(scan.lateralMm)>widthMm/2) continue;
    const elev=needleElevationalFactor(scan.normalMm,{sliceThicknessMm});
    const depthFactor=needleDepthFactor(scan.depthMm);
    const shaftAmplitude=shaftGain*angleFactor*elev*depthFactor;
    const x=Math.round((scan.lateralMm+widthMm/2)/dx-0.5);
    const y=Math.round(scan.depthMm/dy-0.5);
    depositGaussian(contributions,widthPx,heightPx,x,y,shaftAmplitude,{sigmaX:0.7,sigmaY:0.5});
  }

  const tipScan=projectPointToScanCoordinates(needle.tipPointMm,scanPlane);
  if(tipScan.depthMm>=0&&tipScan.depthMm<=depthMm&&Math.abs(tipScan.lateralMm)<=widthMm/2){
    const elev=needleElevationalFactor(tipScan.normalMm,{sliceThicknessMm});
    const depthFactor=needleDepthFactor(tipScan.depthMm);
    const tipAmplitude=tipGain*Math.sqrt(angleFactor)*elev*depthFactor;
    const x=Math.round((tipScan.lateralMm+widthMm/2)/dx-0.5);
    const y=Math.round(tipScan.depthMm/dy-0.5);
    depositGaussian(contributions,widthPx,heightPx,x,y,tipAmplitude,{sigmaX:0.8,sigmaY:0.8});
  }

  const rawSignals=baseField.rawSignals.map((signal,i)=>signal+contributions[i]);
  const pixels=rawSignals.map(signal=>logCompressSignal(signal,{referenceSignal,dynamicRangeDb}));
  return Object.freeze({
    kind:'DETERMINISTIC_NEEDLE_ACOUSTIC_OVERLAY_FIELD',
    widthPx,heightPx,widthMm,depthMm,needleId:needle.id,
    calibrationStatus:'ENGINEERING_CALIBRATION',
    angleFactor,
    needleContributions:Object.freeze(contributions),
    rawSignals:Object.freeze(rawSignals),pixels:Object.freeze(pixels),
    baseStructureIds:baseField.structureIds,
    baseTissueClasses:baseField.tissueClasses
  });
}
