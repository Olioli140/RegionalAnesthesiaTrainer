# Adductor Canal Reference Stack v0.1 — P0

Status: **pipeline proof of concept**  
Scope: visual asset transport/loading only.  
Project status: educational / research engineering; not a medical device; not for patient care.

## Asset

`apps/regional-anesthesia-trainer/public/assets/ultrasound/adductor-canal/v0.1/mid.webp`

- station: mid adductor canal
- dimensions: 256 × 288 px
- encoded size: 6,476 bytes
- SHA-256: `0ce58f4b8b2aa505c0cb6703736b2ce3460564a77013c146231b5bcb50e62371`
- format: WebP binary file
- source: project-generated synthetic engineering reference
- external clinical/patient source data: none
- intended use: validate the binary visual-asset pipeline before a higher-fidelity reference stack is introduced

The image is intentionally a lightweight P0 engineering asset. It is **not** claimed to be photorealistic, clinically validated, diagnostic, scanner-matched, or a substitute for real ultrasound teaching material.

## Architecture boundary

The asset is presentation reference material only. It must not determine:

- anatomy truth,
- probe pose or scan-plane truth,
- needle geometry or interaction,
- injection/spread state,
- complications or safety metrics,
- replay state,
- RNG/deterministic simulation state.

The Worker/canonical cores remain the sole Simulation Truth.

## P0 acceptance gate

P0 passes only when:

1. the WebP exists as a normal binary repository asset,
2. the public path survives the Vite production build,
3. the file has a valid RIFF/WEBP header,
4. no image data is embedded in TypeScript, JavaScript, JSON, CSS, or HTML,
5. no `chunk*.ts` / adductor-realistic text-chunk workflow is introduced,
6. existing core, trainer, replay, needle, injection, and build tests stay green.

## Explicitly out of scope

P0 does **not** yet:

- overlay the asset on the participant ultrasound viewport,
- blend adjacent frames,
- introduce probe-position frame selection,
- alter the A6.8/V6 synthetic ultrasound appearance,
- modify any canonical core.

Those steps require their own regression gate so that Needle and Injection visibility cannot be accidentally obscured.
