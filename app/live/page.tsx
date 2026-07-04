import type { Metadata } from "next";
import { PageShell, PageHeader, Section, Callout, Hx } from "@/app/components/ui";
import WebUsbPanel from "@/app/components/WebUsbPanel";
import { live } from "@/lib/live";

export const metadata: Metadata = {
  title: "חי · WebUSB",
  description: "חברו דונגל RTL8192EU וקראו רגיסטרים אמיתיים מהדפדפן, או עיינו בצילום החי הצרוב.",
};

export default function LivePage() {
  const d = live.descriptor;
  const captured = new Date(live.capturedAt).toLocaleString("he-IL");

  const snap: { label: string; value: string }[] = [
    { label: "SYS_CFG (0x00F0)", value: live.identity.SYS_CFG_0x00F0 },
    { label: "ver (0x00F8)", value: live.identity.ver_0x00F8 },
    { label: "REG_9346CR (0x000A)", value: live.identity.REG_9346CR_0x000A },
    { label: "MCUFWDL (0x0080)", value: live.registers.MCUFWDL.value },
    { label: "04F0 / 04F4", value: `${live.registers.stat_04F0.value} / ${live.registers.stat_04F4.value}` },
    { label: "MACID (0x0610)", value: live.macid_0x0610 },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="בזמן אמת"
        title="חי · WebUSB"
        titleEn="drive a real dongle from your browser"
        lead="אם יש לכם דונגל RTL8192EU מקושר ל-WinUSB, אפשר לקרוא ממנו רגיסטרים אמיתיים ישירות מהדפדפן — קריאה בלבד. אין דונגל? הצילום החי למטה נצרב מהיחידה שלנו וזמין תמיד."
      />

      <Section id="webusb" eyebrow="הדונגל שלכם" title="חבר וקרא חי">
        <WebUsbPanel />
        <Callout kind="note" title="מה צריך">
          דפדפן מבוסס Chromium (Chrome/Edge) במחשב שולחני, ודונגל שמקושר לדרייבר{" "}
          <span className="mono" dir="ltr">WinUSB</span> (דרך Zadig, בדיוק כמו ב-toolkit). הכול כאן{" "}
          <span className="text-ok">קריאה בלבד</span> — שום דבר לא נכתב לצ'יפ, וניתוק/חיבור מאפס אותו ממילא.
        </Callout>
      </Section>

      <Section id="snapshot" eyebrow="צילום צרוב" title="מה היחידה שלנו החזירה">
        <p className="mb-4 max-w-2xl text-sm text-fg-dim">נמדד חי ב-{captured} · {live.method}</p>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-ink-2/50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-fg">‏USB descriptor</h3>
            <div className="mono space-y-1.5 text-sm" dir="ltr">
              <Row k="VID:PID" v={`${d.idVendor}:${d.idProduct}`} />
              <Row k="bcdDevice" v={d.bcdDevice} />
              <Row k="manufacturer" v={d.iManufacturer ?? "—"} />
              <Row k="product" v={d.iProduct ?? "—"} />
              <Row k="serial" v={d.iSerialNumber ?? "—"} />
              <Row k="endpoints" v={d.endpoints.join(" ")} />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-ink-2/50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-fg">רגיסטרים</h3>
            <div className="mono space-y-1.5 text-sm" dir="ltr">
              {snap.map((s) => (
                <Row key={s.label} k={s.label} v={s.value} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-line bg-ink-2/50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-fg">
            טיימר TSF · {live.tsf_timer_0x0560.alive ? <span className="text-ok">חי</span> : "סטטי"}
          </h3>
          <div className="mono flex flex-wrap gap-3 text-sm text-fg-muted" dir="ltr">
            {live.tsf_timer_0x0560.reads.map((r, i) => (
              <span key={i}>{r}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-fg-dim">
            שלוש קריאות רצופות של המונה החופשי — הערכים עולים, כלומר שעון ה-MAC (1MHz) חי.
          </p>
        </div>
      </Section>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-fg-dim">{k}</span>
      <span className="text-data">{v}</span>
    </div>
  );
}
