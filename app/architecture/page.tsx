import type { Metadata } from "next";
import { PageShell, PageHeader, Section, Callout, Card, Hx, CodeBlock } from "@/app/components/ui";
import SameAddress from "@/app/components/SameAddress";
import { SPACES } from "@/lib/memory";

export const metadata: Metadata = {
  title: "ארכיטקטורה",
  description: "הפרימיטיב היחיד, ששת הבלוקים, ארבעת מרחבי הכתובות, ורצף ההדלקה של ה-RTL8192EU.",
};

const BLOCKS = [
  { n: "USB", t: "בקר USB 2.0", d: "מגשר בין ה-host לאפיק הפנימי. 3 תורי TX, RX, ואירועים. רגיסטרים ב-0xFE00." },
  { n: "8051", t: "מיקרו-בקר", d: "מריץ firmware נדיף מ-32KB code SRAM (+16KB boot ROM). ניהול מתח, rate adaptation." },
  { n: "MAC", t: "‏802.11 MAC", d: "טיימר TSF חופשי, מטמון מפתחות (CAM), סינון כתובות, תורי DMA." },
  { n: "BB/PHY", t: "‏Baseband DSP", d: "מודולציה, AGC, ו-TX-power לפי rate/ערוץ (כיול מה-eFuse)." },
  { n: "RF", t: "‏Front-end אנלוגי", d: "‏2.4GHz b/g/n, זרם יחיד. דומיין מתח נפרד." },
  { n: "EFUSE", t: "מערך OTP", d: "זהות הצ'יפ (VID/PID, מחרוזות) + כיול RF." },
];

const MASTER = { host: "var(--data)", mcu: "var(--mcu)" } as const;

export default function ArchitecturePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="איך זה בנוי"
        title="ארכיטקטורה"
        titleEn="one primitive · six blocks · four address spaces"
        lead="הצ'יפ נשלט דרך פעולה יחידה: קריאה/כתיבה של רגיסטר בכתובת 16-ביט. אבל 'מרחב שטוח אחד' נכון רק לטווח הנמוך — במציאות יש כמה מרחבי כתובות נפרדים, וזו הליבה של כל מה שגילינו."
      />

      <Section id="primitive" eyebrow="הרעיון האחד" title="פרימיטיב יחיד — בלי command set">
        <p className="mb-3 max-w-2xl leading-relaxed text-fg-muted">
          אין לצ'יפ אוסף פקודות עשיר. כל פעולה — להגדיר את הרדיו, לקרוא את ה-MAC, לטעון firmware — היא
          גישת רגיסטר בכתובת הנכונה. מה-<span className="text-data">host</span> עושים זאת עם control
          transfer של USB; מה-<span className="text-mcu">8051</span> עם הוראה אחת (<Hx>MOVX</Hx>).
        </p>
        <CodeBlock label="host · pyusb">{`# קריאה של 4 בייט מ-0x00F0, ואז כתיבת 0x12345678 ל-0x0430
data = dev.ctrl_transfer(0xC0, 0x05, 0x00F0, 0, 4)                      # read
dev.ctrl_transfer(0x40, 0x05, 0x0430, 0, bytes([0x78,0x56,0x34,0x12]))  # write`}</CodeBlock>
        <CodeBlock label="firmware · 8051">{`MOV  DPTR, #0x0430
MOVX @DPTR, A          ; @DPTR הוא XDATA = אפיק הרגיסטרים`}</CodeBlock>
        <Callout kind="note" title="מופה במלואו — אין פקודות נסתרות">
          סריקה של כל 256 ערכי <Hx>bRequest</Hx> וכל ערכי <Hx>wIndex</Hx> הראתה: אין פקודות נסתרות, אין
          DFU, אין ערוץ יצרן סודי. המכשיר הוא בדיוק פרימיטיב-רגיסטר אחד מפוענח-כתובת.
        </Callout>
      </Section>

      <Section id="blocks" eyebrow="ששת הבלוקים" title="בלוקים תלויים באפיק הפנימי">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BLOCKS.map((b) => (
            <Card key={b.n}>
              <div className="mono mb-1 text-sm font-semibold text-data" dir="ltr">
                {b.n}
              </div>
              <div className="mb-1 font-medium text-fg">{b.t}</div>
              <p className="text-sm leading-relaxed text-fg-muted">{b.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="spaces" eyebrow="התגלית המרכזית" title="ארבעה מרחבי כתובות">
        <p className="mb-5 max-w-2xl leading-relaxed text-fg-muted">
          ה-toolkit המקורי הניח שחלון הרגיסטרים של ה-host וזיכרון ה-8051 הם מרחב שטוח אחד 1:1. הם לא.
          יש לפחות ארבעה מבטים שונים, לכל אחד decoder משלו.
        </p>
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {SPACES.map((s) => (
            <div
              key={s.letter}
              className="rounded-lg border border-line bg-ink-2/50 p-4"
              style={{ borderInlineStartWidth: "3px", borderInlineStartColor: MASTER[s.master] }}
            >
              <div className="flex items-baseline gap-2">
                <span className="mono text-lg font-bold" style={{ color: MASTER[s.master] }}>
                  {s.letter}
                </span>
                <span className="font-medium text-fg">{s.name}</span>
              </div>
              <div className="mono mt-1 text-xs text-fg-dim" dir="ltr">
                {s.reachedBy} · {s.size}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.note}</p>
            </div>
          ))}
        </div>

        <h3 className="mb-3 text-lg font-semibold text-fg">ההוכחה הניצחת</h3>
        <SameAddress />
      </Section>

      <Section id="power" eyebrow="הדלקה" title="דומייני מתח ורצף bring-up">
        <p className="mb-3 max-w-2xl leading-relaxed text-fg-muted">
          הצ'יפ מחולק ל"איי מתח" עצמאיים שמנוהלים ע"י מכונת-מצבים (<Hx>APS_FSMCO</Hx>). רק הדומיין
          ה-always-on חי באתחול; ה-MAC, ה-MCU וה-RF מודלקים ברצף.
        </p>
        <Callout kind="warn" title="קוד מצב-הקריאה: EA / 00 / דאטה">
          קריאת כתובת מסגירה את מצב המתח שלה:{" "}
          <Hx>0xEA</Hx> = לא-מודלק/clock-gated · <Hx>0x00</Hx> = מודלק אך לא-מאותחל · ערך אמיתי =
          מודלק ומוגדר. אזור מלא ב-<Hx>0xEA</Hx> אינו שבור — פשוט הדומיין הזה עוד לא נדלק.
        </Callout>
        <CodeBlock label="minimal power-on (PON)">{`v = r32(0x0004); v &= ~((1<<9)|(1<<11)|(1<<12)|(1<<15)); v |= (1<<16); w32(0x0004, v)
w16(0x0004, r16(0x0004) | (1<<8))    # MAC_ENABLE — מתנקה-עצמית כשה-MAC מודלק
while r16(0x0004) & (1<<8): pass
w16(0x0008, r16(0x0008) | 0x000F)    # שעונים
w16(0x0002, r16(0x0002) | 0x0003 | (1<<2) | (1<<4))  # BB out of reset + USB A/D`}</CodeBlock>
        <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
          אחרי PON הטיימר TSF ב-<Hx>0x0560</Hx> מתחיל לתקתק וחלון ה-firmware ב-<Hx>0x1000</Hx> נהיה חי —
          שתי הוכחות ששעון ה-MAC חי.
        </p>
      </Section>
    </PageShell>
  );
}
