"use client";

import { useEffect, useMemo, useState } from "react";
import { disassemble } from "@/lib/dis8051";

const hx = (v: number, n: number) => v.toString(16).toUpperCase().padStart(n, "0");
const JUMPS: { label: string; addr: number }[] = [
  { label: "וקטור איפוס", addr: 0x2f52 },
  { label: "MOV DPSEL", addr: 0x2f66 },
  { label: "התחלה", addr: 0x0000 },
];

export default function BootRomViewer() {
  const [data, setData] = useState<Uint8Array | null>(null);
  const [err, setErr] = useState(false);
  const [addr, setAddr] = useState(0x2f52);
  const [mode, setMode] = useState<"disasm" | "hex">("disasm");

  useEffect(() => {
    fetch("/artifacts/bootrom.bin")
      .then((r) => r.arrayBuffer())
      .then((b) => setData(new Uint8Array(b)))
      .catch(() => setErr(true));
  }, []);

  const lines = useMemo(() => (data ? disassemble(data, addr & 0xffff, 40) : []), [data, addr]);
  const hexRows = useMemo(() => {
    if (!data) return [];
    const start = addr & 0xfff0;
    const rows: { a: number; bytes: number[] }[] = [];
    for (let r = 0; r < 16; r++) {
      const a = start + r * 16;
      if (a >= data.length) break;
      rows.push({ a, bytes: Array.from(data.slice(a, a + 16)) });
    }
    return rows;
  }, [data, addr]);

  return (
    <div className="rounded-xl border border-line bg-ink-2/50 p-4 sm:p-5">
      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-line bg-ink p-0.5">
          {(["disasm", "hex"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="mono rounded px-3 py-1 text-xs transition"
              style={{
                background: mode === m ? "var(--ink-3)" : "transparent",
                color: mode === m ? "var(--data)" : "var(--fg-muted)",
              }}
            >
              {m === "disasm" ? "disasm" : "hex"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mono text-xs text-fg-dim" dir="ltr">
            @0x
          </span>
          <input
            value={hx(addr, 4)}
            dir="ltr"
            spellCheck={false}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/[^0-9a-f]/gi, "") || "0", 16);
              if (!Number.isNaN(n)) setAddr(Math.min(n, 0x3fff));
            }}
            className="mono w-20 rounded border border-line-2 bg-ink px-2 py-1 text-sm text-data outline-none focus:border-data"
          />
        </div>
        {JUMPS.map((j) => (
          <button
            key={j.addr}
            onClick={() => setAddr(j.addr)}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-fg-muted transition hover:border-data hover:text-data"
          >
            {j.label}
          </button>
        ))}
      </div>

      {/* body */}
      <div
        className="mono max-h-[420px] overflow-auto rounded-lg border border-line bg-ink p-3 text-[0.8rem] leading-relaxed"
        dir="ltr"
      >
        {err && <div className="text-danger">bootrom.bin failed to load</div>}
        {!data && !err && <div className="text-fg-dim">loading 16KB boot ROM…</div>}

        {data && mode === "disasm" &&
          lines.map((l) => {
            const isDpsel = l.bytes === "75 92 8D";
            return (
              <div
                key={l.addr}
                className="flex gap-3 rounded px-1"
                style={{ background: isDpsel ? "color-mix(in oklab, var(--data) 16%, transparent)" : undefined }}
              >
                <span className="w-12 shrink-0 text-fg-dim">{hx(l.addr, 4)}</span>
                <span className="w-20 shrink-0 text-fg-muted">{l.bytes}</span>
                <span style={{ color: isDpsel ? "var(--data)" : "var(--fg)" }}>
                  {l.asm}
                  {isDpsel && "   ; ← פותח את קריאות ה-MOVX"}
                </span>
              </div>
            );
          })}

        {data && mode === "hex" &&
          hexRows.map((row) => (
            <div key={row.a} className="flex gap-3">
              <span className="shrink-0 text-fg-dim">{hx(row.a, 4)}</span>
              <span className="shrink-0 text-fg">
                {row.bytes.map((b, i) => {
                  const at = row.a + i === addr;
                  return (
                    <span key={i} style={at ? { color: "var(--data)", fontWeight: 700 } : undefined}>
                      {hx(b, 2)}
                      {i === 7 ? "  " : " "}
                    </span>
                  );
                })}
              </span>
              <span className="shrink-0 text-fg-dim">
                {row.bytes.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("")}
              </span>
            </div>
          ))}
      </div>
      <p className="mt-2 text-xs text-fg-dim">
        זהו ה-boot ROM האמיתי (16KB) שחולץ מהצ'יפ. קפצו ל-<span className="mono" dir="ltr">0x2F66</span> כדי
        לראות את <span className="mono text-data" dir="ltr">MOV DPSEL,#0x8D</span> — השורה שפתחה את כל 64KB.
      </p>
    </div>
  );
}
