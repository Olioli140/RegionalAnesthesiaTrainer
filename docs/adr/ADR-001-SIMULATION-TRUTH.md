# ADR-001 — Simulation Truth remains canonical

Status: Accepted

Simulation Truth remains exclusively in canonical cores/domain modules executed through the worker-controlled action path. React, educational content and media assets cannot calculate or mutate canonical anatomy, physics, needle/injection state or replay state.

Reason: preserves determinism, replay, validation and testability while UI/content/media evolve independently.