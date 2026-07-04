// Stepping MCS-51 (8051) emulator — a faithful TypeScript port of the validated
// research emulator (emu8051.py). Executes one instruction per step() and reports
// side-effects so a UI can highlight XDATA / SFR writes as they happen.

import { decode } from "./dis8051";

export const SFR = {
  ACC: 0xe0, B: 0xf0, PSW: 0xd0, SP: 0x81, DPL: 0x82, DPH: 0x83, DPSEL: 0x92,
} as const;

export interface StepInfo {
  pc: number;
  op: number;
  len: number;
  asm: string;
  bytes: string;
  xwrite?: { addr: number; val: number };
  xread?: { addr: number; val: number };
  sfrwrite?: { sfr: number; val: number };
  call?: number;
  halted?: string;
}

export class Cpu8051 {
  code = new Uint8Array(0x10000);
  iram = new Uint8Array(0x100);
  xram = new Uint8Array(0x10000);
  sfr = new Uint8Array(0x100);
  pc = 0;
  steps = 0;
  halted: string | null = null;

  // per-step side effects (consumed by step())
  private _xw?: { addr: number; val: number };
  private _xr?: { addr: number; val: number };
  private _sw?: { sfr: number; val: number };
  private _call?: number;

  constructor(code?: Uint8Array) {
    if (code) this.loadCode(code);
    this.reset(0);
  }

  loadCode(code: Uint8Array) {
    this.code.fill(0);
    this.code.set(code.subarray(0, 0x10000));
  }

  reset(entry = 0) {
    this.iram.fill(0);
    this.xram.fill(0);
    this.sfr.fill(0);
    this.sfr[SFR.SP] = 0x07;
    this.pc = entry & 0xffff;
    this.steps = 0;
    this.halted = null;
  }

  // ---- register bank / accessors ----
  private bank() {
    return (this.sfr[SFR.PSW] >> 3) & 3;
  }
  R(n: number) {
    return this.iram[this.bank() * 8 + n];
  }
  setR(n: number, v: number) {
    this.iram[this.bank() * 8 + n] = v & 0xff;
  }
  get A() {
    return this.sfr[SFR.ACC];
  }
  set A(v: number) {
    this.sfr[SFR.ACC] = v & 0xff;
  }
  get dptr() {
    return (this.sfr[SFR.DPH] << 8) | this.sfr[SFR.DPL];
  }
  set dptr(v: number) {
    this.sfr[SFR.DPH] = (v >> 8) & 0xff;
    this.sfr[SFR.DPL] = v & 0xff;
  }
  get CY() {
    return (this.sfr[SFR.PSW] >> 7) & 1;
  }
  set CY(b: number) {
    this.sfr[SFR.PSW] = (this.sfr[SFR.PSW] & ~0x80) | ((b & 1) << 7);
  }
  flags() {
    const p = this.sfr[SFR.PSW];
    return { CY: (p >> 7) & 1, AC: (p >> 6) & 1, OV: (p >> 2) & 1, P: p & 1, bank: this.bank() };
  }

  // ---- memory ----
  private dread(a: number) {
    return a < 0x80 ? this.iram[a] : this.sfr[a];
  }
  private dwrite(a: number, v: number) {
    v &= 0xff;
    if (a < 0x80) this.iram[a] = v;
    else {
      this.sfr[a] = v;
      this._sw = { sfr: a, val: v };
    }
  }
  private iread(a: number) {
    return this.iram[a];
  }
  private iwrite(a: number, v: number) {
    this.iram[a] = v & 0xff;
  }
  private xreadT(a: number) {
    a &= 0xffff;
    const v = this.xram[a];
    this._xr = { addr: a, val: v };
    return v;
  }
  private xwriteT(a: number, v: number) {
    a &= 0xffff;
    this.xram[a] = v & 0xff;
    this._xw = { addr: a, val: v & 0xff };
  }

