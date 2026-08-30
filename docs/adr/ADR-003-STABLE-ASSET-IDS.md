# ADR-003 — Media uses stable Asset IDs

Status: Accepted

Production media is referenced by stable IDs and versioned registry entries rather than semantic meaning inferred from filenames. Filenames remain implementation details of a production asset version.

Reason: enables replacement, deprecation, provenance tracking, storage migration and reproducible integration freezes without rewriting every consumer.