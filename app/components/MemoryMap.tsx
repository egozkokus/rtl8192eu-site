"use client";

import { useState } from "react";
import { REGIONS, MEM_CLASS, type MemClass, APERTURE_SUMMARY } from "@/lib/memory";

const color = (c: MemClass) => `var(${MEM_CLASS[c].varName})`;
const hx = (n: number) => "0x" + n.toString(16).toUpperCase().padStart(4, "0");

type View = "host" | "mcu";

export default function MemoryMap() {
  const [view, setView] = useState<View>("host");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      {/* view toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-line bg-ink-2 p-1">
          {(
            [
              ["host", "מבט ה-host", "--data"],
              ["mcu", "מבט ה-MCU", "--mcu"],
            ] as const
          ).map(([v, label, cvar]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded-md px-4 py-1.5 text-sm font-medium transition"
              style={{
                background: view === v ? `var(${cvar})` : "transparent",
                color: view === v ? "var(--ink)" : "var(--fg-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mono text-xs text-fg-dim" dir="ltr">
          {view === "host" ? APERTURE_SUMMARY.hostReads : APERTURE_SUMMARY.mcuReads} readable
        </div>
      </div>

      {/* legend */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.72rem] text-fg-muted">
        {(["data", "zeros", "unmapped", "ram", "window"] as MemClass[]).map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: color(c) }} />
            {MEM_CLASS[c].he}
          </span>
        ))}
      </div>

      {/* regions */}
      <div className="overflow-hidden rounded-lg border border-line">
        {REGIONS.map((r, i) => {
          const cls = r[view];
          const differs = r.host !== r.mcu;
          const isOpen = open === i;
          return (
            <div key={r.lo} className="border-b border-line last:border-b-0">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-stretch gap-0 text-start transition hover:bg-ink-2/60"
              >
                <span
                  className="mono grid w-[132px] shrink-0 place-items-center py-2.5 text-xs text-fg-dim"
                  dir="ltr"
                >
                  {hx(r.lo)}–{hx(r.hi)}
                </span>
                <span
                  className="flex flex-1 items-center gap-2 py-2.5 pe-3 ps-3"
                  style={{
                    background: `color-mix(in oklab, ${color(cls)} 16%, transparent)`,
                    borderInlineStartWidth: "3px",
                    borderInlineStartColor: color(cls),
                  }}
                >
                  <span className="flex-1 text-sm text-fg">{r.label}</span>
                  {differs && (
                    <span
                      className="mono rounded px-1.5 py-0.5 text-[0.62rem]"
                      style={{ background: "color-mix(in oklab, var(--mcu) 22%, transparent)", color: "var(--mcu-2)" }}
                      title="ה-host וה-MCU רואים דברים שונים כאן"
                    >
                      ≠
                    </span>
                  )}
                  <span className="mono text-[0.7rem] text-fg-dim">{MEM_CLASS[cls].he}</span>
                </span>
              </button>
              {isOpen && (
                <div className="bg-ink px-4 py-3 text-sm text-fg-muted">
                  {r.note && <p className="mb-2">{r.note}</p>}
                  <div className="mono flex gap-5 text-xs" dir="ltr">
                    <span>
                      host:{" "}
                      <span style={{ color: color(r.host) }}>{MEM_CLASS[r.host].he}</span>
                    </span>
                    <span>
                      mcu:{" "}
                      <span style={{ color: color(r.mcu) }}>{MEM_CLASS[r.mcu].he}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-fg-dim">
        לחצו על אזור לפרטים. שורות עם <span className="text-mcu-2">≠</span> הן המקומות שבהם ה-host וה-MCU
        רואים דברים שונים — הליבה של תגלית ארבעת המרחבים.
      </p>
    </div>
  );
}
