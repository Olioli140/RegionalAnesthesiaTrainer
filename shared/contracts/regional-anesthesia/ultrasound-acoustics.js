const finiteNonNegative=(value,name)=>{
  if(!Number.isFinite(value)||value<0) throw new TypeError(`${name} must be a finite non-negative number`);
};

export function createTissueAcousticProperties({
  tissueClass,
  relativeAcousticImpedance,
  baselineBackscatter,
  scatterFraction,
  attenuationDbPerCm,
  interfaceEchoGain=1,
  anisotropyStrength=0,
  anisotropyPower=1,
  lumenSignalScale=1,
  renderable=true,
  calibrationStatus='ENGINEERING_CALIBRATION'
}){
  if(typeof tissueClass!=='string'||!tissueClass) throw new TypeError('tissueClass is required');
  finiteNonNegative(relativeAcousticImpedance,'relativeAcousticImpedance');
  finiteNonNegative(baselineBackscatter,'baselineBackscatter');
  finiteNonNegative(scatterFraction,'scatterFraction');
  finiteNonNegative(attenuationDbPerCm,'attenuationDbPerCm');
  finiteNonNegative(interfaceEchoGain,'interfaceEchoGain');
  finiteNonNegative(anisotropyStrength,'anisotropyStrength');
  finiteNonNegative(anisotropyPower,'anisotropyPower');
  finiteNonNegative(lumenSignalScale,'lumenSignalScale');
  if(typeof renderable!=='boolean') throw new TypeError('renderable must be boolean');
  return Object.freeze({
    tissueClass,relativeAcousticImpedance,baselineBackscatter,scatterFraction,attenuationDbPerCm,
    interfaceEchoGain,anisotropyStrength,anisotropyPower,lumenSignalScale,renderable,calibrationStatus
  });
}

export function validateTissueAcousticProperties(properties){
  return createTissueAcousticProperties(properties);
}
