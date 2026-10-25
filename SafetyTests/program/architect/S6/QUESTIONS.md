# S6 questions (architect -> lead -> analyst/Vadim)

## Q-S6-1 Safe enabler for the Standard-signal gates (non-blocking for editing, needed for acceptance)
Context: native rule allows a Standard PLC symbol only on AndIn1 of a safeAnd with >= 2 active inputs. PLAN gates each
of CMD_SAFE_TO_RND/CMD_RND_TO_RUN/CMD_RUN_TO_RND/CMD_RND_TO_SAFE/inPLC_BypassC1C2/in_PLC_Heartbeat through
AND(AndIn1 = symbol, AndIn2 = safe TRUE). Safe TRUE = S6_TRUE = in_ES_NC_1 OR NOT in_ES_NC_1.
Options:
- A (recommended): constant safe TRUE. Behaviour identical to canonical E5 (same-scan values, catalog unchanged). The
  standard signal is not replaced; all existing safe guards downstream (PA_*, FBAnd1, EStop) stay as before.
- B: real safe permit as AndIn2 (e.g. GVL1.b_EStop_Ok). Changes behaviour: command/heartbeat edges and PK_PREV history
  are masked during Emergency, so a command held across EStop recovery would create a new edge; heartbeat watchdog
  semantics in Emergency change. Needs new scenario decisions; not designed here.
Recommendation: A. Question to Vadim only if the lead/reviewer consider a tautological enabler unacceptable under
"не подменять стандартный PLC сигнал безопасным".
