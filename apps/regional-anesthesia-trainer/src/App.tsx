import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UltrasoundCanvas } from './components/UltrasoundCanvas';
import { TRAINER_PROTOCOL_VERSION, type TrainerAction, type TrainerSnapshot, type WorkerRequest, type WorkerResponse } from './protocol';
import './styles.css';

export default function App() {
  const worker = useMemo(() => new Worker(new URL('./sim/simulation.worker.ts', import.meta.url), { type: 'module' }), []);
  const [snapshot, setSnapshot] = useState<TrainerSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState(6);
  const mounted = useRef(true);

  const send = (action: TrainerAction) => {
    const request: WorkerRequest = { protocolVersion: TRAINER_PROTOCOL_VERSION, kind: 'ACTION', action };
    worker.postMessage(request);
  };

  useEffect(() => {
    mounted.current = true;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (!mounted.current) return;
      if (event.data.kind === 'ERROR') setError(event.data.message);
      else {
        setError(null);
        setSnapshot(event.data.snapshot);
        setFlow(event.data.snapshot.requestedFlowMlPerMin);
      }
    };
    const request: WorkerRequest = { protocolVersion: TRAINER_PROTOCOL_VERSION, kind: 'INIT' };
    worker.postMessage(request);
    return () => {
      mounted.current = false;
      worker.terminate();
    };
  }, [worker]);

  if (!snapshot) return <main className="loading">Starting Regional Anesthesia Trainer…</main>;

  return (
    <main className="app-shell">
      <header>
        <div>
          <p className="eyebrow">Regional Anesthesia Trainer · A1</p>
          <h1>Adductor Canal Technical Sandbox</h1>
        </div>
        <div className="status">Worker protocol {snapshot.protocolVersion}</div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="workspace">
        <aside className="panel controls">
          <h2>Participant controls</h2>
          <label>
            Needle insertion <strong>{Math.round(snapshot.insertionFraction * 100)}%</strong>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={snapshot.insertionFraction}
              onChange={(event) => send({ type: 'SET_INSERTION_FRACTION', fraction: Number(event.target.value) })}
            />
          </label>

          <button onClick={() => send({ type: 'ASPIRATE' })}>Aspiration</button>
          <div className="button-row">
            <button onClick={() => send({ type: 'START_INJECTION' })}>Start injection</button>
            <button onClick={() => send({ type: 'STOP_INJECTION' })}>Stop</button>
          </div>

          <label>
            Requested flow <strong>{flow.toFixed(1)} mL/min</strong>
            <input type="range" min="0" max="30" step="0.5" value={flow} onChange={(event) => setFlow(Number(event.target.value))} />
          </label>
          <button onClick={() => send({ type: 'SET_REQUESTED_FLOW', flowMlPerMin: flow })}>Apply flow</button>

          <div className="button-row">
            <button onClick={() => send({ type: 'ADVANCE_TIME', deltaSec: 1 })}>+1 s</button>
            <button onClick={() => send({ type: 'ADVANCE_TIME', deltaSec: 5 })}>+5 s</button>
            <button onClick={() => send({ type: 'ADVANCE_TIME', deltaSec: 10 })}>+10 s</button>
          </div>
          <button onClick={() => send({ type: 'REPLAY' })}>Verify deterministic replay</button>
          <button className="secondary" onClick={() => send({ type: 'RESET' })}>Reset sandbox</button>
        </aside>

        <section className="panel ultrasound-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Canonical B4 + C4 + D4 render</p>
              <h2>Ultrasound</h2>
            </div>
            <span>{snapshot.timeSec.toFixed(1)} s</span>
          </div>
          <UltrasoundCanvas frame={snapshot.ultrasound} />
          <div className="metrics">
            <Metric label="Aspiration" value={snapshot.aspiration ?? '—'} />
            <Metric label="Actual flow" value={`${snapshot.actualFlowMlPerMin.toFixed(2)} mL/min`} />
            <Metric label="Line pressure" value={`${snapshot.linePressureKPa.toFixed(2)} kPa`} />
            <Metric label="Delivered" value={`${snapshot.deliveredVolumeMl.toFixed(2)} mL`} />
            <Metric label="Spread" value={`${snapshot.spreadVolumeMl.toFixed(2)} mL`} />
            <Metric label="Depots" value={String(snapshot.depotCount)} />
          </div>
        </section>

        <aside className="panel inspector">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Read-only</p>
              <h2>Developer state</h2>
            </div>
            <span>{snapshot.actionCount} actions</span>
          </div>
          <div className={`replay ${snapshot.replayMatches === true ? 'pass' : snapshot.replayMatches === false ? 'fail' : ''}`}>
            Replay: {snapshot.replayMatches === null ? 'not checked' : snapshot.replayMatches ? 'MATCH' : 'MISMATCH'}
          </div>
          <pre>{JSON.stringify(snapshot.developer, null, 2)}</pre>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
