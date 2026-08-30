# Data Architecture

## Purpose

The Data System contains versioned, machine-readable definitions such as anatomy data, block definitions, probe/needle profiles, scan parameters, presets, material/tissue properties, scenarios and golden poses.

## Current state

Today several important definitions are executable JavaScript inside `cores/regional-anesthesia`, notably the adductor-canal dataset and golden poses. They work and are already connected to validated core behavior, so Phase 0 does **not** move or rewrite them.

## Target pattern

```text
data/<domain>/<pack>.json|yaml
      -> schema validation
      -> explicit domain loader/adapter
      -> canonical core
```

Rules:

- data is declarative, not executable logic;
- IDs and versions are stable;
- schemas reject missing/invalid fields before runtime;
- changes that alter simulation output require deterministic regression tests;
- frozen data packs are immutable; corrections create a new version;
- core defaults remain available during migration until equivalent data packs are validated.

## Schema technology

Phase 0 uses JSON Schema as a dependency-free contract format. Node validation scripts enforce the high-value invariants needed by CI. A later phase may introduce Ajv or Zod when the number and complexity of schemas justify the dependency.

## Migration order

1. Asset registry/schema (low simulation risk).
2. Non-truth UI/atlas metadata.
3. Probe/needle/preset definitions.
4. Golden poses.
5. Anatomy datasets only after parity tests prove byte-/semantic-equivalent snapshots or explicitly versioned behavior.

## Database recommendation

**DATABASE LATER.** Static structured data is currently small, public, version-controlled and build-time validated. JSON/YAML plus schemas provide better reproducibility and offline development today.

A database becomes justified for mutable runtime/user data: accounts, progress, instructor sessions, analytics, annotations or a very large remotely managed catalog. These concerns must remain separate from canonical simulation definitions.