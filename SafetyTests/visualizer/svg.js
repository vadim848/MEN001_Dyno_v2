// VIS shared SVG renderer (isomorphic: used by report.js on the server and served to the browser as /svg.js). No dependencies.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// series: {name: [[t, value], ...]} change-encoded, first point at/before w0. value boolean or string.
export function lanesSvg({ series, w0, w1, marker = null, expected = null, expectedSignal = null, width = 960, labelW = 190, rowH = 20 }) {
  const names = Object.keys(series).sort((a, b) => (a.startsWith("in:") === b.startsWith("in:") ? 0 : a.startsWith("in:") ? -1 : 1));
  const rows = []; for (const n of names) { rows.push({ n, pts: series[n] }); if (n === expectedSignal && expected) rows.push({ n: n + " (reference)", pts: expected, exp: true }); }
  const plotW = width - labelW - 10, span = Math.max(1, w1 - w0), X = t => labelW + Math.min(plotW, Math.max(0, (t - w0) / span * plotW));
  const h = rows.length * rowH + 28; const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" font-family="Consolas,monospace" font-size="11">`);
  o.push(`<rect width="${width}" height="${h}" fill="#fff"/>`);
  const step = niceStep(span); for (let t = Math.ceil(w0 / step) * step; t <= w1; t += step) { const x = X(t); o.push(`<line x1="${x}" y1="14" x2="${x}" y2="${h - 4}" stroke="#e5e5e5"/><text x="${x + 2}" y="11" fill="#888">${t}</text>`); }
  rows.forEach((r, i) => {
    const y0 = 22 + i * rowH, label = r.n.startsWith("in:") ? r.n.slice(3) + " (in)" : r.n;
    o.push(`<text x="4" y="${y0 + 12}" fill="${r.exp ? "#b36b00" : "#222"}">${esc(label.length > 30 ? label.slice(0, 29) + "…" : label)}</text>`);
    const pts = r.pts; const isStr = typeof pts[0]?.[1] === "string";
    const col = r.exp ? "#b36b00" : r.n.startsWith("in:") ? "#1a6fb3" : "#2a8a3a";
    if (isStr) {
      for (let k = 0; k < pts.length; k++) { const xa = X(pts[k][0]), xb = k + 1 < pts.length ? X(pts[k + 1][0]) : X(w1);
        o.push(`<rect x="${xa}" y="${y0 + 2}" width="${Math.max(1, xb - xa)}" height="${rowH - 6}" fill="${pts[k][1] ? "#eaf3e6" : "#f4f4f4"}" stroke="#bbb"/>`);
        if (xb - xa > 30 && pts[k][1]) o.push(`<text x="${xa + 2}" y="${y0 + 13}" fill="#333">${esc(pts[k][1])}</text>`); }
    } else {
      let d = "", prevY; const yH = y0 + 3, yL = y0 + rowH - 6;
      pts.forEach(([t, v], k) => { const x = X(t), y = v ? yH : yL; d += k === 0 ? `M${x},${y}` : `L${x},${prevY}L${x},${y}`; prevY = y; });
      d += `L${X(w1)},${prevY}`;
      o.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.5"${r.exp ? ' stroke-dasharray="4 3"' : ""}/>`);
    }
  });
  if (marker != null && marker >= w0 && marker <= w1) o.push(`<line x1="${X(marker)}" y1="14" x2="${X(marker)}" y2="${h - 4}" stroke="#d32f2f" stroke-width="1.5"/><text x="${X(marker) + 3}" y="${h - 6}" fill="#d32f2f">divergence t=${marker}</text>`);
  o.push("</svg>"); return o.join("");
}
function niceStep(span) { for (const s of [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]) if (span / s <= 12) return s; return 50000; }
export function diagramSvg(d) { return lanesSvg({ series: d.series, w0: d.w0, w1: d.w1, marker: d.t, expected: d.expected, expectedSignal: d.expectedSignal }); }
export { esc };
