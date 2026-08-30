import { describe, expect, it } from 'vitest';
import {
  ADDUCTOR_CANAL_REFERENCE_STACK_V0_1,
  resolveNearestAdductorCanalReferenceFrame,
} from './adductorCanalReferenceStack';

describe('ADDUCTOR_CANAL_REFERENCE_STACK_V0_1', () => {
  it('contains the five ordered P1 reference stations', () => {
    expect(ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.map((frame) => frame.station)).toEqual([
      'proximal',
      'proximal-mid',
      'mid',
      'mid-distal',
      'distal',
    ]);
    expect(ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.map((frame) => frame.normalizedScanPosition)).toEqual([
      0,
      0.25,
      0.5,
      0.75,
      1,
    ]);
  });

  it('keeps generated binary assets presentation-only and uniquely addressable', () => {
    const paths = ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.map((frame) => frame.src);
    expect(new Set(paths).size).toBe(5);
    expect(ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.every((frame) => frame.src.endsWith('.webp'))).toBe(true);
    expect(ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.every((frame) => frame.widthPx === 640 && frame.heightPx === 720)).toBe(true);
    expect(ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.every((frame) => frame.role === 'presentation-reference-only')).toBe(true);
    expect(ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.every((frame) => frame.source === 'deterministic-p1-generator')).toBe(true);
  });

  it('resolves nearest reference frames deterministically without simulation state', () => {
    expect(resolveNearestAdductorCanalReferenceFrame(-1).station).toBe('proximal');
    expect(resolveNearestAdductorCanalReferenceFrame(0.38).station).toBe('mid');
    expect(resolveNearestAdductorCanalReferenceFrame(0.62).station).toBe('mid');
    expect(resolveNearestAdductorCanalReferenceFrame(0.9).station).toBe('distal');
    expect(resolveNearestAdductorCanalReferenceFrame(2).station).toBe('distal');
  });
});
