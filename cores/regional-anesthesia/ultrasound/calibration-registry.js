export const ULTRASOUND_CALIBRATION_STATUS='ENGINEERING_CALIBRATION';

export const ULTRASOUND_ENGINEERING_CALIBRATION=Object.freeze({
  version:'regional-ultrasound-freeze-2026-08-27',
  status:ULTRASOUND_CALIBRATION_STATUS,
  b1:Object.freeze({
    note:'Tissue acoustic profiles remain defined in acoustic-model.js and are not clinically/scanner calibrated.'
  }),
  b2:Object.freeze({
    speckleCorrelationLengthMm:2.5,
    dynamicRangeDb:60,
    referenceSignal:1,
    interfaceThicknessMm:0.8
  }),
  b3:Object.freeze({
    referenceFrequencyMHz:10,
    axialSigmaMmAtReference:0.42,
    lateralSigmaMmAtReference:0.95,
    focusPenaltyPerMm:0.012,
    extraDbPerCmAtReference:0.18,
    propagationReferenceAttenuationDbPerCm:0.60,
    shadowStrength:0.42,
    enhancementStrength:0.30,
    propagationClampMin:0.35,
    propagationClampMax:1.65
  }),
  b4:Object.freeze({
    minLateralSigmaMm:0.35,
    divergenceRatePerMm:0.018,
    defaultSliceThicknessMm:4,
    defaultElevationalSamples:5,
    specularExponent:6,
    specularMinimumResponse:0.15,
    specularBlendStrength:0.35,
    reverberationThreshold:0.18,
    reverberationGain:0.22,
    reverberationOrders:2,
    reverberationDecay:0.55
  })
});

export function getUltrasoundCalibrationSnapshot(){
  return ULTRASOUND_ENGINEERING_CALIBRATION;
}
