import { describe, expect, it } from 'vitest';
import { RegionalTrainerEngine } from './coreAdapter';

describe('RegionalTrainerEngine', () => {
  it('replays an action sequence deterministically', () => {
    const engine = new RegionalTrainerEngine();
    engine.dispatch({ type: 'SET_INSERTION_FRACTION', fraction: 0.72 });
    engine.dispatch({ type: 'ASPIRATE' });
    engine.dispatch({ type: 'SET_REQUESTED_FLOW', flowMlPerMin: 8 });
    engine.dispatch({ type: 'START_INJECTION' });
    engine.dispatch({ type: 'ADVANCE_TIME', deltaSec: 5 });
    engine.dispatch({ type: 'STOP_INJECTION' });
    const checked = engine.dispatch({ type: 'REPLAY' });
    expect(checked.replayMatches).toBe(true);
  });

  it('uses actual pressure-limited flow and D3 volume for spread', () => {
    const engine = new RegionalTrainerEngine();
    engine.dispatch({ type: 'SET_INSERTION_FRACTION', fraction: 0.35 });
    engine.dispatch({ type: 'SET_REQUESTED_FLOW', flowMlPerMin: 30 });
    engine.dispatch({ type: 'START_INJECTION' });
    const snapshot = engine.dispatch({ type: 'ADVANCE_TIME', deltaSec: 10 });
    expect(snapshot.deliveredVolumeMl).toBeGreaterThan(0);
    expect(snapshot.spreadVolumeMl).toBeCloseTo(snapshot.deliveredVolumeMl, 9);
    expect(snapshot.actualFlowMlPerMin).toBeLessThanOrEqual(snapshot.requestedFlowMlPerMin);
  });

  it('reset restores the canonical sandbox initial state', () => {
    const engine = new RegionalTrainerEngine();
    engine.dispatch({ type: 'SET_INSERTION_FRACTION', fraction: 0.9 });
    engine.dispatch({ type: 'ADVANCE_TIME', deltaSec: 4 });
    const snapshot = engine.dispatch({ type: 'RESET' });
    expect(snapshot.timeSec).toBe(0);
    expect(snapshot.insertionFraction).toBe(0.25);
    expect(snapshot.deliveredVolumeMl).toBe(0);
    expect(snapshot.actionCount).toBe(0);
  });
});
