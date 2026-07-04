import type { Metadata } from "next";
import { PageHeader, Callout, Hx } from "@/app/components/ui";
import Simulator from "@/app/components/Simulator";

export const metadata: Metadata = {
  title: "סימולטור 8051",
  description: "סימולטור 8051 מלא בדפדפן — פוסעים דרך ה-boot ROM האמיתי של ה-RTL8192EU וצופים ברגיסטרים, בזיכרון וב-DPSEL, או מריצים כל binary 8051 משלכם.",
};

export default function SimulatorPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6">
      <PageHeader
        eyebrow="הרץ בעצמך"
        title="סימולטור 8051"
        titleEn="step the real boot ROM in your browser"
        lead="סימולטור MCS-51 מלא שרץ כולו בדפדפן — אותו מנוע שהריץ את המחקר, מאומת מול הצ'יפ. טעון-מראש עם ה-boot ROM האמיתי של ה-RTL8192EU: פסעו הוראה-הוראה או הריצו, וצפו ברגיסטרים, בזיכרון ובדגלים משתנים חי. אפשר גם להעלות כל binary 8051 משלכם."
      />
      <Simulator />
      <Callout kind="note" title="מה לנסות">
        לחצו <b>הרץ ▶</b> וצפו ב-XDATA‏ <Hx>0x8000</Hx> מתמלא באפסים (ה-ROM מאפס 12KB של RAM עבודה), ואז
        ב-<span className="text-data">DPSEL</span> נדלק ל-<Hx>0x8D</Hx> — הרגיסטר שפותח את קריאות ה-MOVX. אחרי
        ~38K צעדים ה-ROM עוצר ב-<Hx>SJMP $</Hx> וממתין ל-host. נסו גם את ה<b>דמו</b> (מונה שנכתב ל-<Hx>0x0430</Hx>)
        כדי לראות בבירור רגיסטר וכתובת-זיכרון משתנים בכל צעד.
      </Callout>
    </main>
  );
}
