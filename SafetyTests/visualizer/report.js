// VIS standalone HTML report (VIS-Q4): inline CSS + inline SVG, no external references, no scripts.
import { diagramSvg, esc } from "./svg.js";

export const BANNER = "This is a program model, not Verify/TwinCAT and not hardware. The feedback (FBK) model is simplified.";
const st = s => `<span class="s ${s === "PASS" ? "pass" : s === "FAIL" || s === "ERROR" ? "fail" : "other"}">${esc(s)}</span>`;
const det = d => d == null ? "" : esc(typeof d === "string" ? d : JSON.stringify(d));

export function reportHtml(r, { canonicalSha256 } = {}) {
  const t = r.target, c = r.catalog, tt = c.totals, o = [];
  const same = canonicalSha256 ? (canonicalSha256 === t.salSha256 ? "SAL SHA256 matches the canonical program." : "SAL SHA256 differs from the canonical program (canonical: " + canonicalSha256 + ").") : "";
  o.push(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SAL exam report</title><style>
body{font:14px Segoe UI,Arial,sans-serif;margin:20px;color:#222}h1{font-size:20px}h2{font-size:16px;margin-top:24px;border-bottom:1px solid #ccc}
.banner{background:#fff3cd;border:1px solid #e0c36a;padding:8px 12px;margin:8px 0;font-weight:600}table{border-collapse:collapse;margin:6px 0}td,th{border:1px solid #ccc;padding:3px 8px;text-align:left;vertical-align:top}
.s{font-weight:700;padding:1px 6px;border-radius:3px}.pass{background:#d9f2d9}.fail{background:#f8d0d0}.other{background:#fdecc0}code{font-family:Consolas,monospace;font-size:12px}
.fl{margin:10px 0;padding:8px;border:1px solid #e0a0a0}.dim{color:#666}pre{margin:2px 0;white-space:pre-wrap}</style></head><body>`);
  o.push(`<h1>SAL exam report (trainer)</h1><div class="banner">${esc(BANNER)}</div>`);
  o.push(`<table><tr><th>Date</th><td>${esc(r.date)}</td></tr><tr><th>Catalog version</th><td><code>${esc(r.catalogVersion)}</code></td></tr>
<tr><th>SAL</th><td>${esc(t.salName)}<br><code>SHA256 ${esc(t.salSha256)}</code></td></tr><tr><th>SGVL</th><td>${esc(t.sgvlName)}<br><code>SHA256 ${esc(t.sgvlSha256)}</code></td></tr>
<tr><th>Target</th><td>${t.canonical ? "canonical program" : "uploaded program"}. ${esc(same)}</td></tr></table>`);
  o.push(`<h2>Part 1. Structure check — ${st(r.structure.status)}</h2><table><tr><th>Check</th><th>Status</th><th>Details</th></tr>`);
  for (const k of r.structure.checks) o.push(`<tr><td>${esc(k.name)}</td><td>${st(k.status)}</td><td><code>${det(k.status === "PASS" ? "" : k.detail)}</code></td></tr>`);
  o.push("</table>");
  o.push(`<h2>Part 2. Catalog scenarios (+-50 ms)</h2><p>Total: ${tt.total}; PASS ${tt.pass}; FAIL ${tt.fail}; TODO (has NOT VERIFIED) ${tt.todo}; NOT CHECKED ${tt.notChecked}.${c.loadError ? " Program not loaded: " + esc(c.loadError) : ""}</p>`);
  o.push(`<h3>Summary</h3><table><tr><th>ID</th><th>Stage</th><th>Title</th><th>Status</th></tr>`);
  for (const s of c.scenarios) o.push(`<tr><td>${esc(s.id)}</td><td>${esc(s.stage)}</td><td>${esc(s.title)}</td><td>${st(s.status)}</td></tr>`);
  o.push("</table>");
  const fails = c.scenarios.filter(s => s.status === "FAIL");
  o.push(`<h3>FAIL (${fails.length})</h3>`);
  if (!fails.length) o.push("<p class=dim>none</p>");
  for (const s of fails) {
    o.push(`<div class="fl"><b>${esc(s.id)}</b> [${esc(s.stage)}] ${esc(s.title)} ${st("FAIL")}<br>`);
    for (const m of s.fails.slice(0, 20)) o.push(`<pre>• ${esc(m)}</pre>`);
    const d = s.divergence;
    if (d?.available) o.push(`<p><b>Divergence point</b> (diagnostic, first difference from the canonical trace; the oracle is the check messages): t=${d.t} ms, lane ${d.lane}, signal <code>${esc(d.signal)}</code>, expected <code>${esc(d.expected)}</code>, actual <code>${esc(d.actual)}</code>.</p>`);
    else if (d) o.push(`<p class=dim>Divergence point unavailable: ${esc(d.reason)}</p>`);
    if (s.diagram) o.push(diagramSvg(s.diagram));
    o.push("</div>");
  }
  const nc = c.scenarios.filter(s => s.status === "NOT CHECKED");
  o.push(`<h3>NOT CHECKED (${nc.length})</h3>`);
  if (!nc.length) o.push("<p class=dim>none</p>"); else {
    o.push("<table><tr><th>ID</th><th>Unmapped signals touched by the scenario</th><th>Check messages (informational)</th></tr>");
    for (const s of nc) o.push(`<tr><td>${esc(s.id)}</td><td><code>${esc(s.touchedUnmapped.join(", "))}</code></td><td>${s.fails.length ? esc(s.fails.slice(0, 3).join(" | ")) : ""}</td></tr>`);
    o.push("</table>");
  }
  const todo = c.scenarios.filter(s => s.status === "TODO");
  if (todo.length) { o.push(`<h3>TODO / NOT VERIFIED (${todo.length})</h3><table>`); for (const s of todo) o.push(`<tr><td>${esc(s.id)}</td><td>${esc(s.nv.join(" | "))}</td></tr>`); o.push("</table>"); }
  o.push(`<h2>Name mapping table</h2><table><tr><th>Our name</th><th>Kind</th><th>Signal of the loaded program</th></tr>`);
  for (const n of r.mapping.ours) o.push(`<tr><td>${esc(n.name)}</td><td>${esc(n.kind)}</td><td>${r.mapping.table[n.name] === undefined ? '<span class="s other">not mapped</span>' : esc(r.mapping.table[n.name]) + (r.mapping.table[n.name] === n.name ? "" : " (renamed)")}</td></tr>`);
  o.push(`</table><p>Unmapped: ${r.mapping.unmapped.length}${r.mapping.unmapped.length ? " — " + esc(r.mapping.unmapped.join(", ")) : ""}. Polarity inversion is not supported in the table.</p>`);
  o.push(`<p class="dim">The exam does not replace Verify in TwinCAT and is not a hardware check.</p></body></html>`);
  return o.join("\n");
}
