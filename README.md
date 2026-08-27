# Regional Anesthesia Trainer

Open-source educational and research simulator for regional anesthesia training.

The project combines deterministic 3D anatomy, synthetic ultrasound physics, needle interaction, aspiration/injection mechanics, pressure-limited flow, persistent 3D local-fluid spread and ultrasound hydrodissection rendering with a React/TypeScript participant interface.

> **Important:** This software is an educational/research simulator. It is not a medical device and must not be used for clinical decision-making or patient care.

## Architecture principle

**THE UI DOES NOT SIMULATE. THE CORE SIMULATES. THE UI OBSERVES AND DISPATCHES ACTIONS.**

Simulation truth remains in deterministic canonical cores. UI layers only dispatch typed actions and render canonical snapshots.

## Current technical status

- MVP A1-A4: geometry, probe pose, scan plane, ACB anatomy, deterministic geometry queries
- MVP B1-B4: acoustic tissue model, B-mode field, beam/acquisition physics, completed ultrasound physics
- Ultrasound Core: technically frozen
- MVP C1-C4: needle geometry, scan-plane intersection, acoustic visibility, tissue traversal, frozen needle interaction state
- Needle Core: technically frozen
- MVP D1-D4: aspiration/injection actions, pressure-limited actual flow, persistent 3D fluid spread, ultrasound hydrodissection overlay
- Trainer A1: React/TypeScript participant shell with Dedicated Web Worker and deterministic replay

## Quick start

```bash
npm install --prefix apps/regional-anesthesia-trainer
npm run dev
```

Validation commands:

```bash
npm run test
npm run typecheck
npm run build
```

## Roadmap

- Trainer A2: real probe manipulation + synchronized patient/probe 3D scene
- Trainer A3: real needle manipulation + C1/C2 coupling
- Trainer A4: complete syringe/pressure/injection/spread/hydrodissection interaction
- Trainer A5: cases, participant/instructor separation, replay and debriefing
- Later: assessment, curriculum and clinical validation

## Validation and safety

See `docs/VALIDATION.md` for the distinction between deterministic engineering validation and future clinical validation.

## License

Apache-2.0. See `LICENSE`.
