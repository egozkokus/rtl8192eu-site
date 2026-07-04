import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/app/components/ui";
import Quiz from "@/app/components/Quiz";

export const metadata: Metadata = {
  title: "מבחן",
  description: "בחנו את עצמכם על הנדסת-לאחור של ה-RTL8192EU, וטפסו בלוח התוצאות.",
};

export default function QuizPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="בחן את עצמך"
        title="מבחן"
        titleEn="ten questions from the silicon"
        lead="עשר שאלות שנשאבות ישירות מהממצאים החיים. כל תשובה מלווה בהסבר, ובסוף אפשר לרשום את הציון בלוח התוצאות."
      />
      <Quiz />
    </PageShell>
  );
}
