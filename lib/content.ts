// Narrative content: firmware pipeline, glossary, corrections, headline discoveries.

export interface PipelineStep {
  n: number;
  title: string;
  call: string;
  detail: string;
  gotcha?: string;
}

export const PIPELINE: PipelineStep[] = [
  {
    n: 1, title: "החזק את ה-8051 באיפוס", call: "hold_reset()",
    detail: "נקה CPU_ENABLE‏ (0x0003 &= ~0x04) כדי לחנות את ה-firmware הקודם לפני כל אתחול מחדש.",
    gotcha: "בלי זה — power-on בזמן שה-firmware הקודם עוד רץ תוקע את הצ'יפ.",
  },
  {
    n: 2, title: "הדלק את דומיין ה-MAC", call: "power_on()",
    detail: "רצף PON דרך APS_FSMCO: נקה LPS/suspend/PD, הדלק MAC_ENABLE, שעונים, והוצא את ה-BB מאיפוס — כדי שחלון ה-0x1000 יהיה חי.",
  },
  {
    n: 3, title: "היכנס למצב הורדה", call: "CPU_ENABLE + FW_DL_ENABLE",
    detail: "הדלק CPU_ENABLE‏ (SYS_FUNC_EN bit10) ו-FW_DL_ENABLE‏ (MCUFWDL bit0), ובחר עמוד 0.",
  },
  {
    n: 4, title: "הורד את הקוד", call: "download(code)",
    detail: "לכל עמוד 4KB: קבע את ה-nibble ב-0x0082, וכתוב את הבייטים ל-0x1000..0x1FFF. קרא חזרה כדי לאמת.",
  },
  {
    n: 5, title: "הרץ", call: "boot()",
    detail: "ב-MCUFWDL: נקה bit0, הדלק bit1‏ (FW_DL_READY); ואז toggle לאיפוס ה-8051 דרך bit2 של 0x0003.",
    gotcha: "הבאג ששרף אחר-צהריים: שכחת FW_DL_READY ⇒ ה-8051 לא עולה לעולם (הקוד ב-SRAM אבל ה-CPU חונה).",
  },
];

export interface GlossaryTerm {
  term: string;
  he: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: "SoC", he: "מערכת-על-שבב: מעבד, זיכרון ורכיבים היקפיים על שבב אחד." },
  { term: "8051 / MCS-51", he: "ארכיטקטורת מיקרו-בקר 8-ביט קלאסית; פשוטה, מתועדת, עם כלים חינמיים (SDCC)." },
  { term: "Firmware", he: "התוכנה שרצה על המעבד שבתוך הצ'יפ (בניגוד ל-driver שרץ על ה-PC)." },
  { term: "Register", he: "'תא' חומרה בכתובת קבועה; קריאה/כתיבה אליו שולטת או מדווחת על חומרה." },
  { term: "XDATA", he: "מרחב הנתונים החיצוני של ה-8051 (עד 64KB), נגיש עם MOVX. כאן = אפיק הרגיסטרים + ה-RAM של ה-MCU." },
  { term: "MOVX / MOVC", he: "הוראות ה-8051 לקריאת XDATA (נתונים) / זיכרון קוד. שני נתיבים נפרדים." },
  { term: "DPTR / DPSEL", he: "מצביע-הנתונים 16-ביט / רגיסטר בחירת-המצביע (SFR 0x92) בליבה המורחבת הזו." },
  { term: "Control transfer", he: "בקשת USB קטנה על endpoint 0 — כך ה-host מבצע קריאות/כתיבות רגיסטר." },
  { term: "EFUSE / OTP", he: "זיכרון חד-פעמי לתכנות: שורפים ביטים פעם אחת. מכיל זהות וכיול." },
  { term: "Reset vector", he: "הכתובת הקבועה (0x0000) שבה המעבד מתחיל לרוץ אחרי איפוס." },
  { term: "TSF", he: "‏Timing Synchronization Function — שעון המיקרו-שנייה החופשי של ה-MAC ב-802.11." },
  { term: "HMEBOX", he: "רגיסטרי תיבת-הדואר בין ה-host ל-MCU‏ (0x01D0…)." },
];

export interface Correction {
  claim: string;
  reality: string;
}

export const CORRECTIONS: Correction[] = [
  { claim: "‏XDATA זהה 1:1 למפת הרגיסטרים של ה-host", reality: "ארבעה מרחבים נפרדים; אותה כתובת שונה לפי הנתיב." },
  { claim: "קריאות MOVX לא-פונקציונליות / bus float", reality: "עובדות אחרי MOV DPSEL,#0x8D; כל 64KB קריא." },
  { claim: "בחירת עמוד FWDL היא 3-ביט (32KB)", reality: "‏4-ביט; עמודים 8–11 = ROM נסתר 16KB, 12–15 alias." },
  { claim: "ה-boot ROM 'לא חשוף / לא עניינך'", reality: "ניתן לחילוץ בשתי דרכים (חלון FWDL + MOVC), 16KB." },
  { claim: "‏0x0430 הוא scratch נקי MCU→host", reality: "רק 5 הביטים התחתונים נשמרים; השתמש ב-HMEBOX." },
  { claim: "ה-eFuse הוא 256 בייט", reality: "‏512 בייט פיזי, מאומת ב-wrap test, 2 מקטעים." },
  { claim: "ה-MCU לא יכול לקרוא את ה-ROM (שאלה פתוחה)", reality: "‏MOVC קורא את ה-ROM בכתובת קוד 0x0000." },
  { claim: "אנומליית wIndex=0x32", reality: "לא משוחזרת; גם wIndex וגם bRequest מתעלמים." },
];

export interface Discovery {
  tag: string;
  title: string;
  body: string;
  master?: "host" | "mcu" | "both";
}

export const DISCOVERIES: Discovery[] = [
  {
    tag: "מרחבי כתובות", title: "אותה כתובת, בייט שונה", master: "both",
    body: "‏0x0000 מחזיר 0xD8 דרך אפרטורת ה-host ו-MOVX, אבל 0x02 דרך MOVC. הוכחת סיליקון שהנתיבים נפרדים.",
  },
  {
    tag: "‏DPSEL", title: "מפתח שפותח את כל 64KB", master: "mcu",
    body: "‏MOV 0x92,#0x8D (מה שה-ROM עושה באיפוס) הופך קריאות MOVX 'מתות' לקריאה של כל מרחב ה-XDATA — כולל אזורים שה-host לא רואה.",
  },
  {
    tag: "‏Boot ROM", title: "‏16KB נסתרים, חולצו", master: "mcu",
    body: "חלון ה-FWDL הוא 4-ביט; עמודים 8–11 הם mask ROM נפרד לקריאה-בלבד. חולץ ואומת בחמש דרכים בלתי-תלויות.",
  },
  {
    tag: "‏eFuse", title: "‏512 בייט, לא 256", master: "host",
    body: "‏wrap test הוכיח aliasing מודולו 0x200. מכיל VID/PID, מחרוזות USB וכיולי RF — הזהות הייחודית של היחידה.",
  },
];
