#!/usr/bin/env node
// PreToolUse guard: one writer per file, by role (WORKFLOW.md, "Команда Claude Code").
// Fail-closed: an unknown role or an unlisted repo path is denied. Exit 2 blocks the call.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REFERENCE = "c:/users/user/source/repos/men001_dyno/";

const COMMON_DENY = ["MEN001_Dyno/*.tsproj", "MEN001_Dyno/**/*.xti", "**/_Config/**"];

// Temporary, exact-path grants approved by Vadim (Q-60, 2026-10-21) for the E2a
// Healthy→Faulty rename; remove after E2a is transferred to canonical.
const TEMPORARY_GRANTS = {
  "v2-editor": ["MEN001_Dyno/MEN001_Dyno.tsproj", "MEN001_Dyno/PLC_Dyno/DUTs/ST_TwinSAFE_IN.TcDUT",
    "MEN001_Dyno/PLC_Dyno/POUs/MAIN.TcPOU", "MEN001_Dyno/PLC_Dyno/VISUs/Visualization.TcVIS"]
};

const POLICY = {
  lead: ["AGENTS.md", "WORKFLOW.md", "WORK_STATUS_AND_PLAN.md", ".claude/**",
    "SafetyTests/SCENARIO_DECISIONS.md", "SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md",
    "SafetyTests/program/*.md", "SafetyTests/program/*.json", "SafetyTests/program/lead/**"],
  "v2-analyst": ["SafetyTests/SCENARIO_DECISIONS.md", "SafetyTests/program/DECISIONS_DIGEST.md",
    "SafetyTests/program/analyst/**"],
  "v2-architect": ["SafetyTests/program/architect/**"],
  "v2-stand-engineer": ["SafetyTests/src/**", "SafetyTests/scripts/**", "SafetyTests/package.json",
    "SafetyTests/test/stand-*.test.js", "SafetyTests/test/sal-semantics.test.js",
    "SafetyTests/test/sal-runtime.test.js", "SafetyTests/test/archive/**", "SafetyTests/program/stand/**"],
  "v2-editor": ["MEN001_Dyno/Safety_Dyno/**", "SafetyTests/candidates/**", "SafetyTests/program/editor/**"],
  "v2-tester": ["SafetyTests/test/current-*.test.js", "SafetyTests/test/helpers/**",
    "SafetyTests/test/independent/**", "SafetyTests/test/catalog/**", "SafetyTests/program/tester/**"],
  "v2-reviewer": ["SafetyTests/program/reviewer/**"],
  "v2-runner": ["SafetyTests/program/runs/**"]
};

function globToRegex(glob) {
  let rx = "";
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") { rx += ".*"; i += 1; if (glob[i + 1] === "/") i += 1; }
    else if (c === "*") rx += "[^/]*";
    else rx += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${rx}$`, "i");
}
const matches = (rel, globs) => globs.some(g => globToRegex(g).test(rel));

function repoRoot(file) {
  let dir = path.dirname(file);
  while (!fs.existsSync(dir) && path.dirname(dir) !== dir) dir = path.dirname(dir);
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch { return null; }
}

function deny(reason) {
  process.stderr.write(`path-guard: ${reason}\n`);
  process.exit(2);
}

const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
const role = input.agent_type || "lead";
const tool = input.tool_name;

if (tool === "Bash" || tool === "PowerShell") {
  const cmd = String(input.tool_input?.command ?? "");
  if (/\bgit\b[^\n;|&]*\bpush\b/i.test(cmd)) deny("git push is not permitted (AGENTS.md)");
  if (/source[\\/]+repos[\\/]+MEN001_Dyno(?![_\w])/i.test(cmd) &&
      /\bgit\b[^\n;|&]*\b(checkout|switch|reset|commit|merge|rebase|stash|clean|pull|branch\s+-[dDmM])\b/i.test(cmd))
    deny("reference repository is read-only");
  process.exit(0);
}

const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!target) process.exit(0);
const abs = path.resolve(input.cwd ?? process.cwd(), target);
const norm = abs.replace(/\\/g, "/");
if (norm.toLowerCase().startsWith(REFERENCE)) deny("reference repository is read-only");

const root = repoRoot(abs);
if (!root) process.exit(0); // outside any repo: scratchpad, memory
const rel = path.relative(root, abs).replace(/\\/g, "/");
if ((TEMPORARY_GRANTS[role] ?? []).some(p => p.toLowerCase() === rel.toLowerCase())) process.exit(0);
if (matches(rel, COMMON_DENY)) deny(`${rel}: hardware/target configuration is out of scope for every role`);
const allowed = POLICY[role];
if (!allowed) deny(`unknown role "${role}" (fail-closed)`);
if (!matches(rel, allowed)) deny(`role ${role} does not own ${rel}; hand off via the lead`);
process.exit(0);
