# Trainer A5 — Freeze Candidate

Date: 2026-08-29  
Candidate implementation commit: `dd86cbea785647bba9385f7cb7ef0dfc5715c0ad`  
Live preview: https://olioli140.github.io/RegionalAnesthesiaTrainer/

## Status

A5 is an engineering **Freeze Candidate**, not a final clinical or device validation.
It is an educational/research preview and must not be used for patient care.

## Frozen candidate scope

- Direct probe slide by pointer/touch drag
- Direct probe pressure by vertical drag
- Probe rotation action mapping by wheel
- Direct needle entry-point manipulation
- Direct in-plane/out-of-plane trajectory manipulation
- Needle advancement and length controls
- Aspiration, requested/actual flow, pressure limitation and syringe feedback
- Persistent injection depot and ultrasound spread overlay
- Deterministic action log and replay verification
- Dedicated Web Worker as canonical simulation owner

## Architecture invariants

1. React maps gestures and controls to `TrainerAction` only.
2. Worker/canonical cores own anatomy, scan plane, ultrasound, needle interaction, injection hydraulics and spread.
3. React must not calculate or duplicate simulation truth.
4. Frozen cores must not be silently modified; later work is additive or explicitly versioned.
5. Determinism and replay must remain intact.

## Automated and live validation evidence

| Check | Result |
|---|---|
| PR #7 CI / validation | PASS |
| Main CI run #21 | PASS |
| GitHub Pages deployment | PASS |
| Probe slide | PASS: 0 → 15.4 mm |
| Probe pressure | PASS: 35% → 65% |
| Needle entry drag | PASS |
| Needle trajectory drag | PASS: 26°/0° → 22°/3° |
| Needle advancement | PASS: 25% → 100% |
| Aspiration | PASS: DRY result returned |
| 5 s injection at 6 mL/min | PASS: 0.50 mL delivered |
| Persistent spread | PASS: 0.50 mL, one depot |
| Replay | PASS: MATCH |
| Application-origin console errors | none observed |

## Required real-device checks before final freeze

- Android/iOS touch: probe horizontal and vertical drag
- Android/iOS touch: needle entry and trajectory handle
- Desktop mouse wheel over probe: rotation changes snapshot and B-mode
- Visual confirmation that B-mode changes continuously with probe pose

A failure in these checks blocks the final A5 freeze and must be repaired without weakening tests.

## Excluded from A5

Pharmacology, LAST, physiological block effects, curriculum, dashboards, multiplayer,
persistence and additional anatomical regions are not part of this freeze candidate.
