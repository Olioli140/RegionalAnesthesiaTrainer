# Trainer A4 Playtest / Polish

## Purpose

Validate the first complete probe -> needle -> aspiration -> injection -> spread workflow before the next feature sprint. This remains an engineering/education sandbox, not clinical validation.

## Playtest matrix

1. **Orientation / reset** — start from a clean session, identify probe, needle, ultrasound and injection state.
2. **Probe-first workflow** — slide/rotate the probe and confirm synchronized spatial and ultrasound state.
3. **Needle-first workflow** — move entry point, steer in/out of plane and advance/retract while preserving current probe state.
4. **Combined targeting** — alternate probe and needle changes and confirm the worker remains the single simulation truth.
5. **Aspiration workflow** — aspirate before injection and surface the returned result clearly.
6. **Normal injection** — set requested flow, start injection, advance time, stop; verify delivered + remaining volume balance.
7. **Pressure-limited injection** — request a high flow and verify actual flow, max flow, line pressure and pressure-limited status remain internally consistent.
8. **Spread / hydrodissection** — verify delivered fluid produces D3 spread/depot state and D4 ultrasound overlay state.
9. **Replay** — run a mixed probe/needle/injection sequence and verify deterministic replay MATCH.
10. **Mobile / touch** — verify controls remain reachable at narrow viewport widths and primary procedure state is not buried behind developer output.

## Findings

- Simulation coupling is suitable for continued development: A2 probe, A3 spatial needle and A4 D1-D4 injection states coexist without moving simulation truth into React.
- The participant workflow is currently too engineering-oriented: controls and raw metrics have equal visual weight, and developer state occupies a large part of the page.
- Injection feedback needs a single high-salience status block instead of requiring the learner to interpret several small metrics.
- Mobile layouts need larger touch targets and the developer inspector should be visually de-emphasized.
- The patient/probe illustration is intentionally schematic and remains a future visual-fidelity sprint; this playtest does not treat it as anatomical validation.

## Polish applied

- Added a procedure status strip for needle relation, injection state, aspiration result and pressure limitation.
- Added an injection progress/pressure block with requested vs actual flow and syringe fill visualization.
- Grouped controls into clearer procedure stages.
- Moved developer state into a collapsible details element.
- Increased touch target size and improved narrow-screen layout.
- Added explicit educational/engineering-sandbox language.

## Exit criteria

- Existing A2/A3/A4 regression tests remain green.
- Production build remains green.
- No canonical core changes.
- Deterministic replay remains green.
- UI remains usable at desktop and mobile breakpoints.
