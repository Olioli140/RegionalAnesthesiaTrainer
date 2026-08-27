# Contributing

Thank you for contributing to the Regional Anesthesia Trainer.

## Scope

This repository is an educational and research simulator. It is not a medical device and must not be used for clinical decision-making or patient care.

## Architecture boundary

The UI must not create simulation truth. React, Three.js and other presentation layers may dispatch typed actions and render canonical snapshots, but anatomy, ultrasound physics, needle state, tissue traversal, injection mechanics and spread remain owned by the deterministic simulation cores.

## Development workflow

1. Create a focused feature branch.
2. Keep engineering calibration separate from claims of clinical validation.
3. Add deterministic regression tests for simulation behavior.
4. Run `npm run test`, `npm run typecheck` and `npm run build` before opening a pull request.
5. Describe any calibration changes explicitly in the pull request.

## Clinical and scientific claims

Do not describe engineering-seed anatomy, acoustic values, pressure-flow constants or spread behavior as clinically validated unless dedicated validation evidence has been added and reviewed. Literature references should be traceable and primary sources are preferred where possible.
