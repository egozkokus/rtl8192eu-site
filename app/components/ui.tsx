import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-5xl px-5 pb-28 pt-10 sm:px-8">{children}</main>;
}

export function PageHeader({
  eyebrow,
  title,
  titleEn,
  lead,
}: {
  eyebrow: string;
  title: string;
  titleEn?: string;
  lead?: string;
}) {
  return (
    <header className="mb-12 border-b border-line pb-8">
      <p className="mono mb-3 text-xs uppercase tracking-[0.2em] text-data">// {eyebrow}</p>
      <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        {title}
        {titleEn && (
          <span className="mono mt-2 block text-lg font-normal text-fg-dim" dir="ltr">
            {titleEn}
          </span>
        )}
      </h1>
      {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{lead}</p>}
    </header>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      {eyebrow && (
        <p className="mono mb-1.5 text-xs uppercase tracking-[0.18em] text-fg-dim">// {eyebrow}</p>
      )}
      <h2 className="mb-5 text-2xl font-semibold tracking-tight text-fg">{title}</h2>
      {children}
    </section>
  );
}

const CALLOUT_STYLE = {
  note: { border: "var(--mcu)", label: "שים לב", cls: "text-mcu-2" },
  warn: { border: "var(--data)", label: "אזהרה", cls: "text-data" },
  danger: { border: "var(--danger)", label: "אל תיגע", cls: "text-danger" },
  good: { border: "var(--ok)", label: "בטוח", cls: "text-ok" },
} as const;

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: keyof typeof CALLOUT_STYLE;
  title?: string;
  children: ReactNode;
}) {
  const s = CALLOUT_STYLE[kind];
  return (
    <div
      className="my-6 rounded-lg border border-line bg-ink-2/50 p-4 ps-5"
      style={{ borderInlineStartWidth: "3px", borderInlineStartColor: s.border }}
    >
      <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${s.cls}`}>
        {title ?? s.label}
      </div>
      <div className="text-[0.95rem] leading-relaxed text-fg-muted">{children}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-ink-2/50 p-5 ${className}`}>{children}</div>
  );
}

/** LTR hex/mono badge for inline register values, addresses, opcodes. */
export function Hx({ children }: { children: ReactNode }) {
  return (
    <code
      className="mono rounded bg-ink-3 px-1.5 py-0.5 text-[0.85em] text-data-2"
      dir="ltr"
    >
      {children}
    </code>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-2xl space-y-4 text-[1.02rem] leading-relaxed text-fg-muted">{children}</div>;
}

export function CodeBlock({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-line bg-ink">
      {label && (
        <div className="mono border-b border-line bg-ink-2 px-4 py-1.5 text-[0.7rem] text-fg-dim" dir="ltr">
          {label}
        </div>
      )}
      <pre className="mono ltr-block overflow-x-auto p-4 text-[0.82rem] leading-relaxed text-fg" dir="ltr">
        {children}
      </pre>
    </div>
  );
}
