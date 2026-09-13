/**
 * Pure TypeScript implementation of GenLayer Calldata Encoder & Decoder.
 * Fully compatible with genlayer_py/abi/calldata.
 */

const BITS_IN_TYPE = 3;
const TYPE_SPECIAL = 0;
const TYPE_PINT = 1;
const TYPE_NINT = 2;
const TYPE_BYTES = 3;
const TYPE_STR = 4;
const TYPE_ARR = 5;
const TYPE_MAP = 6;

const SPECIAL_NULL = (0 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_FALSE = (1 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_TRUE = (2 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_ADDR = (3 << BITS_IN_TYPE) | TYPE_SPECIAL;

export function encodeUleb128(val: number): Uint8Array {
  const bytes: number[] = [];
  let n = Math.max(0, Math.floor(val));
  if (n === 0) {
    return new Uint8Array([0]);
  }
  while (n > 0) {
    let cur = n & 0x7f;
    n = Math.floor(n / 128);
    if (n > 0) {
      cur |= 0x80;
    }
    bytes.push(cur);
  }
  return new Uint8Array(bytes);
}

export function decodeUleb128(buf: Uint8Array, offset: number): [number, number] {
  let ret = 0;
  let shift = 0;
  let off = offset;
  while (true) {
    if (off >= buf.length) {
      throw new Error("Unexpected end of buffer while reading ULEB128");
    }
    const b = buf[off++];
    ret |= (b & 0x7f) << shift;
    shift += 7;
    if ((b & 0x80) === 0) {
      break;
    }
  }
  return [ret, off];
}

export function encodeCalldata(val: any): Uint8Array {
  const chunks: Uint8Array[] = [];

  function append(u: Uint8Array) {
    chunks.push(u);
  }

  function appendUleb(num: number) {
    append(encodeUleb128(num));
  }

  function impl(x: any) {
    if (x === null || x === undefined) {
      appendUleb(SPECIAL_NULL);
    } else if (x === true) {
      appendUleb(SPECIAL_TRUE);
    } else if (x === false) {
      appendUleb(SPECIAL_FALSE);
    } else if (typeof x === "number" || typeof x === "bigint") {
      const num = Number(x);
      if (num >= 0) {
        appendUleb((num << BITS_IN_TYPE) | TYPE_PINT);
      } else {
        const n = -num - 1;
        appendUleb((n << BITS_IN_TYPE) | TYPE_NINT);
      }
    } else if (typeof x === "string") {
      // Check if it's an address in 0x hex format
      if (/^0x[0-9a-fA-F]{40}$/.test(x)) {
        appendUleb(SPECIAL_ADDR);
        const clean = x.slice(2);
        const addrBytes = new Uint8Array(20);
        for (let i = 0; i < 20; i++) {
          addrBytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
        }
        append(addrBytes);
      } else {
        const textBytes = new TextEncoder().encode(x);
        appendUleb((textBytes.length << BITS_IN_TYPE) | TYPE_STR);
        append(textBytes);
      }
    } else if (x instanceof Uint8Array) {
      appendUleb((x.length << BITS_IN_TYPE) | TYPE_BYTES);
      append(x);
    } else if (Array.isArray(x)) {
      appendUleb((x.length << BITS_IN_TYPE) | TYPE_ARR);
      for (const item of x) {
        impl(item);
      }
    } else if (typeof x === "object") {
      const keys = Object.keys(x).sort();
      appendUleb((keys.length << BITS_IN_TYPE) | TYPE_MAP);
      for (const k of keys) {
        const kBytes = new TextEncoder().encode(k);
        appendUleb(kBytes.length);
        append(kBytes);
        impl(x[k]);
      }
    } else {
      throw new Error(`Unsupported calldata type: ${typeof x}`);
    }
  }

  impl(val);

  // Combine chunks
  let totalLength = 0;
  for (const c of chunks) totalLength += c.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}

export function decodeCalldata(buf: Uint8Array): any {
  let off = 0;

  function impl(): any {
    const [code, nextOff] = decodeUleb128(buf, off);
    off = nextOff;
    const typ = code & 0x7;

    if (typ === TYPE_SPECIAL) {
      if (code === SPECIAL_NULL) return null;
      if (code === SPECIAL_FALSE) return false;
      if (code === SPECIAL_TRUE) return true;
      if (code === SPECIAL_ADDR) {
        const addrBytes = buf.subarray(off, off + 20);
        off += 20;
        let hex = "0x";
        for (let i = 0; i < addrBytes.length; i++) {
          hex += addrBytes[i].toString(16).padStart(2, "0");
        }
        return hex;
      }
      throw new Error(`Unknown special code: ${code}`);
    }

    const payload = code >> 3;

    if (typ === TYPE_PINT) {
      return payload;
    } else if (typ === TYPE_NINT) {
      return -payload - 1;
    } else if (typ === TYPE_BYTES) {
      const bytes = buf.subarray(off, off + payload);
      off += payload;
      return bytes;
    } else if (typ === TYPE_STR) {
      const strBytes = buf.subarray(off, off + payload);
      off += payload;
      return new TextDecoder().decode(strBytes);
    } else if (typ === TYPE_ARR) {
      const arr: any[] = [];
      for (let i = 0; i < payload; i++) {
        arr.push(impl());
      }
      return arr;
    } else if (typ === TYPE_MAP) {
      const dict: Record<string, any> = {};
      for (let i = 0; i < payload; i++) {
        const [kLen, kOff] = decodeUleb128(buf, off);
        off = kOff;
        const kBytes = buf.subarray(off, off + kLen);
        off += kLen;
        const k = new TextDecoder().decode(kBytes);
        dict[k] = impl();
      }
      return dict;
    }

    throw new Error(`Invalid calldata type tag: ${typ}`);
  }

  return impl();
}

/**
 * Encodes a function call structure for GenLayer:
 * { method: string, args: any[] } -> calldata bytes -> RLP encoded -> Hex
 */
export function encodeGenCallPayload(method: string, args: any[] = []): string {
  const callObj: Record<string, any> = { method };
  if (args && args.length > 0) {
    callObj.args = args;
  }
  const encodedCalldata = encodeCalldata(callObj);

  // In GenLayer, read payload is RLP encoded [calldata_bytes, b"\x00"]
  const rlp = simpleRlpEncode([encodedCalldata, new Uint8Array([0])]);
  return "0x" + bytesToHex(rlp);
}

function simpleRlpEncode(items: (Uint8Array | Uint8Array[])[]): Uint8Array {
  const encodedItems: Uint8Array[] = [];
  let totalLength = 0;

  for (const item of items) {
    if (item instanceof Uint8Array) {
      if (item.length === 1 && item[0] < 0x80) {
        encodedItems.push(item);
        totalLength += 1;
      } else if (item.length <= 55) {
        const header = new Uint8Array([0x80 + item.length]);
        encodedItems.push(header, item);
        totalLength += 1 + item.length;
      } else {
        const lenBytes = intToBytes(item.length);
        const header = new Uint8Array([0xb7 + lenBytes.length, ...lenBytes]);
        encodedItems.push(header, item);
        totalLength += header.length + item.length;
      }
    }
  }

  // Wrap list
  if (totalLength <= 55) {
    const listHeader = new Uint8Array([0xc0 + totalLength]);
    const out = new Uint8Array(1 + totalLength);
    out.set(listHeader, 0);
    let p = 1;
    for (const piece of encodedItems) {
      out.set(piece, p);
      p += piece.length;
    }
    return out;
  } else {
    const lenBytes = intToBytes(totalLength);
    const listHeader = new Uint8Array([0xf7 + lenBytes.length, ...lenBytes]);
    const out = new Uint8Array(listHeader.length + totalLength);
    out.set(listHeader, 0);
    let p = listHeader.length;
    for (const piece of encodedItems) {
      out.set(piece, p);
      p += piece.length;
    }
    return out;
  }
}

function intToBytes(val: number): number[] {
  const res: number[] = [];
  let v = val;
  while (v > 0) {
    res.unshift(v & 0xff);
    v = Math.floor(v / 256);
  }
  return res.length === 0 ? [0] : res;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const len = Math.floor(clean.length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}
