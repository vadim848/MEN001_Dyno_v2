// act-led-control.mjs - JS transcription of PLC action MAIN.act_LED_Control
//
// TRANSCRIPTION, NOT PLC EXECUTION. This is a hand transcription of the
// Structured Text of the action; it does not run TwinCAT. TwinCAT Build/
// runtime behaviour is Vadim's step and is not proven by this module.
//
// Sources (file MEN001_Dyno/PLC_Dyno/POUs/MAIN.TcPOU, action act_LED_Control):
//   variant 'original': commit 0293e216bbdfa5466c0e10fc9b0a9ea2e32954d2 (HEAD at
//       transcription time), blob SHA256
//       2b954d49c225be2e142bba46510d2ad9857418831604443bd66eebe9164eb717
//   variant 'new': working copy 2026-10-29 (Q-LED-1..4, 3a; NIV-GAPS), SHA256
//       f8ac897c346e1602ea467efe00a8f8550ee000ed62fdd69db3b0571798292754
// The exact ST text transcribed is exported as TRANSCRIBED_ST; the test
// act-led-control.test.js fails if the action in MAIN.TcPOU no longer matches.
//
// API (stable; also used by the SAL trainer/visualizer, display only):
//   import { createLedControl } from './act-led-control.mjs';
//   const led = createLedControl({ variant: 'new' | 'original', initial? });
//     initial: optional { RedLED, GreenLED, BlueLED, bPulse, bFaultPulse }
//              (PLC default init = all FALSE).
//   led.scan(inputs, dtMs) -> { RedLED, GreenLED, BlueLED, t_BlinkTimeMs,
//                               bPulse, bFaultPulse }
//     One PLC cycle: the clock advances by dtMs (>= 0), then the action body
//     runs once in ST order. LED outputs are evaluated BEFORE the pulse
//     generators update in the same scan, so a BLINK LED shows the bPulse
//     value returned by the previous scan. In 'new' the STS_FAULT override is
//     applied AFTER the fault generator update (same scan value).
//     bPulse / bFaultPulse returned are post-update values. bFaultPulse is
//     always false in 'original' (generator absent there).
//   led.state() -> copy of internal state (outputs, pulses, timers, clock).
//   led.reset() -> back to initial state.
//   inputs (missing key = FALSE): EStop_Ok, EStop_Status, TransitionStep,
//     Safety_Armed, step1, step2, step4, step5, step6, stepRnD, STS_SAFE,
//     STS_RND, STS_RUN, STS_CFG, STS_EMG, STS_FAULT, DoorMonitor,
//     SolenoedMonitor. Mapping: IN = GVL_Safety.stTwinSAFE_IN (stepX =
//     IN.Speps.stepX), DoorMonitor/SolenoedMonitor = GVL_Safety.stTwinSAFE_OUT.
//     Outputs RedLED/GreenLED/BlueLED = GVL_IO.*.
//   Not transcribed (outside LED scope): the trailing HV_Healthy/LV_Healthy
//   assignments of the action, and MAIN's DoorMonitor := DoorMonitorFromPLC
//   (DoorMonitor is taken directly as input).
//
// TON model (IEC/Tc2 TON): IN FALSE -> Q FALSE, elapsed reset. On the first
// call with IN TRUE the start time is latched (Q FALSE unless PT = 0); on later
// calls Q := (now - start) >= PT, PT read at each call.

export const LED_INPUT_KEYS = Object.freeze([
  'EStop_Ok', 'EStop_Status', 'TransitionStep', 'Safety_Armed',
  'step1', 'step2', 'step4', 'step5', 'step6', 'stepRnD',
  'STS_SAFE', 'STS_RND', 'STS_RUN', 'STS_CFG', 'STS_EMG', 'STS_FAULT',
  'DoorMonitor', 'SolenoedMonitor',
]);

