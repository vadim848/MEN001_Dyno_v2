export const ButtonState = Object.freeze({
  WAIT_RELEASE: "WaitAllReleased",
  ARMED: "ArmedIdle",
  GREEN: "GreenCandidate",
  BLUE: "BlueCandidate",
  BLUE_ACTIVE: "BlueActive",
  TWO: "TwoButtonsAttempt",
  LOCKED: "LockedUntilRelease"
});

export class ButtonRecognizer {
  constructor(config = {}) {
    this.cfg = {
      releaseMs: config.releaseMs ?? 2000,
      chordMs: config.chordMs ?? 500,
      singleMs: config.singleMs ?? 1000,
      bothMs: config.bothMs ?? 2000
    };
    this.state = ButtonState.WAIT_RELEASE;
    this.elapsed = 0;
  }

  tick(dt, green, blue) {
    const out = { stepDown: false, stepUp: false, unlock: false, state: this.state };
    const bothOff = !green && !blue;

    if (this.state === ButtonState.WAIT_RELEASE) {
      if (bothOff) {
        this.elapsed += dt;
        if (this.elapsed >= this.cfg.releaseMs) {
          this.state = ButtonState.ARMED;
          this.elapsed = 0;
        }
      } else {
        this.elapsed = 0;
      }
    } else if (this.state === ButtonState.ARMED) {
      if (green && blue) {
        this.state = ButtonState.TWO;
        this.elapsed = dt;
      } else if (green) {
        this.state = ButtonState.GREEN;
        this.elapsed = dt;
      } else if (blue) {
        this.state = ButtonState.BLUE;
        this.elapsed = dt;
      }
    } else if (this.state === ButtonState.GREEN || this.state === ButtonState.BLUE) {
      const primaryOn = this.state === ButtonState.GREEN ? green : blue;
      const secondOn = this.state === ButtonState.GREEN ? blue : green;

      if (!primaryOn) {
        this.state = bothOff ? ButtonState.WAIT_RELEASE : ButtonState.LOCKED;
        this.elapsed = 0;
      } else if (secondOn) {
        if (this.elapsed <= this.cfg.chordMs) {
          this.state = ButtonState.TWO;
          this.elapsed = dt;
        } else {
          this.state = ButtonState.LOCKED;
          this.elapsed = 0;
        }
      } else {
        this.elapsed += dt;
        if (this.elapsed >= this.cfg.singleMs) {
          if (this.state === ButtonState.GREEN) {
            out.stepDown = true;
            this.state = ButtonState.LOCKED;
          } else {
            this.state = ButtonState.BLUE_ACTIVE;
            out.unlock = true;
          }
          this.elapsed = 0;
        }
      }
    } else if (this.state === ButtonState.BLUE_ACTIVE) {
      out.unlock = blue && !green;
      if (!blue || green) {
        this.state = bothOff ? ButtonState.WAIT_RELEASE : ButtonState.LOCKED;
        out.unlock = false;
        this.elapsed = 0;
      }
    } else if (this.state === ButtonState.TWO) {
      if (green && blue) {
        this.elapsed += dt;
        if (this.elapsed >= this.cfg.bothMs) {
          out.stepUp = true;
          this.state = ButtonState.LOCKED;
          this.elapsed = 0;
        }
      } else if (bothOff) {
        this.state = ButtonState.WAIT_RELEASE;
        this.elapsed = 0;
      } else {
        // A flickering/missing channel only resets two-button qualification.
        // It can never degrade into a single-button command.
        this.elapsed = 0;
      }
    } else if (this.state === ButtonState.LOCKED) {
      if (bothOff) {
        this.state = ButtonState.WAIT_RELEASE;
        this.elapsed = 0;
      }
    }

    out.state = this.state;
    if (this.state === ButtonState.BLUE_ACTIVE) out.unlock = blue && !green;
    return out;
  }
}
