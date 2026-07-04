"use client";

import { useMemo, useState } from "react";
import { REGISTERS, fieldValue, hex, type Register, type BitField } from "@/lib/registers";

const FIELD_COLORS = ["--data", "--mcu", "--ok", "--zeros", "--data-2", "--mcu-2"];

const decodable = REGISTERS.filter((r) => r.fields && r.fields.length);

function fieldForBit(reg: Register, bit: number): number {
  return reg.fields!.findIndex((f) => bit >= f.lo && bit <= f.hi);
}

export default function RegisterDecoder() {
  const [idx, setIdx] = useState(() => decodable.findIndex((r) => r.name === "MCUFWDL"));
  const reg = decodable[Math.max(0, idx)];
  const [value, setValue] = useState<number>(reg.live ?? 0);

  const selectReg = (i: number) => {
    setIdx(i);
    setValue(decodable[i].live ?? 0);
  };

  const bits = useMemo(() => Array.from({ length: reg.width }, (_, i) => reg.width - 1 - i), [reg.width]);
  const toggleBit = (bit: number) => setValue((v) => (v ^ (1 << bit)) >>> 0);

  const colorForField = (fi: number) => `var(${FIELD_COLORS[fi % FIELD_COLORS.length]})`;

  return (
    <div className="rounded-xl border border-line bg-ink-2/50 p-5 sm:p-6">
      {/* register picker */}
      <div className="mb-5 flex flex-wrap gap-2">
        {decodable.map((r, i) => (
          <button
            key={r.name}
            onClick={() => selectReg(i)}
            className={`mono rounded-md border px-2.5 py-1 text-xs transition ${
              reg.name === r.name
                ? "border-data bg-ink-3 text-data"
                : "border-line text-fg-muted hover:border-line-2 hover:text-fg"
            }`}
            dir="ltr"
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="mono text-sm text-fg-dim" dir="ltr">
          {hex(reg.addr, 16)} · {reg.width}-bit
        </span>
        {reg.live !== undefined && (
          <button
            onClick={() => setValue(reg.live!)}
            className="text-xs text-fg-dim underline decoration-dotted hover:text-data"
          >
            טען ערך חי
          </button>
        )}
      </div>

      {/* editable hex value */}
      <div className="mb-5 flex items-center gap-3">
        <label className="mono text-sm text-fg-muted" dir="ltr">
          value =
        </label>
        <input
          value={hex(value, reg.width)}
          dir="ltr"
          spellCheck={false}
          onChange={(e) => {
            const raw = e.target.value.replace(/^0x/i, "").trim();
            const n = parseInt(raw || "0", 16);
            if (!Number.isNaN(n)) setValue(n >>> 0);
          }}
          className="mono w-40 rounded-md border border-line-2 bg-ink px-3 py-1.5 text-lg text-data outline-none focus:border-data"
        />
      </div>

      {/* bit grid */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex flex-wrap gap-1" dir="ltr">
          {bits.map((bit) => {
            const fi = fieldForBit(reg, bit);
            const set = ((value >>> bit) & 1) === 1;
            const c = fi >= 0 ? colorForField(fi) : "var(--line-2)";
            return (
              <button
                key={bit}
                onClick={() => toggleBit(bit)}
                title={fi >= 0 ? reg.fields![fi].name : `bit ${bit}`}
                className="mono grid h-9 w-7 place-items-center rounded text-sm font-semibold transition"
                style={{
                  background: set ? c : "var(--ink)",
                  color: set ? "var(--ink)" : "var(--fg-dim)",
                  border: `1px solid ${fi >= 0 ? c : "var(--line)"}`,
                  boxShadow: set ? `0 0 10px color-mix(in oklab, ${c} 55%, transparent)` : "none",
                }}
              >
                {set ? 1 : 0}
              </button>
            );
          })}
        </div>
      </div>

      {/* decoded fields */}
      <div className="space-y-1.5">
        {reg.fields!.map((f: BitField, fi) => {
          const v = fieldValue(value, f);
          const c = colorForField(fi);
          return (
            <div
              key={f.name}
              className="flex items-center gap-3 rounded-md border border-line bg-ink px-3 py-2"
            >
              <span className="inline-block h-3 w-3 shrink-0 rounded-[3px]" style={{ background: c }} />
              <span className="mono w-28 shrink-0 text-sm" dir="ltr" style={{ color: c }}>
                {f.name}
              </span>
              <span className="mono w-16 shrink-0 text-xs text-fg-dim" dir="ltr">
                [{f.hi === f.lo ? f.lo : `${f.hi}:${f.lo}`}]
              </span>
              <span className="mono w-12 shrink-0 text-sm font-semibold text-fg" dir="ltr">
                {f.hi === f.lo ? v : "0x" + v.toString(16).toUpperCase()}
              </span>
              {f.desc && <span className="flex-1 text-xs text-fg-muted">{f.desc}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
