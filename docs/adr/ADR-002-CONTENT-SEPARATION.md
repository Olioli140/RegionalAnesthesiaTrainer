# ADR-002 — Educational content is separated from simulation logic

Status: Accepted

Learning text, block descriptions, objectives, coaching, quiz/debriefing and instructor notes belong to the Content System and are loaded for presentation. Content may reference canonical IDs but may not contain executable simulation rules or direct state mutations.

Reason: enables review, localization and curriculum growth without coupling every copy change to simulation code.