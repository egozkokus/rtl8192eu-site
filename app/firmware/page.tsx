import type { Metadata } from "next";
import { PageShell, PageHeader, Section, Callout, Card, Hx, CodeBlock } from "@/app/components/ui";
import PipelineWalkthrough from "@/app/components/PipelineWalkthrough";

export const metadata: Metadata = {
  title: "Firmware",
  description: "לכתוב ולהריץ firmware משלכם על ה-8051: דרישות סף, רצף הטעינה, blinky, וערוץ HMEBOX.",
};

const REQS = [
  { t: "‏8051 (MCS-51)", w: "זה המעבד. SDCC או Keil C51." },
  { t: "‏≤ 32KB", w: "‏code SRAM הוא 8×4KB." },
  { t: "קוד תקין ב-0x0000", w: "וקטור האיפוס — בד\"כ LJMP main‏ (0x02…)." },
  { t: "‏data RAM ב-0xA000+", w: "רגיסטרי החומרה ב-0x0000–0x07FF — אל תדרוס אותם." },
  { t: "בלי חתימה", w: "אין secure boot; קוד שרירותי רץ. הכותרת היא format בלבד." },
  { t: "לקריאה: MOV 0x92,#0x8D", w: "מגדיר DPSEL כדי שקריאות MOVX לא יצופו." },
];

export default function FirmwarePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="לגרום לזה לרוץ"
        title="Firmware"
        titleEn="write · load · boot · debug"
        lead="אין secure boot — הצ'יפ מריץ קוד 8051 שרירותי. הכול נדיף: replug מאפס הכול, אז אי אפשר להשחית אותו לצמיתות. הנה הרצף המדויק, מ-hold-reset ועד ה-8051 שרץ."
      />

      <Section id="reqs" eyebrow="דרישות סף" title="מה ה-firmware חייב לקיים">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REQS.map((r, i) => (
            <Card key={r.t}>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="mono text-data">{i + 1}</span>
                <span className="mono text-sm font-semibold text-fg" dir="ltr">
                  {r.t}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-fg-muted">{r.w}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="pipeline" eyebrow="הרצף המוכח" title="טעינה והרצה">
        <PipelineWalkthrough />
      </Section>

      <Section id="blinky" eyebrow="דוגמה" title="‏blinky — ההוכחה שקוד משלנו רץ">
        <p className="mb-3 max-w-2xl leading-relaxed text-fg-muted">
          ה-firmware הכי קטן שמשמעותי: מונה שעולה ונכתב ל-scratch, שה-host צופה בו מטפס.
        </p>
        <CodeBlock label="fw.c">{`__xdata __at(0x0430) volatile unsigned char SCRATCH;
static void delay(void){ volatile unsigned int i; for(i=0;i<20000;i++); }
void main(void){
    unsigned char c = 0;
    for(;;){ SCRATCH = ++c; delay(); }
}`}</CodeBlock>
        <CodeBlock label="build · load · watch">{`sdcc -mmcs51 --code-loc 0x0000 --xram-loc 0xA000 --xram-size 0x1000 fw.c
makebin -p fw.ihx code.bin
python mkfw.py code.bin fw.bin --trim     # כותרת אופציונלית
python fwload.py fw.bin --run             # טען + הרץ
python watch.py 0x0430 30                 # 01 02 03 … הוא מטפס`}</CodeBlock>
        <Callout kind="note" title="התוצאה שנצפתה">
          <Hx>0x0430</Hx> סופר <span className="mono" dir="ltr">01 → … → 0x19</span> בזמן שה-firmware רץ, ו-diff
          מלא מאשר שזה הרגיסטר היחיד שמשתנה (מלבד טיימר ה-TSF). קוד 8051 משלנו רץ על הסיליקון. ✓
        </Callout>
      </Section>

      <Section id="hmebox" eyebrow="ערוץ פיקוד" title="host ↔ MCU (HMEBOX)">
        <p className="mb-3 max-w-2xl leading-relaxed text-fg-muted">
          כי תיבות-הדואר הן פשוט רגיסטרים, עם firmware משלכם אתם מגדירים פרוטוקול משלכם: ה-host כותב בייט-פקודה,
          ה-firmware עושה poll, פועל, וכותב תשובה. שליטה חיה ב-firmware בלי לטעון אותו מחדש.
        </p>
        <CodeBlock label="firmware · C">{`__xdata __at(0x01D0) volatile unsigned char H2C;    // ה-host כותב פקודה
__xdata __at(0x01D4) volatile unsigned char REPLY;  // ה-firmware עונה (HMEBOX, לא 0x0430!)
void main(void){ unsigned char cmd; for(;;){ cmd=H2C; if(cmd){ REPLY=cmd+1; H2C=0; } } }`}</CodeBlock>
        <CodeBlock label="host · Python">{`def cmd(dev,c):
    dev.ctrl_transfer(0x40,0x05,0x01D0,0,bytes([c]))          # שלח
    while dev.ctrl_transfer(0xC0,0x05,0x01D0,0,1)[0]: pass    # חכה ל-ack של ה-fw
    return dev.ctrl_transfer(0xC0,0x05,0x01D4,0,1)[0]         # קרא תשובה`}</CodeBlock>
        <Callout kind="warn" title="אל תשתמשו ב-0x0430 כערוץ">
          ‏<Hx>0x0430</Hx> אינו scratch נקי — רק 5 הביטים התחתונים <Hx>0x1F</Hx> שורדים כתיבה
          (<span className="mono" dir="ltr">0x5A→0x1A</span>). ה-nonce שם לעולם לא יתאים. השתמשו ב-HMEBOX
          (<Hx>0x01D0…</Hx>) שמשקף את כל 8 הביטים.
        </Callout>
      </Section>
    </PageShell>
  );
}
