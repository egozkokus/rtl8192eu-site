// eFuse (OTP) — protocol, sizing, decoded contents (§10.2).

export const EFUSE_PROTOCOL: { n: number; text: string }[] = [
  { n: 1, text: "הכנת מטעין חד-פעמית: נקה SYS_ISO_CTRL bit15; הדלק SYS_FUNC_EN bit12 (ELDR); הדלק SYS_CLKR bits 1,5 (ANA8M|LOADER)." },
  { n: 2, text: "כתוב off&0xFF ל-0x0031; כתוב (off>>8)&0x03 לשני הביטים התחתונים של 0x0032." },
  { n: 3, text: "נקה bit7 של 0x0033 כדי לטרגר; poll את 0x0030 עד ש-bit31 נדלק; הבייט = 0x0030 & 0xFF." },
];

export const EFUSE_FACTS = [
  { k: "גודל פיזי", v: "512 B" },
  { k: "מתוכנת", v: "‎~209 B" },
  { k: "מקטעים", v: "2 (FF-terminated)" },
  { k: "‏wrap", v: "מודולו 0x200" },
];

// The wrap test that proved the physical size is 512 B, not 256 B.
export const WRAP_TEST: { a: string; av: string; b: string; bv: string; rel: string }[] = [
  { a: "0x000", av: "0x0E", b: "0x200", bv: "0x0E", rel: "שווה ⇒ wrap ב-0x200" },
  { a: "0x080", av: "0x30", b: "0x280", bv: "0x30", rel: "שווה" },
  { a: "0x100", av: "0x6F", b: "0x000", bv: "0x0E", rel: "שונה ⇒ אין wrap ב-0x100" },
];

// Decoded logical contents (what the packed eFuse holds).
export const EFUSE_DECODED: { field: string; value: string }[] = [
  { field: "מזהה RTL", value: "0x8129" },
  { field: "‏USB VID / PID", value: "0BDA : 818B" },
  { field: "מחרוזות USB", value: '"Realtek" · "802.11n NIC"' },
  { field: "טבלאות כיול TX-power", value: "לפי rate / קבוצת-ערוץ" },
  { field: "כתובת MAC", value: "אין MAC תקין ביחידה זו (הדרייבר מקצה)" },
];
