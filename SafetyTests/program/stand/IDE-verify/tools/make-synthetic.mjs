// Synthetic IDE-verify candidate: base SAL + one new network with N dummy safeAnd blocks.
// Chain: in_False_SI2_CH8 -> AND1.AndIn1; ANDk.AndOut -> AND(k+1).AndIn1 (same network). No outputs/Symbols.
// Text staging only; base CRC kept; new CRC must be written by native writer (native-save-synth.ps1).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const [,, srcDir, nStr, outDir] = process.argv; const N = +nStr;
const g = () => crypto.randomUUID();
let sal = fs.readFileSync(path.join(srcDir, 'TwinSafeGroup1.sal'), 'utf8');
const orders = [...sal.matchAll(/orderOfExecution="(\d+)"/g)].map(m => +m[1]);
const maxOrd = Math.max(...orders);
const intIds = [...sal.matchAll(/<Network [^>]*intId="(\d+)"[^>]*networkOrderId="(\d+)"/g)];
const nextInt = Math.max(...intIds.map(m => +m[1])) + 1, nextOrd = Math.max(...intIds.map(m => +m[2])) + 1;
const net = `Network${nextInt}`;
if (sal.includes(`name="${net}"`)) throw new Error('network name exists');
const blocks = [];
for (let k = 1; k <= N; k++) {
  const name = `FBAndIdeSyn${k}`;
  let ins = '';
  for (let i = 1; i <= 8; i++) {
    const act = i === 1 ? `channelInterface="Activated" deactivate1="Make Contact (NO)"` : `channelInterface="Deactivated"`;
    ins += `                <functioBlockHasInPorts Id="${g()}">\n                  <inPort Id="${g()}" name="AndIn${i}" portName="AndIn${i}" portNum="${i + 1}" objectIndex="${i + 7}" varId="${i + 1}" filter="2" portDataType="1" ${act} maxDeviation="0" resetTime="0" />\n                </functioBlockHasInPorts>\n`;
  }
  const wire = k < N ? `>\n                    <targetFunctionBlockPorts>\n                      <wiredLink Id="${g()}">\n                        <inPortMoniker name="//${net}/FBAndIdeSyn${k + 1}/AndIn1" />\n                      </wiredLink>\n                    </targetFunctionBlockPorts>\n                  </outPort>` : ' />';
  blocks.push(`          <networkHasFunctionBlocks Id="${g()}">
            <fBAnd Id="${g()}" name="${name}" instanceName="${name}" orderOfExecution="${maxOrd + k}" mapState="false" mapDiag="false" functionName="safeAnd">
              <inPorts>
${ins}              </inPorts>
              <outPorts>
                <functionBlockHasOutPorts Id="${g()}">
                  <outPort Id="${g()}" name="AndOut" portName="AndOut" portNum="8" objectIndex="1" varId="20" filter="7" portDataType="1" replacementValue="0"${wire}
                </functionBlockHasOutPorts>
              </outPorts>
            </fBAnd>
          </networkHasFunctionBlocks>
`);
}
const netXml = `    <safetyApplicationHasNetworks Id="${g()}">
      <Network Id="${g()}" name="${net}" networkName="IdeVerifySynthetic" intId="${nextInt}" networkOrderId="${nextOrd}">
        <functionBlocks>
${blocks.join('')}        </functionBlocks>
      </Network>
    </safetyApplicationHasNetworks>
`;
const idx = sal.indexOf('  </networks>'); if (idx < 0) throw new Error('no </networks>');
sal = sal.slice(0, idx) + netXml + sal.slice(idx);
// target usage in_False_SI2_CH8 -> AND1.AndIn1
const vIdx = sal.indexOf('name="in_False_SI2_CH8"'); if (vIdx < 0) throw new Error('no in_False_SI2_CH8');
const usagesClose = sal.indexOf('<variableHasTargetUsages', vIdx);
const usagesTag = sal.indexOf('<usages>', usagesClose);
const vEnd = sal.indexOf('</variable>', vIdx);
if (usagesClose < 0 || usagesTag < 0 || usagesTag > vEnd) throw new Error('no target usages for in_False_SI2_CH8');
const ins = usagesTag + '<usages>'.length;
const u = `
                <variableUsagesHasUsages Id="${g()}">
                  <fbPortUsage Id="${g()}">
                    <functionBlockPort>
                      <fbPortUsageReferencesFunctionBlockPort Id="${g()}">
                        <inPortMoniker name="//${net}/FBAndIdeSyn1/AndIn1" />
                      </fbPortUsageReferencesFunctionBlockPort>
                    </functionBlockPort>
                  </fbPortUsage>
                </variableUsagesHasUsages>`;
sal = sal.slice(0, ins) + u + sal.slice(ins);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'TwinSafeGroup1.sal'), sal, 'utf8');
for (const f of ['TwinSafeGroup1.sal.diagram', 'GVL1.sgvl']) fs.copyFileSync(path.join(srcDir, f), path.join(outDir, f));
const total = (sal.match(/<networkHasFunctionBlocks /g) || []).length;
console.log(JSON.stringify({ srcDir, N, network: net, intId: nextInt, firstOrder: maxOrd + 1, totalFB: total }));
