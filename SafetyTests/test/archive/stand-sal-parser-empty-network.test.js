// E2-R1 S1 (stand): the native TwinSAFE writer serializes an empty Network as a
// self-closing `<Network .../>`. The parser and the mutation locator must read it
// as an empty network and must not let the preceding/following Network swallow
// its neighbours. On canonical F1 (no self-closing Network) the result must be
// identical to the legacy reader.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile, elements } from "../../src/sal-parser.js";
import { locateBlock } from "../../src/sal-mutations.js";

const block = (name, order) => `<fBAnd Id="b-${name}" name="${name}" instanceName="${name}" functionName="safeAnd" orderOfExecution="${order}">` +
  `<inPorts><inPort Id="i-${name}" name="AndIn1" channelInterface="Activated" /></inPorts>` +
  `<outPorts><outPort Id="o-${name}" name="AndOut" /></outPorts></fBAnd>`;
const net = (name, body) => body === null
  ? `<safetyApplicationHasNetworks Id="h-${name}"><Network Id="n-${name}" name="${name}" networkName="${name}" intId="1" networkOrderId="0" /></safetyApplicationHasNetworks>`
  : `<safetyApplicationHasNetworks Id="h-${name}"><Network Id="n-${name}" name="${name}" networkName="${name}" intId="1" networkOrderId="0"><functionBlocks>${body}</functionBlocks></Network></safetyApplicationHasNetworks>`;
const doc = nets => `<?xml version="1.0" encoding="utf-8"?>\n<safetyApplication Id="app" Crc="1"><networks>${nets.join("\n")}</networks><variables></variables></safetyApplication>`;

function parseText(xml) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stand-empty-net-"));
  const file = path.join(dir, "t.sal");
  fs.writeFileSync(file, xml);
  try { return parseSalFile(file, { bindingMode: "explicit" }); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test("S1: self-closing empty Networks are parsed as empty and do not swallow neighbours", () => {
  const xml = doc([net("Network4", null), net("Network5", null), net("Network6", block("FBAnd9", 1)), net("Network9", null), net("Network10", block("FBAnd1", 2))]);
  const model = parseText(xml);
  assert.deepEqual(model.networks.map(n => `${n.name}:${n.blocks.length}`), ["Network4:0", "Network5:0", "Network6:1", "Network9:0", "Network10:1"]);
  assert.equal(model.networks.find(n => n.name === "Network6").blocks[0].path, "//Network6/FBAnd9");
  assert.equal(model.networks.find(n => n.name === "Network10").blocks[0].path, "//Network10/FBAnd1");
  // Attributes of the self-closing element carry no trailing "/".
  assert.deepEqual(Object.keys(model.networks[0]).sort(), ["Id", "blocks", "intId", "name", "networkName", "networkOrderId"]);
  assert.equal(model.networks[0].networkOrderId, "0");
});

test("S1: element reader distinguishes self-closing and paired forms", () => {
  const found = elements(`<Network name="A" /><Network name="B"><x/></Network><Network name="C"/>`, "Network");
  assert.deepEqual(found.map(e => [e.attr.name, e.selfClosing, e.body]), [["A", true, ""], ["B", false, "<x/>"], ["C", true, ""]]);
});

test("S1: a Network body that still contains another <Network> is rejected, not merged", () => {
  // Open tag without close followed by a closed network: the legacy reader merged both.
  const xml = doc([`<Network Id="n-A" name="A" networkName="A">`, net("B", block("FBAnd1", 1))]);
  assert.throws(() => parseText(xml), /Network A contains a nested <Network>/);
});

test("S1: mutation locator finds blocks after an empty Network and finds none inside it", () => {
  const xml = doc([net("Network4", null), net("Network5", null), net("Network6", block("FBAnd9", 1))]);
  const located = locateBlock(xml, "//Network6/FBAnd9");
  assert.ok(xml.slice(located.start, located.end).startsWith('<fBAnd Id="b-FBAnd9"'));
  assert.throws(() => locateBlock(xml, "//Network4/FBAnd9"), /Block \/\/Network4\/FBAnd9: expected exactly one match, found 0/);
});

test("S1: on pinned F1 (no self-closing Network) the reader equals the legacy paired-only reader", () => {
  const sal = fileURLToPath(new URL("../../fixtures/stand-f1-04b45456/TwinSafeGroup1.sal", import.meta.url));
  const xml = fs.readFileSync(sal, "utf8");
  const legacy = [...xml.matchAll(/<(Network)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(m => [m[2], m[3]]);
  const current = elements(xml, "Network");
  assert.ok(current.every(e => !e.selfClosing), "F1 contains no self-closing Network");
  assert.equal(current.length, 14);
  assert.equal(current.length, legacy.length);
  const attrText = s => Object.fromEntries([...s.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  current.forEach((e, i) => { assert.deepEqual(e.attr, attrText(legacy[i][0])); assert.equal(e.body, legacy[i][1]); });
});