class Ton {
  constructor() { this.reset(); }
  reset() { this.running = false; this.start = 0; this.Q = false; this.ET = 0; }
  call(IN, PT, now) {
    if (!IN) { this.running = false; this.Q = false; this.ET = 0; return; }
    if (!this.running) { this.running = true; this.start = now; this.ET = 0; this.Q = PT <= 0; return; }
    const et = now - this.start;
    this.Q = et >= PT;
    this.ET = Math.min(et, PT);
  }
}

function normInputs(src) {
  const o = {};
  for (const k of LED_INPUT_KEYS) o[k] = Boolean(src && src[k]);
  return o;
}

function scanOriginal(s, x) {
  // //Red
  if (x.EStop_Ok && x.EStop_Status) s.RedLED = false;
  else if (x.EStop_Ok === false && x.EStop_Status) s.RedLED = s.bPulse;
  else if (x.EStop_Ok === false && x.EStop_Status === false) s.RedLED = true;
  // //Blue
  if ((x.DoorMonitor && x.step1) || (x.DoorMonitor === false && x.stepRnD)) s.BlueLED = s.bPulse;
  else if (x.DoorMonitor && x.SolenoedMonitor === false && !x.stepRnD) s.BlueLED = false;
  else if (x.DoorMonitor === false || (x.stepRnD && x.DoorMonitor)) s.BlueLED = true;
  // //Green
  if ((x.step1 && x.EStop_Ok && x.DoorMonitor === true) || x.TransitionStep) s.GreenLED = s.bPulse;
  else if (x.Safety_Armed || x.stepRnD || x.step2) s.GreenLED = true;
  else if (x.step4 || x.step5 || x.step6 || x.DoorMonitor === false) s.GreenLED = false;
  // blink time
  s.t_BlinkTimeMs = (x.step2 || x.TransitionStep) ? 500 : 1500;
  // pulse generator
  s.Pulse_On_TON.call(!s.bPulse, s.t_BlinkTimeMs, s.now);
  s.Pulse_Off_TON.call(s.bPulse, s.t_BlinkTimeMs, s.now);
  if (s.Pulse_On_TON.Q && !s.bPulse) s.bPulse = true;
  if (s.Pulse_Off_TON.Q && s.bPulse) s.bPulse = false;
}

function scanNew(s, x) {
  // //Red
  if (x.EStop_Ok && x.EStop_Status) s.RedLED = false;
  else if (x.EStop_Ok === false && x.EStop_Status) s.RedLED = s.bPulse;
  else s.RedLED = true;
  // //Blue: Unlock indication (Q-LED-3)
  if (x.STS_RUN || x.STS_CFG || x.STS_EMG || !((x.STS_SAFE && x.step1) || x.STS_RND)) s.BlueLED = false;
  else if (x.DoorMonitor === false || x.SolenoedMonitor) s.BlueLED = true;
  else s.BlueLED = s.bPulse;
  // //Green
  if ((x.step1 && x.EStop_Ok && x.DoorMonitor === true) || (x.TransitionStep && !x.step1)) s.GreenLED = s.bPulse;
  else if (x.Safety_Armed || x.stepRnD || x.step2) s.GreenLED = true;
  else if (x.step4 || x.step5 || x.step6 || x.DoorMonitor === false) s.GreenLED = false;
  // blink time
  s.t_BlinkTimeMs = (x.step2 || (x.TransitionStep && !x.step1)) ? 500 : 1500;
  // pulse generator
  s.Pulse_On_TON.call(!s.bPulse, s.t_BlinkTimeMs, s.now);
  s.Pulse_Off_TON.call(s.bPulse, s.t_BlinkTimeMs, s.now);
  if (s.Pulse_On_TON.Q && !s.bPulse) s.bPulse = true;
  if (s.Pulse_Off_TON.Q && s.bPulse) s.bPulse = false;
  // STS_FAULT (Q-LED-2) 200 ms generator + override
  s.FaultPulse_On_TON.call(!s.bFaultPulse, 200, s.now);
  s.FaultPulse_Off_TON.call(s.bFaultPulse, 200, s.now);
  if (s.FaultPulse_On_TON.Q && !s.bFaultPulse) s.bFaultPulse = true;
  if (s.FaultPulse_Off_TON.Q && s.bFaultPulse) s.bFaultPulse = false;
  if (x.STS_FAULT) {
    s.GreenLED = s.bFaultPulse;
    s.BlueLED = !s.bFaultPulse;
  }
}

