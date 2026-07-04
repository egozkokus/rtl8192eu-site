"use client";

import { useMemo, useState } from "react";
import { REGISTERS, GROUPS, hex, type RegGroup } from "@/lib/registers";

export default function RegisterReference() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return REGISTERS;
    return REGISTERS.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.role.toLowerCase().includes(s) ||
        hex(r.addr, 16).toLowerCase().includes(s)
    );
  }, [q]);

  const groups = Object.keys(GROUPS) as RegGroup[];

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="חיפוש: שם, כתובת (0x0080), או תיאור…"
        className="mb-5 w-full rounded-lg border border-line bg-ink-2 px-4 py-2.5 text-fg outline-none placeholder:text-fg-dim focus:border-data"
      />

      {groups.map((g) => {
        const regs = filtered.filter((r) => r.group === g);
        if (!regs.length) return null;
        return (
          <div key={g} className="mb-6">
            <h3 className="mono mb-2 text-xs uppercase tracking-wider text-fg-dim">{GROUPS[g]}</h3>
            <div className="overflow-hidden rounded-lg border border-line">
              {regs.map((r) => (
                <div
                  key={r.addr + r.name}
                  className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 hover:bg-ink-2/60 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <div className="flex shrink-0 items-baseline gap-3 sm:w-64">
                    <code className="mono text-sm text-data-2" dir="ltr">
                      {hex(r.addr, 16)}
                    </code>
                    <span className="mono text-sm font-semibold text-fg" dir="ltr">
                      {r.name}
                    </span>
                    <span className="mono text-[0.65rem] text-fg-dim">{r.width}b</span>
                    {r.danger && (
                      <span
                        className="rounded px-1.5 text-[0.6rem] text-danger"
                        style={{ background: "color-mix(in oklab, var(--danger) 20%, transparent)" }}
                      >
                        סכנה
                      </span>
                    )}
                  </div>
                  <p className="flex-1 text-sm text-fg-muted">{r.role}</p>
                  {r.live !== undefined && (
                    <code className="mono shrink-0 text-xs text-fg-dim" dir="ltr" title="ערך חי שנמדד">
                      = {hex(r.live, r.width)}
                    </code>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!filtered.length && <p className="text-sm text-fg-dim">אין תוצאות עבור “{q}”.</p>}
    </div>
  );
}
