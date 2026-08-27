import {logCompressSignal} from '../ultrasound/bmode-field.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});

function projectPoint(point,scanPlane){
  const d=sub(point,scanPlane.originMm);
  return {lateralMm:dot(d,scanPlane.lateralAxis),depthMm:dot(d,scanPlane.depthAxis),normalMm:dot(d,scanPlane.normal)};
}

function acceptedBase(baseField){
  return baseField?.kind==='DETERMINISTIC_COMPLETED_ULTRASOUND_PHYSICS_FIELD'||baseField?.kind==='DETERMINISTIC_NEEDLE_ACOUSTIC_OVERLAY_FIELD';
}

export function createFluidUltrasoundOverlay({
  baseField,spreadState,scanPlane,sliceThicknessMm=4,lateralSigmaMm=2.2,axialSigmaMm=1.4,densityScaleMl=0.15,
  fluidDarkening=0.72,rimGain=0.16,dynamicRangeDb=60,referenceSignal=1
}={}){
  if(!acceptedBase(baseField)) throw new TypeError('completed ultrasound or needle overlay field is required');
  if(spreadState?.kind!=='PERSISTENT_3D_INJECTION_SPREAD_STATE') throw new TypeError('D3 persistent spread state is required');
  if(!scanPlane?.originMm||!scanPlane?.lateralAxis||!scanPlane?.depthAxis||!scanPlane?.normal) throw new TypeError('scanPlane is required');
  if(!(sliceThicknessMm>0&&lateralSigmaMm>0&&axialSigmaMm>0&&densityScaleMl>0)) throw new RangeError('slice, sigma and density scale values must be > 0');
  const {widthPx,heightPx,widthMm,depthMm}=baseField;
  const dx=widthMm/widthPx,dy=depthMm/heightPx;
  const fluidDensity=new Array(widthPx*heightPx).fill(0);
  const sliceSigma=sliceThicknessMm/2.355;
  const cells=spreadState.depots.flatMap(d=>d.cells);

  for(const cell of cells){
    const p=projectPoint(cell.positionMm,scanPlane);
    const elev=Math.exp(-0.5*(p.normalMm*p.normalMm)/(sliceSigma*sliceSigma));
    if(elev<1e-4) continue;
    const cx=(p.lateralMm+widthMm/2)/dx-0.5;
    const cy=p.depthMm/dy-0.5;
    const rx=Math.ceil(3*lateralSigmaMm/dx),ry=Math.ceil(3*axialSigmaMm/dy);
    const x0=Math.max(0,Math.floor(cx-rx)),x1=Math.min(widthPx-1,Math.ceil(cx+rx));
    const y0=Math.max(0,Math.floor(cy-ry)),y1=Math.min(heightPx-1,Math.ceil(cy+ry));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const lateral=((x+0.5)-cx)*dx,axial=((y+0.5)-cy)*dy;
      const g=Math.exp(-0.5*((lateral*lateral)/(lateralSigmaMm*lateralSigmaMm)+(axial*axial)/(axialSigmaMm*axialSigmaMm)));
      fluidDensity[y*widthPx+x]+=cell.volumeMl*elev*g;
    }
  }

  const fluidFraction=fluidDensity.map(v=>clamp(1-Math.exp(-v/densityScaleMl),0,1));
  const rimResponse=new Array(widthPx*heightPx).fill(0);
  for(let y=0;y<heightPx;y++) for(let x=0;x<widthPx;x++){
    const i=y*widthPx+x;
    const l=fluidFraction[y*widthPx+Math.max(0,x-1)],r=fluidFraction[y*widthPx+Math.min(widthPx-1,x+1)];
    const u=fluidFraction[Math.max(0,y-1)*widthPx+x],d=fluidFraction[Math.min(heightPx-1,y+1)*widthPx+x];
    rimResponse[i]=Math.sqrt((r-l)*(r-l)+(d-u)*(d-u))*rimGain;
  }
  const rawSignals=baseField.rawSignals.map((signal,i)=>Math.max(0,signal*(1-fluidDarkening*fluidFraction[i])+rimResponse[i]));
  const pixels=rawSignals.map(signal=>logCompressSignal(signal,{referenceSignal,dynamicRangeDb}));
  return Object.freeze({
    kind:'DETERMINISTIC_ULTRASOUND_FLUID_OVERLAY_FIELD',version:'D4.1',widthPx,heightPx,widthMm,depthMm,
    sourceSpreadVersion:spreadState.version,sourceDepotCount:spreadState.depots.length,totalSpreadVolumeMl:spreadState.totalSpreadVolumeMl,
    fluidDensity:Object.freeze(fluidDensity),fluidFraction:Object.freeze(fluidFraction),rimResponse:Object.freeze(rimResponse),
    rawSignals:Object.freeze(rawSignals),pixels:Object.freeze(pixels),
    baseStructureIds:baseField.baseStructureIds||baseField.structureIds,
    baseTissueClasses:baseField.baseTissueClasses||baseField.tissueClasses,
    calibrationStatus:'ENGINEERING_CALIBRATION'
  });
}