  private bitLoc(b: number): [number, number, boolean] {
    if (b < 0x80) return [0x20 + (b >> 3), b & 7, false];
    return [b & 0xf8, b & 7, true];
  }
  private getbit(b: number) {
    const [byte, bit, sfr] = this.bitLoc(b);
    const base = sfr ? this.sfr[byte] : this.iram[byte];
    return (base >> bit) & 1;
  }
  private setbit(b: number, val: number) {
    const [byte, bit, sfr] = this.bitLoc(b);
    const arr = sfr ? this.sfr : this.iram;
    if (val) arr[byte] |= 1 << bit;
    else arr[byte] &= ~(1 << bit);
  }

  private f() {
    const v = this.code[this.pc];
    this.pc = (this.pc + 1) & 0xffff;
    return v;
  }
  private rel() {
    const r = this.f();
    return r > 127 ? r - 256 : r;
  }
  private add(a: number, b: number, carry = 0) {
    const r = a + b + carry;
    this.CY = r > 0xff ? 1 : 0;
    return r & 0xff;
  }
  private sub(a: number, b: number) {
    const r = a - b - this.CY;
    this.CY = r < 0 ? 1 : 0;
    return r & 0xff;
  }
  private push(v: number) {
    this.sfr[SFR.SP] = (this.sfr[SFR.SP] + 1) & 0xff;
    this.iram[this.sfr[SFR.SP]] = v & 0xff;
  }
  private pop() {
    const v = this.iram[this.sfr[SFR.SP]];
    this.sfr[SFR.SP] = (this.sfr[SFR.SP] - 1) & 0xff;
    return v;
  }

  /** execute one instruction; returns a description + side-effects for the UI. */
  step(): StepInfo {
    const pc0 = this.pc;
    const dis = decode(this.code, pc0);
    this._xw = this._xr = this._sw = undefined;
    this._call = undefined;
    const op = this.f();
    this.steps++;
    const halt = this.exec(op, pc0);
    const info: StepInfo = { pc: pc0, op, len: dis.bytes.split(" ").length, asm: dis.asm, bytes: dis.bytes };
    if (this._xw) info.xwrite = this._xw;
    if (this._xr) info.xread = this._xr;
    if (this._sw) info.sfrwrite = this._sw;
    if (this._call !== undefined) info.call = this._call;
    if (halt) {
      info.halted = this.halted ?? "halt";
      this.halted = info.halted;
    }
    return info;
  }

