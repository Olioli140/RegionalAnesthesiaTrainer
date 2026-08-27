import {normalize,sub,length} from '../../../cores/regional-anesthesia/geometry/geometry.js';

export function createNeedleGeometry({id='needle',entryPointMm,tipPointMm,diameterMm=0.8}={}){
  if(!entryPointMm||!tipPointMm) throw new TypeError('entryPointMm and tipPointMm are required');
  if(!(diameterMm>0)) throw new RangeError('diameterMm must be > 0');
  const shaftVector=sub(tipPointMm,entryPointMm);
  const insertedLengthMm=length(shaftVector);
  if(!(insertedLengthMm>0)) throw new RangeError('needle entry and tip must differ');
  return Object.freeze({
    kind:'REGIONAL_NEEDLE_GEOMETRY',id,
    entryPointMm:Object.freeze({...entryPointMm}),
    tipPointMm:Object.freeze({...tipPointMm}),
    direction:Object.freeze(normalize(shaftVector)),
    insertedLengthMm,diameterMm,
    calibrationStatus:'ENGINEERING_GEOMETRY'
  });
}
