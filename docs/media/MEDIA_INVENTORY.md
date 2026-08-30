# Media Inventory

Audit baseline: `main` at `ffa385bea7ac02a35aada05a2ec113ec157656cd`.

## Binary runtime assets

| Future Asset ID | Type | Path | Size | Use | License | Status | Duplicate |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `us_adductor_canal_proximal_v0_1` | ultrasound-image | `apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/proximal.webp` | 91,066 B | adductor reference stack | UNKNOWN | production-reference | none identified |
| `us_adductor_canal_proximal_mid_v0_1` | ultrasound-image | `apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/proximal-mid.webp` | 91,536 B | adductor reference stack | UNKNOWN | production-reference | none identified |
| `us_adductor_canal_mid_v0_1` | ultrasound-image | `apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/mid.webp` | 92,124 B | hybrid runtime reference | UNKNOWN | production-reference | none identified |
| `us_adductor_canal_mid_distal_v0_1` | ultrasound-image | `apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/mid-distal.webp` | 89,730 B | adductor reference stack | UNKNOWN | production-reference | none identified |
| `us_adductor_canal_distal_v0_1` | ultrasound-image | `apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/distal.webp` | 91,500 B | adductor reference stack | UNKNOWN | production-reference | none identified |

Total binary runtime media: **455,956 bytes**.

Provenance known from existing project documentation: project-generated synthetic reference imagery produced by `scripts/generate-adductor-reference-stack.py`; no copied patient pixels are claimed. The documentation does not provide a dedicated explicit per-asset license declaration, therefore the inventory records license as **UNKNOWN** rather than inferring one from repository licensing.

## Procedural media-like visuals currently embedded in code

`apps/regional-anesthesia-trainer/src/components/NerveBlockAtlas.tsx` contains procedural ultrasound/probe reference definitions for adductor, femoral, popliteal, interscalene, supraclavicular and axillary blocks. These are not standalone binary assets and therefore do not yet receive production Asset Registry entries. They should be migrated later either to structured visual descriptors or to a formal media pack.

## Missing media classes

No checked-in standalone video, audio, 3D model or ultrasound sequence files were identified in the current recursive repository tree.

## Inventory policy

Future media additions must enter the inventory/registry before production use. Unknown license/provenance must remain explicitly `UNKNOWN` and cannot be silently promoted to validated production media.