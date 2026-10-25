# Proposal: current-SAL RnD shutdown regression

READY for independent review; canonical test files have not been changed.

Copy only these two reviewed files into the canonical SafetyTests tree:

- test/current-rnd-down-no-reenergy.test.js
- test/helpers/rnd-down-source.js

software-check.js already enumerates *.test.js and categorizes current-* as
current-code tests; no pipeline policy change is required. Both files always
read the relative working SAL/SGVL pair, freshly audit the complete source and
then select the demanded actual-producer closure. No source environment override
or frozen candidate input exists in the official helper/test. Source SHA256 and
SGVL SHA256, declared initial states, exact seven Network4 native/global IDs and
per-case scan count appear in Node diagnostics. Every scan is observed in memory.
Optional MEN001_RND_DOWN_EVIDENCE_DIR writes full gzip traces; it only controls
output, never the source under test.

Four tests cover:

1. Actual Safe→Step12→RnD→green down→LVoff→given feedbackoff→actualStep2;
   first-scan owner capture before N5, owner hold after SG clears and buttons
   release,2500ms with no permitted energy Set or renewed LV/HV output.
2. Initial ordinaryStep2, generic dischargeFALSE: original power-on availability.
3. Initial ordinaryStep2, generic dischargeTRUE with no RnD origin: same availability.
4. Explicit existing raw fault branch: actual Step2 exit clears owner; real manual
   Restart/full neutral and fresh Safe BOTH/RnD down recapture owner. This is a
   technical component reset/reentry proof, not normal shutdown completion.

The prior three-source legacy comparison remains unchanged historical evidence;
the official current tests do not substitute historical sources for working code.
Initial component state is explicit, recognizer owners are never seeded, and
program phases/owners cannot be supplied after protocol start. Demanded unresolved
inputs throw. These software-adapter tests do not claim full BOOT/group semantics,
normal RnD-down→Safe completion, pending PLC endpoints or native/hardware validation.

run-target.mjs creates an isolated canonical filesystem tree in this owned folder,
copies frozen v2 SAL72f42daf…/SGVLde0fa993… there, and runs the unmodified proposal
files against that tree's working pair. Runtime files in src/ are unchanged copies
used only for local replay; they are not part of the canonical-copy proposal.
target.log, target-identity.json and full evidence archives document the run.
The canonical working source outside this isolated tree was not changed.
