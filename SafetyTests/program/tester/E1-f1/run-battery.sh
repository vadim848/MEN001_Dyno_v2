#!/usr/bin/env bash
# Tester E1-f1 behavioral battery for one source root (F1 or a mutant).
# Usage: run-battery.sh <runnersDir> <sourceRoot containing MEN001_Dyno/Safety_Dyno> <outDir>
# Runners: qualification (16), Run20 (20), lifecycle (2), phase-exit (3) — prior independent F1 suite,
# copied unchanged except import/output paths. Exit codes: 0 PASS, 1 FAIL, 3 ERROR (per runner).
set -u
R="$1"; ROOT="$2"; OUT="$3"; mkdir -p "$OUT"
export MEN001_F1_ROOT="$ROOT"
cd "$R" || exit 9
MEN001_F1_OUTPUT="$OUT/qualification.json" node qualification-red.mjs > "$OUT/qualification.log" 2>&1; echo "qualification $?" > "$OUT/exit.txt"
MEN001_F1_RUN_OUTPUT="$OUT/run20.json" node candidate-run20.mjs > "$OUT/run20.log" 2>&1; echo "run20 $?" >> "$OUT/exit.txt"
MEN001_F1_LIFECYCLE_OUTPUT="$OUT/lifecycle.json" node lifecycle-owner.mjs > "$OUT/lifecycle.log" 2>&1; echo "lifecycle $?" >> "$OUT/exit.txt"
MEN001_F1_PHASE_OUTPUT="$OUT/phase-exit.json" node phase-exit.mjs > "$OUT/phase-exit.log" 2>&1; echo "phase-exit $?" >> "$OUT/exit.txt"
