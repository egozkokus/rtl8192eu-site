// Minimal MCS-51 (8051) disassembler — ported from the toolkit's dis8051.py.
// Enhancement over the Python: SFR 0x92 is named DPSEL (the register this chip's
// boot ROM writes to unlock MOVX reads), so the reset routine reads correctly.

const SFR: Record<number, string> = {
  0x80: "P0", 0x81: "SP", 0x82: "DPL", 0x83: "DPH", 0x87: "PCON",
  0x88: "TCON", 0x89: "TMOD", 0x8a: "TL0", 0x8b: "TL1", 0x8c: "TH0",
  0x8d: "TH1", 0x90: "P1", 0x92: "DPSEL", 0x98: "SCON", 0x99: "SBUF",
  0xa0: "P2", 0xa8: "IE", 0xb0: "P3", 0xb8: "IP", 0xd0: "PSW",
  0xe0: "ACC", 0xf0: "B",
};

function dname(a: number): string {
  if (a >= 0x80) return SFR[a] ?? `SFR_${a.toString(16).toUpperCase().padStart(2, "0")}`;
  return `${a.toString(16).toUpperCase().padStart(2, "0")}h`;
}

function bname(a: number): string {
  const byte = a >= 0x80 ? a & 0xf8 : 0x20 + (a >> 3);
  return `${dname(byte)}.${a & 7}`;
}

type Entry = [number, string];
const T: Record<number, Entry> = {
  0x00: [1, "NOP"], 0x01: [2, "AJMP {a}"], 0x02: [3, "LJMP {A}"], 0x03: [1, "RR A"],
  0x04: [1, "INC A"], 0x05: [2, "INC {d}"], 0x06: [1, "INC @R0"], 0x07: [1, "INC @R1"],
  0x10: [3, "JBC {b},{r}"], 0x11: [2, "ACALL {a}"], 0x12: [3, "LCALL {A}"], 0x13: [1, "RRC A"],
  0x14: [1, "DEC A"], 0x15: [2, "DEC {d}"], 0x16: [1, "DEC @R0"], 0x17: [1, "DEC @R1"],
  0x20: [3, "JB {b},{r}"], 0x21: [2, "AJMP {a}"], 0x22: [1, "RET"], 0x23: [1, "RL A"],
  0x24: [2, "ADD A,{i}"], 0x25: [2, "ADD A,{d}"], 0x26: [1, "ADD A,@R0"], 0x27: [1, "ADD A,@R1"],
  0x30: [3, "JNB {b},{r}"], 0x31: [2, "ACALL {a}"], 0x32: [1, "RETI"], 0x33: [1, "RLC A"],
  0x34: [2, "ADDC A,{i}"], 0x35: [2, "ADDC A,{d}"], 0x36: [1, "ADDC A,@R0"], 0x37: [1, "ADDC A,@R1"],
  0x40: [2, "JC {r}"], 0x41: [2, "AJMP {a}"], 0x42: [2, "ORL {d},A"], 0x43: [3, "ORL {d},{i}"],
  0x44: [2, "ORL A,{i}"], 0x45: [2, "ORL A,{d}"], 0x46: [1, "ORL A,@R0"], 0x47: [1, "ORL A,@R1"],
  0x50: [2, "JNC {r}"], 0x51: [2, "ACALL {a}"], 0x52: [2, "ANL {d},A"], 0x53: [3, "ANL {d},{i}"],
  0x54: [2, "ANL A,{i}"], 0x55: [2, "ANL A,{d}"], 0x56: [1, "ANL A,@R0"], 0x57: [1, "ANL A,@R1"],
  0x60: [2, "JZ {r}"], 0x61: [2, "AJMP {a}"], 0x62: [2, "XRL {d},A"], 0x63: [3, "XRL {d},{i}"],
  0x64: [2, "XRL A,{i}"], 0x65: [2, "XRL A,{d}"], 0x66: [1, "XRL A,@R0"], 0x67: [1, "XRL A,@R1"],
  0x70: [2, "JNZ {r}"], 0x71: [2, "ACALL {a}"], 0x72: [2, "ORL C,{b}"], 0x73: [1, "JMP @A+DPTR"],
  0x74: [2, "MOV A,{i}"], 0x75: [3, "MOV {d},{i}"], 0x76: [2, "MOV @R0,{i}"], 0x77: [2, "MOV @R1,{i}"],
  0x80: [2, "SJMP {r}"], 0x81: [2, "AJMP {a}"], 0x82: [2, "ANL C,{b}"], 0x83: [1, "MOVC A,@A+PC"],
  0x84: [1, "DIV AB"], 0x85: [3, "MOV {d2},{d}"], 0x86: [2, "MOV {d},@R0"], 0x87: [2, "MOV {d},@R1"],
  0x90: [3, "MOV DPTR,{I}"], 0x91: [2, "ACALL {a}"], 0x92: [2, "MOV {b},C"], 0x93: [1, "MOVC A,@A+DPTR"],
  0x94: [2, "SUBB A,{i}"], 0x95: [2, "SUBB A,{d}"], 0x96: [1, "SUBB A,@R0"], 0x97: [1, "SUBB A,@R1"],
  0xa0: [2, "ORL C,/{b}"], 0xa1: [2, "AJMP {a}"], 0xa2: [2, "MOV C,{b}"], 0xa3: [1, "INC DPTR"],
  0xa4: [1, "MUL AB"], 0xa5: [1, "?A5"], 0xa6: [2, "MOV @R0,{d}"], 0xa7: [2, "MOV @R1,{d}"],
  0xb0: [2, "ANL C,/{b}"], 0xb1: [2, "ACALL {a}"], 0xb2: [2, "CPL {b}"], 0xb3: [1, "CPL C"],
  0xb4: [3, "CJNE A,{i},{r}"], 0xb5: [3, "CJNE A,{d},{r}"], 0xb6: [3, "CJNE @R0,{i},{r}"], 0xb7: [3, "CJNE @R1,{i},{r}"],
  0xc0: [2, "PUSH {d}"], 0xc1: [2, "AJMP {a}"], 0xc2: [2, "CLR {b}"], 0xc3: [1, "CLR C"],
  0xc4: [1, "SWAP A"], 0xc5: [2, "XCH A,{d}"], 0xc6: [1, "XCH A,@R0"], 0xc7: [1, "XCH A,@R1"],
  0xd0: [2, "POP {d}"], 0xd1: [2, "ACALL {a}"], 0xd2: [2, "SETB {b}"], 0xd3: [1, "SETB C"],
  0xd4: [1, "DA A"], 0xd5: [3, "DJNZ {d},{r}"], 0xd6: [1, "XCHD A,@R0"], 0xd7: [1, "XCHD A,@R1"],
  0xe0: [1, "MOVX A,@DPTR"], 0xe1: [2, "AJMP {a}"], 0xe2: [1, "MOVX A,@R0"], 0xe3: [1, "MOVX A,@R1"],
  0xe4: [1, "CLR A"], 0xe5: [2, "MOV A,{d}"], 0xe6: [1, "MOV A,@R0"], 0xe7: [1, "MOV A,@R1"],
  0xf0: [1, "MOVX @DPTR,A"], 0xf1: [2, "ACALL {a}"], 0xf2: [1, "MOVX @R0,A"], 0xf3: [1, "MOVX @R1,A"],
  0xf4: [1, "CPL A"], 0xf5: [2, "MOV {d},A"], 0xf6: [1, "MOV @R0,A"], 0xf7: [1, "MOV @R1,A"],
};

