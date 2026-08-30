# Trainer A6.8 – Anatomy & Ultrasound Realism Gate

Status: **Engineering calibration / educational simulation only**  
Scope: additive A6.8 realism work for the adductor-canal sandbox.  
This document does **not** claim clinical validation, diagnostic accuracy, or patient-care suitability.

## 1. Why A6.8 exists

A6.7–A6.7.3 repaired display scaling, tissue-windowed presentation, responsiveness and caching. The remaining visual limitation is primarily the simplified anatomical geometry and the lack of tissue-specific internal detail.

A6.8 therefore changes the synthetic image generator rather than adding another CSS filter:

- muscle boundaries gain small deterministic contour irregularities,
- muscle receives directed fascicle-like microstructure,
- fascia receives fine deterministic echogenic irregularity while retaining angle dependence,
- vessels retain dark lumina but gain a brighter wall signature and posterior enhancement,
- the saphenous nerve gains a subtle fascicular/honeycomb-like internal signature and epineurial edge,
- probe pressure produces a deterministic image-space flattening of the synthetic venous signature,
- legacy appearance profiles A6.1–A6.5 remain selectable for regression comparison.

The pressure effect is deliberately an **appearance-stage engineering approximation**, not a biomechanical deformable-tissue model. It must not be interpreted as quantitative venous mechanics.

## 2. Reference and license matrix

No external clinical image is copied into the repository by A6.8.

| Reference | License / access status | A6.8 use |
| --- | --- | --- |
| M. Fenech et al., *Ultrasound imaging of the femoral and saphenous nerves*, Australasian Journal of Ultrasound in Medicine, 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC11671740/ | CC BY 4.0 | Sonoanatomy and qualitative visual reference for femoral/saphenous nerve, surrounding muscles and vessels. No source image copied. |
| K.-V. Chang et al., *Ultrasound Imaging for the Cutaneous Nerves of the Extremities and Relevant Entrapment Syndromes: From Anatomy to Clinical Implications*, J Clin Med, 2018. https://pmc.ncbi.nlm.nih.gov/articles/PMC6262579/ | CC BY 4.0 | Qualitative reference for high-resolution peripheral-nerve appearance and saphenous-nerve localization. No source image copied. |
| W. Y. Wong et al., *Defining the Location of the Adductor Canal Using Ultrasound*, Regional Anesthesia and Pain Medicine, 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5318152/ | CC BY-NC-ND 4.0 | Anatomical/visual benchmark only. Because the work is NC-ND, its figures are **not** copied, modified, traced, or shipped as project assets. |

### Reference versus calibration

These references define qualitative target features and anatomical relationships. Numeric rendering coefficients in A6.8 are synthetic engineering calibration parameters. They are not measurements extracted from the cited clinical images and are not clinically validated.

## 3. A6.8 implementation boundaries

### Canonical state preserved

- React still observes snapshots and sends typed actions only.
- The Web Worker and canonical cores remain Simulation Truth.
- The existing canonical anatomy dataset file is not rewritten by A6.8; structure IDs, target-region ID, vessel radii, nerve radius, positions and injection/needle semantics are retained.
- No unseeded or runtime-random source is introduced.
- The original ellipsoid/cylinder/layer geometry kinds remain supported.

### Additive anatomy detail

A6.8 adds the separate module `adductor-canal-a6-8-detail.js`. It provides deterministic contour harmonics keyed to the existing muscle geometry IDs. The scan-plane resolver applies this profile only where an A6.8 contour detail exists; all other ellipsoids retain the legacy exact ellipse path.

The original anatomical dataset remains unchanged. The additive detail profile is explicitly identified as:

`A6_8_ANATOMY_REALISM_V1`

### Additive ultrasound appearance

`A6_ADDUCTOR_CANAL_V6` is the new default appearance profile. A6.1–A6.5 remain available and preserve their historical behavior.

The V6 presentation adds:

1. world-coordinate-coherent fascicle-like muscle texture,
2. subtle fascia ripple,
3. fascicular nerve microtexture,
4. echogenic vessel-wall and epineurial boundary emphasis,
5. gentle interface blending for non-protected soft-tissue edges,
6. pressure-driven synthetic venous flattening,
7. the previously existing vessel posterior enhancement, fascia shadowing, anisotropy, gain control and pose-coherent speckle.

## 4. Measurable realism gate

A6.8 passes only when all of the following are true.

| Gate | Evidence |
| --- | --- |
| No muscle cross-section is forced to remain a mathematically perfect ellipse | Public core smoke verifies `irregular-ellipse` for the Sartorius reference section and the A6.8 harmonic profile. |
| Muscle texture contains deterministic internal structure beyond homogeneous speckle | Appearance test compares A6.5 with A6.8 and requires a non-trivial frame delta. |
| Nerve has internal texture and a brighter outer boundary | Synthetic nerve-patch test verifies internal variation and boundary-versus-center contrast. |
| Vessel has a dark lumen with a distinguishable echogenic wall | Synthetic artery-patch test requires higher boundary than center intensity; existing posterior-enhancement regression remains active. |
| Probe pressure visibly changes venous appearance | Appearance test requires fewer visible vein-class pixels at high pressure; trainer test requires a frame delta between pressure 0 and 1. |
| Small pose changes remain deterministic and continuous | Existing world-coordinate continuity and probe-manipulation tests remain active. |
| Gain, depth, focus and dynamic range have distinct effects | Existing A6.5 worker-controlled imaging tests remain active. |
| Replay remains exact | Existing mixed probe/needle/injection replay plus imaging replay tests remain active. |
| No UI action computes Simulation Truth | No React simulation code added; all A6.8 image logic remains under cores/worker path. |
| Build integrity | Core tests, trainer tests, TypeScript typecheck and production build must all pass in CI. |

## 5. Honest limitations after A6.8

Even if all tests pass, A6.8 must not be described as photorealistic or clinically validated.

Known limitations:

- synthetic 2D B-mode presentation from simplified 3D primitives,
- no biomechanical finite-element tissue deformation,
- venous compression is a deterministic image-space approximation,
- no Doppler or physiological pulsatility waveform is simulated in this sprint,
- muscle fascicles and nerve fascicles are procedural visual signatures rather than histology-derived meshes,
- vessel wall thickness is an image-space signature, not a quantitative wall measurement,
- the simulator remains an engineering training model rather than a medical device.

## 6. Deployment validation

After merge:

1. confirm PR CI is green,
2. confirm the custom `Deploy Trainer Preview` Pages workflow succeeds,
3. open the exact production URL and verify that the React trainer—not a generic Jekyll README—is served,
4. exercise presets, probe slide/rotation/tilt/rock/pressure, needle controls, aspiration, injection start/stop, time advance, replay and reset,
5. compare the A6.8 ultrasound visually with the A6.7.3 baseline and record remaining schematic features.

If the final browser image remains visibly schematic, A6.8 is a measurable improvement but **not** a realism freeze.
