export const TRAINER_PROTOCOL_VERSION = 'regional-trainer-a2.v1' as const;

export interface Vec3Snapshot { x: number; y: number; z: number; }
export interface ProbeSnapshot {
  positionMm: Vec3Snapshot;
  contactPointMm: Vec3Snapshot;
  slideMm: number;
  rotationDeg: number;
  tiltDeg: number;
  rockDeg: number;
  pressure: number;
  contact: boolean;
}

export type TrainerAction =
  | { type: 'RESET' }
  | { type: 'SET_INSERTION_FRACTION'; fraction: number }
  | { type: 'PROBE_SLIDE'; deltaMm: number }
  | { type: 'PROBE_ROTATE'; deltaDeg: number }
  | { type: 'PROBE_TILT'; deltaDeg: number }
  | { type: 'PROBE_ROCK'; deltaDeg: number }
  | { type: 'PROBE_PRESSURE_SET'; pressure: number }
  | { type: 'ASPIRATE' }
  | { type: 'START_INJECTION' }
  | { type: 'STOP_INJECTION' }
  | { type: 'SET_REQUESTED_FLOW'; flowMlPerMin: number }
  | { type: 'ADVANCE_TIME'; deltaSec: number }
  | { type: 'REPLAY' };

export interface UltrasoundFrame { widthPx: number; heightPx: number; pixels: number[]; }

export interface TrainerSnapshot {
  protocolVersion: typeof TRAINER_PROTOCOL_VERSION;
  caseId: 'ACB_TECHNICAL_SANDBOX_V1';
  timeSec: number;
  probe: ProbeSnapshot;
  insertionFraction: number;
  aspiration: string | null;
  injectionActive: boolean;
  requestedFlowMlPerMin: number;
  actualFlowMlPerMin: number;
  linePressureKPa: number;
  deliveredVolumeMl: number;
  remainingVolumeMl: number;
  spreadVolumeMl: number;
  depotCount: number;
  actionCount: number;
  replayMatches: boolean | null;
  ultrasound: UltrasoundFrame;
  developer: unknown;
}

export type WorkerRequest =
  | { protocolVersion: typeof TRAINER_PROTOCOL_VERSION; kind: 'INIT' }
  | { protocolVersion: typeof TRAINER_PROTOCOL_VERSION; kind: 'ACTION'; action: TrainerAction };
export type WorkerResponse =
  | { protocolVersion: typeof TRAINER_PROTOCOL_VERSION; kind: 'SNAPSHOT'; snapshot: TrainerSnapshot }
  | { protocolVersion: typeof TRAINER_PROTOCOL_VERSION; kind: 'ERROR'; message: string };
