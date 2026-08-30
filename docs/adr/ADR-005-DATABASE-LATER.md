# ADR-005 — No classical database for static platform definitions yet

Status: Accepted

Canonical static data, content metadata and asset registries remain version-controlled files with schemas and CI validation for now. A database is deferred until mutable/user-centric concerns such as profiles, progress, instructor sessions, analytics, annotations or a remotely managed catalog require one.

Reason: files currently provide stronger reproducibility, offline development and review with less operational complexity.