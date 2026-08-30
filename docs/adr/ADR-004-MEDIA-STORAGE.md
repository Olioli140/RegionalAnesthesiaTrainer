# ADR-004 — Large media is not accumulated blindly in Git

Status: Accepted

Small optimized runtime media may remain in normal Git while repository impact is low. Large masters, sequences, video and future 3D assets require an explicit storage decision (Git LFS, release/object storage/CDN or a dedicated media repository) based on measured size, clone/build cost, offline needs and reproducibility.

Reason: avoid premature infrastructure now while preventing uncontrolled repository growth later.