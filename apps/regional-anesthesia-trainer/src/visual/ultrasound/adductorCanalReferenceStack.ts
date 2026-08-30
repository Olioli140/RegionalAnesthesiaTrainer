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
  source: 'openai-generated-p1-reference';
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
    widthPx: 256,
    heightPx: 416,
    byteSize: 10316,
    sha256: '5cca43dce93fc4fa160a7e75de5cf55c8e26988ee9e9a0e8f273d41a85e1c20b',
    source: 'openai-generated-p1-reference',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-proximal-mid-p1',
    blockId: 'adductor-canal',
    station: 'proximal-mid',
    normalizedScanPosition: 0.25,
    src: './assets/ultrasound/adductor-canal/v0.1/proximal-mid.webp',
    widthPx: 256,
    heightPx: 405,
    byteSize: 9616,
    sha256: '168f341a8705a991ab7f60ac9d924a520670d9a5d3cb4e536e43c121d81403ef',
    source: 'openai-generated-p1-reference',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-mid-p1',
    blockId: 'adductor-canal',
    station: 'mid',
    normalizedScanPosition: 0.5,
    src: './assets/ultrasound/adductor-canal/v0.1/mid.webp',
    widthPx: 256,
    heightPx: 406,
    byteSize: 10296,
    sha256: 'd75c7b6da5196f1b00ae7fc133dd45f42a67d022c22b98ec578e6926b2385447',
    source: 'openai-generated-p1-reference',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-mid-distal-p1',
    blockId: 'adductor-canal',
    station: 'mid-distal',
    normalizedScanPosition: 0.75,
    src: './assets/ultrasound/adductor-canal/v0.1/mid-distal.webp',
    widthPx: 256,
    heightPx: 419,
    byteSize: 10386,
    sha256: '427b346f1fd34a857005d13126315813e68109185ec576a015245276763c8f0b',
    source: 'openai-generated-p1-reference',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
  Object.freeze({
    id: 'adductor-canal-distal-p1',
    blockId: 'adductor-canal',
    station: 'distal',
    normalizedScanPosition: 1,
    src: './assets/ultrasound/adductor-canal/v0.1/distal.webp',
    widthPx: 256,
    heightPx: 420,
    byteSize: 10014,
    sha256: '9a4bb737bcdbb02367488eeea66301dac71c776efb7cc629fe24cab9178037c1',
    source: 'openai-generated-p1-reference',
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
