# Adductor Canal Reference Stack v0.1 — P1

Status: **five-frame high-resolution synthetic visual reference stack**  
Scope: coherent presentation-reference assets and validation only.  
Project status: educational / research engineering; not a medical device; not for patient care.

## Reference stack

The stack contains five normal binary WebP files representing an ordered adductor-canal reference sequence:

| Station | Normalized position | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| proximal | 0.00 | 640 × 720 | 91,066 | `af039bfe159e604c96037411a43f6cb74bc97ee17024d140ec462ef8d3df08d1` |
| proximal-mid | 0.25 | 640 × 720 | 91,536 | `ae333848e9b5ac1f6e54e42a4c7c92b13315d988681bea2ec680e1fc289149e7` |
| mid | 0.50 | 640 × 720 | 92,124 | `d875a18d2f624f66c1d3ef91e75977589987328d883bb9213435108a49932955` |
| mid-distal | 0.75 | 640 × 720 | 89,730 | `20b9a3671f9f11bafcbc1199f1d92b3165ab86b2f8dbe30342d411c35477618b` |
| distal | 1.00 | 640 × 720 | 91,500 | `01ed9dbf2acc3fc4435f5170a89edbfee8128fd00d466e3fe272be243f841558` |

Repository path:

`apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/`

Total encoded stack size: **455,956 bytes**.

## Provenance and generation

The P1 frames are project-generated synthetic reference imagery. They do not contain copied patient images or external clinical source pixels.

The checked-in binary files were produced by:

`scripts/generate-adductor-reference-stack.py`

The generator uses deterministic seeds plus procedural layers for:

- superficial skin/subcutaneous texture,
- fascia interfaces,
- sartorius/vastus/adductor muscle texture,
- artery and vein lumens/walls,
- posterior acoustic enhancement,
- a fascicular saphenous-nerve reference,
- depth attenuation, speckle and anisotropy-like presentation effects.

The binary generation run used Python 3.12, NumPy 2.5.2 and Pillow 12.3.0. Encoder-version changes may alter binary hashes, so normal CI validates the checked-in assets rather than silently regenerating them.

These images are **not** claimed to be clinically validated, diagnostic, scanner-matched or equivalent to real patient ultrasound. They are a higher-resolution visual-reference layer for engineering development. Clinical/visual calibration against appropriately licensed reference material remains future work.

## Architecture boundary

These assets are presentation-reference material only. They must not determine:

- anatomy truth,
- probe pose or scan-plane truth,
- needle geometry or interaction,
- injection/spread state,
- complications or safety metrics,
- replay state,
- RNG/deterministic simulation state.

The Worker/canonical cores remain the sole Simulation Truth.

## P1 acceptance gate

P1 passes only when:

1. all five frames exist as normal binary WebP repository assets,
2. the exact five-file set survives the Vite production build,
3. every frame has a valid RIFF/WEBP/VP8 structure,
4. RIFF-declared length exactly matches file length,
5. every frame remains 640 × 720 and matches its locked byte size and SHA-256,
6. the complete stack remains below the 600 kB P1 budget,
7. no image data is embedded in TypeScript, JavaScript, JSON, CSS or HTML,
8. no `chunk*.ts` / `adductorRealistic` text-chunk workflow is introduced,
9. manifest order and normalized positions remain deterministic,
10. existing core, trainer, replay, needle, injection and production-build tests stay green.

## Explicitly out of scope

P1 does **not** yet:

- overlay these assets on the participant ultrasound viewport,
- cross-fade adjacent frames,
- use probe position to select or blend frames at runtime,
- modify the A6.8/V6 synthetic ultrasound renderer,
- modify canonical anatomy, probe, needle, injection, replay or RNG logic.

The next integration sprint must preserve canonical Needle and Injection visibility and must derive any frame-selection/blend state from canonical worker-owned probe/scan-plane state.
