# Adductor Canal Reference Stack v0.1 — P1

Status: **five-frame visual reference stack**  
Scope: coherent presentation-reference assets and validation only.  
Project status: educational / research engineering; not a medical device; not for patient care.

## Reference stack

The stack contains five binary WebP frames representing a longitudinally ordered adductor-canal reference sequence:

| Station | Normalized position | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| proximal | 0.00 | 256 × 416 | 10,316 | `5cca43dce93fc4fa160a7e75de5cf55c8e26988ee9e9a0e8f273d41a85e1c20b` |
| proximal-mid | 0.25 | 256 × 405 | 9,616 | `168f341a8705a991ab7f60ac9d924a520670d9a5d3cb4e536e43c121d81403ef` |
| mid | 0.50 | 256 × 406 | 10,296 | `d75c7b6da5196f1b00ae7fc133dd45f42a67d022c22b98ec578e6926b2385447` |
| mid-distal | 0.75 | 256 × 419 | 10,386 | `427b346f1fd34a857005d13126315813e68109185ec576a015245276763c8f0b` |
| distal | 1.00 | 256 × 420 | 10,014 | `9a4bb737bcdbb02367488eeea66301dac71c776efb7cc629fe24cab9178037c1` |

Repository path:

`apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/`

Total encoded stack size: **50,628 bytes**.

## Provenance

The P1 frames are project-generated synthetic reference imagery created for this engineering pipeline. They do not contain copied patient images or external clinical source pixels.

The images are intended to establish:

- a coherent five-position asset set,
- binary WebP handling,
- deterministic metadata,
- build-time preservation,
- a clean basis for later interpolation/blending experiments.

They are **not** claimed to be clinically validated, diagnostic, scanner-matched, or a substitute for real ultrasound teaching material. Higher-fidelity visual calibration remains future work.

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
3. every frame matches its expected RIFF/WEBP signature, byte size and SHA-256,
4. total stack size remains below the P1 asset budget,
5. no image data is embedded in TypeScript, JavaScript, JSON, CSS, or HTML,
6. no `chunk*.ts` / `adductorRealistic` text-chunk workflow is introduced,
7. manifest order and normalized positions remain deterministic,
8. existing core, trainer, replay, needle, injection, and build tests stay green.

## Explicitly out of scope

P1 does **not** yet:

- overlay these assets on the participant ultrasound viewport,
- cross-fade adjacent frames,
- use probe position to select or blend frames at runtime,
- modify the A6.8/V6 synthetic ultrasound renderer,
- modify canonical anatomy, probe, needle, injection, replay or RNG logic.

The next integration sprint must preserve canonical Needle and Injection visibility and must derive any frame-selection state from canonical worker-owned probe/scan-plane state.
