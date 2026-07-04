import type { Metadata } from "next";
import { PageShell, PageHeader, Section, Callout, Hx } from "@/app/components/ui";
import MemoryMap from "@/app/components/MemoryMap";
import RegisterDecoder from "@/app/components/RegisterDecoder";
import RegisterReference from "@/app/components/RegisterReference";

export const metadata: Metadata = {
  title: "זיכרון ורגיסטרים",
  description: "סייר מפת-הזיכרון (host מול MCU), מפענח רגיסטרים אינטראקטיבי, וטבלת ייחוס מלאה.",
};

export default function MemoryPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="מפה ורגיסטרים"
        title="זיכרון ורגיסטרים"
        titleEn="host aperture vs the MCU's 64KB"
        lead="ה-host רואה כ-8KB דרך USB; ה-8051 רואה מרחב 64KB מלא — כולל אזורים שה-host כלל לא מגיע אליהם. הסיירים כאן הם אינטראקטיביים: החליפו מבט, פענחו רגיסטר, חפשו בכל המפה."
      />

      <Section id="map" eyebrow="סייר אינטראקטיבי" title="מפת הזיכרון — host מול MCU">
        <MemoryMap />
      </Section>

      <Section id="decoder" eyebrow="פענוח חי" title="מפענח רגיסטרים">
        <p className="mb-4 max-w-2xl leading-relaxed text-fg-muted">
          בחרו רגיסטר, ערכו את הערך ההקסדצימלי או לחצו על ביטים בודדים — שדות-הביט מתפענחים חי. ערכי
          ברירת-המחדל הם מה שהיחידה הזו החזירה בפועל. נסו את <Hx>MCUFWDL</Hx> וראו את{" "}
          <span className="text-data">FW_DL_READY</span> — הביט שקל לשכוח.
        </p>
        <RegisterDecoder />
      </Section>

      <Section id="reference" eyebrow="ייחוס מלא" title="טבלת רגיסטרים">
        <Callout kind="note" title="מוסכמת השמות">
          השמות עוקבים אחר מוסכמת Realtek / <Hx>rtl8xxxu</Hx>. הרוחב: 8=בייט, 16=מילה, 32=dword. ערכי
          ה-<span dir="ltr" className="mono">=</span> הם קריאות חיות מהיחידה.
        </Callout>
        <RegisterReference />
      </Section>
    </PageShell>
  );
}
