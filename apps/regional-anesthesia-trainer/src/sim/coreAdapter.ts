import { vec3 } from '../../../../cores/regional-anesthesia/geometry/geometry.js';
import { createNeedleGeometry } from '../../../../shared/contracts/regional-anesthesia/needle.js';
import { createAdductorCanalAnatomy, ADDUCTOR_CANAL_PRESET } from '../../../../cores/regional-anesthesia/anatomy/adductor-canal-dataset.js';
import { getAdductorCanalGoldenPose, ADDUCTOR_CANAL_GOLDEN_POSE_ID } from '../../../../cores/regional-anesthesia/anatomy/adductor-canal-golden-poses.js';
import { resolveScanPlane } from '../../../../cores/regional-anesthesia/scan-plane/scan-plane-resolver.js';
import { createCompletedUltrasoundPhysicsField } from '../../../../cores/regional-anesthesia/ultrasound/ultrasound-physics-completion.js';
import { createNeedleInteractionSnapshot } from '../../../../cores/regional-anesthesia/needle/needle-interaction.js';
import { createInjectionActionState, INJECTION_ACTION } from '../../../../cores/regional-anesthesia/injection/injection-actions.js';
import { createPressureFlowState, reducePressureFlowAction } from '../../../../cores/regional-anesthesia/injection/injection-pressure-flow.js';
import { createInjectionSpreadState, advanceInjectionSpread } from '../../../../cores/regional-anesthesia/injection/injection-spread.js';
import { createFluidUltrasoundOverlay } from '../../../../cores/regional-anesthesia/injection/injection-ultrasound-spread.js';
import { TRAINER_PROTOCOL_VERSION, type TrainerAction, type TrainerSnapshot } from '../protocol';

const CASE_ID = 'ACB_TECHNICAL_SANDBOX_V1' as const;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

interface EngineState {
  insertionFraction: number;
  timeSec: number;
  pressureFlowState: any;
  spreadState: any;
  replayMatches: boolean | null;
}

export class RegionalTrainerEngine {
  private dataset: any;
  private scanPlane: any;
  private baseField: any;
  private needle: any;
  private state!: EngineState;
  private actionLog: TrainerAction[] = [];

  constructor() {
    this.dataset = createAdductorCanalAnatomy(ADDUCTOR_CANAL_PRESET.STANDARD);
    const pose = getAdductorCanalGoldenPose(ADDUCTOR_CANAL_GOLDEN_POSE_ID.TRANSVERSE_TARGET);
    this.scanPlane = resolveScanPlane(pose.probeState, pose.scanSettings);
    this.baseField = createCompletedUltrasoundPhysicsField({
      dataset: this.dataset,
      scanPlane: this.scanPlane,
      seed: 'trainer-a1-acb-sandbox',
      widthPx: 160,
      heightPx: 192,
      elevationalSamples: 3,
      frequencyMHz: 12,
      focusDepthMm: 42
    });
    this.needle = createNeedleGeometry({
      id: 'trainer-a1-needle',
      entryPointMm: vec3(-22, -5, 0),
      tipPointMm: vec3(1, 43, 0),
      diameterMm: 0.8
    });
    this.reset();
  }

  private needleInteraction() {
    return createNeedleInteractionSnapshot({
      dataset: this.dataset,
      needle: this.needle,
      scanPlane: this.scanPlane,
      baseField: this.baseField,
      insertionFraction: this.state.insertionFraction
    });
  }

  reset(): TrainerSnapshot {
    const insertionFraction = 0.25;
    const needleInteraction = createNeedleInteractionSnapshot({
      dataset: this.dataset,
      needle: this.needle,
      scanPlane: this.scanPlane,
      baseField: this.baseField,
      insertionFraction
    });
    const injectionState = createInjectionActionState({
      needleInteraction,
      initialVolumeMl: 20,
      requestedFlowMlPerMin: 6
    });
    const pressureFlowState = createPressureFlowState({ injectionState, pressureLimitKPa: 20 });
    const spreadState = createInjectionSpreadState({ pressureFlowState });
    this.state = { insertionFraction, timeSec: 0, pressureFlowState, spreadState, replayMatches: null };
    this.actionLog = [];
    return this.snapshot();
  }

