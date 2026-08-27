/// <reference lib="webworker" />
import { TRAINER_PROTOCOL_VERSION, type WorkerRequest, type WorkerResponse } from '../protocol';
import { RegionalTrainerEngine } from './coreAdapter';

const engine = new RegionalTrainerEngine();
const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

function send(message: WorkerResponse) {
  ctx.postMessage(message);
}

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const request = event.data;
    if (request.protocolVersion !== TRAINER_PROTOCOL_VERSION) throw new Error('Worker protocol version mismatch');
    const snapshot = request.kind === 'INIT' ? engine.snapshot() : engine.dispatch(request.action);
    send({ protocolVersion: TRAINER_PROTOCOL_VERSION, kind: 'SNAPSHOT', snapshot });
  } catch (error) {
    send({
      protocolVersion: TRAINER_PROTOCOL_VERSION,
      kind: 'ERROR',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
