# System Boundaries

## Simulation Truth boundary

Simulation Truth is owned by canonical cores/domain modules executed through the worker path.

Allowed:

`React -> TrainerAction -> simulation.worker -> coreAdapter -> canonical cores -> snapshot -> React`

Not allowed:

- React calculating anatomy, physics, needle intersection, spread or outcome state.
- Content files dispatching hidden simulation mutations.
- Media pixels being interpreted as anatomy truth.
- UI components importing core functions to bypass Trainer Actions/Worker.

## Data boundary

Structured data may parameterize canonical cores only after schema validation and an explicit loader/domain adapter. Data does not become executable logic merely because it is machine-readable.

Data changes that affect simulation results require simulation tests and a DATA FREEZE review.

## Content boundary

Content is educational presentation: explanations, steps, goals, cases, quizzes, coaching, debriefing and instructor notes. A content loader may select text based on a snapshot, but content cannot directly alter the snapshot or core state.

## Media boundary

Media is presentation/reference material. The Asset Registry resolves stable IDs to production files. Rendering may composite media with canonical output, but an image/video cannot determine probe pose, anatomy, needle position, injection state or replay state.

**REFERENCE IMAGE != SIMULATION TRUTH.**

## Compatibility boundary

Every future data pack, content pack and media pack should expose a version and compatibility declaration. Integration tests validate combinations; individual pack upgrades must not silently change unrelated systems.