# Master Architecture v2 — Migration Plan

No big-bang rewrite. Every phase must leave the public simulator buildable and replay-compatible.

## Phase 0 — Architecture & Media Audit

- document current repository and boundaries;
- introduce ADRs;
- inventory media;
- introduce an asset registry/schema/CI validation without moving runtime assets.

Exit gate: current simulator behavior unchanged; all existing tests/build green; registry detects missing/invalid assets.

## Phase 1 — Boundary Enforcement

- architecture lint/tests for forbidden import directions where practical;
- formalize loaders for data/content/media;
- no core movement.

## Phase 2 — Asset Registry Adoption

- runtime asset loader resolves stable IDs rather than hard-coded filenames;
- migrate current five-frame adductor stack first;
- keep fallback paths until integration validation.

## Phase 3 — Content Extraction

- extract `NERVE_BLOCKS` educational copy from React into validated content definitions;
- preserve UI snapshots/visible output;
- add content fallback behavior for invalid optional modules.

## Phase 4 — Structured Data Extraction

- migrate low-risk presets/profiles first;
- then golden poses;
- anatomy datasets last, only with deterministic parity fixtures.

## Phase 5 — Media Production Pipeline

- establish source/master/processed/production conventions;
- add QC metadata and reproducible optimization tools;
- support sequences/sweeps without bundling them into JS.

## Phase 6 — Storage Optimization

Trigger based on measured repository/media growth. Evaluate Git LFS for large tracked masters and release/object storage/CDN for large production packs or video. Keep an offline-development cache strategy.

## Phase 7 — Integration Validation

Validate worker/core determinism, replay, asset loading, content failure handling, GitHub Pages, needle/injection behavior and representative block packs.

## Phase 8 — Architecture Freeze

Publish compatible CORE/DATA/CONTENT/ASSET freeze records and an INTEGRATION FREEZE matrix.

## Immediate next migration after Phase 0

**Asset Registry Adoption P1:** replace the adductor-canal runtime filename lookup with stable asset IDs through one presentation-only asset loader, preserving all existing paths and fallback behavior.