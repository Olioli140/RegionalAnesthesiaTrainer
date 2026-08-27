import {STRUCTURE_TYPE} from '../../../shared/contracts/regional-anesthesia/anatomy.js';
import {createTissueAcousticProperties} from '../../../shared/contracts/regional-anesthesia/ultrasound-acoustics.js';
import {dot,normalize,rotateVector,vec3} from '../geometry/geometry.js';
import {getAdductorCanalGeometry} from '../anatomy/adductor-canal-dataset.js';
import {resolveAnatomyCrossSections} from '../scan-plane/anatomy-cross-section-resolver.js';

const profile=(values)=>createTissueAcousticProperties(values);

export const TISSUE_ACOUSTIC_PROFILES=Object.freeze({
  [STRUCTURE_TYPE.SKIN]:profile({tissueClass:'skin',relativeAcousticImpedance:1.72,baselineBackscatter:0.52,scatterFraction:0.18,attenuationDbPerCm:0.75,interfaceEchoGain:1.15}),
  [STRUCTURE_TYPE.FAT]:profile({tissueClass:'fat',relativeAcousticImpedance:1.38,baselineBackscatter:0.24,scatterFraction:0.38,attenuationDbPerCm:0.62,interfaceEchoGain:0.85}),
  [STRUCTURE_TYPE.FASCIA]:profile({tissueClass:'fascia',relativeAcousticImpedance:1.78,baselineBackscatter:0.82,scatterFraction:0.14,attenuationDbPerCm:0.58,interfaceEchoGain:1.55}),
  [STRUCTURE_TYPE.MUSCLE]:profile({tissueClass:'muscle',relativeAcousticImpedance:1.66,baselineBackscatter:0.34,scatterFraction:0.26,attenuationDbPerCm:0.72,interfaceEchoGain:1.0}),
  [STRUCTURE_TYPE.ARTERY]:profile({tissueClass:'artery',relativeAcousticImpedance:1.61,baselineBackscatter:0.08,scatterFraction:0.20,attenuationDbPerCm:0.48,interfaceEchoGain:1.05,lumenSignalScale:0.42}),
  [STRUCTURE_TYPE.VEIN]:profile({tissueClass:'vein',relativeAcousticImpedance:1.58,baselineBackscatter:0.06,scatterFraction:0.22,attenuationDbPerCm:0.45,interfaceEchoGain:0.95,lumenSignalScale:0.36}),
  [STRUCTURE_TYPE.NERVE]:profile({tissueClass:'nerve',relativeAcousticImpedance:1.69,baselineBackscatter:0.48,scatterFraction:0.25,attenuationDbPerCm:0.66,interfaceEchoGain:1.2,anisotropyStrength:0.72,anisotropyPower:3}),
  [STRUCTURE_TYPE.OTHER]:profile({tissueClass:'other',relativeAcousticImpedance:1.55,baselineBackscatter:0.20,scatterFraction:0.25,attenuationDbPerCm:0.60,interfaceEchoGain:0.8})
});

function hash32(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){ h^=text.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}

export function deterministicScatter({seed='regional-mvp-b1',sampleKey='sample',baseline=1,scatterFraction=0.25}){
  const h=hash32(`${seed}|${sampleKey}`);
  const unit=h/0xffffffff;
  const centered=unit*2-1;
  return Math.max(0,baseline*(1+centered*scatterFraction));
}

export function depthAttenuationFactor(depthMm,attenuationDbPerCm){
  if(!Number.isFinite(depthMm)||depthMm<0) throw new RangeError('depthMm must be >= 0');
  if(!Number.isFinite(attenuationDbPerCm)||attenuationDbPerCm<0) throw new RangeError('attenuationDbPerCm must be >= 0');
  const lossDb=attenuationDbPerCm*(depthMm/10);
  return Math.pow(10,-lossDb/20);
}

export function interfaceEchoResponse(a,b){
  if(!a||!b) return 0;
  const z1=a.relativeAcousticImpedance,z2=b.relativeAcousticImpedance;
  const contrast=Math.abs(z2-z1)/Math.max(1e-12,z1+z2);
  return contrast*((a.interfaceEchoGain+b.interfaceEchoGain)/2);
}

