# Current Architecture Audit

Audit baseline: `main` at `ffa385bea7ac02a35aada05a2ec113ec157656cd`.

## Executive finding

The current repository already has a strong software core boundary, but it does not yet have first-class Data, Content and Media systems. The main scaling risk is therefore not the canonical simulation architecture; it is the increasing amount of declarative knowledge and visual material embedded in software paths.

## Software System — current

### Application

`apps/regional-anesthesia-trainer`

- React/Vite application.
- `App.tsx` owns trainer UI and dispatches TrainerActions.
- `simulation.worker.ts` owns the worker execution boundary.
- `coreAdapter.ts` composes canonical core modules and creates snapshots/replay checks.
- `UltrasoundCanvas.tsx` renders the current hybrid visual presentation.
- `ProbeScene.tsx` is presentation/input for probe/needle manipulation.
- `NerveBlockAtlas.tsx` combines UI, educational content and procedural visual definitions.

### Canonical cores

`cores/regional-anesthesia/`

- anatomy: adductor-canal dataset/detail/golden poses;
- geometry;
- probe;
- scan-plane;
- ultrasound physics/appearance/calibration;
- needle geometry/acoustics/interaction/traversal;
- injection actions/pressure-flow/spread/ultrasound overlay.

### Contracts

`shared/contracts/regional-anesthesia/` contains anatomy, needle, probe, scan-plane and ultrasound-acoustics contracts.

### Tests

- public core smoke test;
- appearance renderer tests;
- trainer Vitest suites for core adapter, probe, needle, injection, imaging, atlas and hybrid reference behavior.

## Data System — current

There is no top-level Data System yet. Machine-readable truth/configuration is primarily encoded as JavaScript/TypeScript constants inside core or UI modules.

Examples:

- `cores/.../anatomy/adductor-canal-dataset.js` — canonical anatomy definitions.
- `cores/.../anatomy/adductor-canal-golden-poses.js` — golden pose definitions.
- imaging presets inside `coreAdapter.ts`.
- five-frame media metadata in `adductorCanalReferenceStack.ts`.

This is stable today but will scale poorly across many block regions and configurations.

## Content System — current

No separate content tree exists. `NerveBlockAtlas.tsx` contains names, regions, targets, positioning, sonographic landmarks, orientation instructions, needle-tip guidance and status for ten blocks inline in React.

This is the clearest current separation-of-concerns violation. It does **not** currently violate Simulation Truth, but it couples educational review/localization/versioning to software releases.

## Media System — current

Binary runtime media currently consists of five WebP adductor-canal reference frames under:

`apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/`

Total encoded size: 455,956 bytes. All are small enough for ordinary Git at present.

Media generation/validation tooling already exists:

- `scripts/generate-adductor-reference-stack.py`
- `scripts/check-ultrasound-assets.mjs`
- `docs/ADDUCTOR_CANAL_REFERENCE_STACK_V0_1.md`

The atlas also contains multiple procedural visual definitions embedded directly in `NerveBlockAtlas.tsx`; these are code-generated visuals rather than external media files.

## Storage audit

`.gitattributes` contains only text normalization; Git LFS is not configured. At the present binary-media volume (~0.46 MB), this is appropriate. LFS would add operational complexity without benefit today.

## Hard-coded coupling / migration candidates

Priority 1:
- educational `NERVE_BLOCKS` content embedded in React;
- runtime asset filenames/metadata represented by TypeScript arrays rather than a central cross-media registry.

Priority 2:
- imaging presets embedded in `coreAdapter.ts`;
- atlas procedural visual descriptors embedded in React.

Priority 3 / high risk:
- anatomy dataset and golden poses embedded in canonical JavaScript modules. Do not migrate until parity tests exist.

## Duplicates / remnants

No Base64/chunk ultrasound image workflow is present on current `main`. Current media consists of normal WebP files. The five-frame manifest intentionally duplicates path/dimension/hash information already checked by the asset guard; Phase 0 centralizes cross-media catalog metadata without removing this validated runtime manifest yet.

## Architecture violations assessment

- **React -> simulation formulas:** no direct violation found in the current trainer path; `coreAdapter`/worker remains the simulation bridge.
- **Content -> simulation mutation:** no direct violation found.
- **Image -> simulation truth:** no direct violation found; hybrid images are presentation-only.
- **UI -> direct core mutation:** current participant UI uses TrainerActions/worker.
- **Content mixed with UI:** yes, notably `NerveBlockAtlas.tsx`.
- **Media metadata mixed with app code:** yes, current reference-stack manifest.

## Recommendation

Preserve current software cores. Build v2 outward around them: registry/schema validation first, then content extraction, then lower-risk data extraction. Database is not required now.