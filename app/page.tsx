import Link from "next/link";
import ApertureHero from "./components/ApertureHero";
import { live } from "@/lib/live";
import { DISCOVERIES, CORRECTIONS, GLOSSARY } from "@/lib/content";

const FACTS: { k: string; v: string; sub?: string }[] = [
  { k: "צ'יפ", v: "RTL8192EU", sub: "משפחת 8192E" },
  { k: "USB ID", v: "0BDA:818B", sub: "cut B · TSMC" },
  { k: "ליבה", v: "8051", sub: "MCS-51 מורחב" },
  { k: "Code SRAM", v: "32KB", sub: "‏8×4KB · נדיף" },
  { k: "Boot ROM", v: "16KB", sub: "‏mask ROM · חולץ" },
  { k: "eFuse", v: "512B", sub: "OTP · זהות" },
  { k: "Secure boot", v: "אין", sub: "קוד שרירותי רץ" },
  { k: "רדיו", v: "2.4GHz", sub: "b/g/n · 1×1" },
];

const EXPLORE = [
  { href: "/architecture", t: "ארכיטקטורה", d: "פרימיטיב יחיד, ארבעה מרחבי כתובות, רצף הדלקה." },
  { href: "/memory", t: "זיכרון ורגיסטרים", d: "סייר host↔MCU, מפענח רגיסטרים, טבלת ייחוס." },
  { href: "/mcu", t: "ה-8051", d: "תגלית ה-DPSEL, ה-boot ROM שחולץ, ה-eFuse." },
  { href: "/firmware", t: "Firmware", d: "כתיבה, טעינה, blinky, וערוץ HMEBOX." },
  { href: "/live", t: "חי · WebUSB", d: "חברו דונגל וקראו רגיסטרים אמיתיים מהדפדפן." },
  { href: "/quiz", t: "מבחן", d: "בחנו את עצמכם וטפסו בלוח התוצאות." },
];

const MASTER = { host: "var(--data)", mcu: "var(--mcu)", both: "var(--ok)" } as const;

export default function Home() {
  const captured = new Date(live.capturedAt).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dataPages = live.aperture_map.filter((c) => c.class === "data").length;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">
      <div className="mono flex items-center justify-between border-b border-line pb-3 text-[0.72rem] text-fg-dim">
        <span dir="ltr">rtl8192eu · usb 0BDA:818B</span>
        <span className="inline-flex items-center gap-1.5 text-ok">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />
          נמדד חי · {captured}
        </span>
      </div>

      {/* hero */}
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-16">
        <div className="rise">
          <p className="mb-4 text-sm font-medium text-data">
            הנדסה־לאחור חיה &nbsp;·&nbsp;{" "}
            <span className="mono text-fg-muted" dir="ltr">
              no datasheet
            </span>
          </p>
          <h1 className="text-balance">
            <span
              className="mono block text-5xl font-semibold leading-none tracking-tight text-fg sm:text-6xl lg:text-7xl"
              dir="ltr"
            >
              RTL8192EU
            </span>
            <span className="mt-3 block text-2xl font-light text-fg-muted sm:text-3xl">
              נתיחה חיה של צ'יפ Wi-Fi
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
            צ'יפ ה־Wi-Fi הזה הוא בעצם מחשב זעיר על שבב: מעבד{" "}
            <span className="text-fg">8051</span>, זיכרון, ורדיו. כאן פירקנו אותו לגורמים{" "}
            <span className="text-fg">חי מעל USB</span> — בלי datasheet — ומיפינו את הארכיטקטורה, מפת
            הזיכרון וכל רגיסטר, עד להרצת firmware משלנו על הסיליקון.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/architecture"
              className="rounded-md bg-data px-5 py-2.5 font-medium text-ink transition hover:brightness-110"
            >
              התחל לחקור →
            </Link>
            <Link
              href="/live"
              className="rounded-md border border-line-2 px-5 py-2.5 font-medium text-fg-muted transition hover:border-mcu hover:text-mcu-2"
            >
              חבר את הדונגל שלך
            </Link>
          </div>
        </div>

        <div className="rise" style={{ animationDelay: "120ms" }}>
          <ApertureHero />
          <p className="mt-3 text-center text-xs text-fg-dim">
            מפת מרחב הכתובות של הצ'יפ — כל ריבוע הוא בייט אמיתי שנקרא ממנו
          </p>
        </div>
      </section>

      {/* facts */}
      <section id="facts" className="scroll-mt-20">
        <h2 className="mono mb-4 text-xs uppercase tracking-[0.2em] text-fg-dim">// עובדות מהירות</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.k} className="rounded-lg border border-line bg-ink-2/60 p-4 transition hover:border-line-2">
              <div className="text-[0.7rem] uppercase tracking-wider text-fg-dim">{f.k}</div>
              <div className="mono mt-1 text-xl font-semibold text-fg" dir="ltr">
                {f.v}
              </div>
              {f.sub && <div className="mt-0.5 text-xs text-fg-muted">{f.sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* discoveries */}
      <section className="mt-16">
        <h2 className="mono mb-4 text-xs uppercase tracking-[0.2em] text-fg-dim">// מה גילינו</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DISCOVERIES.map((d) => (
            <div
              key={d.title}
              className="rounded-lg border border-line bg-ink-2/50 p-5"
              style={{ borderInlineStartWidth: "3px", borderInlineStartColor: MASTER[d.master ?? "both"] }}
            >
              <div className="mono mb-1 text-[0.7rem] uppercase tracking-wider" style={{ color: MASTER[d.master ?? "both"] }}>
                {d.tag}
              </div>
              <div className="mb-1.5 text-lg font-semibold text-fg">{d.title}</div>
              <p className="text-sm leading-relaxed text-fg-muted">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* explore */}
      <section className="mt-16">
        <h2 className="mono mb-4 text-xs uppercase tracking-[0.2em] text-fg-dim">// המשך לחקור</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group rounded-lg border border-line bg-ink-2/50 p-5 transition hover:border-data hover:bg-ink-2"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-lg font-semibold text-fg">{e.t}</span>
                <span className="text-fg-dim transition group-hover:text-data">←</span>
              </div>
              <p className="text-sm leading-relaxed text-fg-muted">{e.d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* corrections */}
      <section className="mt-16">
        <h2 className="mono mb-1 text-xs uppercase tracking-[0.2em] text-fg-dim">// מה ה-toolkit המקורי פספס</h2>
        <p className="mb-4 max-w-2xl text-sm text-fg-muted">
          ה-RE החי תיקן כמה הנחות. אלה ההבדלים בין מה שחשבנו למה שמדדנו.
        </p>
        <div className="overflow-hidden rounded-lg border border-line">
          {CORRECTIONS.map((c, i) => (
            <div key={i} className="grid gap-2 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-2 sm:gap-6">
              <div className="text-sm text-fg-muted line-through decoration-danger/50">{c.claim}</div>
              <div className="text-sm text-fg">
                <span className="mono me-1.5 text-ok">→</span>
                {c.reality}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* glossary */}
      <section className="mt-16">
        <h2 className="mono mb-4 text-xs uppercase tracking-[0.2em] text-fg-dim">// מילון</h2>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="border-b border-line pb-3">
              <div className="mono mb-0.5 text-sm font-semibold text-fg" dir="ltr">
                {g.term}
              </div>
              <p className="text-sm leading-relaxed text-fg-muted">{g.he}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mono mt-20 border-t border-line pt-6 text-xs text-fg-dim" dir="ltr">
        compiled from live RE of one RTL8192EU dongle · everything volatile, replug to reset
      </footer>
    </main>
  );
}
