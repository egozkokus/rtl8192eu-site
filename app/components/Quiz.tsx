"use client";

import { useCallback, useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/quiz";
import { supabase, SCORES_TABLE, type ScoreRow } from "@/lib/supabase";

type Phase = "intro" | "playing" | "done";

export default function Quiz() {
  const total = QUESTIONS.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const q = QUESTIONS[idx];

  const start = () => {
    setPhase("playing");
    setIdx(0);
    setPicked(null);
    setScore(0);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= total) {
      setPhase("done");
    } else {
      setIdx((n) => n + 1);
      setPicked(null);
    }
  };

  if (phase === "intro") {
    return (
      <div className="rounded-xl border border-line bg-ink-2/50 p-6 text-center">
        <p className="mx-auto mb-5 max-w-md text-fg-muted">
          {total} שאלות על מה שגילינו בצ'יפ — מרחבי כתובות, DPSEL, ה-boot ROM, ה-eFuse ועוד. בכל שאלה תקבלו
          הסבר. בסוף אפשר להעלות לתוצאות.
        </p>
        <button
          onClick={start}
          className="rounded-md bg-data px-6 py-2.5 font-medium text-ink transition hover:brightness-110"
        >
          התחל מבחן
        </button>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="rounded-xl border border-line bg-ink-2/50 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="mono text-xs text-fg-dim" dir="ltr">
            {idx + 1} / {total}
          </span>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-ink-3">
            <div
              className="h-full rounded-full bg-data transition-all duration-300"
              style={{ width: `${((idx + (picked !== null ? 1 : 0)) / total) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="mb-4 text-lg font-semibold text-fg">{q.q}</h3>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const revealed = picked !== null;
            const isCorrect = i === q.correct;
            const isPicked = i === picked;
            let border = "var(--line)";
            let bg = "transparent";
            if (revealed && isCorrect) {
              border = "var(--ok)";
              bg = "color-mix(in oklab, var(--ok) 12%, transparent)";
            } else if (revealed && isPicked) {
              border = "var(--danger)";
              bg = "color-mix(in oklab, var(--danger) 12%, transparent)";
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={revealed}
                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition disabled:cursor-default"
                style={{ borderColor: border, background: bg }}
              >
                <span
                  className="mono grid h-6 w-6 shrink-0 place-items-center rounded text-xs"
                  style={{
                    background: revealed && isCorrect ? "var(--ok)" : revealed && isPicked ? "var(--danger)" : "var(--ink-3)",
                    color: revealed && (isCorrect || isPicked) ? "var(--ink)" : "var(--fg-dim)",
                  }}
                  dir="ltr"
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={revealed && !isCorrect && !isPicked ? "text-fg-dim" : "text-fg"}>{opt}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-4">
            <p
              className="rounded-lg border p-3 text-sm leading-relaxed ps-4"
              style={{
                borderColor: "var(--line)",
                borderInlineStartWidth: "3px",
                borderInlineStartColor: picked === q.correct ? "var(--ok)" : "var(--data)",
              }}
            >
              <span className="font-semibold" style={{ color: picked === q.correct ? "var(--ok)" : "var(--data)" }}>
                {picked === q.correct ? "נכון! " : "לא בדיוק. "}
              </span>
              <span className="text-fg-muted">{q.why}</span>
            </p>
            <button
              onClick={next}
              className="mt-4 rounded-md bg-data px-5 py-2 font-medium text-ink transition hover:brightness-110"
            >
              {idx + 1 >= total ? "לתוצאות ←" : "הבא ←"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return <Results score={score} total={total} onRetry={start} />;
}

function Results({ score, total, onRetry }: { score: number; total: number; onRetry: () => void }) {
  const pct = Math.round((score / total) * 100);
  const grade =
    pct >= 90 ? "מהנדס-לאחור 🏆" : pct >= 70 ? "יודע את הסיליקון" : pct >= 50 ? "בדרך הנכונה" : "שווה סיבוב נוסף";

  return (
    <div className="rounded-xl border border-line bg-ink-2/50 p-6">
      <div className="mb-6 text-center">
        <div className="mono text-5xl font-bold text-data" dir="ltr">
          {score}/{total}
        </div>
        <div className="mt-1 text-fg-muted">{grade}</div>
        <button onClick={onRetry} className="mt-3 text-sm text-fg-dim underline decoration-dotted hover:text-fg">
          נסה שוב
        </button>
      </div>
      <Leaderboard score={score} total={total} />
    </div>
  );
}

function Leaderboard({ score, total }: { score: number; total: number }) {
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "offline">(
    supabase ? "idle" : "offline"
  );

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from(SCORES_TABLE)
      .select("handle,score,total,created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);
    if (error) {
      setState("error");
      setRows([]);
      return;
    }
    setRows((data as ScoreRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!supabase || !handle.trim()) return;
    setState("sending");
    const { error } = await supabase
      .from(SCORES_TABLE)
      .insert({ handle: handle.trim().slice(0, 24), score, total });
    if (error) {
      setState("error");
      return;
    }
    setState("sent");
    load();
  };

  if (state === "offline" || (state === "error" && (rows === null || rows.length === 0))) {
    return (
      <div className="rounded-lg border border-line bg-ink p-4 text-center text-sm text-fg-dim">
        לוח התוצאות מחכה להרצת <span className="mono" dir="ltr">supabase/schema.sql</span> (יצירת הטבלה{" "}
        <span className="mono" dir="ltr">rtl8192eu_scores</span>). ברגע שהטבלה קיימת — הוא נדלק אוטומטית.
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-fg">לוח התוצאות</h3>

      {state !== "sent" && (
        <div className="mb-4 flex items-center gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={24}
            placeholder="הכינוי שלך"
            className="flex-1 rounded-md border border-line-2 bg-ink px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-dim focus:border-data"
          />
          <button
            onClick={submit}
            disabled={!handle.trim() || state === "sending"}
            className="rounded-md bg-data px-4 py-2 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {state === "sending" ? "שולח…" : "שלח תוצאה"}
          </button>
        </div>
      )}
      {state === "error" && (
        <p className="mb-3 text-xs text-danger">
          השליחה נכשלה — ודאו שהטבלה <span className="mono" dir="ltr">rtl8192eu_scores</span> קיימת (schema.sql).
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-line">
        {rows === null && <div className="px-4 py-3 text-sm text-fg-dim">טוען…</div>}
        {rows?.length === 0 && <div className="px-4 py-3 text-sm text-fg-dim">עדיין אין תוצאות — היו הראשונים!</div>}
        {rows?.map((r, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-b-0">
            <span className="mono w-6 text-sm text-fg-dim" dir="ltr">
              {i + 1}
            </span>
            <span className="flex-1 truncate text-sm text-fg">{r.handle}</span>
            <span className="mono text-sm text-data" dir="ltr">
              {r.score}/{r.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
