import assert from 'node:assert/strict';
import { vec3 } from '../cores/regional-anesthesia/geometry/geometry.js';
import { createNeedleGeometry } from '../shared/contracts/regional-anesthesia/needle.js';
import { createAdductorCanalAnatomy, ADDUCTOR_CANAL_PRESET } from '../cores/regional-anesthesia/anatomy/adductor-canal-dataset.js';
import { getAdductorCanalGoldenPose, ADDUCTOR_CANAL_GOLDEN_POSE_ID } from '../cores/regional-anesthesia/anatomy/adductor-canal-golden-poses.js';
import { resolveScanPlane } from '../cores/regional-anesthesia/scan-plane/scan-plane-resolver.js';
import { createCompletedUltrasoundPhysicsField } from '../cores/regional-anesthesia/ultrasound/ultrasound-physics-completion.js';
import { createNeedleInteractionSnapshot } from '../cores/regional-anesthesia/needle/needle-interaction.js';
import { createInjectionActionState, INJECTION_ACTION } from '../cores/regional-anesthesia/injection/injection-actions.js';
import { createPressureFlowState, reducePressureFlowAction } from '../cores/regional-anesthesia/injection/injection-pressure-flow.js';
import { createInjectionSpreadState, advanceInjectionSpread } from '../cores/regional-anesthesia/injection/injection-spread.js';
import { createFluidUltrasoundOverlay } from '../cores/regional-anesthesia/injection/injection-ultrasound-spread.js';

function runScenario() {
  const dataset = createAdductorCanalAnatomy(ADDUCTOR_CANAL_PRESET.STANDARD);
  const pose = getAdductorCanalGoldenPose(ADDUCTOR_CANAL_GOLDEN_POSE_ID.TRANSVERSE_TARGET);
  const scanPlane = resolveScanPlane(pose.probeState, pose.scanSettings);
  const baseField = createCompletedUltrasoundPhysicsField({ dataset, scanPlane, seed: 'public-smoke', widthPx: 40, heightPx: 48, elevationalSamples: 3 });
  const needle = createNeedleGeometry({ id: 'public-smoke-needle', entryPointMm: vec3(-22, -5, 0), tipPointMm: vec3(1, 43, 0), diameterMm: 0.8 });
  const c4 = createNeedleInteractionSnapshot({ dataset, needle, scanPlane, baseField, insertionFraction: 0.72 });
  const d1 = createInjectionActionState({ needleInteraction: c4, initialVolumeMl: 10, requestedFlowMlPerMin: 8 });
  let d2 = createPressureFlowState({ injectionState: d1, pressureLimitKPa: 20 });
  let d3 = createInjectionSpreadState({ pressureFlowState: d2 });
  d2 = reducePressureFlowAction(d2, { type: INJECTION_ACTION.START_INJECTION }, { needleInteraction: c4 });
  d2 = reducePressureFlowAction(d2, { type: INJECTION_ACTION.ADVANCE_TIME, deltaSec: 5 }, { needleInteraction: c4 });
  d3 = advanceInjectionSpread(d3, d2);
  const d4 = createFluidUltrasoundOverlay({ baseField: c4.acoustics, spreadState: d3, scanPlane });
  return { baseField, c4, d2, d3, d4 };
}

const a = runScenario();
const b = runScenario();
assert.equal(a.baseField.kind, 'DETERMINISTIC_COMPLETED_ULTRASOUND_PHYSICS_FIELD');
assert.equal(a.c4.kind, 'FROZEN_NEEDLE_INTERACTION_STATE');
assert.equal(a.d2.kind, 'DETERMINISTIC_INJECTION_PRESSURE_FLOW_STATE');
assert.equal(a.d3.kind, 'PERSISTENT_3D_INJECTION_SPREAD_STATE');
assert.equal(a.d4.kind, 'DETERMINISTIC_ULTRASOUND_FLUID_OVERLAY_FIELD');
assert(a.d2.injectionState.syringe.deliveredVolumeMl > 0);
assert(Math.abs(a.d3.totalSpreadVolumeMl - a.d2.injectionState.syringe.deliveredVolumeMl) < 1e-9);
assert.deepEqual(a, b);
console.log('PUBLIC REGIONAL CORE SMOKE PASS');
