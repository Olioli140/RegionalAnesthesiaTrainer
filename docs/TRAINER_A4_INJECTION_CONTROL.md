# Trainer A4 – Injection Control

A4 exposes the already validated D1–D4 injection chain to the participant UI without adding React-side simulation truth.

## Architecture

`TrainerAction -> worker -> D1 injection actions -> D2 pressure/flow -> D3 spread -> D4 ultrasound overlay -> snapshot -> UI`

The canonical injection cores remain unchanged.

## Participant controls

- aspiration
- injection start/stop
- requested flow selection
- deterministic time advancement
- syringe volume tracking

## Readouts

- requested and actual flow
- maximum pressure-limited flow
- line pressure and pressure cap
- opening pressure
- needle and total hydraulic resistance
- dominant tip environment
- delivered and remaining syringe volume
- D3 spread volume and depot count
- D4 fluid overlay in ultrasound

## Acceptance criteria

1. Actual flow is sourced from D2 and never calculated in React.
2. Delivered + remaining syringe volume remains conserved.
3. D3 spread advances from canonical pressure/flow state.
4. D4 ultrasound overlay remains coupled to the canonical spread state.
5. Full injection sequences replay deterministically.
6. Existing A2/A3 probe and needle behavior remains regression-tested.

All pressure/tissue mechanics remain engineering calibration, not clinical validation or patient-care guidance.