export function nerveAnisotropyFactor(fiberDirection,beamDirection,{strength=0.72,power=3}={}){
  const f=normalize(fiberDirection),b=normalize(beamDirection);
  const cos=Math.max(-1,Math.min(1,dot(f,b)));
  const perpendicular=Math.sqrt(Math.max(0,1-cos*cos));
  return Math.max(0,(1-strength)+strength*Math.pow(perpendicular,power));
}

function worldFiberDirection(structure,geometry){
  if(structure?.properties?.fiberAxis) return normalize(rotateVector(structure.transform.orientation,structure.properties.fiberAxis));
  if(geometry?.kind==='cylinder'&&geometry.axis==='z') return normalize(rotateVector(structure.transform.orientation,vec3(0,0,1)));
  return null;
}

export function acousticPropertiesForStructure(structure){
  const base=TISSUE_ACOUSTIC_PROFILES[structure?.type]||TISSUE_ACOUSTIC_PROFILES[STRUCTURE_TYPE.OTHER];
  if(structure?.properties?.trainingTarget){
    return Object.freeze({...base,renderable:false,baselineBackscatter:0,scatterFraction:0,interfaceEchoGain:0,calibrationStatus:'NON_RENDERING_TRAINING_METADATA'});
  }
  return base;
}

export function geometryToAcousticSamples({dataset,scanPlane,seed='regional-mvp-b1'}={}){
  if(!dataset||!scanPlane) throw new TypeError('dataset and scanPlane are required');
  const sections=resolveAnatomyCrossSections(dataset,scanPlane).filter(s=>s.intersects&&s.inView);
  const structureById=new Map(dataset.structures.map(s=>[s.id,s]));
  const candidates=sections.map(section=>({section,structure:structureById.get(section.structureId)}))
    .filter(x=>x.structure)
    .map(x=>({...x,properties:acousticPropertiesForStructure(x.structure)}))
    .filter(x=>x.properties.renderable)
    .sort((a,b)=>a.section.centroid.depthMm-b.section.centroid.depthMm||a.structure.id.localeCompare(b.structure.id));

  let previousProperties=null;
  const samples=candidates.map(({section,structure,properties})=>{
    const depthMm=Math.max(0,section.centroid.depthMm);
    const attenuationFactor=depthAttenuationFactor(depthMm,properties.attenuationDbPerCm);
    const sampleKey=`${structure.id}|${section.centroid.lateralMm.toFixed(6)}|${section.centroid.depthMm.toFixed(6)}`;
    let backscatter=deterministicScatter({seed,sampleKey,baseline:properties.baselineBackscatter,scatterFraction:properties.scatterFraction});
    if(structure.type===STRUCTURE_TYPE.ARTERY||structure.type===STRUCTURE_TYPE.VEIN) backscatter*=properties.lumenSignalScale;
    let anisotropyFactor=1;
    if(structure.type===STRUCTURE_TYPE.NERVE){
      const geometry=getAdductorCanalGeometry(dataset,structure.geometryId);
      const fiberDirection=worldFiberDirection(structure,geometry);
      if(fiberDirection) anisotropyFactor=nerveAnisotropyFactor(fiberDirection,scanPlane.depthAxis,{strength:properties.anisotropyStrength,power:properties.anisotropyPower});
    }
    const boundaryEcho=previousProperties?interfaceEchoResponse(previousProperties,properties):0;
    const signal=(backscatter*anisotropyFactor+boundaryEcho)*attenuationFactor;
    previousProperties=properties;
    return Object.freeze({
      structureId:structure.id,tissueClass:properties.tissueClass,depthMm,lateralMm:section.centroid.lateralMm,
      backscatter,attenuationFactor,boundaryEcho,anisotropyFactor,signal:Math.max(0,signal),calibrationStatus:properties.calibrationStatus
    });
  });
  return Object.freeze(samples);
}