export function createLedControl({ variant = 'new', initial = {} } = {}) {
  if (variant !== 'new' && variant !== 'original') throw new Error(`unknown variant ${variant}`);
  const body = variant === 'new' ? scanNew : scanOriginal;
  let s;
  const reset = () => {
    s = {
      now: 0,
      RedLED: Boolean(initial.RedLED), GreenLED: Boolean(initial.GreenLED), BlueLED: Boolean(initial.BlueLED),
      bPulse: Boolean(initial.bPulse), bFaultPulse: variant === 'new' ? Boolean(initial.bFaultPulse) : false,
      t_BlinkTimeMs: 0,
      Pulse_On_TON: new Ton(), Pulse_Off_TON: new Ton(),
      FaultPulse_On_TON: new Ton(), FaultPulse_Off_TON: new Ton(),
    };
  };
  reset();
  return {
    variant,
    scan(inputs, dtMs = 0) {
      if (!(dtMs >= 0)) throw new Error('dtMs must be >= 0');
      s.now += dtMs;
      body(s, normInputs(inputs));
      return {
        RedLED: s.RedLED, GreenLED: s.GreenLED, BlueLED: s.BlueLED,
        t_BlinkTimeMs: s.t_BlinkTimeMs, bPulse: s.bPulse, bFaultPulse: s.bFaultPulse,
      };
    },
    state() {
      const ton = (t) => ({ running: t.running, start: t.start, Q: t.Q, ET: t.ET });
      return {
        now: s.now, RedLED: s.RedLED, GreenLED: s.GreenLED, BlueLED: s.BlueLED,
        bPulse: s.bPulse, bFaultPulse: s.bFaultPulse, t_BlinkTimeMs: s.t_BlinkTimeMs,
        Pulse_On_TON: ton(s.Pulse_On_TON), Pulse_Off_TON: ton(s.Pulse_Off_TON),
        FaultPulse_On_TON: ton(s.FaultPulse_On_TON), FaultPulse_Off_TON: ton(s.FaultPulse_Off_TON),
      };
    },
    reset,
  };
}

