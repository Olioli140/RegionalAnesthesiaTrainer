import React, { useEffect, useMemo, useRef, useState } from "react";
import { UltrasoundCanvas } from "./components/UltrasoundCanvas";
import { ProbeScene } from "./components/ProbeScene";
import {
  TRAINER_PROTOCOL_VERSION,
  type TrainerAction,
  type TrainerSnapshot,
  type WorkerRequest,
  type WorkerResponse,
} from "./protocol";
import "./styles.css";
export default function App() {
  const worker = useMemo(
    () =>
      new Worker(new URL("./sim/simulation.worker.ts", import.meta.url), {
        type: "module",
      }),
    [],
  );
  const [snapshot, setSnapshot] = useState<TrainerSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState(6);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const send = (action: TrainerAction) => {
    setBusy(true);
    worker.postMessage({
      protocolVersion: TRAINER_PROTOCOL_VERSION,
      kind: "ACTION",
      action,
    } satisfies WorkerRequest);
  };
  useEffect(() => {
    mounted.current = true;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (!mounted.current) return;
      if (e.data.kind === "ERROR") setError(e.data.message);
      else {
        setBusy(false);
        setError(null);
        setSnapshot(e.data.snapshot);
        setFlow(e.data.snapshot.requestedFlowMlPerMin);
      }
    };
    worker.postMessage({
      protocolVersion: TRAINER_PROTOCOL_VERSION,
      kind: "INIT",
    } satisfies WorkerRequest);
    return () => {
      mounted.current = false;
      worker.terminate();
    };
  }, [worker]);
  if (!snapshot)
    return (
      <main className="loading">Starting Regional Anesthesia Trainer…</main>
    );
  const inj = snapshot.injection;
  const pressurePct = Math.max(
    0,
    Math.min(
      100,
      inj.pressureLimitKPa > 0
        ? (inj.linePressureKPa / inj.pressureLimitKPa) * 100
        : 0,
    ),
  );
  const syringePct = Math.max(
    0,
    Math.min(100, (inj.remainingVolumeMl / 20) * 100),
  );
  return (
    <main className="app-shell">
      <header>
        <div>
          <p className="eyebrow">Regional Anesthesia Trainer · A6.7</p>
          <h1>Adductor Canal Direct Manipulation Sandbox</h1>
          <p className="subtitle">
            Manipulate probe, imaging and needle directly. Every gesture emits
            canonical TrainerActions; worker/core remains simulation truth.
          </p>
        </div>
        <div className={`status worker-status ${busy ? "busy" : ""}`} aria-live="polite">
          <i /> {busy ? "Bild wird aktualisiert…" : "Bereit"}
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <section className="procedure-strip">
        <Status
          label="Needle"
          value={`${snapshot.needle.scanRelation ?? "—"} · ${snapshot.needle.inViewport ? "in view" : "out of view"}`}
        />
        <Status label="Aspiration" value={inj.aspiration || "not performed"} />
        <Status
          label="Injection"
          value={inj.active ? "INJECTING" : "STOPPED"}
          active={inj.active}
        />
        <Status
          label="Pressure"
          value={inj.pressureLimited ? "LIMITED" : "within limit"}
          warning={inj.pressureLimited}
        />
      </section>
      <section className="workspace">
        <aside className="panel controls">
          <ControlGroup title="Sonde und Nadel">
            <p className="muted">
              Sonde im Modell ziehen: seitlich verschieben, vertikal drücken,
              mit dem Mausrad drehen. Nadelpunkte direkt ziehen.
            </p>
          </ControlGroup>
          <ControlGroup title="Ultraschallbild">
            <div className="preset-row" aria-label="Ultrasound presets">
              <PresetButton id="NERVE_DETAIL" label="Nerve" active={snapshot.imaging.presetId==='NERVE_DETAIL'} onAction={send}/>
              <PresetButton id="NEEDLE_VISIBILITY" label="Needle" active={snapshot.imaging.presetId==='NEEDLE_VISIBILITY'} onAction={send}/>
              <PresetButton id="OVERVIEW" label="Overview" active={snapshot.imaging.presetId==='OVERVIEW'} onAction={send}/>
            </div>
            <label>
              Gain{" "}
              <strong>
                {snapshot.imaging.gainDb > 0 ? "+" : ""}
                {snapshot.imaging.gainDb.toFixed(0)} dB
              </strong>
              <input
                type="range"
                min="-18"
                max="18"
                step="1"
                value={snapshot.imaging.gainDb}
                onChange={(e) =>
                  send({
                    type: "SET_ULTRASOUND_GAIN",
                    gainDb: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Depth <strong>{snapshot.imaging.depthMm.toFixed(0)} mm</strong>
              <input
                type="range"
                min="45"
                max="100"
                step="5"
                value={snapshot.imaging.depthMm}
                onChange={(e) =>
                  send({
                    type: "SET_ULTRASOUND_DEPTH",
                    depthMm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Focus{" "}
              <strong>{snapshot.imaging.focusDepthMm.toFixed(0)} mm</strong>
              <input
                type="range"
                min="10"
                max={snapshot.imaging.depthMm - 5}
                step="1"
                value={snapshot.imaging.focusDepthMm}
                onChange={(e) =>
                  send({
                    type: "SET_ULTRASOUND_FOCUS",
                    focusDepthMm: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Dynamic range{" "}
              <strong>{snapshot.imaging.dynamicRangeDb.toFixed(0)} dB</strong>
              <input
                type="range"
                min="40"
                max="80"
                step="2"
                value={snapshot.imaging.dynamicRangeDb}
                onChange={(e) =>
                  send({
                    type: "SET_ULTRASOUND_DYNAMIC_RANGE",
                    dynamicRangeDb: Number(e.target.value),
                  })
                }
              />
            </label>
          </ControlGroup>
          <ControlGroup title="Needle advance">
            <label>
              Advance{" "}
              <strong>
                {Math.round(snapshot.needle.advanceFraction * 100)}%
              </strong>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={snapshot.needle.advanceFraction}
                onChange={(e) =>
                  send({
                    type: "SET_INSERTION_FRACTION",
                    fraction: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Needle length{" "}
              <strong>{snapshot.needle.lengthMm.toFixed(0)} mm</strong>
              <input
                type="range"
                min="20"
                max="100"
                step="1"
                value={snapshot.needle.lengthMm}
                onChange={(e) =>
                  send({
                    type: "NEEDLE_LENGTH_SET",
                    lengthMm: Number(e.target.value),
                  })
                }
              />
            </label>
          </ControlGroup>
          <ControlGroup title="Injection">
            <button className="wide" onClick={() => send({ type: "ASPIRATE" })} disabled={busy}>
              Aspirate {inj.aspiration ? `· ${inj.aspiration}` : ""}
            </button>
            <label>
              Requested flow <strong>{flow.toFixed(1)} mL/min</strong>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={flow}
                onChange={(e) => setFlow(Number(e.target.value))}
                onPointerUp={() => send({ type: "SET_REQUESTED_FLOW", flowMlPerMin: flow })}
                onKeyUp={() => send({ type: "SET_REQUESTED_FLOW", flowMlPerMin: flow })}
              />
            </label>
            <p className="control-hint">Der Wert wird beim Loslassen übernommen.</p>
            <div className="button-row">
              <button
                className="primary"
                onClick={() => send({ type: "START_INJECTION" })}
                disabled={inj.active || busy}
              >
                Start injection
              </button>
              <button
                onClick={() => send({ type: "STOP_INJECTION" })}
                disabled={!inj.active || busy}
              >
                Stop
              </button>
            </div>
            <div className="button-row">
              <button
                onClick={() => send({ type: "ADVANCE_TIME", deltaSec: 1 })}
                disabled={busy}
              >
                Advance +1 s
              </button>
              <button
                onClick={() => send({ type: "ADVANCE_TIME", deltaSec: 5 })}
                disabled={busy}
              >
                Advance +5 s
              </button>
            </div>
          </ControlGroup>
          <div className="button-row">
            <button onClick={() => send({ type: "REPLAY" })} disabled={busy}>
              Verify replay
            </button>
            <button
              className="secondary"
              onClick={() => send({ type: "RESET" })}
              disabled={busy}
            >
              Reset
            </button>
          </div>
        </aside>
        <section className="center-stack">
          <section className="panel">
            <ProbeScene
              probe={snapshot.probe}
              needle={snapshot.needle}
              onAction={send}
            />
            <div className="metrics">
              <Metric
                label="Entry X"
                value={`${snapshot.needle.entryPointMm.x.toFixed(1)} mm`}
              />
              <Metric
                label="Entry Z"
                value={`${snapshot.needle.entryPointMm.z.toFixed(1)} mm`}
              />
              <Metric
                label="In-plane"
                value={`${snapshot.needle.inPlaneAngleDeg.toFixed(1)}°`}
              />
              <Metric
                label="Out-plane"
                value={`${snapshot.needle.outOfPlaneAngleDeg.toFixed(1)}°`}
              />
            </div>
          </section>
          <section className="panel ultrasound-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  Canonical ultrasound + D4 fluid overlay
                </p>
                <h2>Ultrasound</h2>
              </div>
              <span>
                {snapshot.imaging.depthMm.toFixed(0)} mm · focus{" "}
                {snapshot.imaging.focusDepthMm.toFixed(0)} mm
              </span>
            </div>
            <UltrasoundCanvas frame={snapshot.ultrasound} imaging={snapshot.imaging} busy={busy} />
            <section className="injection-feedback">
              <div>
                <p className="eyebrow">Injection feedback</p>
                <div className="flow-big">
                  <strong>{inj.actualFlowMlPerMin.toFixed(2)}</strong>
                  <span>mL/min actual</span>
                </div>
                <p className="muted">
                  requested {inj.requestedFlowMlPerMin.toFixed(2)} · max{" "}
                  {inj.maxFlowMlPerMin.toFixed(2)}
                </p>
              </div>
              <div className="gauges">
                <Gauge
                  label="Line pressure"
                  value={`${inj.linePressureKPa.toFixed(1)} / ${inj.pressureLimitKPa.toFixed(1)} kPa`}
                  percent={pressurePct}
                />
                <Gauge
                  label="Syringe remaining"
                  value={`${inj.remainingVolumeMl.toFixed(2)} mL`}
                  percent={syringePct}
                />
              </div>
            </section>
            <div className="metrics">
              <Metric label="Tip environment" value={inj.dominantEnvironment} />
              <Metric
                label="Delivered"
                value={`${inj.deliveredVolumeMl.toFixed(2)} mL`}
              />
              <Metric
                label="Spread"
                value={`${inj.spreadVolumeMl.toFixed(2)} mL`}
              />
              <Metric label="Depots" value={String(inj.depotCount)} />
              <Metric
                label="Resistance"
                value={`${inj.totalResistanceKPaPerMlMin.toFixed(2)} kPa/(mL/min)`}
              />
              <Metric
                label="Opening P"
                value={`${inj.openingPressureKPa.toFixed(2)} kPa`}
              />
            </div>
          </section>
          <details className="panel inspector">
            <summary>
              <span>
                <span className="eyebrow">Read-only</span>
                <strong>Developer state</strong>
              </span>
              <span>
                {snapshot.actionCount} actions · replay{" "}
                {snapshot.replayMatches === null
                  ? "not checked"
                  : snapshot.replayMatches
                    ? "MATCH"
                    : "MISMATCH"}
              </span>
            </summary>
            <div
              className={`replay ${snapshot.replayMatches === true ? "pass" : snapshot.replayMatches === false ? "fail" : ""}`}
            >
              Replay:{" "}
              {snapshot.replayMatches === null
                ? "not checked"
                : snapshot.replayMatches
                  ? "MATCH"
                  : "MISMATCH"}
            </div>
            <pre>{JSON.stringify(snapshot.developer, null, 2)}</pre>
          </details>
        </section>
      </section>
    </main>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Status({
  label,
  value,
  active = false,
  warning = false,
}: {
  label: string;
  value: string;
  active?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`procedure-status ${active ? "active" : ""} ${warning ? "warning" : ""}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function ControlGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="control-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function PresetButton({id,label,active,onAction}:{id:'NERVE_DETAIL'|'NEEDLE_VISIBILITY'|'OVERVIEW';label:string;active:boolean;onAction:(action:TrainerAction)=>void}) {
  return <button className={`preset ${active?'active':''}`} aria-pressed={active} onClick={()=>onAction({type:'APPLY_ULTRASOUND_PRESET',presetId:id})}>{label}</button>;
}
function Gauge({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="gauge">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="gauge-track">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
