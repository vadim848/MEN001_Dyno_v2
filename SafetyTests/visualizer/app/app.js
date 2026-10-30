// VIS trainer UI (English). Model only. Talks to the local server API.
import { lanesSvg, diagramSvg, esc } from "/svg.js";

const $ = id => document.getElementById(id);
const api = async (url, method = "GET", body) => {
  const r = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j;
};
const S = { target: "canonical", targetInfo: null, mapRows: [], table: {}, loadedNames: [], loadedInputs: [], job: null };
const stCls = s => s === "PASS" ? "pass" : s === "FAIL" || s === "ERROR" ? "fail" : "other";
const stLabel = s => s === "TODO" ? "TODO (NOT VERIFIED)" : s;
const badge = s => `<span class="s ${stCls(s)}">${esc(stLabel(s))}</span>`;

// ---------- tabs ----------
for (const b of document.querySelectorAll("#tabs button")) b.onclick = () => {
  document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== b.dataset.tab);
  if (b.dataset.tab === "map") loadMapping();
};

// ---------- program ----------
async function useCanonical() {
  const r = await api("/api/target/canonical", "POST"); S.target = r.targetId; S.targetInfo = r; S.table = {}; showTarget("Canonical program");
}
function showTarget(title) {
  const r = S.targetInfo;
  $("progInfo").innerHTML = `<b>${esc(title)}</b><br>SAL SHA256: <code>${esc(r.salSha256)}</code><br>SGVL SHA256: <code>${esc(r.sgvlSha256)}</code><br>Blocks: ${r.blocks ?? "—"}` +
    (r.hasDiagram === false ? "<br><span class=dim>.diagram not loaded: the native CRC check will give ERROR (shown as is)</span>" : "") +
    (r.parseError ? `<br><span class="err">Parse error: ${esc(r.parseError)}</span> (the exam still runs: the structure part shows the cause, catalog scenarios are FAIL)` : "");
}
document.querySelectorAll("input[name=src]").forEach(r => r.onchange = () => { if (r.checked && r.value === "canonical") useCanonical().catch(e => $("progInfo").textContent = e.message); });
const b64 = f => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(",")[1] ?? ""); fr.onerror = rej; fr.readAsDataURL(f); });
$("upload").onclick = async () => {
  try {
    const list = [...$("files").files, ...$("aliasdir").files]; if (!list.length) throw new Error("select files");
    const files = []; for (const f of list) files.push({ name: f.webkitRelativePath || f.name, base64: await b64(f) });
    const r = await api("/api/target", "POST", { files }); S.target = r.targetId; S.targetInfo = r; S.table = {};
    document.querySelector("input[name=src][value=upload]").checked = true; showTarget("Uploaded program");
  } catch (e) { $("progInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
};

// ---------- mapping ----------
async function loadMapping() {
  const r = await api("/api/mapping?target=" + encodeURIComponent(S.target));
  $("mapInfo").textContent = r.parseError ? "Program not parsed: " + r.parseError : "";
  S.mapRows = r.rows; S.loadedNames = r.loadedNames; S.loadedInputs = r.loadedInputs;
  const prev = S.table; S.table = {}; for (const row of r.rows) { const v = prev[row.our] ?? row.loaded; if (v && r.loadedNames.includes(v)) S.table[row.our] = v; }
  renderMap();
}
function renderMap() {
  const tb = $("mapTable").tBodies[0]; tb.innerHTML = "";
  for (const row of S.mapRows) {
    const tr = document.createElement("tr"); const cur = S.table[row.our] ?? "";
    const opts = (row.kind === "input" ? S.loadedInputs : S.loadedNames);
    const list = [...new Set([...(cur ? [cur] : []), ...opts])];
    tr.innerHTML = `<td>${esc(row.our)}</td><td>${esc(row.kind)}</td><td><select><option value="">- not mapped -</option>${list.map(n => `<option${n === cur ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></td><td class="dim">${row.auto && cur === row.loaded ? "auto" : ""}</td>`;
    tr.querySelector("select").onchange = async ev => {
      const prevV = S.table[row.our]; if (ev.target.value) S.table[row.our] = ev.target.value; else delete S.table[row.our];
      try { await validateMap(); } catch (e) { if (prevV) S.table[row.our] = prevV; else delete S.table[row.our]; $("mapInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`; renderMap(); }
    };
    tb.appendChild(tr);
  }
  validateMap().catch(e => $("mapInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`);
}
async function validateMap() {
  if (!S.mapRows.length) return;
  const r = await api("/api/mapping", "PUT", { target: S.target, table: S.table });
  $("mapInfo").innerHTML = r.unmapped.length ? `Unmapped: <b>${r.unmapped.length}</b> (${esc(r.unmapped.join(", "))}) - scenarios touching them will be NOT CHECKED.` : "All names are mapped.";
}
$("mapReload").onclick = () => { S.table = {}; loadMapping(); };
$("mapSave").onclick = () => {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ format: "vis-mapping-1", table: S.table }, null, 1)], { type: "application/json" }));
  a.download = "mapping.json"; a.click();
};
$("mapLoad").onchange = async ev => {
  try { const j = JSON.parse(await ev.target.files[0].text()); if (j.format !== "vis-mapping-1") throw new Error("invalid table format");
    S.table = j.table; await loadMapping(); } catch (e) { $("mapInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
  ev.target.value = "";
};

// ---------- exam ----------
$("examStart").onclick = async () => {
  try {
    if (!S.mapRows.length) await loadMapping();
    const { jobId } = await api("/api/exam", "POST", { target: S.target, table: S.mapRows.length ? S.table : undefined });
    S.job = jobId; $("examReport").hidden = true; $("examTable").hidden = true; $("examStruct").innerHTML = ""; $("examTotals").textContent = "";
    $("examStart").disabled = true; pollExam();
  } catch (e) { $("examProgress").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
};
async function pollExam() {
  const j = await api("/api/exam/" + S.job);
  const pr = j.progress; $("examProgress").textContent = j.state === "running" ? `Part ${pr.part}: ${pr.done}/${pr.total}` + (pr.part === 1 ? " (structure, native CRC may take up to a minute)" : "") : j.state === "done" ? "Done" : "Error";
  if (j.structure) renderStruct(j.structure);
  if (j.state === "running") return setTimeout(pollExam, 700);
  $("examStart").disabled = false;
  if (j.state === "error") { $("examProgress").innerHTML = `<span class="err">Exam error: ${esc(j.error)}</span>`; return; }
  renderCatalog(j.result); $("examReport").hidden = false; $("examReport").href = `/api/exam/${S.job}/report.html`; $("examReport").setAttribute("download", "sal-exam-report.html");
}
function renderStruct(s) {
  $("examStruct").innerHTML = `<p>Result: ${badge(s.status)}</p><table><tr><th>Check</th><th>Status</th><th>Details</th></tr>` +
    s.checks.map(c => `<tr><td>${esc(c.name)}</td><td>${badge(c.status)}</td><td><code>${c.status === "PASS" ? "" : esc(typeof c.detail === "string" ? c.detail : JSON.stringify(c.detail))}</code></td></tr>`).join("") + "</table>";
}
function renderCatalog(r) {
  const t = r.catalog.totals;
  $("examTotals").innerHTML = `Catalog version: <code>${esc(r.catalogVersion)}</code>. Total ${t.total}: PASS ${t.pass}, FAIL ${t.fail}, TODO ${t.todo}, NOT CHECKED ${t.notChecked}.` +
    (r.catalog.loadError ? `<br><span class="err">Program not loaded: ${esc(r.catalog.loadError)}</span>` : "");
  const tb = $("examTable").tBodies[0]; tb.innerHTML = ""; $("examTable").hidden = false;
  for (const s of r.catalog.scenarios) {
    const tr = document.createElement("tr"); if (s.status === "FAIL") tr.className = "frow";
    tr.innerHTML = `<td>${esc(s.id)}</td><td>${esc(s.stage)}</td><td>${esc(s.title)}</td><td>${badge(s.status)}</td>`; tb.appendChild(tr);
    if (s.status === "PASS") continue;
    const dr = document.createElement("tr"); dr.hidden = s.status === "FAIL" ? false : true; const td = document.createElement("td"); td.colSpan = 4; td.className = "detail"; dr.appendChild(td); tb.appendChild(dr);
    const fill = async () => {
      let h = "";
      if (s.fails.length) h += s.fails.slice(0, 20).map(m => `<pre>• ${esc(m)}</pre>`).join("");
      if (s.nv.length) h += `<div class="dim">NOT VERIFIED: ${esc(s.nv.join(" | "))}</div>`;
      if (s.touchedUnmapped?.length) h += `<div>Unmapped signals touched: <code>${esc(s.touchedUnmapped.join(", "))}</code></div>`;
      const d = s.divergence;
      if (d?.available) h += `<p><b>Divergence point</b> (diagnostic: first difference from the canonical program trace under the same stimulus; the oracle is the check messages above): t=${d.t} ms, signal <code>${esc(d.signal)}</code>, expected <code>${esc(d.expected)}</code>, actual <code>${esc(d.actual)}</code>.</p>`;
      else if (d) h += `<p class="dim">Divergence point unavailable: ${esc(d.reason)}</p>`;
      td.innerHTML = h;
      if (s.hasDiagram) { try { const full = await api(`/api/exam/${S.job}/scenario/${encodeURIComponent(s.id)}`); const div = document.createElement("div"); div.style.overflowX = "auto"; div.innerHTML = diagramSvg(full.diagram); td.appendChild(div); } catch (e) { td.append(" diagram: " + e.message); } }
    };
    fill(); tr.onclick = () => { dr.hidden = !dr.hidden; };
  }
}

// ---------- manual ----------
const M = { on: false, series: {}, base: {}, last: -1, t: 0, timer: null, rendered: "" };
const ctl = ["mRun", "mPause", "mStep", "mAdv"];
const mpost = (path, body) => api("/api/manual/" + path, "POST", body).catch(e => { $("mInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`; throw e; });
$("mStart").onclick = async () => {
  try {
    if (!S.mapRows.length) await loadMapping();
    const s = await api("/api/manual/start", "POST", { target: S.target, table: S.mapRows.length ? S.table : undefined, plant: $("mPlant").checked });
    M.on = true; M.series = {}; M.last = -1; M.base = {}; ctl.forEach(i => $(i).disabled = false); ingest(s); $("mInfo").textContent = ""; clearTimeout(M.timer); mpoll();
  } catch (e) { $("mInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
};
$("mRun").onclick = () => mpost("cmd", { cmd: "run", speed: Number($("mSpeed").value) });
$("mPause").onclick = () => mpost("cmd", { cmd: "pause" });
$("mStep").onclick = () => mpost("cmd", { cmd: "step" });
$("mAdv").onclick = () => mpost("cmd", { cmd: "advance", ms: Number($("mMs").value) });
$("mSpeed").onchange = () => mpost("cmd", { speed: Number($("mSpeed").value) });
$("mPlant").onchange = () => { if (M.on) mpost("cmd", { cmd: "plant", on: $("mPlant").checked }); };
$("mWin").onchange = () => renderTimeline();
function ingest(s) {
  if (s.base) M.base = s.base;
  for (const c of s.changes) (M.series[c.n] ??= []).push([c.t, c.v]);
  M.last = s.t; M.t = s.t;
  const lim = s.t - s.ringMs; for (const [n, a] of Object.entries(M.series)) { while (a.length > 1 && a[1][0] < lim) { M.base[n] = a[0][1]; a.shift(); } }
  renderManual(s); renderTimeline();
}
async function mpoll() {
  if (!M.on) return;
  try { const s = await api("/api/manual/state?since=" + M.last); ingest(s); } catch (e) { $("mInfo").innerHTML = `<span class="err">${esc(e.message)}</span>`; }
  M.timer = setTimeout(mpoll, 100);
}
function renderManual(s) {
  $("mInfo").innerHTML = `t = <b>${s.t}</b> ms (scan 1 ms) · ${s.running ? "running" : "paused"} · speed x${s.speed}${s.lag ? ' · <span class="err">model cannot keep up with real time</span>' : ""}` + (s.error ? ` · <span class="err">${esc(s.error)}</span>` : "");
  const box = $("mInputs");
  if (!box.dataset.init) { box.dataset.init = "1"; box.innerHTML = ""; for (const i of s.inputs) {
    const d = document.createElement("div"); d.className = "in"; d.id = "in_" + i.name;
    d.innerHTML = `<input type="checkbox"${i.unmapped || i.constant ? " disabled" : ""}><span>${esc(i.name)}</span><span class="dim"></span>`;
    d.querySelector("input").onchange = ev => mpost("inputs", { [i.name]: ev.target.checked }).catch(() => {});
    box.appendChild(d); } }
  for (const i of s.inputs) { const d = $("in_" + i.name); if (!d) continue; const cb = d.querySelector("input");
    d.classList.toggle("off", i.unmapped); if (document.activeElement !== cb) cb.checked = i.value;
    d.lastChild.textContent = i.unmapped ? "not mapped" : i.constant ? "stand constant" : i.held !== null ? `held ${i.held}` : (i.name in s.pending ? "pending scan" : ""); }
  renderPairs(s);
  const led = (n, v) => `<div class="in"><span class="led${v ? " on" : ""}"></span>${esc(n)}</div>`;
  $("mOut").innerHTML = `<div>State: <b>${esc(s.status.join("+"))}</b> · stages: <b>${esc(s.stages.join("+") || "—")}</b></div>` +
    led("SafetyFault", s.fault) + led("Fault (PLC)", s.plcFault) + led("Cover locked", s.cover) + led("STO active", s.sto) +
    Object.entries(s.outputs).map(([k, v]) => led(k, v)).join("");
  renderLeds(s.led);
  $("mTimers").innerHTML = s.timers.length ? s.timers.map(t => `<div>${esc(t.path)}: ${t.elapsed}/${t.preset} ms</div>`).join("") : "<span class=dim>none active</span>";
}
// VIS-LED: dashboard LEDs (display only; replica of act_LED_Control)
const LEDMODE = { off: "off", on: "on", "blink-slow": "blink slow (1.5 s)", "blink-fast": "blink fast (0.5 s)", fault: "fault alternate (200 ms)" };
function renderLeds(l) {
  const box = $("mLeds"); if (!box || !l) return;
  const cell = (n, c) => `<div class="in"><span class="led${c.on ? " on" : ""}" style="${c.on ? "background:" + n.toLowerCase() : ""}"></span>${n}: <b>${c.on ? "ON" : "OFF"}</b> · ${esc(LEDMODE[c.mode])}</div>`;
  box.innerHTML = cell("Red", l.leds.red) + cell("Green", l.leds.green) + cell("Blue", l.leds.blue) +
    `<div class="dim">${esc(l.caption)}</div><div class="dim">${esc(l.solenoid)}</div>` +
    (l.notMapped.length ? `<div class="dim">LED inputs not mapped: ${esc(l.notMapped.join(", "))}</div>` : "");
}
function renderTimeline() {
  if (!M.on) return; const w1 = M.t, w0 = Math.max(0, w1 - Number($("mWin").value)); const ser = {};
  for (const [n, a] of Object.entries(M.series)) {
    let start = M.base[n]; const inside = [];
    for (const [t, v] of a) { if (t <= w0) start = v; else inside.push([t, v]); }
    if (start === undefined) start = typeof a[0]?.[1] === "string" ? "" : false;
    const pts = [[w0, start], ...inside]; if (inside.length || n === "st" || n === "stg" || start === true) ser[n] = pts;
  }
  const html = lanesSvg({ series: ser, w0, w1 }); if (html !== M.rendered) { M.rendered = html; $("mTimeline").innerHTML = html; }
}

useCanonical().catch(e => $("progInfo").textContent = "Error: " + e.message);

// ---------- paired buttons (both lines changed in ONE scan via a single inputs call) ----------
const ICON = {
  estop: '<svg viewBox="0 0 48 48"><rect x="6" y="38" width="36" height="6" rx="2" fill="#555"/><rect x="14" y="30" width="20" height="8" fill="#e0b800"/><path d="M8 30a16 16 0 0 1 32 0z" fill="#d32f2f" stroke="#7f0000" stroke-width="2"/><ellipse cx="18" cy="21" rx="4" ry="2" fill="#fff" opacity=".5"/></svg>',
  cover: '<svg viewBox="0 0 48 48"><rect x="6" y="20" width="36" height="22" rx="2" fill="#9e9e9e" stroke="#444" stroke-width="2"/><path d="M6 20L14 8h28l-4 12z" fill="#cfd8dc" stroke="#444" stroke-width="2"/><circle cx="24" cy="31" r="3" fill="#444"/></svg>',
  sto: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#fff" stroke="#444" stroke-width="3"/><path d="M14 24l7 7 13-14" fill="none" stroke="#2e7d32" stroke-width="5"/></svg>',
  reset: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#43a047" stroke="#1b5e20" stroke-width="3"/><path d="M33 17a11 11 0 1 0 2 10" fill="none" stroke="#fff" stroke-width="4"/><path d="M34 8v11H23z" fill="#fff"/></svg>',
  unlock: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#1e88e5" stroke="#0d47a1" stroke-width="3"/><rect x="15" y="23" width="18" height="13" rx="2" fill="#fff"/><path d="M18 23v-5a6 6 0 0 1 12 0" fill="none" stroke="#fff" stroke-width="3.5"/></svg>',
  both: '<svg viewBox="0 0 48 48"><circle cx="16" cy="24" r="11" fill="#43a047" stroke="#1b5e20" stroke-width="2"/><circle cx="32" cy="24" r="11" fill="#1e88e5" stroke="#0d47a1" stroke-width="2"/></svg>'
};
// activeVal = line value when the button is "active". latch: click toggles; momentary: active only while pointer is held.
const PAIRS = [
  { id: "es", title: "Emergency stop", icon: "estop", color: "red", sig: ["in_ES_NC_1", "in_ES_NC_2"], activeVal: false, on: "PRESSED", off: "released", latch: true },
  { id: "cv", title: "Cover", icon: "cover", color: "gray", sig: ["in_InterLock_NC_1", "in_InterLock_NC_2"], activeVal: false, on: "open", off: "closed", latch: true },
  { id: "sto", title: "STO FBK", icon: "sto", color: "gray", sig: ["in_STO_DR1_FBK", "in_STO_DR2_FBK"], activeVal: true, on: "confirmed", off: "not confirmed", latch: true },
  { id: "rst", title: "Reset", icon: "reset", color: "green", sig: ["in_Reset_PB"], activeVal: true, on: "pressed", off: "", latch: false },
  { id: "unl", title: "Unlock", icon: "unlock", color: "blue", sig: ["in_Relase_Door_PB"], activeVal: true, on: "pressed", off: "", latch: false },
  { id: "both", title: "Both", icon: "both", color: "gray", sig: ["in_Reset_PB", "in_Relase_Door_PB"], activeVal: true, on: "pressed", off: "", latch: false }
];
let pairInit = false, lastS = null;
const pressed = {}, relAll = [];
const releaseAll = () => relAll.forEach(f => f());
window.addEventListener("blur", releaseAll);
document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });
function effective(s, n) { const i = s.inputs.find(x => x.name === n); if (!i) return undefined; if (n in s.pending) return s.pending[n]; return i.fbk && i.held !== null ? i.held : i.value; }
function renderPairs(s) {
  lastS = s; const box = $("mPairs"), by = Object.fromEntries(s.inputs.map(i => [i.name, i]));
  if (!pairInit) { pairInit = true; box.innerHTML = "";
    for (const p of PAIRS) {
      const b = document.createElement("button"); b.className = "pb " + p.color; b.id = "pb_" + p.id; b.type = "button";
      b.innerHTML = ICON[p.icon] + `<b>${p.title}</b><small></small>` + (FILTERED.includes(p.id) ? '<div class="fbar"><i></i></div><div class="fchip"></div>' : "");
      let chain = Promise.resolve();
      const send = v => { chain = chain.then(() => mpost("inputs", Object.fromEntries(p.sig.map(n => [n, v]))).catch(() => {})); };
      if (p.latch) b.onclick = () => { const act = p.sig.every(n => effective(lastS, n) === p.activeVal); send(act ? !p.activeVal : p.activeVal); };
      else {
        const rel = () => { if (pressed[p.id]) { pressed[p.id] = false; send(!p.activeVal); } }; relAll.push(rel);
        b.onpointerdown = ev => { ev.preventDefault(); if (b.disabled || pressed[p.id]) return; pressed[p.id] = true; try { b.setPointerCapture(ev.pointerId); } catch {} send(p.activeVal); };
        b.onpointerup = rel; b.onpointerleave = rel; b.onpointercancel = rel; b.oncontextmenu = ev => ev.preventDefault();
      }
      box.appendChild(b);
    } }
  for (const p of PAIRS) {
    const b = $("pb_" + p.id), small = b.querySelector("small"), missing = p.sig.filter(n => !by[n] || by[n].unmapped || by[n].constant);
    b.classList.toggle("dis", missing.length > 0); b.disabled = missing.length > 0;
    b.title = missing.length ? "unavailable: no mapped signal " + missing.join(", ") : p.sig.join(" + ");
    if (missing.length) { small.textContent = "unavailable"; b.classList.remove("act", "split"); continue; }
    const vals = p.sig.map(n => effective(s, n)), split = vals.some(v => v !== vals[0]), act = !split && vals[0] === p.activeVal;
    const pend = p.sig.some(n => n in s.pending || (by[n].fbk && by[n].held !== null && by[n].held !== by[n].value));
    b.classList.toggle("split", split); b.classList.toggle("act", act);
    small.textContent = split ? "split" : (act ? p.on : p.off) + (pend ? " …" : "");
    if (FILTERED.includes(p.id)) applyFilter(b, p, s.filter);
  }
  renderFilter(s.filter);
}
// VIS-3 (Q3: buttons never blocked): filter readiness (model countdown of p.9 + SAL flag RELEASE/TonOut). Display only; raw input checkboxes stay usable.
const FILTERED = ["rst", "unl", "both"];
function applyFilter(b, p, f) {
  const bar = b.querySelector(".fbar"), chip = b.querySelector(".fchip"), i = bar.firstChild;
  i.style.width = (f.available ? f.progress * 100 : 0) + "%"; bar.classList.toggle("ok", !!f.modelReady);
  b.classList.toggle("cnt", f.available && !f.modelReady && !f.pressed); // VIS-3-Q3: visual only, the button is never blocked
  if (!f.available) { chip.className = "fchip nc"; chip.textContent = "filter NOT CHECKED"; return; }
  const sal = !f.sal.found ? "SAL flag NOT CHECKED" : !f.compared ? "SAL flag " + (f.sal.value ? "ready" : "not ready") + " (not compared)" : "SAL flag " + (f.sal.value ? "ready" : "not ready");
  chip.className = "fchip" + (f.diverged ? " dv" : !f.sal.found || !f.compared ? " nc" : "");
  chip.textContent = (f.modelReady ? "ready" : `${Math.max(0, f.presetMs - f.elapsed)} ms left of ${f.presetMs}`) + " | " + sal + (f.diverged ? " | DIVERGED" : "");
}
function renderFilter(f) {
  const box = $("mFilter");
  if (!f.available) { box.innerHTML = `Button filter: <span class="dim">NOT CHECKED - ${esc(f.reason)}</span>`; return; }
  const sal = f.sal.found ? `SAL flag ${esc(f.sal.path)}/TonOut = <b>${f.sal.value}</b> (preset ${f.sal.presetMs} ms, elapsed ${f.sal.elapsed} ms)` : `<span class="dim">${esc(f.sal.reason)}</span>`;
  box.innerHTML = `Button filter (p.9, model time): ${f.modelReady ? "<b>ready</b>" : `counting ${f.elapsed}/${f.presetMs} ms`}${f.pressed ? " (button held)" : ""} · ${sal} · ` +
    (f.compared ? "compared" : `<span class="dim">${esc(f.notComparedReason)}</span>`) +
    (f.diverged ? ` · <span class="dv">DIVERGED (model vs SAL flag)</span>` : "") + (f.lastDivergedT !== null ? ` · last divergence at t=${f.lastDivergedT}` : "");
}
