# Content Architecture

## Purpose

The Content System owns human-readable educational material: block descriptions, anatomy explanations, learning objectives, procedural steps, cases, coaching, quizzes, debriefing and instructor notes.

## Current state

`NerveBlockAtlas.tsx` currently contains block names, targets, patient positioning, sonographic landmarks, orientation guidance and needle-tip guidance inline in React. This is functional but couples educational copy to UI code and makes review/versioning difficult.

## Target pattern

```text
content/<domain>/<module>.md|json|yaml
      -> content validation
      -> content loader
      -> React presentation
```

Content may reference stable simulation/data/media IDs, but it cannot contain formulas or hidden state transitions.

## Proposed content metadata

Every publishable module should eventually expose at least:

- `id`
- `version`
- `status`: draft | review | approved | published | deprecated
- `language`
- `title`
- `contentType`
- `relatedBlockIds`
- optional `mediaAssetIds`
- optional `compatibleDataVersions`
- review/provenance metadata

## Workflow

Draft -> Review -> Approved -> Published.

Educational review is independent from core validation. A wording correction should not require a CORE FREEZE; a statement that implies new simulation behavior must be handled through a separate data/core change.

## Migration priority

First extract the `NERVE_BLOCKS` educational metadata from `NerveBlockAtlas.tsx` into a validated content/data boundary without changing visible UI output. Procedural SVG-like atlas rendering remains software/media-presentation code until a dedicated media migration.