"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal WebUSB typing (not in the default TS DOM lib).
type USBInTransferResult = { data?: DataView; status?: string };
interface USBDeviceLike {
  productName?: string;
  serialNumber?: string;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  controlTransferIn(setup: Record<string, unknown>, length: number): Promise<USBInTransferResult>;
}
interface USBLike {
  requestDevice(opts: { filters: { vendorId: number; productId: number }[] }): Promise<USBDeviceLike>;
}

const VID = 0x0bda;
const PID = 0x818b;
const hx = (v: number, n: number) => "0x" + v.toString(16).toUpperCase().padStart(n, "0");

export default function WebUsbPanel() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [dev, setDev] = useState<USBDeviceLike | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<{ label: string; addr: number; val: string }[]>([]);
  const [tsf, setTsf] = useState<string[]>([]);
  const [custom, setCustom] = useState("0x00F0");
  const [customVal, setCustomVal] = useState<string | null>(null);
  const [ticking, setTicking] = useState(false);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "usb" in navigator);
    return () => {
      if (polling.current) clearInterval(polling.current);
    };
  }, []);

  const read = useCallback(
    async (d: USBDeviceLike, addr: number, len: number): Promise<number | null> => {
      try {
        const r = await d.controlTransferIn(
          { requestType: "vendor", recipient: "device", request: 0x05, value: addr, index: 0 },
          len
        );
        if (!r.data) return null;
        let v = 0;
        for (let i = 0; i < len; i++) v |= r.data.getUint8(i) << (8 * i);
        return v >>> 0;
      } catch {
        return null;
      }
    },
    []
  );

  const connect = async () => {
    setStatus("");
    const usb = (navigator as unknown as { usb?: USBLike }).usb;
    if (!usb) return;
    try {
      setBusy(true);
      const d = await usb.requestDevice({ filters: [{ vendorId: VID, productId: PID }] });
      await d.open();
      await d.selectConfiguration(1);
      try {
        await d.claimInterface(0);
      } catch {
        /* control transfers to the device recipient usually work without it */
      }
      setDev(d);
      setStatus(`מחובר · ${d.productName ?? "802.11n NIC"}`);
      await refresh(d);
    } catch (e) {
      setStatus(
        e instanceof Error && e.name === "NotFoundError"
          ? "לא נבחר מכשיר. ודאו שהדונגל מחובר ומקושר ל-WinUSB."
          : "החיבור נכשל — ייתכן שהדונגל תפוס ע\"י תוכנה אחרת, או לא מקושר ל-WinUSB."
      );
    } finally {
      setBusy(false);
    }
  };

  const refresh = async (d: USBDeviceLike) => {
    const regs: { label: string; addr: number; len: number }[] = [
      { label: "SYS_CFG", addr: 0x00f0, len: 4 },
      { label: "SYS_CFG1", addr: 0x00fc, len: 4 },
      { label: "REG_9346CR", addr: 0x000a, len: 2 },
      { label: "MCUFWDL", addr: 0x0080, len: 4 },
    ];
    const out: { label: string; addr: number; val: string }[] = [];
    for (const r of regs) {
      const v = await read(d, r.addr, r.len);
      out.push({ label: r.label, addr: r.addr, val: v === null ? "—" : hx(v, r.len * 2) });
    }
    setSnapshot(out);
  };

  const toggleTsf = async () => {
    if (!dev) return;
    if (polling.current) {
      clearInterval(polling.current);
      polling.current = null;
      setTicking(false);
      return;
    }
    setTicking(true);
    polling.current = setInterval(async () => {
      const v = await read(dev, 0x0560, 4);
      if (v !== null) setTsf((t) => [hx(v, 8), ...t].slice(0, 6));
    }, 500);
  };

  const readCustom = async () => {
    if (!dev) return;
    const addr = parseInt(custom.replace(/^0x/i, "") || "0", 16);
    const v = await read(dev, addr & 0xffff, 1);
    setCustomVal(v === null ? "—" : hx(v, 2));
  };

  const disconnect = async () => {
    if (polling.current) {
      clearInterval(polling.current);
      polling.current = null;
    }
    setTicking(false);
    try {
      await dev?.close();
    } catch {
      /* ignore */
    }
    setDev(null);
    setTsf([]);
    setSnapshot([]);
    setStatus("");
  };

  if (supported === false) {
    return (
      <div className="rounded-xl border border-line bg-ink-2/50 p-6">
        <p className="text-fg-muted">
          הדפדפן הזה לא תומך ב-WebUSB. נסו <span className="text-fg">Chrome</span> או{" "}
          <span className="text-fg">Edge</span> במחשב שולחני. הצילום החי למטה זמין תמיד.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-ink-2/50 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!dev ? (
          <button
            onClick={connect}
            disabled={busy}
            className="rounded-md bg-mcu px-5 py-2.5 font-medium text-ink transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "מחבר…" : "חבר דונגל (WebUSB)"}
          </button>
        ) : (
          <>
            <button
              onClick={() => refresh(dev)}
              className="rounded-md border border-line-2 px-4 py-2 text-sm text-fg-muted transition hover:border-data hover:text-data"
            >
              ↻ רענן snapshot
            </button>
            <button
              onClick={disconnect}
              className="rounded-md border border-line-2 px-4 py-2 text-sm text-fg-muted transition hover:border-danger hover:text-danger"
            >
              נתק
            </button>
          </>
        )}
        {status && <span className="text-sm text-fg-muted">{status}</span>}
      </div>

      {dev && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-fg">Snapshot רגיסטרים</h3>
            <div className="mono overflow-hidden rounded-lg border border-line text-sm" dir="ltr">
              {snapshot.map((s) => (
                <div key={s.addr} className="flex justify-between gap-3 border-b border-line px-3 py-1.5 last:border-b-0">
                  <span className="text-fg-muted">
                    {s.label} <span className="text-fg-dim">{hx(s.addr, 4)}</span>
                  </span>
                  <span className="text-data">{s.val}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                value={custom}
                dir="ltr"
                spellCheck={false}
                onChange={(e) => setCustom(e.target.value)}
                className="mono w-28 rounded border border-line-2 bg-ink px-2 py-1.5 text-sm text-data outline-none focus:border-data"
              />
              <button
                onClick={readCustom}
                className="rounded-md border border-line-2 px-3 py-1.5 text-sm text-fg-muted transition hover:border-data hover:text-data"
              >
                קרא בייט
              </button>
              {customVal && (
                <span className="mono text-sm text-fg" dir="ltr">
                  = {customVal}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">טיימר TSF (0x0560)</h3>
              <button onClick={toggleTsf} className="text-xs text-mcu-2 underline decoration-dotted">
                {ticking ? "עצור" : "התחל לתקתק"}
              </button>
            </div>
            <div className="mono min-h-[120px] rounded-lg border border-line bg-ink p-3 text-sm" dir="ltr">
              {tsf.length === 0 && <span className="text-fg-dim">לחצו “התחל” כדי לראות את המונה עולה חי…</span>}
              {tsf.map((t, i) => (
                <div key={i} style={{ color: i === 0 ? "var(--data)" : "var(--fg-dim)" }}>
                  {t}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-fg-dim">אם המספר עולה — שעון ה-MAC חי. קריאה בלבד; שום דבר לא נכתב.</p>
          </div>
        </div>
      )}
    </div>
  );
}
