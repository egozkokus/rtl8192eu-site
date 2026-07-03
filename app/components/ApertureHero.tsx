"use client";

import { useEffect, useMemo, useState } from "react";
import { live, READ_CLASS, type ApertureCell } from "@/lib/live";

const COLOR: Record<string, string> = {
  data: "var(--data)",
  zeros: "var(--zeros)",
  unmapped: "var(--unmapped)",
  error: "var(--danger)",
};

export default function ApertureHero() {
  const cells = live.aperture_map;
  const [animate, setAnimate] = useState(false);
  const [hover, setHover] = useState<{ cell: ApertureCell; i: number } | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setAnimate(true);
  }, []);

  const counts = useMemo(() => {
    const c = { data: 0, zeros: 0, unmapped: 0, error: 0 } as Record<string, number>;
    for (const x of cells) c[x.class]++;
    return c;
  }, [cells]);

  const readout = hover
    ? `${hover.cell.addr} = ${hover.cell.value ?? "--"}  ·  ${READ_CLASS[hover.cell.class].he} — ${READ_CLASS[hover.cell.class].note}`
    : `${cells.length} עמודים · ${counts.data} דאטה · ${counts.zeros} אפסים · ${counts.unmapped} לא-ממופים`;

  return (
    <div className="w-full">
      {/* legend — teaches the color = read-state code up front */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.72rem] text-fg-muted">
        {(["data", "zeros", "unmapped"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-[3px]"
              style={{ background: COLOR[k], boxShadow: `0 0 8px ${COLOR[k]}` }}
            />
            <span className="mono">{READ_CLASS[k].he}</span>
          </span>
        ))}
      </div>

      {/* the signature: 256 real bytes, one per 0x100 page, colored by read-state */}
      <div
        className="grid gap-[3px] rounded-lg border border-line bg-ink-2/60 p-3"
        style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`מפת האפרטורה החיה של הצ'יפ: ${counts.data} עמודי דאטה, ${counts.zeros} אפסים, ${counts.unmapped} לא-ממופים`}
      >
        {cells.map((cell, i) => (
          <button
            key={cell.addr}
            type="button"
            onMouseEnter={() => setHover({ cell, i })}
            onFocus={() => setHover({ cell, i })}
            title={`${cell.addr} = ${cell.value ?? "--"}`}
            className="aspect-square rounded-[3px] outline-none transition-[filter,transform] duration-150 hover:z-10 hover:scale-[1.35] focus-visible:scale-[1.35]"
            style={{
              background: COLOR[cell.class],
              boxShadow:
                cell.class === "data"
                  ? `0 0 6px color-mix(in oklab, ${COLOR.data} 55%, transparent)`
                  : undefined,
              ...(animate
                ? { animation: `poweron 460ms ease-out both`, animationDelay: `${i * 3.2}ms` }
                : {}),
            }}
          />
        ))}
      </div>

      {/* live instrument readout */}
      <div className="mono mt-3 flex items-center gap-2 text-[0.78rem] text-fg-muted ltr" dir="ltr">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />
        <span className="truncate">{readout}</span>
      </div>
    </div>
  );
}
