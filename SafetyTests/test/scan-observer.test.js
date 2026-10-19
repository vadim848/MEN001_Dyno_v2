import test from "node:test";
import assert from "node:assert/strict";
import { anySignalDuring } from "../src/scan-observer.js";

test("Scan observer retains an interior one-millisecond pulse after output returns FALSE", () => {
  for (const duration of [999,1100]) {
    let elapsed=0;
    const emitter={ scanMs:1,scan(dt){ elapsed+=dt; },get(){ return elapsed===500; } };
    assert.equal(anySignalDuring(emitter,duration,"request"),true);
    assert.equal(emitter.get(),false); // Endpoint-only observation would miss it.
    assert.equal(elapsed,duration);
  }
});

test("Scan observer advances every scan without short-circuiting after detection", () => {
  let scans=0;
  const emitter={ scanMs:1,scan(){ scans++; },get(){ return scans===1; } };
  assert.equal(anySignalDuring(emitter,1100,"request"),true);
  assert.equal(scans,1100);
  assert.equal(anySignalDuring({ scanMs:1,scan(){},get(){return false;} },999,"request"),false);
});
