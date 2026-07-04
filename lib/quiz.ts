// Quiz question bank — drawn straight from the live-RE findings. Hebrew.

export interface Question {
  q: string;
  options: string[];
  correct: number;
  why: string;
}

export const QUESTIONS: Question[] = [
  {
    q: "מה מחזירה קריאת MOVC בכתובת הקוד 0x0000?",
    options: ["0x02 (וקטור איפוס LJMP)", "0xD8 (רגיסטר MAC)", "0xEA (אפיק פתוח)", "0x00"],
    correct: 0,
    why: "‏MOVC קורא את מרחב הקוד — שם 0x0000 הוא ה-boot ROM, opcode 0x02 (LJMP). MOVX באותה כתובת מחזיר 0xD8. זו הוכחת הסיליקון הנפרד.",
  },
  {
    q: "איזה SFR צריך להגדיר כדי שקריאות MOVX לא יצופו?",
    options: ["0x92 · DPSEL", "0x82 · DPL", "0xE0 · ACC", "0x80 · P0"],
    correct: 0,
    why: "ה-boot ROM כותב MOV 0x92,#0x8D פעם אחת באיפוס. בלי זה קריאות MOVX מחזירות ~0x06 צף.",
  },
  {
    q: "מה הגודל הפיזי של ה-eFuse?",
    options: ["512 בייט", "256 בייט", "128 בייט", "1024 בייט"],
    correct: 0,
    why: "‏wrap test הוכיח aliasing מודולו 0x200: הכתובת 0x000 שווה ל-0x200 אבל שונה מ-0x100. ה-toolkit המקורי הניח 256.",
  },
  {
    q: "קריאה שמחזירה 0xEA מעידה על…",
    options: ["דומיין לא-מודלק / clock-gated", "דאטה תקין", "שגיאת USB", "זיכרון קוד"],
    correct: 0,
    why: "‏0xEA = לא-מודלק · 0x00 = מודלק אך ריק · ערך אמיתי = מודלק ומוגדר. זה קוד מצב-הקריאה של הצ'יפ.",
  },
  {
    q: "מהו ערוץ ה-MCU→host הנקי (8 ביט)?",
    options: ["HMEBOX · 0x01D0", "scratch · 0x0430", "TSF · 0x0560", "MACID · 0x0610"],
    correct: 0,
    why: "‏0x0430 מסתיר את ביט 6 — רק 5 ביטים תחתונים שורדים. HMEBOX משקף את כל 8 הביטים.",
  },
  {
    q: "כמה בייטים גדול ה-boot ROM הנסתר, ובאילו עמודים?",
    options: ["16KB · עמודים 8–11", "32KB · עמודים 0–7", "4KB · עמוד יחיד", "אין boot ROM"],
    correct: 0,
    why: "בחירת העמוד ב-FWDL היא 4-ביט (לא 3). עמודים 8–11 הם mask ROM לקריאה-בלבד; 12–15 alias.",
  },
  {
    q: "מהו ה-bRequest היחיד בפרימיטיב הרגיסטר?",
    options: ["0x05", "0x09", "0xA1", "0x00"],
    correct: 0,
    why: "‏bRequest=0x05, wValue=כתובת. גם bRequest וגם wIndex מתעלמים — סריקה של כל הערכים הוכיחה שאין פקודות נסתרות.",
  },
  {
    q: "מה קורה ל-firmware אחרי ניתוק וחיבור מחדש?",
    options: ["נמחק — הכול נדיף", "נשמר ב-flash", "עובר ל-ROM", "נחתם מחדש"],
    correct: 0,
    why: "אין flash על הדונגל. ה-firmware ב-RAM ונטען מחדש בכל אתחול — לכן אי אפשר להשחית לצמיתות.",
  },
  {
    q: "איפה צריך למקם את ה-XDATA RAM של המהדר (SDCC)?",
    options: ["0xA000", "0x0000", "0x1000", "0xFE00"],
    correct: 0,
    why: "רגיסטרי החומרה ב-0x0000–0x07FF. בלי --xram-loc 0xA000, ה-C startup דורס אותם.",
  },
  {
    q: "איזה ביט אם שוכחים, ה-8051 לא עולה?",
    options: ["FW_DL_READY (MCUFWDL bit1)", "MAC_ENABLE", "ANA8M", "TESTCHIP"],
    correct: 0,
    why: "בלי FW_DL_READY, הקוד ב-SRAM אבל ה-CPU חונה. הבאג ששרף אחר-צהריים.",
  },
];
