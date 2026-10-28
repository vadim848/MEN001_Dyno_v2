// VIS item 7 (+ item 8 of the plan): page served by the server is English and states model != Verify/TwinCAT/hardware, FBK simplified.
// Oracle: VIS-3-Q2 (English UI; replaces VIS-Q6 Russian), VIS_PLAN §1 banner, VIS-Q2 ("Не заменяет Verify"), VIS_PLAN §0 (localhost only).
import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "./_lib.mjs";

const visible = h => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");

test("VIS-7 static page text and binding", async () => {
  const srv = await startServer();
  try {
    assert.equal(srv.server.address().address, "127.0.0.1", "binds 127.0.0.1");
    const r = await srv.call("GET", "/");
    assert.equal(r.status, 200); assert.match(r.headers.get("content-type"), /text\/html/);
    const h = r.text;
    assert.match(h, /<html[^>]*lang="en"/);
    const txt = visible(h);
    assert.match(txt, /not Verify\/TwinCAT/, "states: not Verify/TwinCAT");
    assert.match(txt, /not hardware/, "states: not hardware");
    assert.match(txt, /(FBK)[^.]*simplif|simplif[^.]*FBK/i, "states: FBK model simplified");
    for (const tab of ["Program", "Name mapping", "Exam", "Manual mode"]) assert.ok(txt.includes(tab), "tab " + tab);
    const letters = txt.match(/\p{L}/gu) ?? [], cyr = txt.match(/\p{Script=Cyrillic}/gu) ?? [];
    assert.ok(letters.length > 200, "page has text");
    assert.equal(cyr.length, 0, `English UI (VIS-3-Q2): no Cyrillic in visible page text: ${cyr.join("")}`);
    assert.doesNotMatch(h, /\b(src|href)\s*=\s*["'](https?:)?\/\//i, "no external resources on the page");
    const info = await srv.call("GET", "/api/info");
    assert.equal(info.status, 200); assert.ok(info.json.scenarioCount >= 80); assert.ok(info.json.catalogVersion);
    const trav = await fetch(srv.base + "/..%2f..%2fpackage.json"); assert.notEqual(trav.status, 200, "no path traversal out of app/");
  } finally { srv.stop(); }
});
