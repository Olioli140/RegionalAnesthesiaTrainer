# Trainer A2 — Probe Manipulation + Synchronized Patient Scene

## Goal
Trainer A2 turns the A1 fixed golden probe pose into participant-controlled canonical probe manipulation.

## Implemented actions
- longitudinal slide
- axial rotation
- tilt
- rock
- contact pressure

Every action is dispatched through the worker protocol. React does not calculate ultrasound truth.

## Coupling contract
`TrainerAction -> worker -> ProbeState -> ScanPlane -> Ultrasound Core -> Needle Interaction -> Snapshot -> UI`

The patient/probe scene renders the canonical probe snapshot returned by the worker. It is an observer, not a second simulation.

## Acceptance criteria
1. Moving the probe changes the canonical scan plane and regenerated ultrasound field.
2. Probe pose is included in deterministic replay.
3. Needle visibility is recomputed against the current scan plane.
4. Existing injection/spread state remains available.
5. Typecheck, trainer tests, core smoke test and production build remain green.

## Scope boundary
The current patient scene is deliberately lightweight 2.5D spatial visualization. A later visual-polish sprint may replace it with WebGL/Three.js without changing the simulation contract.
