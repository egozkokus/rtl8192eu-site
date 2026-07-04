// The 8051 boot-ROM reset routine (disassembled from the real bootrom.bin, §9.2),
// which predicts — through a different path — both the 0x8000–0xAFFF working-RAM
// region and the DPSEL=0x8D value later measured live.

export interface AsmLine {
  addr: number;
  bytes: string;
  asm: string;
  comment?: string;
  highlight?: boolean;
}

export const RESET_ROUTINE: AsmLine[] = [
  { addr: 0x2f52, bytes: "78 7F", asm: "MOV  R0,#0x7F" },
  { addr: 0x2f54, bytes: "E4", asm: "CLR  A" },
  { addr: 0x2f55, bytes: "F6", asm: "MOV  @R0,A", comment: "מאפס RAM פנימי 0x7F..0x00" },
  { addr: 0x2f56, bytes: "D8 FD", asm: "DJNZ R0,0x2F55" },
  { addr: 0x2f58, bytes: "90 80 00", asm: "MOV  DPTR,#0x8000" },
  { addr: 0x2f5b, bytes: "7F 00", asm: "MOV  R7,#0" },
  { addr: 0x2f5d, bytes: "7E 30", asm: "MOV  R6,#0x30" },
  { addr: 0x2f5f, bytes: "E4", asm: "CLR  A" },
  { addr: 0x2f60, bytes: "F0", asm: "MOVX @DPTR,A", comment: "מאפס XDATA 0x8000..0xAFFF (12KB RAM עבודה)" },
  { addr: 0x2f61, bytes: "A3", asm: "INC  DPTR" },
  { addr: 0x2f62, bytes: "DF FC", asm: "DJNZ R7,0x2F60" },
  { addr: 0x2f64, bytes: "DE FA", asm: "DJNZ R6,0x2F60" },
  {
    addr: 0x2f66, bytes: "75 92 8D", asm: "MOV  0x92,#0x8D",
    comment: "‎*** MOV DPSEL,#0x8D *** — פותח את קריאות ה-MOVX",
    highlight: true,
  },
];

export const BOOTROM_FACTS = [
  { k: "גודל", v: "16,384 B" },
  { k: "אנטרופיה", v: "6.37 ביט/בייט" },
  { k: "וקטור איפוס", v: "02 2F 52 = LJMP 0x2F52" },
  { k: "‏MOV DPTR (90)", v: "×1189" },
  { k: "‏MOVX A (E0)", v: "×1189" },
  { k: "‏MOVX @DPTR (F0)", v: "×951" },
  { k: "‏LCALL (12)", v: "×399" },
  { k: "‏LJMP (02)", v: "×231" },
];

// Five independent lines of evidence that the ROM dump is faithful (§10.1).
export const TRUST_LINES: { title: string; body: string }[] = [
  { title: "דטרמיניזם", body: "שתי הטענות רצופות של ה-FWDL זהות בייט-בבייט, ושתיהן שוות ל-bootrom.bin." },
  { title: "שלמות", body: "עמודים 12–15 הם alias מלא של 8–11 ⇒ 16KB הם כל ה-ROM (אין ביט-עמוד חמישי)." },
  { title: "הגנת-כתיבה", body: "romtest.py: עמודים 8–11 מתעלמים מכתיבות וקוראים חזרה את הקוד המקורי — ROM אמיתי." },
  { title: "דיסאסמבלי מחוץ-לנתיב", body: "שגרת האיפוס (נקראה דרך FWDL) חוזה את אזור ה-RAM 0x8000–0xAFFF ואת DPSEL=0x8D — שנמדדו דרך נתיבים אחרים." },
  { title: "קריאת MOVC אורתוגונלית", body: "קריאת ה-ROM דרך נתיב ה-MOVC של ה-MCU זהה בייט-בבייט לטענת ה-FWDL." },
];

export const DPSEL = {
  sfr: "0x92",
  value: "0x8D",
  name: "DPSEL — Data Pointer Select Register",
  story: [
    "קריאות MOVX נראו 'מתות': כל MOVX A,@DPTR החזיר ~0x06 צף, בלי קשר לכתובת. ה-MCU כאילו לא יכול לקרוא זיכרון.",
    "דיסאסמבלי של ה-boot ROM מוקטור-האיפוס גילה שה-ROM כותב SFR 0x92 בערך 0x8D פעם אחת (ב-0x2F66) לפני כל קריאת MOVX.",
    "‏IDA זיהתה את SFR 0x92 כ-DPSEL של ליבת ה-8051 המורחבת (multi-DPTR). ה-firmware שלנו, שנטען דרך FWDL, דילג על אתחול ה-ROM — אז DPSEL נשאר בברירת-מחדל והקריאות צפו.",
    "הוספת MOV 0x92,#0x8D (הבייטים 75 92 8D) לפני כל reader מתקנת הכול: MOVX של 0x0000 קורא 0xD8 — בדיוק כמו ה-host. פתאום כל 64KB קריא מצד ה-MCU.",
  ],
};
