export type UltrasoundReferenceAsset = Readonly<{
  id: string;
  blockId: 'adductor-canal';
  station: 'proximal' | 'proximal-mid' | 'mid' | 'mid-distal' | 'distal';
  normalizedScanPosition: number;
  src: string;
  widthPx: number;
  heightPx: number;
  byteSize: number;
  sha256: string;
  source: 'deterministic-p1-generator';
  role: 'presentation-reference-only';
}>;

/**
 * Presentation metadata only.
 *
 * This manifest does not determine anatomy, probe pose, scan-plane geometry,
 * needle interaction, injection spread, safety state, or any other simulation
 * truth. Those responsibilities remain in the worker/canonical cores.
 */
export const ADDUCTOR_CANAL_REFERENCE_STACK_V0_1 = Object.freeze([
  Object.freeze({
    id: 'adductor-canal-proximal-p1',
    blockId: 'adductor-canal',
    station: 'proximal',
    normalizedScanPosition: 0,
    src: './assets/ultrasound/adductor-canal/v0.1/proximal.webp',
    widthPx: 640,
    heightPx: 720,
    byteSize: 91066,
    sha256: 'af039bfe159e604c96037411a43f6cb74bc97ee17024d140ec462ef8d3df08d1',
    source: 'deterministic-p1-generator',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-proximal-mid-p1',
    blockId: 'adductor-canal',
    station: 'proximal-mid',
    normalizedScanPosition: 0.25,
    src: './assets/ultrasound/adductor-canal/v0.1/proximal-mid.webp',
    widthPx: 640,
    heightPx: 720,
    byteSize: 91536,
    sha256: 'ae333848e9b5ac1f6e54e42a4c7c92b13315d988681bea2ec680e1fc289149e7',
    source: 'deterministic-p1-generator',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-mid-p1',
    blockId: 'adductor-canal',
    station: 'mid',
    normalizedScanPosition: 0.5,
    src: './assets/ultrasound/adductor-canal/v0.1/mid.webp',
    widthPx: 640,
    heightPx: 720,
    byteSize: 92124,
    sha256: 'd875a18d2f624f66c1d3ef91e75977589987328d883bb9213435108a49932955',
    source: 'deterministic-p1-generator',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-mid-distal-p1',
    blockId: 'adductor-canal',
    station: 'mid-distal',
    normalizedScanPosition: 0.75,
    src: './assets/ultrasound/adductor-canal/v0.1/mid-distal.webp',
    widthPx: 640,
    heightPx: 720,
    byteSize: 89730,
    sha256: '20b9a3671f9f11bafcbc1199f1d92b3165ab86b2f8dbe30342d411c35477618b',
    source: 'deterministic-p1-generator',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-distal-p1',
    blockId: 'adductor-canal',
    station: 'distal',
    normalizedScanPosition: 1,
    src: './assets/ultrasound/adductor-canal/v0.1/distal.webp',
    widthPx: 640,
    heightPx: 720,
    byteSize: 91500,
    sha256: '01ed9dbf2acc3fc4435f5170a89edbfee8128fd00d466e3fe272be243f841558',
    source: 'deterministic-p1-generator',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
] as const);

export function resolveNearestAdductorCanalReferenceFrame(normalizedScanPosition: number) {
  const clamped = Math.max(0, Math.min(1, normalizedScanPosition));
  return ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.reduce((best, frame) =>
    Math.abs(frame.normalizedScanPosition - clamped) < Math.abs(best.normalizedScanPosition - clamped)
      ? frame
      : best,
  );
}