function regBlock(base: number, mnem: string, length = 1) {
  for (let n = 0; n < 8; n++) T[base + 8 + n] = [length, mnem.replace("{Rn}", `R${n}`)];
}
regBlock(0x00, "INC {Rn}"); regBlock(0x10, "DEC {Rn}"); regBlock(0x20, "ADD A,{Rn}");
regBlock(0x30, "ADDC A,{Rn}"); regBlock(0x40, "ORL A,{Rn}"); regBlock(0x50, "ANL A,{Rn}");
regBlock(0x60, "XRL A,{Rn}"); regBlock(0x70, "MOV {Rn},{i}", 2); regBlock(0x80, "MOV {d},{Rn}", 2);
regBlock(0x90, "SUBB A,{Rn}"); regBlock(0xa0, "MOV {Rn},{d}", 2); regBlock(0xb0, "CJNE {Rn},{i},{r}", 3);
regBlock(0xc0, "XCH A,{Rn}"); regBlock(0xd0, "DJNZ {Rn},{r}", 2); regBlock(0xe0, "MOV A,{Rn}");
regBlock(0xf0, "MOV {Rn},A");

const hx = (v: number, n: number) => v.toString(16).toUpperCase().padStart(n, "0");

export interface DisLine {
  addr: number;
  bytes: string;
  asm: string;
  op: number;
}

export function decode(mem: Uint8Array, pc: number): DisLine {
  const op = mem[pc];
  const [length, tmpl] = T[op] ?? [1, `?${hx(op, 2)}`];
  const b = mem.slice(pc + 1, pc + length);
  const nxt = pc + length;
  let s = tmpl;
  if (s.includes("{A}")) s = s.replace("{A}", `${hx((b[0] << 8) | b[1], 4)}h`);
  if (s.includes("{a}")) s = s.replace("{a}", `${hx((nxt & 0xf800) | ((op & 0xe0) << 3) | b[b.length - 1], 4)}h`);
  if (s.includes("{I}")) s = s.replace("{I}", `#${hx((b[0] << 8) | b[1], 4)}h`);
  if (s.includes("{d2}")) s = s.replace("{d2}", dname(b[1])).replace("{d}", dname(b[0]));
  if (s.includes("{d}")) s = s.replace("{d}", dname(b[0]));
  if (s.includes("{i}")) {
    const imm = op === 0x75 ? b[1] : b[0];
    s = s.replace("{i}", `#${hx(imm, 2)}h`);
  }
  if (s.includes("{b}")) s = s.replace("{b}", bname(b[0]));
  if (s.includes("{r}")) {
    let rel = b[b.length - 1];
    if (rel > 127) rel -= 256;
    s = s.replace("{r}", `${hx((nxt + rel) & 0xffff, 4)}h`);
  }
  const raw = Array.from(mem.slice(pc, pc + length)).map((x) => hx(x, 2)).join(" ");
  return { addr: pc, bytes: raw, asm: s, op };
}

export function disassemble(mem: Uint8Array, start: number, count: number): DisLine[] {
  const out: DisLine[] = [];
  let pc = start;
  for (let i = 0; i < count && pc < mem.length; i++) {
    const line = decode(mem, pc);
    out.push(line);
    pc += Math.max(1, line.bytes.split(" ").length);
  }
  return out;
}
