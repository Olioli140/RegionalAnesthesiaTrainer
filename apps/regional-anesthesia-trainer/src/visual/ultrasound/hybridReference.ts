import { ADDUCTOR_CANAL_REFERENCE_STACK_V0_1 } from './adductorCanalReferenceStack';

export type AdductorReferenceStation = (typeof ADDUCTOR_CANAL_REFERENCE_STACK_V0_1)[number]['station'];

export type UltrasoundReferenceBlend = Readonly<{
  normalizedScanPosition: number;
  lowerStation: AdductorReferenceStation;
  upperStation: AdductorReferenceStation;
  blend: number;
}>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Presentation mapping only. The input is canonical worker-owned probe slide.
 * It does not alter anatomy, scan-plane geometry or any clinical/simulation truth.
 */
export function resolveAdductorReferenceBlendFromSlideMm(slideMm: number): UltrasoundReferenceBlend {
  const normalizedScanPosition = clamp01((slideMm + 90) / 180);
  const stack = ADDUCTOR_CANAL_REFERENCE_STACK_V0_1;

  if (normalizedScanPosition <= stack[0].normalizedScanPosition) {
    return Object.freeze({ normalizedScanPosition, lowerStation: stack[0].station, upperStation: stack[0].station, blend: 0 });
  }

  const last = stack[stack.length - 1];
  if (normalizedScanPosition >= last.normalizedScanPosition) {
    return Object.freeze({ normalizedScanPosition, lowerStation: last.station, upperStation: last.station, blend: 0 });
  }

  for (let index = 0; index < stack.length - 1; index++) {
    const lower = stack[index];
    const upper = stack[index + 1];
    if (normalizedScanPosition >= lower.normalizedScanPosition && normalizedScanPosition <= upper.normalizedScanPosition) {
      const span = upper.normalizedScanPosition - lower.normalizedScanPosition;
      const blend = span > 0 ? (normalizedScanPosition - lower.normalizedScanPosition) / span : 0;
      return Object.freeze({
        normalizedScanPosition,
        lowerStation: lower.station,
        upperStation: upper.station,
        blend: clamp01(blend),
      });
    }
  }

  return Object.freeze({ normalizedScanPosition, lowerStation: last.station, upperStation: last.station, blend: 0 });
}

export function getAdductorReferenceAsset(station: AdductorReferenceStation) {
  const asset = ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.find((candidate) => candidate.station === station);
  if (!asset) throw new Error(`Unknown adductor reference station: ${station}`);
  return asset;
}
