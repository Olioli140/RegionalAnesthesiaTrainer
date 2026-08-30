export const ADDUCTOR_CANAL_A6_8_DETAIL_PROFILE=Object.freeze({
  id:'A6_8_ANATOMY_REALISM_V1',
  calibrationStatus:'ENGINEERING_CALIBRATION',
  contours:Object.freeze({
    'geom.ac.sartorius.standard':Object.freeze({twist:1.45,terms:Object.freeze([[2,0.055,0.35],[3,0.038,1.65],[5,0.018,0.80]])}),
    'geom.ac.sartorius.high-bmi':Object.freeze({twist:1.35,terms:Object.freeze([[2,0.050,0.35],[3,0.034,1.65],[5,0.016,0.80]])}),
    'geom.ac.sartorius.low-muscle':Object.freeze({twist:1.55,terms:Object.freeze([[2,0.060,0.35],[3,0.040,1.65],[5,0.020,0.80]])}),
    'geom.ac.vastus-medialis.standard':Object.freeze({twist:1.10,terms:Object.freeze([[2,0.065,1.05],[4,0.030,0.25],[5,0.020,2.20]])}),
    'geom.ac.vastus-medialis.high-bmi':Object.freeze({twist:1.05,terms:Object.freeze([[2,0.060,1.05],[4,0.028,0.25],[5,0.018,2.20]])}),
    'geom.ac.vastus-medialis.low-muscle':Object.freeze({twist:1.20,terms:Object.freeze([[2,0.070,1.05],[4,0.032,0.25],[5,0.021,2.20]])}),
    'geom.ac.adductor-longus':Object.freeze({twist:1.25,terms:Object.freeze([[2,0.058,2.15],[3,0.032,0.65],[6,0.015,1.30]])}),
    'geom.ac.adductor-magnus.standard':Object.freeze({twist:1.00,terms:Object.freeze([[2,0.060,2.65],[3,0.035,1.15],[5,0.018,0.10]])}),
    'geom.ac.adductor-magnus.low-muscle':Object.freeze({twist:1.10,terms:Object.freeze([[2,0.066,2.65],[3,0.038,1.15],[5,0.020,0.10]])})
  })
});

export function getAdductorCanalA68ContourDetail(geometryId){
  return ADDUCTOR_CANAL_A6_8_DETAIL_PROFILE.contours[geometryId]||null;
}
