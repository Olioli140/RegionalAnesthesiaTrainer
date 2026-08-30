# Asset Versioning

## Identity

Asset identity and asset version are separate.

Example logical identity: `us_adductor_canal_mid`.

Versioned release: `us_adductor_canal_mid@1.1.0`.

Repository-safe IDs may include the pack/version suffix where needed during migration.

## Semantic intent

- PATCH: metadata correction or encoding-only change with no intended visual/anatomical meaning change.
- MINOR: compatible visual improvement such as speckle/contrast/QC improvement while preserving the declared view and purpose.
- MAJOR: anatomy correction, new rendering approach, changed view/meaning or other change that may invalidate prior visual calibration.

## Registry lifecycle

`draft -> review -> production -> deprecated -> retired`

A deprecated entry remains resolvable for old cases/replays where reproducibility requires it and points to `replacementAssetId` when available.

## Reproducibility

Scenarios/integration freeze records should eventually capture the media-pack version used for a validated build. Simulation replay correctness must never depend on visual media bytes; however the asset version is recorded so a historical visual presentation can be reconstructed.

## Immutability

Once an Asset Pack is frozen, binary bytes and checksums for that version do not change in place. Corrections create a new asset/pack version.