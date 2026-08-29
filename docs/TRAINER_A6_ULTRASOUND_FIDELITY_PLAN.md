# Trainer A6 — Pose-Dependent Ultrasound Fidelity Plan

## Goal

Improve visual ultrasound fidelity while preserving the A5 interaction and simulation architecture.
The live frame must be derived from canonical worker output for the current probe pose; it must not
be an image cross-fade controlled independently by React.

## Proposed additive pipeline

```text
canonical probe pose
  → canonical scan plane
  → anatomy cross-section
  → acoustic / B-mode field
  → deterministic appearance renderer
  → canvas display
```

## A6 scope

1. Add a versioned appearance-rendering profile for adductor-canal B-mode.
2. Improve deterministic speckle, attenuation, fascia interfaces, lumen appearance and shadows.
3. Preserve vessel, nerve, muscle and fascia geometry from the anatomy/scan-plane cores.
4. Ensure slide, rotation, tilt, rock and pressure produce continuous pose-dependent image changes.
5. Use generated/reference images only as calibration targets or texture priors with documented licence/provenance.
6. Add golden-pose snapshots and continuity tests between neighbouring probe poses.
7. Retain needle acoustic overlay and D4 fluid spread overlay.
8. Keep replay byte-/field-deterministic for the same action sequence.

## Acceptance criteria

- No simulation truth calculated in React.
- Same seed + same action sequence produces the same frame.
- Neighbouring poses change continuously without unrelated flicker.
- Golden poses retain expected landmark ordering.
- Artery/vein/nerve remain consistent with canonical geometry.
- Needle visibility follows canonical scan-plane relation.
- Fluid overlay remains registered to the persistent depot.
- Existing A5 tests remain green.
- CI, production build, Pages preview and live playtest pass.

## Explicit non-goals

- No new anatomical region
- No pharmacology or block-effect model
- No clinical validation claim
- No replacement of canonical anatomy with generated images

Engineering calibration is not clinical validation.
