#!/bin/bash
SP="$1"; shift
for id in "$@"; do
  R="$SP/roots/$id/SafetyTests"
  ( cd "$R" && start=$(date +%s); node scripts/software-check.js > "$SP/reg-$id.out" 2>&1; echo "exit=$? secs=$(( $(date +%s)-start ))" >> "$SP/reg-$id.out" )
done
