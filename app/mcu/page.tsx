import type { Metadata } from "next";
import { PageShell, PageHeader, Section, Callout, Card, Hx } from "@/app/components/ui";
import BootRomViewer from "@/app/components/BootRomViewer";
import EfuseViewer from "@/app/components/EfuseViewer";
import { RESET_ROUTINE, BOOTROM_FACTS, TRUST_LINES, DPSEL } from "@/lib/bootrom";
import { EFUSE_PROTOCOL, EFUSE_FACTS, WRAP_TEST, EFUSE_DECODED } from "@/lib/efuse";

export const metadata: Metadata = {
  title: "ה-8051",
  description: "ליבת ה-8051, תגלית ה-DPSEL, ה-boot ROM שחולץ (16KB), וה-eFuse (512B).",
};

const MEM_TYPES = [
  { n: "CODE", d: "הוראות; נשלפות באיפוס מ-0x0000. כאן = 32KB SRAM + 16KB boot ROM. נקרא עם MOVC." },
  { n: "XDATA", d: "נתונים חיצוניים; כאן זהו אפיק רגיסטרי ה-MAC + ה-RAM של ה-MCU. נקרא/נכתב עם MOVX." },
  { n: "IRAM", d: "‏256B פנימי: R0–R7, מחסנית, RAM בר-מיעון-ביט. ה-boot ROM מאפס אותו." },
  { n: "SFR", d: "רגיסטרי-בקרה על-הליבה: הצובר, DPTR, ו-DPSEL (0x92) — זה שפותח את קריאות ה-MOVX." },
];

export default function McuPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="בתוך הסיליקון"
        title="ה-8051"
        titleEn="Harvard core · DPSEL · boot ROM · eFuse"
        lead="המוח הוא ליבת 8051 סטנדרטית — אבל מורחבת (multi-DPTR). כאן הסיפור של איך קריאות הזיכרון 'המתות' שלה נפתרו, איך חילצנו את ה-boot ROM הנסתר, ומה יש ב-eFuse."
      />

      <Section id="mem" eyebrow="ארבעה סוגי זיכרון" title="לשמור אותם נפרדים זה המפתח">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MEM_TYPES.map((m) => (
            <Card key={m.n}>
              <div className="mono mb-1 text-sm font-semibold text-mcu" dir="ltr">
                {m.n}
              </div>
              <p className="text-sm leading-relaxed text-fg-muted">{m.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="dpsel" eyebrow="הבלש" title="תגלית ה-DPSEL">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="space-y-3">
            {DPSEL.story.map((p, i) => (
              <p key={i} className="max-w-xl leading-relaxed text-fg-muted">
                <span className="mono me-2 text-data">{i + 1}.</span>
                {p}
              </p>
            ))}
          </div>
          <div>
            <div className="mono overflow-hidden rounded-lg border border-line bg-ink text-[0.78rem]" dir="ltr">
              <div className="border-b border-line bg-ink-2 px-3 py-1.5 text-[0.7rem] text-fg-dim">
                reset routine @ 0x2F52 (from bootrom.bin)
              </div>
              <div className="overflow-x-auto p-3">
                {RESET_ROUTINE.map((l) => (
                  <div
                    key={l.addr}
                    className="flex gap-2.5 whitespace-nowrap rounded px-1"
                    style={{
                      background: l.highlight ? "color-mix(in oklab, var(--data) 16%, transparent)" : undefined,
                    }}
                  >
                    <span className="text-fg-dim">{l.addr.toString(16).toUpperCase().padStart(4, "0")}</span>
                    <span className="w-16 text-fg-muted">{l.bytes}</span>
                    <span style={{ color: l.highlight ? "var(--data)" : "var(--fg)" }}>{l.asm}</span>
                    {l.comment && <span className="text-fg-dim">; {l.comment}</span>}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-fg-dim">
              ה-SFR‏ <Hx>0x92</Hx> נכתב פעם אחת בלבד — ב-<Hx>0x2F66</Hx> — ומעולם לא נגעו בו שוב.
            </p>
          </div>
        </div>
        <Callout kind="note" title={`${DPSEL.name} = ${DPSEL.value}`}>
          הוספת <Hx>MOV 0x92,#0x8D</Hx> (הבייטים <span dir="ltr" className="mono">75 92 8D</span>) לפני כל
          reader מספיקה: מ-<Hx>~0x06</Hx> צף פתאום כל 64KB קריא מצד ה-MCU.
        </Callout>
      </Section>

      <Section id="bootrom" eyebrow="חולץ" title="ה-boot ROM (16KB)">
        <div className="mb-4 flex flex-wrap gap-2">
          {BOOTROM_FACTS.map((f) => (
            <span key={f.k} className="rounded-md border border-line bg-ink-2/60 px-2.5 py-1 text-xs text-fg-muted">
              {f.k}: <span className="mono text-fg" dir="ltr">{f.v}</span>
            </span>
          ))}
        </div>
        <BootRomViewer />
        <h3 className="mb-3 mt-8 text-lg font-semibold text-fg">למה אנחנו סומכים על ה-dump — חמישה קווים</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRUST_LINES.map((t, i) => (
            <Card key={t.title}>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="mono text-data">{i + 1}</span>
                <span className="font-medium text-fg">{t.title}</span>
              </div>
              <p className="text-sm leading-relaxed text-fg-muted">{t.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="efuse" eyebrow="לא-נדיף" title="ה-eFuse (512B)">
        <div className="mb-4 flex flex-wrap gap-2">
          {EFUSE_FACTS.map((f) => (
            <span key={f.k} className="rounded-md border border-line bg-ink-2/60 px-2.5 py-1 text-xs text-fg-muted">
              {f.k}: <span className="mono text-fg" dir="ltr">{f.v}</span>
            </span>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <EfuseViewer />
          <div>
            <h3 className="mb-2 text-sm font-semibold text-fg">מה יש בפנים</h3>
            <div className="mb-5 overflow-hidden rounded-lg border border-line">
              {EFUSE_DECODED.map((d) => (
                <div key={d.field} className="flex justify-between gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0">
                  <span className="text-fg-muted">{d.field}</span>
                  <span className="mono text-fg" dir="ltr">{d.value}</span>
                </div>
              ))}
            </div>
            <h3 className="mb-2 text-sm font-semibold text-fg">מבחן ה-wrap (הוכיח 512B)</h3>
            <div className="mono overflow-hidden rounded-lg border border-line text-xs" dir="ltr">
              {WRAP_TEST.map((w) => (
                <div key={w.a} className="flex flex-wrap gap-x-3 border-b border-line px-3 py-1.5 last:border-b-0">
                  <span className="text-fg-dim">{w.a}={w.av}</span>
                  <span className="text-fg-dim">{w.b}={w.bv}</span>
                  <span className="font-sans text-fg-muted">{w.rel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Callout kind="danger" title="אף פעם לא להפעיל את מתח התכנות">
          קריאת eFuse רק כותבת לרגיסטר טריגר-הקריאה — בטוח לגמרי. שריפה דורשת מתח (<Hx>0x0034</Hx> / LDOE25),
          ושום דבר כאן לא מפעיל אותו — אז אי אפשר לשנות את ה-OTP בטעות.
        </Callout>
        <ol className="mt-4 space-y-2">
          {EFUSE_PROTOCOL.map((s) => (
            <li key={s.n} className="flex gap-3 text-sm text-fg-muted">
              <span className="mono shrink-0 text-data">{s.n}.</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </Section>
    </PageShell>
  );
}
