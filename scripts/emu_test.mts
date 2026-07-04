import { readFileSync } from "fs";
import { Cpu8051 } from "../lib/emu8051";

const rom = new Uint8Array(readFileSync("public/artifacts/bootrom.bin"));
const cpu = new Cpu8051(rom);
cpu.reset(0);

let dpsel: { pc: string; val: string } | null = null;
const xw = new Set<number>();
const sfrw: Record<string, string> = {};
let steps = 0;
for (let i = 0; i < 300000 && !cpu.halted; i++) {
  const s = cpu.step();
  steps++;
  if (s.sfrwrite) {
    if (s.sfrwrite.sfr === 0x92) dpsel = { pc: "0x" + s.pc.toString(16).toUpperCase(), val: "0x" + s.sfrwrite.val.toString(16).toUpperCase() };
    sfrw["0x" + s.sfrwrite.sfr.toString(16).toUpperCase()] = "0x" + s.sfrwrite.val.toString(16).toUpperCase();
  }
  if (s.xwrite) xw.add(s.xwrite.addr);
}

const has0000 = [...xw].some((a) => a < 0x100);
const has8000 = [...xw].some((a) => a >= 0x8000 && a < 0xb000);
console.log("halted:", cpu.halted, "| steps:", steps, "| distinct XDATA writes:", xw.size);
console.log("DPSEL write:", dpsel);
console.log("zeroed 0x0000-page:", has0000, "| zeroed 0x8000-0xAFFF:", has8000);
console.log("SFR config writes:", sfrw);
console.log(dpsel && dpsel.pc === "0x2F66" && has0000 && has8000 ? "\n✅ MATCHES the Python emulator" : "\n❌ MISMATCH");