  dispatch(action: TrainerAction, record = true): TrainerSnapshot {
    if (action.type === 'RESET') return this.reset();
    if (action.type === 'REPLAY') return this.verifyReplay();

    const needleInteraction = this.needleInteraction();
    if (action.type === 'SET_INSERTION_FRACTION') {
      this.state.insertionFraction = clamp(action.fraction, 0, 1);
    } else {
      const mapped = this.mapInjectionAction(action);
      this.state.pressureFlowState = reducePressureFlowAction(
        this.state.pressureFlowState,
        mapped,
        { needleInteraction }
      );
      if (action.type === 'ADVANCE_TIME') this.state.timeSec += action.deltaSec;
      this.state.spreadState = advanceInjectionSpread(this.state.spreadState, this.state.pressureFlowState);
    }

    this.state.replayMatches = null;
    if (record) this.actionLog.push(structuredClone(action));
    return this.snapshot();
  }

  private mapInjectionAction(action: Exclude<TrainerAction, { type: 'RESET' | 'REPLAY' | 'SET_INSERTION_FRACTION' }>) {
    switch (action.type) {
      case 'ASPIRATE': return { type: INJECTION_ACTION.ASPIRATE };
      case 'START_INJECTION': return { type: INJECTION_ACTION.START_INJECTION };
      case 'STOP_INJECTION': return { type: INJECTION_ACTION.STOP_INJECTION };
      case 'SET_REQUESTED_FLOW': return { type: INJECTION_ACTION.SET_REQUESTED_FLOW, flowMlPerMin: action.flowMlPerMin };
      case 'ADVANCE_TIME': return { type: INJECTION_ACTION.ADVANCE_TIME, deltaSec: action.deltaSec };
    }
  }

  private comparableSnapshot(snapshot: TrainerSnapshot) {
    const { replayMatches: _replayMatches, developer: _developer, ...stable } = snapshot;
    return stable;
  }

  verifyReplay(): TrainerSnapshot {
    const replay = new RegionalTrainerEngine();
    for (const action of this.actionLog) replay.dispatch(action, true);
    const matches = JSON.stringify(this.comparableSnapshot(replay.snapshot())) === JSON.stringify(this.comparableSnapshot(this.snapshot()));
    this.state.replayMatches = matches;
    return this.snapshot();
  }

  snapshot(): TrainerSnapshot {
    const needleInteraction = this.needleInteraction();
    const injection = this.state.pressureFlowState.injectionState;
    const ultrasound = createFluidUltrasoundOverlay({
      baseField: needleInteraction.acoustics,
      spreadState: this.state.spreadState,
      scanPlane: this.scanPlane
    });

    return {
      protocolVersion: TRAINER_PROTOCOL_VERSION,
      caseId: CASE_ID,
      timeSec: this.state.timeSec,
      insertionFraction: this.state.insertionFraction,
      aspiration: injection.lastAspiration?.result ?? null,
      injectionActive: injection.injectionActive,
      requestedFlowMlPerMin: injection.requestedFlowMlPerMin,
      actualFlowMlPerMin: this.state.pressureFlowState.lastFlowSolution.actualFlowMlPerMin,
      linePressureKPa: this.state.pressureFlowState.linePressureKPa,
      deliveredVolumeMl: injection.syringe.deliveredVolumeMl,
      remainingVolumeMl: injection.syringe.remainingVolumeMl,
      spreadVolumeMl: this.state.spreadState.totalSpreadVolumeMl,
      depotCount: this.state.spreadState.depots.length,
      actionCount: this.actionLog.length,
      replayMatches: this.state.replayMatches,
      ultrasound: {
        widthPx: ultrasound.widthPx,
        heightPx: ultrasound.heightPx,
        pixels: Array.from(ultrasound.pixels)
      },
      developer: {
        needle: {
          kind: needleInteraction.kind,
          insertionFraction: needleInteraction.insertionFraction,
          activeStructureIds: needleInteraction.insertion.activeStructureIds,
          crossedEvents: needleInteraction.insertion.crossedEvents,
          tipPointMm: needleInteraction.insertion.tipPointMm
        },
        pressureFlow: {
          kind: this.state.pressureFlowState.kind,
          pressureLimitKPa: this.state.pressureFlowState.pressureLimitKPa,
          lastFlowSolution: this.state.pressureFlowState.lastFlowSolution
        },
        spread: {
          kind: this.state.spreadState.kind,
          totalSpreadVolumeMl: this.state.spreadState.totalSpreadVolumeMl,
          depots: this.state.spreadState.depots
        }
      }
    };
  }
}
