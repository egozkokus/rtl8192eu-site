"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cpu8051, SFR, type StepInfo } from "@/lib/emu8051";
import { disassemble } from "@/lib/dis8051";

const hx = (v: number, n: number) => v.toString(16).toUpperCase().padStart(n, "0");

// tiny hand-assembled demo: counter -> XDATA 0x0430, forever
const DEMO = (() => {
  const d = new Uint8Array(0x40);
  d.set([0x02, 0x00, 0x30], 0x00); // LJMP 0x30
  d.set([0x7f, 0x00], 0x30); // MOV R7,#0
  d.set([0x0f], 0x32); // INC R7
  d.set([0xef], 0x33); // MOV A,R7
  d.set([0x90, 0x04, 0x30], 0x34); // MOV DPTR,#0x0430
  d.set([0xf0], 0x37); // MOVX @DPTR,A
  d.set([0x80, 0xf8], 0x38); // SJMP 0x32
  return d;
})();

const SFR_VIEW: { addr: number; name: string; hot?: boolean }[] = [
  { addr: SFR.PSW, name: "PSW" },
  { addr: 0xa8, name: "IE" },
  { addr: 0x98, name: "SCON" },
  { addr: SFR.DPSEL, name: "DPSEL", hot: true },
];

export default function Simulator() {
  const cpu = useRef(new Cpu8051()).current;
  const [tick, setTick] = useState(0);
  const [codeVer, setCodeVer] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2000);
  const [src, setSrc] = useState("");
  const [status, setStatus] = useState("טוענים…");
  const [viewStart, setViewStart] = useState(0);
  const [watch, setWatch] = useState(0x8000);
  const [trace, setTrace] = useState<StepInfo[]>([]);
  const prev = useRef<Record<string, number>>({});

  const snapshot = () => ({
    A: cpu.A, B: cpu.sfr[SFR.B], DPTR: cpu.dptr, SP: cpu.sfr[SFR.SP], PC: cpu.pc,
    R0: cpu.R(0), R1: cpu.R(1), R2: cpu.R(2), R3: cpu.R(3),
    R4: cpu.R(4), R5: cpu.R(5), R6: cpu.R(6), R7: cpu.R(7),
  });

  const loadCode = useCallback(
    (bytes: Uint8Array, label: string) => {
      cpu.loadCode(bytes);
      cpu.reset(0);
      prev.current = {};
      setTrace([]);
      setViewStart(0);
      setSrc(label);
      setStatus(`נטען: ${label} (${bytes.length}B)`);
      setCodeVer((v) => v + 1);
      setTick((t) => t + 1);
    },
    [cpu]
  );

  const loadBoot = useCallback(() => {
    setRunning(false);
    fetch("/artifacts/bootrom.bin")
      .then((r) => r.arrayBuffer())
      .then((b) => loadCode(new Uint8Array(b), "Boot ROM (אמיתי)"))
      .catch(() => setStatus("טעינת ה-boot ROM נכשלה"));
  }, [loadCode]);

  useEffect(() => {
    loadBoot();
  }, [loadBoot]);

  const doStep = useCallback(
    (n = 1) => {
      if (cpu.halted) return;
      prev.current = snapshot();
      let last: StepInfo | null = null;
      const batch: StepInfo[] = [];
      for (let i = 0; i < n && !cpu.halted; i++) {
        last = cpu.step();
        if (n <= 100) batch.push(last);
      }
      if (batch.length) setTrace((t) => [...batch.reverse(), ...t].slice(0, 60));
      if (last?.halted) setRunning(false);
      setTick((t) => t + 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [cpu]
  );

  // run loop
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (cpu.halted) {
        setRunning(false);
        return;
      }
      prev.current = snapshot();
      for (let i = 0; i < speed && !cpu.halted; i++) cpu.step();
      setTick((t) => t + 1);
    }, 32);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, cpu]);

  const reset = () => {
    setRunning(false);
    cpu.reset(0);
    prev.current = {};
    setTrace([]);
    setViewStart(0);
    setTick((t) => t + 1);
    setStatus(`אופס: ${src}`);
  };

  const lines = useMemo(
    () => disassemble(cpu.code, viewStart, 30),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewStart, codeVer, tick]
  );
  useEffect(() => {
    if (!lines.some((l) => l.addr === cpu.pc)) setViewStart(cpu.pc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const cur = snapshot();
  const chg = (k: string, v: number) => (prev.current[k] !== undefined && prev.current[k] !== v);

  return (
    <div className="rounded-xl border border-line bg-ink-2/40 p-4 sm:p-5">
      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={loadBoot}
          className="rounded-md border border-line px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-data hover:text-data">
          Boot ROM
        </button>
        <button onClick={() => { setRunning(false); loadCode(DEMO, "דמו: מונה→0x0430"); }}
          className="rounded-md border border-line px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-data hover:text-data">
          דמו
        </button>
        <label className="cursor-pointer rounded-md border border-line px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-data hover:text-data">
          העלה .bin
          <input type="file" accept=".bin" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) f.arrayBuffer().then((b) => loadCode(new Uint8Array(b), f.name)); }} />
        </label>
        <span className="mx-1 h-5 w-px bg-line" />
        <button onClick={reset} className="rounded-md border border-line-2 px-3 py-1.5 text-xs text-fg-muted transition hover:border-danger hover:text-danger">איפוס</button>
        <button onClick={() => doStep(1)} disabled={!!cpu.halted}
          className="rounded-md bg-data px-3 py-1.5 text-xs font-medium text-ink transition hover:brightness-110 disabled:opacity-40">צעד</button>
        <button onClick={() => doStep(100)} disabled={!!cpu.halted}
          className="rounded-md border border-line-2 px-3 py-1.5 text-xs text-fg-muted transition hover:text-fg disabled:opacity-40">×100</button>
        <button onClick={() => setRunning((r) => !r)} disabled={!!cpu.halted}
          className="rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-40"
          style={{ background: running ? "var(--danger)" : "var(--mcu)", color: "var(--ink)" }}>
          {running ? "עצור" : "הרץ ▶"}
        </button>
        <input type="range" min={100} max={20000} step={100} value={speed}
          onChange={(e) => setSpeed(+e.target.value)} className="w-24 accent-[var(--mcu)]" title="מהירות" />
        <span className="mono ms-auto text-xs text-fg-dim" dir="ltr">
          {cpu.steps.toLocaleString()} steps{cpu.halted ? ` · ${cpu.halted}` : ""}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* registers */}
        <div className="rounded-lg border border-line bg-ink p-3">
          <h3 className="mono mb-2 text-[0.7rem] uppercase tracking-wider text-fg-dim">registers</h3>
          <div className="mono grid grid-cols-2 gap-1 text-sm" dir="ltr">
            <Reg k="PC" v={hx(cur.PC, 4)} hot={chg("PC", cur.PC)} accent />
            <Reg k="DPTR" v={hx(cur.DPTR, 4)} hot={chg("DPTR", cur.DPTR)} />
            <Reg k="A" v={hx(cur.A, 2)} hot={chg("A", cur.A)} />
            <Reg k="B" v={hx(cur.B, 2)} hot={chg("B", cur.B)} />
            <Reg k="SP" v={hx(cur.SP, 2)} hot={chg("SP", cur.SP)} />
            <div />
          </div>
          <div className="my-2 flex gap-1.5" dir="ltr">
            {(["CY", "AC", "OV", "P"] as const).map((f) => {
              const on = cpu.flags()[f];
              return (
                <span key={f} className="mono rounded px-1.5 py-0.5 text-[0.65rem]"
                  style={{ background: on ? "var(--data)" : "var(--ink-3)", color: on ? "var(--ink)" : "var(--fg-dim)" }}>
                  {f}
                </span>
              );
            })}
          </div>
          <div className="mono grid grid-cols-4 gap-1 text-xs" dir="ltr">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Reg key={n} k={`R${n}`} v={hx(cur[`R${n}` as keyof typeof cur], 2)} hot={chg(`R${n}`, cur[`R${n}` as keyof typeof cur])} small />
            ))}
          </div>
          <h3 className="mono mb-1 mt-3 text-[0.7rem] uppercase tracking-wider text-fg-dim">SFRs</h3>
          <div className="mono space-y-1 text-xs" dir="ltr">
            {SFR_VIEW.map((s) => (
              <div key={s.addr} className="flex items-center justify-between rounded px-1.5 py-0.5"
                style={{ background: s.hot ? "color-mix(in oklab, var(--data) 12%, transparent)" : "transparent" }}>
                <span style={{ color: s.hot ? "var(--data)" : "var(--fg-muted)" }}>
                  {s.name} <span className="text-fg-dim">0x{hx(s.addr, 2)}</span>
                </span>
                <span className="text-fg">{hx(cpu.sfr[s.addr], 2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* disassembly */}
        <div className="rounded-lg border border-line bg-ink p-3">
          <h3 className="mono mb-2 text-[0.7rem] uppercase tracking-wider text-fg-dim">disassembly</h3>
          <div className="mono max-h-[360px] overflow-auto text-[0.78rem] leading-relaxed" dir="ltr">
            {lines.map((l) => {
              const isPc = l.addr === cpu.pc;
              const isDpsel = l.bytes === "75 92 8D";
              return (
                <div key={l.addr} className="flex gap-2 rounded px-1"
                  style={{ background: isPc ? "var(--data)" : isDpsel ? "color-mix(in oklab, var(--data) 14%, transparent)" : undefined,
                           color: isPc ? "var(--ink)" : undefined }}>
                  <span className="w-6 shrink-0 text-center" style={{ color: isPc ? "var(--ink)" : "var(--fg-dim)" }}>{isPc ? "▶" : ""}</span>
                  <span className="w-10 shrink-0" style={{ color: isPc ? "var(--ink)" : "var(--fg-dim)" }}>{hx(l.addr, 4)}</span>
                  <span className="w-16 shrink-0" style={{ color: isPc ? "var(--ink)" : "var(--fg-muted)" }}>{l.bytes}</span>
                  <span style={{ color: isPc ? "var(--ink)" : "var(--fg)" }}>{l.asm}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* memory + trace */}
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="mono text-[0.7rem] uppercase tracking-wider text-fg-dim">XDATA</h3>
              <div className="flex items-center gap-1">
                {[0x0000, 0x0430, 0x8000].map((a) => (
                  <button key={a} onClick={() => setWatch(a)}
                    className="mono rounded px-1.5 py-0.5 text-[0.62rem]"
                    style={{ background: (watch & 0xff00) === a ? "var(--ink-3)" : "transparent", color: (watch & 0xff00) === a ? "var(--data)" : "var(--fg-dim)" }} dir="ltr">
                    {hx(a, 4)}
                  </button>
                ))}
              </div>
            </div>
            <HexView bytes={cpu.xram} base={watch & 0xfff0} rows={8} last={trace[0]?.xwrite?.addr} />
          </div>
          <div className="rounded-lg border border-line bg-ink p-3">
            <h3 className="mono mb-2 text-[0.7rem] uppercase tracking-wider text-fg-dim">trace</h3>
            <div className="mono max-h-[150px] space-y-0.5 overflow-auto text-[0.72rem]" dir="ltr">
              {trace.length === 0 && <div className="text-fg-dim">צעד/הרץ כדי לראות…</div>}
              {trace.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <span className="w-10 shrink-0 text-fg-dim">{hx(s.pc, 4)}</span>
                  <span className="flex-1 truncate text-fg-muted">{s.asm}</span>
                  {s.sfrwrite && <span style={{ color: s.sfrwrite.sfr === 0x92 ? "var(--data)" : "var(--mcu-2)" }}>
                    SFR{hx(s.sfrwrite.sfr, 2)}={hx(s.sfrwrite.val, 2)}</span>}
                  {s.xwrite && <span className="text-mcu-2">X{hx(s.xwrite.addr, 4)}={hx(s.xwrite.val, 2)}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-fg-dim">{status} · טעון-מראש עם ה-boot ROM האמיתי — לחצו “הרץ” וצפו ב-RAM מתאפס וב-<span className="mono text-data" dir="ltr">DPSEL</span> נדלק ב-<span className="mono" dir="ltr">0x2F66</span>.</p>
    </div>
  );
}

function Reg({ k, v, hot, accent, small }: { k: string; v: string; hot?: boolean; accent?: boolean; small?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded px-1.5 ${small ? "py-0.5" : "py-1"}`}
      style={{ background: hot ? "color-mix(in oklab, var(--data) 18%, transparent)" : "transparent" }}>
      <span style={{ color: accent ? "var(--data)" : "var(--fg-dim)" }}>{k}</span>
      <span className="text-fg">{v}</span>
    </div>
  );
}

function HexView({ bytes, base, rows, last }: { bytes: Uint8Array; base: number; rows: number; last?: number }) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const a = (base + r * 16) & 0xffff;
    const row = [];
    for (let i = 0; i < 16; i++) {
      const addr = a + i;
      const b = bytes[addr];
      row.push(
        <span key={i} style={{ color: addr === last ? "var(--data)" : b ? "var(--fg)" : "var(--fg-dim)", fontWeight: addr === last ? 700 : 400 }}>
          {b.toString(16).toUpperCase().padStart(2, "0")}{i === 7 ? "  " : " "}
        </span>
      );
    }
    out.push(
      <div key={r} className="flex gap-2">
        <span className="shrink-0 text-fg-dim">{a.toString(16).toUpperCase().padStart(4, "0")}</span>
        <span>{row}</span>
      </div>
    );
  }
  return <div className="mono overflow-x-auto text-[0.72rem] leading-relaxed" dir="ltr">{out}</div>;
}