// Exact ST text transcribed (CDATA of the action); generated below by copy
// from the sources named in the header.
export const TRANSCRIBED_ST = Object.freeze({
  original: String.raw`//Red 
IF GVL_Safety.stTwinSAFE_IN.EStop_Ok AND GVL_Safety.stTwinSAFE_IN.EStop_Status THEN
	//Red Off
	GVL_IO.RedLED:= FALSE;
ELSIF GVL_Safety.stTwinSAFE_IN.EStop_Ok=FALSE AND GVL_Safety.stTwinSAFE_IN.EStop_Status  THEN
	//Red Blink 
	GVL_IO.RedLED:=bPulse;
ELSIF GVL_Safety.stTwinSAFE_IN.EStop_Ok=FALSE AND GVL_Safety.stTwinSAFE_IN.EStop_Status=FALSE THEN
	//Red On
	GVL_IO.RedLED:= TRUE;
END_IF

//Blue
IF (GVL_Safety.stTwinSAFE_OUT.DoorMonitor AND GVL_Safety.stTwinSAFE_IN.Speps.step1) 
OR (GVL_Safety.stTwinSAFE_OUT.DoorMonitor=FALSE AND GVL_Safety.stTwinSAFE_IN.Speps.stepRnD) THEN
	//Blue Blink
	GVL_IO.BlueLED:=bPulse;
ELSIF GVL_Safety.stTwinSAFE_OUT.DoorMonitor AND GVL_Safety.stTwinSAFE_OUT.SolenoedMonitor=FALSE AND NOT GVL_Safety.stTwinSAFE_IN.Speps.stepRnD THEN
	//Blue Off
	GVL_IO.BlueLED:=FALSE;
ELSIF GVL_Safety.stTwinSAFE_OUT.DoorMonitor=FALSE OR (GVL_Safety.stTwinSAFE_IN.Speps.stepRnD AND GVL_Safety.stTwinSAFE_OUT.DoorMonitor) THEN
	//Blue On
	GVL_IO.BlueLED:=TRUE;
END_IF

//Green
IF (GVL_Safety.stTwinSAFE_IN.Speps.step1 AND GVL_Safety.stTwinSAFE_IN.EStop_Ok AND GVL_Safety.stTwinSAFE_OUT.DoorMonitor=TRUE) OR GVL_Safety.stTwinSAFE_IN.TransitionStep THEN
	//Green Blink
	GVL_IO.GreenLED:=bPulse;
ELSIF GVL_Safety.stTwinSAFE_IN.Safety_Armed OR (GVL_Safety.stTwinSAFE_IN.Speps.stepRnD) OR GVL_Safety.stTwinSAFE_IN.Speps.step2 THEN
	//Green On
	GVL_IO.GreenLED:=TRUE;
ELSIF GVL_Safety.stTwinSAFE_IN.Speps.step4 OR GVL_Safety.stTwinSAFE_IN.Speps.step5 
OR GVL_Safety.stTwinSAFE_IN.Speps.step6 OR GVL_Safety.stTwinSAFE_OUT.DoorMonitor=FALSE THEN
	//Green Off
	GVL_IO.GreenLED:=FALSE;
END_IF

IF GVL_Safety.stTwinSAFE_IN.Speps.step2 OR GVL_Safety.stTwinSAFE_IN.TransitionStep THEN
	t_BlinkTime:=T#0.5S;
ELSE
	t_BlinkTime:=T#1.5S;
END_IF

Pulse_On_TON(IN:=NOT bPulse , PT:=t_BlinkTime , Q=> , ET=> );
Pulse_Off_TON(IN:=bPulse , PT:=t_BlinkTime , Q=> , ET=> );
IF Pulse_On_TON.Q AND NOT bPulse THEN bPulse:=TRUE; END_IF;
IF Pulse_Off_TON.Q AND bPulse THEN bPulse:=FALSE; END_IF;


GVL_Safety.stTwinSAFE_IN.HV_Healthy:=NOT GVL_Safety.stTwinSAFE_IN.HV_Faulty;
GVL_Safety.stTwinSAFE_IN.LV_Healthy:=NOT GVL_Safety.stTwinSAFE_IN.LV_Faulty;
`,
  new: String.raw`//Red 
IF GVL_Safety.stTwinSAFE_IN.EStop_Ok AND GVL_Safety.stTwinSAFE_IN.EStop_Status THEN
	//Red Off
	GVL_IO.RedLED:= FALSE;
ELSIF GVL_Safety.stTwinSAFE_IN.EStop_Ok=FALSE AND GVL_Safety.stTwinSAFE_IN.EStop_Status  THEN
	//Red Blink 
	GVL_IO.RedLED:=bPulse;
ELSE
	//Red On
	GVL_IO.RedLED:= TRUE;
END_IF

//Blue: Unlock indication (Q-LED-3). Off in Run/Config/Emergency, in Safe->R&D transition and without Safe/R&D status
IF GVL_Safety.stTwinSAFE_IN.STS_RUN OR GVL_Safety.stTwinSAFE_IN.STS_CFG OR GVL_Safety.stTwinSAFE_IN.STS_EMG
OR NOT ((GVL_Safety.stTwinSAFE_IN.STS_SAFE AND GVL_Safety.stTwinSAFE_IN.Speps.step1) OR GVL_Safety.stTwinSAFE_IN.STS_RND) THEN
	//Blue Off
	GVL_IO.BlueLED:=FALSE;
ELSIF GVL_Safety.stTwinSAFE_OUT.DoorMonitor=FALSE OR GVL_Safety.stTwinSAFE_OUT.SolenoedMonitor THEN
	//Blue On (lid open or solenoid on)
	GVL_IO.BlueLED:=TRUE;
ELSE
	//Blue Blink (lid closed, may be opened)
	GVL_IO.BlueLED:=bPulse;
END_IF

//Green
IF (GVL_Safety.stTwinSAFE_IN.Speps.step1 AND GVL_Safety.stTwinSAFE_IN.EStop_Ok AND GVL_Safety.stTwinSAFE_OUT.DoorMonitor=TRUE) OR (GVL_Safety.stTwinSAFE_IN.TransitionStep AND NOT GVL_Safety.stTwinSAFE_IN.Speps.step1) THEN
	//Green Blink
	GVL_IO.GreenLED:=bPulse;
ELSIF GVL_Safety.stTwinSAFE_IN.Safety_Armed OR (GVL_Safety.stTwinSAFE_IN.Speps.stepRnD) OR GVL_Safety.stTwinSAFE_IN.Speps.step2 THEN
	//Green On
	GVL_IO.GreenLED:=TRUE;
ELSIF GVL_Safety.stTwinSAFE_IN.Speps.step4 OR GVL_Safety.stTwinSAFE_IN.Speps.step5 
OR GVL_Safety.stTwinSAFE_IN.Speps.step6 OR GVL_Safety.stTwinSAFE_OUT.DoorMonitor=FALSE THEN
	//Green Off
	GVL_IO.GreenLED:=FALSE;
END_IF

IF GVL_Safety.stTwinSAFE_IN.Speps.step2 OR (GVL_Safety.stTwinSAFE_IN.TransitionStep AND NOT GVL_Safety.stTwinSAFE_IN.Speps.step1) THEN
	t_BlinkTime:=T#0.5S;
ELSE
	t_BlinkTime:=T#1.5S;
END_IF

Pulse_On_TON(IN:=NOT bPulse , PT:=t_BlinkTime , Q=> , ET=> );
Pulse_Off_TON(IN:=bPulse , PT:=t_BlinkTime , Q=> , ET=> );
IF Pulse_On_TON.Q AND NOT bPulse THEN bPulse:=TRUE; END_IF;
IF Pulse_Off_TON.Q AND bPulse THEN bPulse:=FALSE; END_IF;

//STS_FAULT (Q-LED-2): green/blue alternate 200 ms, overrides green/blue in all states; red unchanged
FaultPulse_On_TON(IN:=NOT bFaultPulse , PT:=T#200MS , Q=> , ET=> );
FaultPulse_Off_TON(IN:=bFaultPulse , PT:=T#200MS , Q=> , ET=> );
IF FaultPulse_On_TON.Q AND NOT bFaultPulse THEN bFaultPulse:=TRUE; END_IF;
IF FaultPulse_Off_TON.Q AND bFaultPulse THEN bFaultPulse:=FALSE; END_IF;
IF GVL_Safety.stTwinSAFE_IN.STS_FAULT THEN
	GVL_IO.GreenLED:=bFaultPulse;
	GVL_IO.BlueLED:=NOT bFaultPulse;
END_IF


GVL_Safety.stTwinSAFE_IN.HV_Healthy:=NOT GVL_Safety.stTwinSAFE_IN.HV_Faulty;
GVL_Safety.stTwinSAFE_IN.LV_Healthy:=NOT GVL_Safety.stTwinSAFE_IN.LV_Faulty;
`,
});
