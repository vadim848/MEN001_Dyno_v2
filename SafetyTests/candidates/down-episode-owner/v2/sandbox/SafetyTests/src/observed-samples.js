// Fixed-grid observed-sample chronology. No partial final scan or silent ceil.
export class ObservedSamples {
  constructor(runtime, stepMs) {
    if(!Number.isInteger(stepMs)||stepMs<=0)throw Error("Positive integer fixed step required");
    this.runtime=runtime;this.stepMs=stepMs;this.timeMs=-stepMs;
  }
  sample(inputs) {
    if(inputs)this.runtime.setInputs(inputs);
    this.runtime.scan(this.stepMs);this.timeMs+=this.stepMs;return this.timeMs;
  }
  advance(durationMs) {
    if(!Number.isInteger(durationMs)||durationMs<0||durationMs%this.stepMs)throw Error("Duration is not representable on this fixed sample grid");
    for(let elapsed=0;elapsed<durationMs;elapsed+=this.stepMs)this.sample();
    return this.timeMs;
  }
  observeAfter(firstTime,deltaMs,inputs) {
    if(deltaMs<this.stepMs||deltaMs%this.stepMs)throw Error("Event delta not representable on fixed grid");
    const remaining=firstTime+deltaMs-this.timeMs;
    if(remaining<this.stepMs||remaining%this.stepMs)throw Error("Event timestamp already passed or off grid");
    this.advance(remaining-this.stepMs);const secondTime=this.sample(inputs);
    if(secondTime-firstTime!==deltaMs)throw Error("Dispatcher changed actual observed event delta");
    return secondTime;
  }
}
