import raw from "./livecapture.json";

export type ReadClass = "data" | "zeros" | "unmapped" | "error";

export interface ApertureCell {
  addr: string;
  value: string | null;
  class: ReadClass;
}

export interface LiveCapture {
  capturedAt: string;
  device: string;
  method: string;
  descriptor: {
    idVendor: string;
    idProduct: string;
    bcdDevice: string;
    bcdUSB: string;
    iManufacturer: string | null;
    iProduct: string | null;
    iSerialNumber: string | null;
    endpoints: string[];
  };
  identity: {
    SYS_CFG_0x00F0: string;
    SYS_CFG1_0x00FC: string;
    ver_0x00F8: string;
    REG_9346CR_0x000A: string;
    decode: Record<string, number | boolean>;
  };
  registers: Record<string, { addr: string; width: number; value: string }>;
  tsf_timer_0x0560: { reads: string[]; alive: boolean };
  macid_0x0610: string;
  aperture_map: ApertureCell[];
}

export const live = raw as LiveCapture;

/** Hebrew label for each read-state class — the chip's own color code. */
export const READ_CLASS: Record<
  ReadClass,
  { he: string; note: string; varName: string }
> = {
  data: { he: "דאטה", note: "מודלק ומוגדר — ערך אמיתי", varName: "--data" },
  zeros: { he: "אפסים", note: "מודלק אך ריק (0x00)", varName: "--zeros" },
  unmapped: { he: "לא ממופה", note: "אפיק פתוח (0xEA)", varName: "--unmapped" },
  error: { he: "שגיאה", note: "הקריאה נכשלה", varName: "--danger" },
};
