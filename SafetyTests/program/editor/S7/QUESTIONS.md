# S7 questions (implemented recommendation)
Q1 Button disabling: decision "button active only when STS allows". Real "Deactivate inputs" property cannot be written safely (IDE member id unknown, file has no example). Options: A) PLC gating + enable lamp (implemented); B) Vadim/IDE sets "Deactivate inputs" = NOT MAIN.bEn_* on the 4 buttons (1 min in IDE). Recommend A now, B optional.
Q2 Confirmation: "переключатель с подтверждением" implemented as request + CONFIRM button (5 s) instead of a modal dialog (needs a new dialog Visu, not creatable by text edit). Option: dialog visu in IDE. Recommend keep two-button.
Q3 Dead time 200 ms after pulse and discard (not queue) of presses during pulse: not in decisions; recommend keep (clean edge, no double command).
Q4 STS_FAULT does not block buttons; recommend keep (TwinSAFE enforces).
