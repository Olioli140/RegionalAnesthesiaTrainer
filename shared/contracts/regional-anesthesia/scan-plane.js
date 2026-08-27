export function createScanPlane({originMm,normal,lateralAxis,depthAxis,widthMm=50,depthMm=60}){
  if(!originMm||!normal||!lateralAxis||!depthAxis) throw new TypeError('ScanPlane axes and origin are required');
  if(!(widthMm>0&&depthMm>0)) throw new RangeError('ScanPlane width/depth must be > 0');
  return {originMm:{...originMm},normal:{...normal},lateralAxis:{...lateralAxis},depthAxis:{...depthAxis},widthMm,depthMm};
}
