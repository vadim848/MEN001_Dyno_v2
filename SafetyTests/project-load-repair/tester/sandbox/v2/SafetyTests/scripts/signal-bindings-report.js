import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { readAliasDescriptors, signalBindings } from "../src/signal-bindings.js";
const root = new URL("../../MEN001_Dyno/Safety_Dyno/", import.meta.url);
const model = parseSalFile(fileURLToPath(new URL("TwinSafeGroup1/TwinSafeGroup1.sal", root)));
const aliases = readAliasDescriptors(fileURLToPath(new URL("TwinSafeGroup1/Alias Devices/", root)));
const rows = signalBindings(model, aliases);
const report = { crc: model.crc, source: "working v2 SAL and SDS files", safetyAcceptance: false, rows };
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../SIGNAL_BINDINGS.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ signals: rows.length, descriptors: aliases.size,
  important: rows.filter(r => ["in_Door_Monitor", "in_Safety_Run", "GroupPort_ErrAck"].includes(r.signal)) }, null, 2));
