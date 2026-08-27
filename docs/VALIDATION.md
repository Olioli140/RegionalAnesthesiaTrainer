# Validation Status

## Purpose

This document separates software/engineering validation from future clinical validation.

## Current status

The current Regional Anesthesia Trainer contains deterministic engineering models for anatomy, ultrasound acquisition, needle interaction, aspiration/injection mechanics, pressure-limited flow, persistent three-dimensional fluid spread and hydrodissection rendering.

The existing regression fixtures and constants are intended for software development and deterministic training simulation. They must not be interpreted as proof of patient-level accuracy or scanner-equivalent fidelity.

### Technically validated / regression protected

- deterministic vector/quaternion geometry
- probe pose and scan-plane derivation
- data-driven adductor-canal anatomy presets
- geometry/scan-plane intersections and viewport metrics
- deterministic acoustic tissue model and B-mode field
- beam/acquisition and completed ultrasound physics
- needle geometry, acoustic visibility and tissue traversal
- canonical frozen needle interaction state
- aspiration and injection action state
- pressure-limited actual flow
- persistent 3D fluid spread
- ultrasound fluid/hydrodissection overlay
- Trainer A1 worker protocol and deterministic replay

## Engineering calibration

Many model constants are explicitly marked `ENGINEERING_CALIBRATION`. These values support reproducible software behavior and plausible simulation development; they are not automatically clinically validated.

## Future clinical validation

Clinical validation should be performed separately and may include expert review, phantom comparison, representative ultrasound datasets, procedural task-performance studies and defined acceptance criteria. Any future validated parameter set should be versioned and documented with its evidence and intended scope.

## Safety statement

This project is an educational/research simulator, not a medical device. It must not be used for diagnosis, treatment planning, procedural guidance or other patient-care decisions.
