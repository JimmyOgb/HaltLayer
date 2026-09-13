import { encodeGenCallPayload, decodeCalldata, hexToBytes, encodeCalldata } from '../src/lib/contracts/codec.ts';

const testVectors = [
  { method: 'get_protocol', args: ['0x1111111111111111111111111111111111111111'], expected: 'f2b01604617267730d181111111111111111111111111111111111111111066d6574686f64646765745f70726f746f636f6c00' },
  { method: 'get_incident', args: ['INC-1'], expected: 'e3a11604617267730d2c494e432d31066d6574686f64646765745f696e636964656e7400' },
  { method: 'get_protection_status', args: ['0x1111111111111111111111111111111111111111'], expected: 'f83db83a1604617267730d181111111111111111111111111111111111111111066d6574686f64ac016765745f70726f74656374696f6e5f73746174757300' },
  { method: 'submit_incident', args: ['0x1111111111111111111111111111111111111111', 'Critical reentrancy drain exploit', '0x9a8b', 'https://alert.json'], expected: 'f874b871160461726773251811111111111111111111111111111111111111118c02437269746963616c207265656e7472616e637920647261696e206578706c6f697434307839613862940168747470733a2f2f616c6572742e6a736f6e066d6574686f647c7375626d69745f696e636964656e7400' },
  { method: 'adjudicate_incident', args: ['INC-1'], expected: 'eba91604617267730d2c494e432d31066d6574686f649c0161646a756469636174655f696e636964656e7400' },
  { method: 'appeal_incident', args: ['INC-1', 'Audited patch'], expected: 'f4b2160461726773152c494e432d316c41756469746564207061746368066d6574686f647c61707065616c5f696e636964656e7400' },
  { method: 'resolve_appeal', args: ['INC-1', true, 'Resolved'], expected: 'efad1604617267731d2c494e432d3110445265736f6c766564066d6574686f64747265736f6c76655f61707065616c00' },
  { method: 'deposit', args: [1000], expected: 'da981604617267730dc13e066d6574686f643c6465706f73697400' },
  { method: 'withdraw', args: [500], expected: 'db991604617267730da11f066d6574686f6444776974686472617700' },
  { method: 'pause', args: [], expected: 'd08e0e066d6574686f642c706175736500' },
  { method: 'resume', args: [], expected: 'd18f0e066d6574686f6434726573756d6500' },
  { method: 'is_paused', args: [], expected: 'd4920e066d6574686f644c69735f70617573656400' },
  { method: 'get_total_staked', args: [], expected: 'dc9a0e066d6574686f6484016765745f746f74616c5f7374616b656400' }
];

console.log("================================================================");
console.log("COMPREHENSIVE TS CALDATA CODEC AUDIT (13 METHODS)");
console.log("================================================================");

let passed = 0;
for (const v of testVectors) {
  const actual = encodeGenCallPayload(v.method, v.args).replace(/^0x/, '');
  const match = actual.toLowerCase() === v.expected.toLowerCase();
  if (match) {
    passed++;
    console.log(`[PASS] ${v.method}`);
  } else {
    console.error(`[FAIL] ${v.method}`);
    console.error(`  actual:   ${actual}`);
    console.error(`  expected: ${v.expected}`);
  }
}

console.log("\nTesting Roundtrip Encoding & Decoding...");
const roundtrips = [
  true,
  false,
  123456,
  "ACTIVE",
  "HALTED",
  "0x1111111111111111111111111111111111111111",
  { status: "ACTIVE", count: 42, target: "0x1111111111111111111111111111111111111111" }
];

let rtPassed = 0;
for (const obj of roundtrips) {
  const enc = encodeCalldata(obj);
  const dec = decodeCalldata(enc);
  const sortKeys = (o) => typeof o === 'object' && o !== null ? Object.keys(o).sort().reduce((r, k) => ({ ...r, [k]: o[k] }), {}) : o;
  const match = JSON.stringify(sortKeys(obj)) === JSON.stringify(sortKeys(dec));
  if (match) {
    rtPassed++;
    console.log(`[PASS] Decoded: ${JSON.stringify(dec)}`);
  } else {
    console.error(`[FAIL] Original:`, obj, `Decoded:`, dec);
  }
}

console.log("================================================================");
console.log(`Encoding Results: ${passed}/${testVectors.length} passed`);
console.log(`Decoding Results: ${rtPassed}/${roundtrips.length} passed`);
console.log("================================================================");

if (passed === testVectors.length && rtPassed === roundtrips.length) {
  process.exit(0);
} else {
  process.exit(1);
}
