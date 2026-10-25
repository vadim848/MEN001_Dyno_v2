# S1 stand requests (v2-tester -> stand engineer, via lead; 2026-10-23)

SR-1 check:catalog / check:software: `node --test test/catalog/` (directory) fails on Node 22 / Windows (MODULE_NOT_FOUND).
 Pass the glob `test/catalog/*.test.js` (or the explicit file list). Env pass-through: CATALOG_SAL_DIR, CATALOG_STAGES,
 optional CATALOG_PLANT_DELAY, CATALOG_SAFETYFAULT_SYMBOL, CATALOG_FAULT_SYMBOL, CATALOG_SYM_<KIND>.
SR-2 Runtime: ~50 s per target for the full catalog (files run in parallel); no simulator feature is missing for S1.
 Mutations are applied to a structuredClone of the parsed model (port deactivate / contact invert / consumer pinning via a
 pseudo variable) - no src/ change and no file writes.
SR-3 The catalog helper calls assertNativeSalStructure + whole binding audit before execution only as a load guard;
 the single structural check (preflight + CRC + FB <= 512) stays with the stand.
