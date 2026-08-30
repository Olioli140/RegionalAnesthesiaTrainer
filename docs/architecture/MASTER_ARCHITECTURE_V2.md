# Regional Anesthesia Trainer — Master Architecture v2

Status: Phase 0 / transition baseline

The RegionalAnesthesiaTrainer is treated as four connected systems:

1. **Software System** — executable simulation, UI, worker, canonical cores, replay, rendering and tests.
2. **Data System** — versioned machine-readable definitions used by software through validated contracts.
3. **Content System** — human-readable educational material. Content may describe simulation state but never mutate it directly.
4. **Media Production System** — source/master/processed/production assets plus provenance, QC and runtime delivery metadata.

## Non-negotiable invariants

- Public Apache-2.0 educational/research engineering project.
- Not a medical device and not for patient care.
- Engineering calibration is not clinical validation.
- Simulation Truth remains in canonical cores/domain modules and the Web Worker execution path.
- React does not calculate anatomy, ultrasound physics, needle geometry, injection spread or clinical state.
- Determinism, replay and reproducible snapshots remain protected.
- Frozen/validated cores are not silently rewritten to satisfy folder layout.
- Migration is additive and staged; no big-bang rewrite.

## Target dependency model

```text
UI / React
  -> Trainer Actions
  -> Worker
  -> Canonical Cores
  -> Validated Data Definitions

Content
  -> Content Loader
  -> UI presentation only

Asset Registry
  -> Asset Loader
  -> Renderer / UI presentation only

Media Production
  -> QC + Metadata + Optimization
  -> Production Assets
  -> Asset Registry
```

Forbidden dependency directions include `React -> simulation formulas`, `Content -> state mutation`, `Image -> simulation truth`, and `UI -> direct core mutation`.

## Repository target

The current executable paths stay in place during the transition. New systems are introduced alongside them:

```text
apps/                         # Software: applications
cores/                        # Software: canonical simulation cores
shared/contracts/             # Software contracts
shared/schemas/               # Schemas shared by data/content/media

data/                         # Structured definitions; initially additive
  anatomy/
  blocks/
  probes/
  needles/
  presets/
  scenarios/

content/                      # Educational content; initially additive
  blocks/
  anatomy/
  curriculum/
  cases/
  quizzes/
  debriefing/
  instructor/

media/                        # Media catalog and production metadata
  manifests/
  metadata/
  source/                     # normally not runtime-delivered
  masters/
  processed/
  production/                 # canonical production location in later phases

tools/                        # future pipeline tools
scripts/                      # existing automation retained during migration

docs/architecture/
docs/media/
docs/adr/
tests/
```

Runtime media currently remains under `apps/regional-anesthesia-trainer/public/assets/...` until the asset-loader migration is complete. Moving those files now would create unnecessary deployment risk.

## Freeze model

Separate freeze states are introduced conceptually:

- CORE FREEZE — executable simulation behavior.
- DATA FREEZE — structured simulation definitions and presets.
- CONTENT FREEZE / APPROVED — educational copy and curricula.
- ASSET FREEZE — a versioned production media pack and its manifest.
- INTEGRATION FREEZE — validated combination of compatible core/data/content/assets.

A media improvement therefore does not imply a core change, and a content revision does not invalidate deterministic simulation behavior unless its declared compatibility changes.

## Current transition decision

Phase 0 adds documentation, boundaries, registry/schema validation and inventory only. Existing canonical modules and runtime asset paths remain unchanged. The first runtime migrations must be small and independently reversible.