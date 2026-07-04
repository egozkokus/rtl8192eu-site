// The four address spaces + the dual-view memory map (§7, §9.3 of the arch doc).
// The central discovery: the same numeric address means different things depending
// on which datapath reads it.

export type MemClass = "data" | "zeros" | "unmapped" | "window" | "ram" | "code";

export const MEM_CLASS: Record<MemClass, { he: string; varName: string }> = {
  data: { he: "דאטה", varName: "--data" },
  zeros: { he: "אפסים", varName: "--zeros" },
  unmapped: { he: "לא-ממופה · 0xEA", varName: "--unmapped" },
  window: { he: "חלון FWDL", varName: "--mcu" },
  ram: { he: "‏RAM עבודה (MCU)", varName: "--mcu" },
  code: { he: "קוד · ROM/SRAM", varName: "--mcu" },
};

export interface AddressSpace {
  letter: "A" | "B" | "C" | "D";
  name: string;
  reachedBy: string;
  size: string;
  master: "host" | "mcu";
  note: string;
}

export const SPACES: AddressSpace[] = [
  {
    letter: "A", name: "אפרטורת רגיסטרים (host / USB)",
    reachedBy: "קריאת host · bRequest=0x05", size: "‎~8KB נראה", master: "host",
    note: "קובץ רגיסטרי ה-MAC + חלון ה-firmware SRAM + רגיסטרי USB. זה מה שה-PC רואה.",
  },
  {
    letter: "B", name: "‏XDATA של ה-8051 (data)",
    reachedBy: "‏MOVX A,@DPTR · דורש DPSEL", size: "‏64KB", master: "mcu",
    note: "אותו אפיק MAC כפי שה-MCU רואה אותו — כולל אזורים מחוץ לאפרטורת ה-host.",
  },
  {
    letter: "C", name: "מרחב הקוד של ה-8051",
    reachedBy: "‏MOVC A,@A+DPTR + שליפת הוראות", size: "‏64KB", master: "mcu",
    note: "‏boot ROM + code SRAM. נתיב נפרד לגמרי מ-XDATA.",
  },
  {
    letter: "D", name: "‏eFuse OTP",
    reachedBy: "עקיף דרך REG_EFUSE_CTRL 0x0030", size: "‏512B", master: "host",
    note: "זהות + כיול, לא-נדיף. פרוטוקול indirect: כתוב כתובת → טריגר → poll → קרא בייט.",
  },
];

/** The killer proof: address 0x0000 returns a different byte per datapath. */
export const SAME_ADDRESS = {
  addr: "0x0000",
  paths: [
    { path: "קריאת host (מרחב A)", byte: "0xD8", what: "קובץ רגיסטרי ה-MAC, בייט ראשון", master: "host" as const },
    { path: "‏MOVX של ה-MCU (מרחב B)", byte: "0xD8", what: "אותו אפיק MAC, מצד ה-MCU (אחרי DPSEL)", master: "mcu" as const },
    { path: "‏MOVC של ה-MCU (מרחב C)", byte: "0x02", what: "‏boot ROM — opcode של וקטור-האיפוס (LJMP)", master: "mcu" as const },
  ],
  punch: "‏MOVX ו-MOVC מחזירים בייט שונה באותה כתובת — הוכחה ישירה שהם ניגשים לסיליקון נפרד.",
};

export interface MemRegion {
  lo: number;
  hi: number;
  label: string;
  host: MemClass;
  mcu: MemClass;
  note?: string;
}

// §9.3 — MCU (space B) vs host (space A), per region.
export const REGIONS: MemRegion[] = [
  { lo: 0x0000, hi: 0x00ff, label: "רגיסטרי ליבת MAC", host: "data", mcu: "data", note: "power-FSM, שעונים, EFUSE, MCUFWDL, HMEBOX" },
  { lo: 0x0100, hi: 0x02ff, label: "‏MAC — תורים/פסיקות", host: "zeros", mcu: "zeros" },
  { lo: 0x0300, hi: 0x03ff, label: "פער לא-מודלק", host: "unmapped", mcu: "unmapped" },
  { lo: 0x0400, hi: 0x05ff, label: "‏BB / כיול / TX-power", host: "data", mcu: "data", note: "AGC, טיימר TSF ב-0x0560" },
  { lo: 0x0600, hi: 0x07ff, label: "‏MAC — סינון כתובות / CAM", host: "zeros", mcu: "zeros", note: "MACID 0x0610 (ריק ביחידה זו)" },
  { lo: 0x0800, hi: 0x0fff, label: "‏MAC — DMA / תורים", host: "data", mcu: "data", note: "0x0C00 העמוד העמוס ביותר" },
  { lo: 0x1000, hi: 0x1fff, label: "חלון code-SRAM (FWDL)", host: "window", mcu: "unmapped", note: "ה-host כותב פה firmware; ה-MCU לא רואה אותו כ-XDATA" },
  { lo: 0x2000, hi: 0x2fff, label: "דאטה — נראה רק ל-MCU", host: "unmapped", mcu: "data", note: "ה-host רואה 0xEA, ה-MCU רואה דאטה" },
  { lo: 0x3000, hi: 0x3fff, label: "לא-ממופה משני הצדדים", host: "unmapped", mcu: "unmapped" },
  { lo: 0x4000, hi: 0x7fff, label: "דאטה 16KB — נסתר מה-host", host: "unmapped", mcu: "data", note: "16KB שה-host כלל לא רואה" },
  { lo: 0x8000, hi: 0xafff, label: "‏RAM העבודה של ה-MCU", host: "unmapped", mcu: "ram", note: "12KB, מאופס ע\"י ה-boot ROM; ה-firmware האמיתי חי ב-0xA300+" },
  { lo: 0xb000, hi: 0xffff, label: "דאטה — נראה רק ל-MCU", host: "unmapped", mcu: "data", note: "רוב המרחב הגבוה: דאטה מצד ה-MCU בלבד" },
];

export const APERTURE_SUMMARY = {
  hostVisible: "‏0x0000–0x1FFF + עמוד 0xFE00",
  mcuVisible: "‏167/256 עמודים (מרחב 64KB מלא)",
  hostReads: "‎~8KB",
  mcuReads: "‏64KB",
};
