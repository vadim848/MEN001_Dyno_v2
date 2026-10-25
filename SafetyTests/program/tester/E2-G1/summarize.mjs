// Summarise a node --test TAP file: one line per test with status and the first error line (verbatim).
// Usage: node summarize.mjs <file.tap> [more.tap...]  -> prints JSON lines {file,n,status,diag,name,error}
// G1 v3 (review m-c): "ok … # TODO" -> status NV (NOT VERIFIED), "not ok … # TODO" -> FAIL-TODO, "# SKIP" -> SKIP; never PASS.
// diag=true for names starting with "DIAG " (diagnostic modes) or "E2-STAND " (stand re-measure) - outside the normative count.
// G1 v7: kf=true for names starting with "KF-" (optionally after a DIAG mode prefix): known FAIL until E3/E4/E5 (analyst E2-plan-v7-TD §3),
// counted separately - never PASS, never part of the normative count.
// G1 v9 (review G1 v8 m-24): stand=true for a FAIL whose first error line carries "ERROR stand" / "ERROR precondition" (TD-08/09/13 ERRORs) -
// reported as ERROR, never counted as a content RED.
import fs from 'node:fs';
const KF=/^(DIAG \[[^\]]*\] )*KF-/;
for(const f of process.argv.slice(2)){
 const lines=fs.readFileSync(f,'utf8').split(/\r?\n/);
 for(let i=0;i<lines.length;i++){const m=lines[i].match(/^(not ok|ok) (\d+) - (.*)$/);if(!m)continue;
  let name=m[3],dir=null;const d=name.match(/^(.*?) # (TODO|SKIP)\b.*$/);if(d){name=d[1];dir=d[2];}
  let error='';
  if(m[1]==='not ok')for(let j=i+1;j<Math.min(lines.length,i+40);j++){
   const e=lines[j].match(/^\s+error: (.*)$/);if(e){error=e[1]==="|-"?lines[j+1].trim():e[1].replace(/^'|'$/g,'');
    const plus=lines.slice(j+2,j+10).find(l=>/^\s+\+\s+'/.test(l));if(plus)error+=' :: '+plus.trim();break;}}
  const status=dir==='SKIP'?'SKIP':dir==='TODO'?(m[1]==='ok'?'NV':'FAIL-TODO'):(m[1]==='ok'?'PASS':'FAIL');
  // G1 v9 (review G1 v8 m-24): stand=true for a FAIL whose first error line carries "ERROR stand" / "ERROR precondition" (TD-08/09/13) -
  // reported as ERROR, never counted as a content RED.
  console.log(JSON.stringify({file:f.split(/[\/]/).pop(),n:+m[2],status,stand:status==='FAIL'&&/ERROR (stand|precondition)/.test(error),diag:/^(DIAG |E2-STAND )/.test(name)&&!KF.test(name),kf:KF.test(name),name,error}));}
}
