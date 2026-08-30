# Asset Pipeline

## Pipeline stages

```text
SOURCE
 -> MASTER
 -> PROCESS / GENERATE
 -> QC
 -> METADATA
 -> OPTIMIZE
 -> VERSIONED PRODUCTION ASSET
 -> REGISTRY
 -> RUNTIME DELIVERY
```

## Source

Record origin, author/source organization where known, source URL/reference if redistributable, license, acquisition/generation method and restrictions. `UNKNOWN` is a valid temporary metadata state; guessing is not.

## Master

Highest-quality project-controlled representation. Masters are not automatically runtime assets and may eventually live in LFS or external storage if large.

## Processing / generation

Transformations must be reproducible where practical: crop, resize, normalize, encode, synthetic generation, sequence extraction and metadata generation. Tools belong under `tools/asset-pipeline/` or existing `scripts/` during transition.

## Quality control

QC is type-specific. Ultrasound media should check anatomy plausibility, visual artifacts, coherence across a sweep, aspect/depth consistency, labels/privacy, file integrity and compatibility with dynamic needle/injection overlays.

QC status does not equal clinical validation.

## Metadata and optimization

Every production asset receives a stable ID/version, checksum, dimensions/duration, media type, region/view, provenance/license state, quality status, validation status and replacement/deprecation fields.

Runtime formats should prioritize browser delivery and offline practicality (e.g. WebP for current still images). Source/master format may differ.

## Runtime delivery

Software resolves stable Asset IDs through a registry/loader. Components should not invent paths or infer semantic meaning from filenames.

Missing optional media should fail gracefully to a validated synthetic/UI fallback. Missing required production media should fail CI/build validation.

## Ultrasound-specific rule

Anatomical reference, simulation geometry, rendering input, generated ultrasound output, curated training asset and runtime asset are distinct artifacts. A visual reference can influence presentation calibration but cannot mutate canonical geometry or state.