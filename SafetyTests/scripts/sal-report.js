import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile, buildDependencyGraph, findPath } from "../src/sal-parser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sal = path.resolve(here, "../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal");
const model = parseSalFile(sal);
const graph = buildDependencyGraph(model);
const inputs = ["in_LV_Connector_Interlock", "in_HV_Connector_Interlock", "in_InterLock_NC_1", "in_InterLock_NC_2"];

const report = {
  sal,
  crc: model.crc,
  networks: model.networks.length,
  blocks: model.networks.flatMap(n => n.blocks).length,
  variables: model.variables.length,
  dependencyChecks: Object.fromEntries(inputs.map(input => [input, {
    resetStoDrive1: Boolean(findPath(graph, `var:${input}`, "var:b_Reset_STO_DR1")),
    resetStoDrive2: Boolean(findPath(graph, `var:${input}`, "var:b_Reset_STO_DR2"))
  }]))
};

console.log(JSON.stringify(report, null, 2));
if (Object.values(report.dependencyChecks).some(x => !x.resetStoDrive1 || !x.resetStoDrive2)) process.exitCode = 1;
