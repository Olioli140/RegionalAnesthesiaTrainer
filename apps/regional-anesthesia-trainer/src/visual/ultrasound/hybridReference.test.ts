import { describe, expect, it } from 'vitest';
import { getAdductorReferenceAsset, resolveAdductorReferenceBlendFromSlideMm } from './hybridReference';

describe('hybrid ultrasound reference mapping', () => {
  it('maps canonical probe slide endpoints and midpoint deterministically', () => {
    expect(resolveAdductorReferenceBlendFromSlideMm(-90)).toEqual({
      normalizedScanPosition: 0,
      lowerStation: 'proximal',
      upperStation: 'proximal',
      blend: 0,
    });
    expect(resolveAdductorReferenceBlendFromSlideMm(0)).toEqual({
      normalizedScanPosition: 0.5,
      lowerStation: 'proximal-mid',
      upperStation: 'mid',
      blend: 1,
    });
    expect(resolveAdductorReferenceBlendFromSlideMm(90)).toEqual({
      normalizedScanPosition: 1,
      lowerStation: 'distal',
      upperStation: 'distal',
      blend: 0,
    });
  });

  it('interpolates continuously between adjacent stations', () => {
    const blend = resolveAdductorReferenceBlendFromSlideMm(-22.5);
    expect(blend.normalizedScanPosition).toBeCloseTo(0.375, 6);
    expect(blend.lowerStation).toBe('proximal-mid');
    expect(blend.upperStation).toBe('mid');
    expect(blend.blend).toBeCloseTo(0.5, 6);
  });

  it('resolves only external WebP presentation assets', () => {
    const asset = getAdductorReferenceAsset('mid');
    expect(asset.src).toMatch(/^\.\/assets\/ultrasound\/adductor-canal\/v0\.1\/.*\.webp$/);
    expect(asset.role).toBe('presentation-reference-only');
  });
});