  private exec(op: number, pc0: number): boolean {
    const hi = op & 0xf0,
      lo = op & 0x0f;
    const rn = lo >= 8 ? lo - 8 : -1;

    if (op === 0x00) return false; // NOP
    if (op === 0x02) {
      this.pc = (this.f() << 8) | this.f();
      return false;
    } // LJMP
    if (op === 0x12) {
      // LCALL
      const t = (this.f() << 8) | this.f();
      this.push(this.pc & 0xff);
      this.push((this.pc >> 8) & 0xff);
      this._call = t;
      this.pc = t;
      return false;
    }
    if (op === 0x22 || op === 0x32) {
      const h = this.pop();
      const l = this.pop();
      this.pc = (h << 8) | l;
      return false;
    } // RET/RETI (pop order: high pushed last)
    if ((op & 0x1f) === 0x01 || (op & 0x1f) === 0x11) {
      // AJMP/ACALL addr11
      const a8 = this.f();
      const t = (this.pc & 0xf800) | ((op & 0xe0) << 3) | a8;
      if ((op & 0x0f) === 0x01) this.pc = t;
      else {
        this.push(this.pc & 0xff);
        this.push((this.pc >> 8) & 0xff);
        this._call = t;
        this.pc = t;
      }
      return false;
    }
    if (op === 0x80) {
      const r = this.rel();
      if (r === -2) {
        this.pc = pc0;
        this.halted = "SJMP $ (idle spin)";
        return true;
      }
      this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x90) {
      this.dptr = (this.f() << 8) | this.f();
      return false;
    }
    // MOVX / MOVC
    if (op === 0xe0) {
      this.A = this.xreadT(this.dptr);
      return false;
    }
    if (op === 0xf0) {
      this.xwriteT(this.dptr, this.A);
      return false;
    }
    if (op === 0xe2 || op === 0xe3) {
      this.A = this.xreadT(this.R(op & 1));
      return false;
    }
    if (op === 0xf2 || op === 0xf3) {
      this.xwriteT(this.R(op & 1), this.A);
      return false;
    }
    if (op === 0x93) {
      this.A = this.code[(this.A + this.dptr) & 0xffff];
      return false;
    }
    if (op === 0x83) {
      this.A = this.code[(this.A + this.pc) & 0xffff];
      return false;
    }
    // data moves
    if (op === 0x74) {
      this.A = this.f();
      return false;
    }
    if (op === 0x75) {
      const d = this.f();
      this.dwrite(d, this.f());
      return false;
    }
    if (op === 0x85) {
      const src = this.f();
      const dst = this.f();
      this.dwrite(dst, this.dread(src));
      return false;
    }
    if (op === 0x76 || op === 0x77) {
      this.iwrite(this.R(op & 1), this.f());
      return false;
    }
    if (op === 0xe5) {
      this.A = this.dread(this.f());
      return false;
    }
    if (op === 0xf5) {
      this.dwrite(this.f(), this.A);
      return false;
    }
    if (op === 0xe6 || op === 0xe7) {
      this.A = this.iread(this.R(op & 1));
      return false;
    }
    if (op === 0xf6 || op === 0xf7) {
      this.iwrite(this.R(op & 1), this.A);
      return false;
    }
    if (op === 0xa6 || op === 0xa7) {
      this.iwrite(this.R(op & 1), this.dread(this.f()));
      return false;
    }
    if (hi === 0x70 && rn >= 0) {
      this.setR(rn, this.f());
      return false;
    }
    if (hi === 0xe0 && rn >= 0) {
      this.A = this.R(rn);
      return false;
    }
    if (hi === 0xf0 && rn >= 0) {
      this.setR(rn, this.A);
      return false;
    }
    if (hi === 0xa0 && rn >= 0) {
      this.setR(rn, this.dread(this.f()));
      return false;
    }
    if (hi === 0x80 && rn >= 0) {
      this.dwrite(this.f(), this.R(rn));
      return false;
    }
    // INC / DEC
    if (op === 0x04) {
      this.A = this.A + 1;
      return false;
    }
    if (op === 0x05) {
      const d = this.f();
      this.dwrite(d, this.dread(d) + 1);
      return false;
    }
    if (op === 0x06 || op === 0x07) {
      const a = this.R(op & 1);
      this.iwrite(a, this.iread(a) + 1);
      return false;
    }
    if (hi === 0x00 && rn >= 0) {
      this.setR(rn, this.R(rn) + 1);
      return false;
    }
    if (op === 0xa3) {
      this.dptr = (this.dptr + 1) & 0xffff;
      return false;
    }
    if (op === 0x14) {
      this.A = this.A - 1;
      return false;
    }
    if (op === 0x15) {
      const d = this.f();
      this.dwrite(d, this.dread(d) - 1);
      return false;
    }
    if (op === 0x16 || op === 0x17) {
      const a = this.R(op & 1);
      this.iwrite(a, this.iread(a) - 1);
      return false;
    }
    if (hi === 0x10 && rn >= 0) {
      this.setR(rn, this.R(rn) - 1);
      return false;
    }
    // CLR/CPL/SETB
    if (op === 0xe4) {
      this.A = 0;
      return false;
    }
    if (op === 0xf4) {
      this.A = ~this.A & 0xff;
      return false;
    }
    if (op === 0xc3) {
      this.CY = 0;
      return false;
    }
    if (op === 0xd3) {
      this.CY = 1;
      return false;
    }
    if (op === 0xb3) {
      this.CY ^= 1;
      return false;
    }
    if (op === 0xc2) {
      this.setbit(this.f(), 0);
      return false;
    }
    if (op === 0xd2) {
      this.setbit(this.f(), 1);
      return false;
    }
    if (op === 0xb2) {
      const b = this.f();
      this.setbit(b, this.getbit(b) ^ 1);
      return false;
    }
    // arithmetic
    if (op === 0x24) {
      this.A = this.add(this.A, this.f());
      return false;
    }
    if (op === 0x25) {
      this.A = this.add(this.A, this.dread(this.f()));
      return false;
    }
    if (op === 0x26 || op === 0x27) {
      this.A = this.add(this.A, this.iread(this.R(op & 1)));
      return false;
    }
    if (hi === 0x20 && rn >= 0) {
      this.A = this.add(this.A, this.R(rn));
      return false;
    }
    if (op === 0x34) {
      this.A = this.add(this.A, this.f(), this.CY);
      return false;
    }
    if (op === 0x35) {
      this.A = this.add(this.A, this.dread(this.f()), this.CY);
      return false;
    }
    if (hi === 0x30 && rn >= 0) {
      this.A = this.add(this.A, this.R(rn), this.CY);
      return false;
    }
    if (op === 0x94) {
      this.A = this.sub(this.A, this.f());
      return false;
    }
    if (op === 0x95) {
      this.A = this.sub(this.A, this.dread(this.f()));
      return false;
    }
    if (hi === 0x90 && rn >= 0) {
      this.A = this.sub(this.A, this.R(rn));
      return false;
    }
    // logic
    const logic = (fn: (a: number, b: number) => number) => {
      if (lo === 0x4) this.A = fn(this.A, this.f());
      else if (lo === 0x5) this.A = fn(this.A, this.dread(this.f()));
      else if (lo === 0x2) {
        const d = this.f();
        this.dwrite(d, fn(this.dread(d), this.A));
      } else if (lo === 0x3) {
        const d = this.f();
        this.dwrite(d, fn(this.dread(d), this.f()));
      } else if (lo === 0x6 || lo === 0x7) this.A = fn(this.A, this.iread(this.R(lo & 1)));
      else if (rn >= 0) this.A = fn(this.A, this.R(rn));
    };
    // lo>=2 guards keep JC/JNC/JZ (0x40/0x50/0x60) and AJMP/ACALL (…1) from being
    // swallowed here — those fall through to their real handlers below.
    if (hi === 0x50 && lo >= 2) {
      logic((a, b) => a & b);
      return false;
    }
    if (hi === 0x40 && lo >= 2) {
      logic((a, b) => a | b);
      return false;
    }
    if (hi === 0x60 && lo >= 2) {
      logic((a, b) => a ^ b);
      return false;
    }
    // rotates
    if (op === 0x23) {
      this.A = ((this.A << 1) | (this.A >> 7)) & 0xff;
      return false;
    }
    if (op === 0x03) {
      this.A = ((this.A >> 1) | (this.A << 7)) & 0xff;
      return false;
    }
    if (op === 0x33) {
      const c = this.CY;
      this.CY = (this.A >> 7) & 1;
      this.A = ((this.A << 1) | c) & 0xff;
      return false;
    }
    if (op === 0x13) {
      const c = this.CY;
      this.CY = this.A & 1;
      this.A = ((this.A >> 1) | (c << 7)) & 0xff;
      return false;
    }
    if (op === 0xc4) {
      this.A = ((this.A << 4) | (this.A >> 4)) & 0xff;
      return false;
    }
    // conditional branches
    if (op === 0x60) {
      const r = this.rel();
      if (this.A === 0) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x70) {
      const r = this.rel();
      if (this.A !== 0) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x40) {
      const r = this.rel();
      if (this.CY) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x50) {
      const r = this.rel();
      if (!this.CY) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x20) {
      const b = this.f();
      const r = this.rel();
      if (this.getbit(b)) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x30) {
      const b = this.f();
      const r = this.rel();
      if (!this.getbit(b)) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0x10) {
      const b = this.f();
      const r = this.rel();
      if (this.getbit(b)) {
        this.setbit(b, 0);
        this.pc = (this.pc + r) & 0xffff;
      }
      return false;
    }
    if (op === 0x73) {
      this.pc = (this.A + this.dptr) & 0xffff;
      return false;
    }
    // CJNE
    if (op === 0xb4) {
      const imm = this.f();
      const r = this.rel();
      this.CY = this.A < imm ? 1 : 0;
      if (this.A !== imm) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0xb5) {
      const v = this.dread(this.f());
      const r = this.rel();
      this.CY = this.A < v ? 1 : 0;
      if (this.A !== v) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (op === 0xb6 || op === 0xb7) {
      const v = this.iread(this.R(op & 1));
      const imm = this.f();
      const r = this.rel();
      this.CY = v < imm ? 1 : 0;
      if (v !== imm) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (hi === 0xb0 && rn >= 0) {
      const imm = this.f();
      const r = this.rel();
      const v = this.R(rn);
      this.CY = v < imm ? 1 : 0;
      if (v !== imm) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    // DJNZ
    if (op === 0xd5) {
      const d = this.f();
      const r = this.rel();
      const v = (this.dread(d) - 1) & 0xff;
      this.dwrite(d, v);
      if (v !== 0) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    if (hi === 0xd0 && rn >= 0) {
      const r = this.rel();
      const v = (this.R(rn) - 1) & 0xff;
      this.setR(rn, v);
      if (v !== 0) this.pc = (this.pc + r) & 0xffff;
      return false;
    }
    // PUSH/POP/XCH
    if (op === 0xc0) {
      this.push(this.dread(this.f()));
      return false;
    }
    if (op === 0xd0) {
      const d = this.f();
      this.dwrite(d, this.pop());
      return false;
    }
    if (op === 0xc5) {
      const d = this.f();
      const v = this.dread(d);
      this.dwrite(d, this.A);
      this.A = v;
      return false;
    }
    if (op === 0xc6 || op === 0xc7) {
      const a = this.R(op & 1);
      const v = this.iread(a);
      this.iwrite(a, this.A);
      this.A = v;
      return false;
    }
    if (hi === 0xc0 && rn >= 0) {
      const v = this.R(rn);
      this.setR(rn, this.A);
      this.A = v;
      return false;
    }
    // MUL/DIV/DA
    if (op === 0xa4) {
      const p = this.A * this.sfr[SFR.B];
      this.A = p & 0xff;
      this.sfr[SFR.B] = (p >> 8) & 0xff;
      this.CY = 0;
      return false;
    }
    if (op === 0x84) {
      const b = this.sfr[SFR.B];
      if (b === 0) this.CY = 0;
      else {
        const q = Math.floor(this.A / b),
          r = this.A % b;
        this.A = q;
        this.sfr[SFR.B] = r;
        this.CY = 0;
      }
      return false;
    }
    if (op === 0xd4) return false; // DA A (approx)
    // bit-C ops
    if (op === 0x72) {
      this.CY |= this.getbit(this.f());
      return false;
    }
    if (op === 0x82) {
      this.CY &= this.getbit(this.f());
      return false;
    }
    if (op === 0xa2) {
      this.CY = this.getbit(this.f());
      return false;
    }
    if (op === 0x92) {
      this.setbit(this.f(), this.CY);
      return false;
    }
    if (op === 0xa0) {
      this.CY |= this.getbit(this.f()) ^ 1;
      return false;
    }
    if (op === 0xb0) {
      this.CY &= this.getbit(this.f()) ^ 1;
      return false;
    }

    this.halted = `unimplemented op 0x${op.toString(16)} @0x${pc0.toString(16)}`;
    return true;
  }
}
