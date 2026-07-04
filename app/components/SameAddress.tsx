"use client";

import { useEffect, useRef, useState } from "react";
import { SAME_ADDRESS } from "@/lib/memory";

const MASTER_COLOR = { host: "var(--data)", mcu: "var(--mcu)" } as const;

export default function SameAddress() {
  const [revealed, setRevealed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const paths = SAME_ADDRESS.paths;

  const run = () => {
    setRevealed(0);
    paths.forEach((_, i) => setTimeout(() => setRevealed(i + 1), 380 * (i + 1)));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allShown = revealed >= paths.length;

  return (
    <div ref={ref} className="rounded-xl border border-line bg-ink-2/50 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-fg-muted">קוראים את הכתובת</span>
          <span className="mono text-2xl font-semibold text-fg" dir="ltr">
            {SAME_ADDRESS.addr}
          </span>
        </div>
        <button
          onClick={run}
          className="mono rounded-md border border-line-2 px-3 py-1.5 text-xs text-fg-muted transition hover:border-data hover:text-data"
        >
          ↻ צלם שוב
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {paths.map((p, i) => {
          const shown = revealed > i;
          const color = MASTER_COLOR[p.master];
          return (
            <div
              key={p.path}
              className="rounded-lg border border-line bg-ink p-4 transition-colors"
              style={{ borderColor: shown ? color : undefined }}
            >
              <div className="mb-3 text-xs text-fg-muted">{p.path}</div>
              <div
                className="mono text-4xl font-bold tabular-nums transition-all duration-300"
                dir="ltr"
                style={{
                  color: shown ? color : "var(--unmapped)",
                  textShadow: shown ? `0 0 22px ${color}` : "none",
                  opacity: shown ? 1 : 0.5,
                }}
              >
                {shown ? p.byte : "??"}
              </div>
              <div
                className="mt-3 text-[0.82rem] leading-snug text-fg-muted transition-opacity duration-300"
                style={{ opacity: shown ? 1 : 0 }}
              >
                {p.what}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mono mt-5 overflow-hidden text-[0.9rem] leading-relaxed text-fg transition-all duration-500"
        style={{ maxHeight: allShown ? 80 : 0, opacity: allShown ? 1 : 0 }}
      >
        <span className="text-data">D8</span> == <span className="text-mcu">D8</span> !={" "}
        <span className="text-mcu">02</span> &nbsp;→&nbsp;
        <span className="font-sans not-italic">{SAME_ADDRESS.punch}</span>
      </div>
    </div>
  );
}
