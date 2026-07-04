"use client";

import { useEffect, useRef, useState } from "react";
import { PIPELINE } from "@/lib/content";

export default function PipelineWalkthrough() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) return;
    if (active >= PIPELINE.length - 1) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setActive((a) => a + 1), 1400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, active]);

  const play = () => {
    setActive(0);
    setPlaying(true);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={play}
          className="rounded-md bg-data px-4 py-1.5 text-sm font-medium text-ink transition hover:brightness-110"
        >
          ▶ הרץ את הרצף
        </button>
        <span className="mono text-xs text-fg-dim" dir="ltr">
          {active + 1} / {PIPELINE.length}
        </span>
      </div>

      <div className="relative">
        {/* the spine (RTL: on the right) */}
        <div className="absolute bottom-2 top-2 right-[15px] w-px bg-line" />
        <ol className="space-y-2.5">
          {PIPELINE.map((s, i) => {
            const isActive = i === active;
            const done = i < active;
            return (
              <li key={s.n}>
                <button
                  onClick={() => {
                    setPlaying(false);
                    setActive(i);
                  }}
                  className="flex w-full items-start gap-4 text-start"
                >
                  <span
                    className="mono relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: isActive ? "var(--data)" : done ? "var(--ink-3)" : "var(--ink-2)",
                      color: isActive ? "var(--ink)" : done ? "var(--data)" : "var(--fg-dim)",
                      border: `1px solid ${isActive || done ? "var(--data)" : "var(--line)"}`,
                    }}
                  >
                    {done ? "✓" : s.n}
                  </span>
                  <div
                    className="flex-1 rounded-lg border p-3 transition-all"
                    style={{
                      borderColor: isActive ? "var(--data)" : "var(--line)",
                      background: isActive ? "var(--ink-2)" : "transparent",
                    }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-fg">{s.title}</span>
                      <code className="mono text-xs text-data-2" dir="ltr">
                        {s.call}
                      </code>
                    </div>
                    <div
                      className="overflow-hidden text-sm text-fg-muted transition-all duration-300"
                      style={{ maxHeight: isActive ? 200 : 0, opacity: isActive ? 1 : 0 }}
                    >
                      <p className="mt-2">{s.detail}</p>
                      {s.gotcha && (
                        <p
                          className="mt-2 rounded-md p-2 text-[0.82rem] ps-3"
                          style={{
                            borderInlineStartWidth: "2px",
                            borderInlineStartColor: "var(--danger)",
                            background: "color-mix(in oklab, var(--danger) 8%, transparent)",
                          }}
                        >
                          {s.gotcha}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
