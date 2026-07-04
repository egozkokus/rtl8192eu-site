// Register reference — merged from the live-RE architecture doc (§12) and the
// live capture. Bit fields power the interactive decoder; `live` holds the value
// this specific dongle returned on 2026-07-03.

export interface BitField {
  hi: number;
  lo: number;
  name: string;
  desc?: string;
  /** highlight this field as the notable one for the register */
  key?: boolean;
}

export type RegGroup = "system" | "mac" | "fwdl" | "usb";

export interface Register {
  addr: number;
  name: string;
  width: 8 | 16 | 32;
  group: RegGroup;
  role: string;
  fields?: BitField[];
  live?: number;
  danger?: boolean;
}

export const GROUPS: Record<RegGroup, string> = {
  system: "בקרת מערכת (always-on · 0x0000–0x00FF)",
  mac: "‏MAC / PHY / רדיו (0x0100–0x0FFF)",
  fwdl: "הורדת firmware",
  usb: "‏USB (0xFE00+)",
};

export const REGISTERS: Register[] = [
  {
    addr: 0x0000, name: "SYS_ISO_CTRL", width: 16, group: "system",
    role: "בידוד אנלוגי/דיגיטלי בין איי-המתח.",
    live: 0x8ed8,
    fields: [{ hi: 15, lo: 15, name: "PWC_EV12V", desc: "בקרת מתח 12V", key: true }],
  },
  {
    addr: 0x0002, name: "SYS_FUNC_EN", width: 16, group: "system",
    role: "אפשור בלוקים פונקציונליים. כאן מדליקים/מאפסים את ה-8051.",
    live: 0xdc1f,
    fields: [
      { hi: 0, lo: 0, name: "FEN_BB0", desc: "reset baseband" },
      { hi: 1, lo: 1, name: "FEN_BB1", desc: "reset baseband" },
      { hi: 2, lo: 2, name: "FEN_USBA", desc: "USB analog" },
      { hi: 4, lo: 4, name: "FEN_USBD", desc: "USB digital" },
      { hi: 10, lo: 10, name: "CPU_ENABLE", desc: "אפשור ליבת ה-8051", key: true },
      { hi: 12, lo: 12, name: "ELDR", desc: "מטעין ה-eFuse" },
    ],
  },
  {
    addr: 0x0003, name: "SYS_FUNC_EN+1", width: 8, group: "system",
    role: "הבייט העליון של SYS_FUNC_EN. ‏bit2 כאן = CPU_ENABLE — לוחצים עליו לאפס את ה-8051.",
    fields: [{ hi: 2, lo: 2, name: "CPU_ENABLE", desc: "toggle לאיפוס ה-8051", key: true }],
  },
  {
    addr: 0x0004, name: "APS_FSMCO", width: 32, group: "system",
    role: "מכונת-המצבים של ניהול המתח (power FSM). לב רצף ה-power-on.",
    live: 0x14030012,
    fields: [
      { hi: 8, lo: 8, name: "MAC_ENABLE", desc: "מדליק את דומיין ה-MAC (מתנקה-עצמית)", key: true },
      { hi: 9, lo: 9, name: "SW_LPS", desc: "low-power state" },
      { hi: 11, lo: 11, name: "HW_SUSPEND" },
      { hi: 15, lo: 15, name: "HW_POWERDOWN" },
      { hi: 16, lo: 16, name: "WLON_RESET", desc: "reset דומיין ה-WLAN" },
      { hi: 17, lo: 17, name: "PWR_READY", desc: "המתח יציב" },
    ],
  },
  {
    addr: 0x0008, name: "SYS_CLKR", width: 16, group: "system",
    role: "בקרת שעונים (ANA8M, loader-enable, MAC clock).",
    live: 0x7c2b,
    fields: [
      { hi: 0, lo: 0, name: "ANA8M", desc: "שעון אנלוגי 8MHz" },
      { hi: 1, lo: 1, name: "LOADER", desc: "שעון המטעין" },
    ],
  },
  {
    addr: 0x000a, name: "REG_9346CR", width: 16, group: "system",
    role: "מקור ה-autoload. הקריאה 0x0020 ⇒ טעינה מ-eFuse פנימי (לא EEPROM חיצוני).",
    live: 0x0020,
    fields: [
      { hi: 4, lo: 4, name: "EEPROM_BOOT", desc: "‏0 = eFuse פנימי · 1 = 93Cxx חיצוני", key: true },
      { hi: 5, lo: 5, name: "AUTOLOAD", desc: "טעינה אוטומטית הושלמה" },
    ],
  },
  {
    addr: 0x001c, name: "RSV_CTRL", width: 8, group: "system",
    role: "שער הגנת-כתיבה לרגיסטרים מסוימים.",
    live: 0x00,
  },
  {
    addr: 0x0030, name: "EFUSE_CTRL", width: 32, group: "system",
    role: "גישה עקיפה ל-eFuse: ‏+1/+2 = כתובת · +3 bit7 = טריגר-קריאה · bit31 = data-ready · byte0 = הנתון.",
    live: 0x10600000,
    fields: [
      { hi: 31, lo: 31, name: "DATA_READY", desc: "הבייט מוכן לקריאה", key: true },
      { hi: 7, lo: 0, name: "DATA", desc: "בייט ה-eFuse שנקרא" },
    ],
  },
  {
    addr: 0x0034, name: "EFUSE_TEST", width: 32, group: "system", danger: true,
    role: "בדיקת eFuse / מתח תכנות (LDOE25). לא לגעת — הפעלתו היא היחידה שיכולה לשנות את ה-OTP.",
  },
  {
    addr: 0x0080, name: "MCUFWDL", width: 32, group: "fwdl",
    role: "בקרת הורדת firmware. הבייט 0x0082 (nibble תחתון) = בחירת עמוד 0–15 (4-bit).",
    live: 0x00000305,
    fields: [
      { hi: 0, lo: 0, name: "FW_DL_ENABLE", desc: "מצב הורדה פעיל", key: true },
      { hi: 1, lo: 1, name: "FW_DL_READY", desc: "מוכן ל-boot — קל לשכוח!", key: true },
      { hi: 2, lo: 2, name: "CSUM_RPT", desc: "דיווח checksum של החומרה" },
      { hi: 6, lo: 6, name: "WINT_INIT_RDY", desc: "לא אמין מצד ה-MCU" },
      { hi: 19, lo: 16, name: "PAGE_SEL", desc: "בחירת עמוד FWDL (0–15)", key: true },
    ],
  },
  {
    addr: 0x00f0, name: "SYS_CFG", width: 32, group: "system",
    role: "זהות הצ'יפ. היחידה הזו קוראת 0x0C441137 = cut B · TSMC.",
    live: 0x0c441137,
    fields: [
      { hi: 20, lo: 20, name: "TESTCHIP", desc: "שבב-בדיקה" },
      { hi: 15, lo: 12, name: "CHIP_VER", desc: "גרסת cut", key: true },
      { hi: 19, lo: 16, name: "VENDOR", desc: "יצרן (4 כאן)" },
      { hi: 27, lo: 24, name: "RTL_ID", desc: "מזהה Realtek" },
    ],
  },
  {
    addr: 0x00f8, name: "SYS_CFG_VER", width: 32, group: "system",
    role: "מילת גרסה — נושאת את מזהה ה-eFuse ‏0x8129.",
    live: 0x00058129,
  },
  {
    addr: 0x01cc, name: "HMETFR", width: 32, group: "mac",
    role: "דגל העברת הודעה למ-host (לבעוט ב-MCU).",
    live: 0x00000000,
  },
  {
    addr: 0x01d0, name: "HMEBOX0", width: 32, group: "mac",
    role: "תיבת-דואר host↔MCU‏ 0 (H2C). ערוץ MCU→host נקי 8-bit — הערוץ המומלץ.",
    live: 0x00000000,
  },
  {
    addr: 0x01d4, name: "HMEBOX1", width: 32, group: "mac",
    role: "תיבת-דואר 1. משמשת ל-nonce/ready מול HMEBOX0.",
    live: 0x00000000,
  },
  {
    addr: 0x0430, name: "SCRATCH", width: 8, group: "mac",
    role: "רגיסטר scratch — אבל לא נקי! רק 5 הביטים התחתונים (0x1F) נשמרים בכתיבה. אל תשתמש כערוץ; השתמש ב-HMEBOX.",
    live: 0x01,
    fields: [{ hi: 4, lo: 0, name: "RETAINED", desc: "רק הביטים ששורדים כתיבה", key: true }],
  },
  {
    addr: 0x0560, name: "TSFTR", width: 32, group: "mac",
    role: "טיימר TSF — מונה µs חופשי ב-1MHz. ההוכחה ששעון ה-MAC חי.",
  },
  {
    addr: 0x0610, name: "MACID", width: 32, group: "mac",
    role: "כתובת MAC‏ (6 בייט). קוראת 00:00:00:00:00:00 — הדרייבר טוען אותה, וה-eFuse של היחידה ריק מ-MAC.",
    live: 0x00000000,
  },
  {
    addr: 0x0670, name: "CAMCMD", width: 32, group: "mac",
    role: "גישה עקיפה למטמון מפתחות האבטחה (CAM) — WEP/TKIP/CCMP.",
  },
  {
    addr: 0xfe00, name: "USB_REGS", width: 32, group: "usb",
    role: "רגיסטרים של ליבת ה-USB — צבירת DMA, timeouts, בקרת transfer.",
    live: 0x00000000,
  },
];

/** extract a bit-field's value from a register value */
export function fieldValue(regValue: number, f: BitField): number {
  const width = f.hi - f.lo + 1;
  const mask = width >= 32 ? 0xffffffff : (1 << width) - 1;
  return (regValue >>> f.lo) & mask;
}

export function hex(value: number, width: 8 | 16 | 32): string {
  return "0x" + (value >>> 0).toString(16).toUpperCase().padStart(width / 4, "0");
}
