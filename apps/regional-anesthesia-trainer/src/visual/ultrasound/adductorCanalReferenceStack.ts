export type UltrasoundReferenceAsset = Readonly<{
  id: string;
  blockId: 'adductor-canal';
  station: 'mid';
  src: string;
  widthPx: number;
  heightPx: number;
  byteSize: number;
  sha256: string;
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
    id: 'adductor-canal-mid-p0',
    blockId: 'adductor-canal',
    station: 'mid',
    src: './assets/ultrasound/adductor-canal/v0.1/mid.webp',
    widthPx: 256,
    heightPx: 288,
    byteSize: 6476,
    sha256: '0ce58f4b8b2aa505c0cb6703736b2ce3460564a77013c146231b5bcb50e62371',
    role: 'presentation-reference-only',
  } satisfies UltrasoundReferenceAsset),
] as const);
