# Media Architecture

## Principle

Media is a production system, not an unstructured pile of runtime files.

Pipeline:

```text
SOURCE
 -> MASTER ASSET
 -> PROCESSING / GENERATION
 -> QUALITY CONTROL
 -> METADATA
 -> OPTIMIZATION
 -> VERSIONED PRODUCTION ASSET
 -> ASSET REGISTRY
 -> RUNTIME DELIVERY
```

Supported classes include ultrasound images/sequences, probe sweeps, anatomy illustrations, needle assets, animation, video, audio, icons and future 3D assets.

## Repository layers

- `media/source/`: provenance/source references or small redistributable sources; never assumed runtime-ready.
- `media/masters/`: lossless/high-quality project masters where practical.
- `media/processed/`: intermediate outputs; usually generated and not all need Git history.
- `media/production/`: future canonical optimized production packs.
- `media/metadata/`: per-pack metadata and QC records.
- `media/manifests/`: stable asset registry consumed by tooling/runtime loaders.

During Phase 0, current production WebP files remain under `apps/.../public/assets` to preserve GitHub Pages behavior. The registry points at those existing files.

## Ultrasound separation

1. Anatomical reference — external/reference knowledge, never direct truth.
2. Simulation geometry — canonical anatomy/scan-plane definitions.
3. Ultrasound rendering input — core-owned physical/material state.
4. Generated ultrasound output — deterministic renderer output.
5. Curated training asset — reviewed visual material.
6. Runtime asset — optimized file delivered to the UI.

Reference images and curated media support visual fidelity but cannot replace worker/core state.

## QC requirements

A production media asset should have a stable ID, version, source/provenance, license status, checksum, dimensions/duration, quality status, validation status, creation method and deprecation/replacement metadata. Missing license information is `UNKNOWN`, never inferred.

## Storage trigger policy

Small optimized runtime assets may stay in Git now. Introduce Git LFS or external object storage only when media growth materially hurts clone/build performance. Large raw masters and video should not accumulate in normal Git history.