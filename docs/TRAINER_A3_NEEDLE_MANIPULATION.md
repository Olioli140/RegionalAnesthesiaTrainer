# Trainer A3 — Spatial Needle Manipulation

## Goal
Trainer A3 replaces the A1/A2 depth-only needle slider with participant-controlled spatial needle geometry while preserving the canonical Needle Core as the only source of geometric truth.

## Participant actions
- move entry point on the engineering skin plane
- change in-plane angle
- change out-of-plane angle
- set technical needle length
- advance/retract along the canonical needle geometry

## Runtime contract
`TrainerAction -> Worker -> Needle parameters -> createNeedleFromEntryDirection -> C1/C2/C4 -> canonical snapshot -> UI`

Probe movement and needle movement remain independent participant actions but converge in the same canonical scan-plane / needle-intersection calculation.

## Engineering envelope
- entry X: -60..20 mm
- entry Z: -60..60 mm
- in-plane angle: 5..80 degrees
- out-of-plane angle: -30..30 degrees
- needle length: 20..100 mm
- advance fraction: 0..1

These are technical sandbox bounds, not clinical recommendations.

## Acceptance criteria
1. Entry-point movement changes canonical needle geometry and ultrasound acoustics.
2. In-plane/out-of-plane steering changes needle direction and scan-plane relation.
3. Advancement moves the current tip along the canonical needle geometry without relocating the entry point.
4. C4 tissue traversal and acoustic visibility use the current canonical needle geometry.
5. Probe + needle + injection action sequences replay deterministically.
6. Core smoke test, strict TypeScript, trainer tests and production build remain green.

## Scope boundary
A3 does not add clinical target snapping, success scoring, automatic correction or haptic-force simulation. Those remain outside the UI and outside this sprint.
