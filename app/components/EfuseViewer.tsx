"use client";

import { useEffect, useMemo, useState } from "react";

const hx = (v: number, n: number) => v.toString(16).toUpperCase().padStart(n, "0");

export default function EfuseViewer() {
  const [data, setData] = useState<Uint8Array | null>(null);
  const [err, setErr] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    fetch("/artifacts/efuse_full.bin")
      .then((r) => r.arrayBuffer())
      .then((b) => setData(new Uint8Array(b)))
      .catch(() => setErr(true));
  }, []);

  const programmed = useMemo(
    () => (data ? data.reduce((n, b) => n + (b !== 0xff ? 1 : 0), 0) : 0),
    [data]
  );

  const readout =
    hover !== null && data
      ? `off 0x${hx(hover, 3)} = 0x${hx(data[hover], 2)}  ${data[hover] === 0xff ? "· padding" : "· programmed"}`
      : data
        ? `512 bytes · ${programmed} programmed · ${512 - programmed} padding (0xFF)`
        : "…";

  return (
    <div className="rounded-xl border border-line bg-ink-2/50 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.72rem] text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--data)" }} />
          מתוכנת
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--unmapped)" }} />
          padding · 0xFF
        </span>
      </div>

      {err && <div className="text-sm text-danger">efuse_full.bin failed to load</div>}
      {!data && !err && <div className="text-sm text-fg-dim">loading 512B eFuse…</div>}

      {data && (
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}
          onMouseLeave={() => setHover(null)}
          dir="ltr"
        >
          {Array.from(data).map((b, i) => (
            <button
              key={i}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              title={`0x${hx(i, 3)} = 0x${hx(b, 2)}`}
              className="aspect-square rounded-[2px] outline-none transition-transform hover:scale-150 focus-visible:scale-150"
              style={{
                background: b === 0xff ? "var(--unmapped)" : "var(--data)",
                opacity: b === 0xff ? 0.4 : Math.max(0.5, b / 255),
              }}
            />
          ))}
        </div>
      )}

      <div className="mono mt-3 text-[0.78rem] text-fg-muted" dir="ltr">
        {readout}
      </div>
    </div>
  );
}
