// Samples every completed software scan, including transient one-scan requests.
export function anySignalDuring(runtime, durationMs, signal, inputs) {
  if (inputs) runtime.setInputs(inputs);
  let seen = false;
  for (let elapsed = 0; elapsed < durationMs; elapsed += runtime.scanMs) {
    runtime.scan(Math.min(runtime.scanMs, durationMs - elapsed));
    seen = runtime.get(signal) || seen;
  }
  return seen;
}
