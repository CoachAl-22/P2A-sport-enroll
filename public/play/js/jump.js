// Long Jump rules for Explorer's Run. Pure: no DOM, no clocks; time arrives as `now` (ms) and `dt` (s).
// scoring.js plugs this into its RULES table and hands over what it needs (the sprint rule and the
// event helper), so this file imports nothing from scoring.js.
//
// Two buttons: RUN (the 'L' side; 'R' is read as RUN too) and JUMP ('J').
// One attempt: ready -> runup (tap RUN: every tap is the next stride) -> takeoff (JUMP, pressed in
// the armed zone and held for the push) -> flight (one tap of RUN or JUMP to land) -> landed
// (slide to a stop) -> between (waits for nextAttempt). The top-level phase stays 'go' | 'run' | 'done'.
// Practice (opts.practice): a standing take-off at the pit edge, repeated until done right once.

const round2 = (m) => Math.round(m * 100) / 100;
const MARKS = ['fast', 'board', 'push', 'landing'];

// The debug panel takes any number. These keys divide, time or bound a stage, so a non-finite or
// too-small value falls back to a safe minimum: a run can never stall on a bad tuning value.
const atLeast = (v, min) => (Number.isFinite(v) && v >= min ? v : min);
const runLen = (tune) => atLeast(tune.jumpRunLen, 1);
const runThrough = (tune) => atLeast(tune.jumpRunThroughM ?? tune.jumpPitLen, 1);
const pushMs = (tune) => atLeast(tune.jumpPushMs, 1);
const graceMs = (tune) => atLeast(tune.jumpLandGraceMs, 0);
const minFlightSecs = (tune) => atLeast(tune.jumpMinFlightSecs, 0.05);
const idleSecs = (tune) => atLeast(tune.jumpIdleSecs, 0.5);

// The sprint tune view the run-up uses: the run's own tune (live, so the debug panel reaches it) with a
// lower top speed and the sprint XP switched off. Refreshed in place before every run-up tap and step.
function syncRunup(run, tune) {
  Object.assign(run.runupTune, tune, {
    sprintMaxCad: tune.jumpMaxCad, sprintTapXp: 0, lightningMs: -Infinity, sprintBonusEvery: Infinity,
  });
  return run.runupTune;
}

export function makeJumpRules({ sprint, push }) {
  // ---- set-up ----

  function init(run, tune, opts = {}) {
    // The run-up is the sprint's own tap and step with a lower top speed. Sprint XP is switched off
    // in this view (no per-tap XP, a LIGHTNING START window nothing can hit, a CLEAN streak that never
    // comes round): jump XP comes only from the four marks. The caller's tune is never touched.
    run.runupTune = {};
    syncRunup(run, tune);
    run.practice = !!opts.practice;
    run.attempt = 0;
    run.attempts = [];
    run.shoes = 0;
    resetAttempt(run, tune);
  }

  // Per-attempt state. Clock, xp, attempts and shoes carry over.
  function resetAttempt(run, tune) {
    run.stage = 'ready';
    run.boardAt = runLen(tune) + run.shoes * tune.jumpShoeM;
    run.pos = run.practice ? run.boardAt : 0; // practice stands at the pit edge
    run.dist = run.pos; run.speed = 0; run.cad = 0; run.topSpeed = 0;
    run.lastSide = null; run.lastTapAt = null; run.combo = 0;
    run.lastPausePos = null; // where the last stutter (a pause in tapping) happened
    run.idleSecs = 0;
    run.armed = false;    // in the armed zone: JUMP takes off (the UI shows the button)
    run.takeoff = null;
    run.jumpDown = null;  // ms JUMP went down for this take-off, until it is released (a lost release clears here)
    run.jumpAt = null;    // ms JUMP went down (the push starts)
    run.push = 0;         // 0..1
    run.landFirst = null; // the landing tap of this flight: { side, at }
    run.landJudged = false; // the landing has been tapped
    run.pushPads = [];    // RUN presses during the push: { side, at }; replayed at flight start if recent
    run.landing = null;   // 'two' once landed on both pads; 'two' | 'leap' after touchdown
    run.flight = 0;       // metres this flight covers
    run.flightSecs = 0;
    run.flightAt = null;  // ms the flight began (push over)
    run.touchAt = null;   // ms of touchdown
    run.flightFrac = 0;   // 0..1 through the flight
    run.flightDist = 0;   // metres travelled in flight so far
    run.flightHeight = 0; // metres above the sand now, for the art
    run.landX = null;     // metres past the foul line where the hero lands
    if (run.practice) arm(run);
  }

  function arm(run) {
    run.armed = true;
    push(run, { type: 'armed' });
  }

  // ---- run-up: one RUN button ----

  // Every RUN tap is the next stride: it is handed to the sprint rule as the opposite foot of the last
  // one, so there is no order to get wrong and speed comes only from tapping fast and steady (capped
  // at jumpMaxCad). A pause in tapping near the board (a stutter) slows the hero and costs the fast mark.
  function runupPress(run, now, tune) {
    if (run.lastTapAt !== null && now - run.lastTapAt < tune.dupTapMs) return; // same touch, dropped
    if (run.stage === 'ready') {
      run.stage = 'runup';
      run.phase = 'run';
      if (run.firstTapAt === null) { run.firstTapAt = now; run.goAt = now; } // the first tap starts the clock
    }
    if (run.lastTapAt !== null && now - run.lastTapAt > tune.jumpStutterMs) run.lastPausePos = run.pos;
    sprint.tap(run, run.lastSide === 'L' ? 'R' : 'L', now, syncRunup(run, tune));
  }

  function stepRunup(run, dt, now, tune) {
    sprint.step(run, dt, now, syncRunup(run, tune));
    run.pos += run.speed * dt;
    run.dist = run.pos;
    run.topSpeed = Math.max(run.topSpeed, run.speed);
    run.idleSecs = run.speed < tune.jumpIdleMps ? run.idleSecs + dt : 0;
    if (run.pos >= run.boardAt + runThrough(tune) || run.idleSecs > idleSecs(tune)) { noJump(run, tune); return; }
    // Armed within jumpArmM of the (shoe-shifted) foul line, or past it, until the run-through limit.
    if (!run.armed && runLen(tune) - (run.pos - run.shoes * tune.jumpShoeM) <= tune.jumpArmM) arm(run);
  }

  // ---- take-off and push ----

  // Flight metres for a take-off speed and push; a jab keeps jumpFlatShare of it.
  function flightFor(v, pushFrac, tune) {
    const r = v / (tune.jumpMaxCad * tune.sprintStride);
    const f = tune.jumpDistScale * Math.pow(r, tune.jumpSpeedPow) * (tune.jumpFlatShare + (1 - tune.jumpFlatShare) * pushFrac);
    return Math.min(tune.jumpMaxM, f);
  }

  // Judged where the hero is, at the speed it has, when JUMP goes down.
  function takeOff(run, now, tune) {
    if (run.practice) { run.phase = 'run'; run.speed = tune.jumpPracticeMps; }
    const speed = run.speed;
    if (!run.practice && run.lastTapAt !== null && now - run.lastTapAt > tune.jumpStutterMs) run.lastPausePos = run.pos; // stopped tapping before JUMP
    // Judge where the hero was on screen when the thumb went down: a phone's touch delay (jumpLagMs)
    // has already carried the hero this far. The take-off (and the jump) starts from that point.
    const lag = run.practice ? 0 : atLeast(tune.jumpLagMs, 0) / 1000;
    const pos = Math.max(0, run.pos - speed * lag);
    run.pos = pos; run.dist = pos;
    let gapM = runLen(tune) - (pos - run.shoes * tune.jumpShoeM);
    const foul = gapM < -tune.jumpToeM;
    if (!foul && gapM < 0) gapM = 0; // a legal toe-over counts from the line
    const zone = tune.jumpZoneM + (run.attempt === 0 ? tune.jumpWideFirstM : 0);
    const onBoard = !foul && gapM <= zone;
    run.takeoff = { pos, gapM, onBoard, foul, speed };
    run.stage = 'takeoff';
    run.armed = false;
    run.jumpDown = now;
    run.jumpAt = now;
    run.landX = pos + flightFor(speed, 0, tune) - run.boardAt; // a flat jump until the push is in
    push(run, { type: 'takeoff', gapM, onBoard });
    if (foul) push(run, { type: 'foul' });
  }

  // The push ends when JUMP is released, or at jumpPushMs if still held (the hold then does nothing).
  function startFlight(run, at, tune) {
    run.push = Math.max(0, Math.min(1, (at - run.jumpAt) / pushMs(tune)));
    const v = run.takeoff.speed;
    run.flight = flightFor(v, run.push, tune);
    // Hang time: the flight plays jumpHangScale times slower than real, so there is a clear window
    // for the landing tap (Alistair, 6 Nov: hard to time the legs kicking out). Distance is unchanged.
    const hang = atLeast(tune.jumpHangScale, 1);
    run.flightSecs = Math.max(minFlightSecs(tune), v > 0 ? hang * run.flight / v : 0);
    run.flightAt = at;
    run.touchAt = at + run.flightSecs * 1000;
    run.landX = run.takeoff.pos + run.flight - run.boardAt;
    run.stage = 'flight';
    // Pads that went down just before the flight started (within jumpLandGraceMs: a thumb lifting off
    // JUMP and two landing thumbs arrive in no fixed order) join the landing as if pressed at the
    // flight start, in time order. Older ones were pressed during the push and stay ignored.
    const recent = run.pushPads.filter((p) => at - p.at <= graceMs(tune)).sort((a, b) => a.at - b.at);
    run.pushPads = [];
    for (const p of recent) landPress(run, p.side, Math.max(at, p.at), tune);
    push(run, { type: 'flight', landed: run.landJudged }); // the UI flashes TAP! unless the landing is already in
  }

  function stepFlight(run, now, tune) {
    const secs = run.flightSecs;
    const e = Math.min(secs, Math.max(0, (now - run.flightAt) / 1000));
    run.flightFrac = e / secs;
    run.flightDist = run.flight * run.flightFrac;
    run.flightHeight = tune.jumpGravity * e * (secs - e) / 2; // a ballistic arc over the flight time
    run.pos = run.takeoff.pos + run.flightDist;
    run.dist = run.pos;
    if (now >= run.touchAt) touchdown(run, tune);
  }

  // ---- landing and the attempt record ----

  function touchdown(run, tune) {
    run.flightFrac = 1; run.flightDist = run.flight; run.flightHeight = 0;
    run.pos = run.takeoff.pos + run.flight; run.dist = run.pos;
    run.landing = run.landing === 'two' ? 'two' : 'leap';
    run.stage = 'landed';
    push(run, { type: 'land', landing: run.landing });
    if (run.practice) { judgePractice(run, tune); return; }
    const to = run.takeoff;
    const stutter = run.lastPausePos !== null && to.pos - run.lastPausePos <= tune.jumpStutterM;
    const marks = {
      fast: run.topSpeed >= tune.jumpFastMinPct * tune.jumpMaxCad * tune.sprintStride
        && to.speed >= tune.jumpFastPct * run.topSpeed && !stutter,
      board: to.onBoard,
      push: run.push >= tune.jumpPushMark,
      landing: run.landing === 'two',
    };
    const after = run.flight * (run.landing === 'two' ? 1 : 1 - tune.jumpLeapCut);
    const distanceM = to.foul ? null : round2(Math.max(0, after - to.gapM));
    record(run, to.foul ? 'foul' : 'jump', distanceM, marks, to.gapM, to.speed, tune);
  }

  function noJump(run, tune) {
    push(run, { type: 'nojump' });
    run.stage = 'landed'; // slows to a stop, then between
    run.armed = false;
    record(run, 'nojump', null, { fast: false, board: false, push: false, landing: false }, null, null, tune);
  }

  function record(run, outcome, distanceM, marks, gapM, speed, tune) {
    const n = MARKS.filter((k) => marks[k]).length;
    const pct = Math.round(100 * n / MARKS.length);
    run.attempts.push({ outcome, distanceM, marks, pct, gapM, speed });
    push(run, { type: 'attempt', index: run.attempt, outcome, distanceM, marks: { ...marks } });
    if (n > 0) {
      const xp = n * tune.jumpMarkXp;
      run.xp += xp;
      push(run, { type: 'xp', amount: xp, label: 'marks' });
    }
    if (n === MARKS.length) {
      run.xp += tune.jumpAllFourXp;
      push(run, { type: 'xp', amount: tune.jumpAllFourXp, label: 'allFour' });
    }
  }

  // Slide to a stop in the sand, then wait for the next attempt (or finish the level).
  function stepLanded(run, dt, tune) {
    if (run.speed > 0) {
      run.speed += (0 - run.speed) * Math.min(1, dt * tune.jumpSandEase);
      run.pos += run.speed * dt;
      run.dist = run.pos;
      if (run.speed < tune.jumpIdleMps) run.speed = 0;
    }
    if (run.speed > 0 || run.phase === 'done') return;
    if (run.attempts.length >= tune.jumpAttempts) { run.phase = 'done'; run.timeSecs = run.t; }
    else run.stage = 'between';
  }

  // ---- practice landing ----

  function judgePractice(run, tune) {
    if (run.push >= 1 && run.landing === 'two') {
      run.phase = 'done';
      push(run, { type: 'practiceDone' });
      return;
    }
    push(run, { type: 'practiceRetry' });
    resetAttempt(run, tune);
  }

  // ---- input ----

  function tap(run, side, now, tune) {
    if (run.phase === 'done') return;
    if (side === 'J') {
      // A second JUMP while it is still down: its release was never heard, so it lifts now. Before the
      // flight that lift ends the push and is all the press does; in flight the thumb really did lift
      // and press again, so it is also a landing press.
      if (run.jumpDown !== null) {
        const flying = run.stage === 'flight';
        release(run, 'J', now, tune);
        if (!flying) return;
      }
      if (run.armed && (run.stage === 'runup' || run.stage === 'ready')) { takeOff(run, now, tune); return; }
      landPress(run, 'J', now, tune); // in flight a JUMP tap lands; elsewhere ignored
      return;
    }
    if (run.stage === 'ready' || run.stage === 'runup') {
      if (!run.practice) runupPress(run, now, tune);
      return;
    }
    if (run.stage === 'takeoff') { run.pushPads.push({ side: 'RUN', at: now }); return; } // judged at flight start
    landPress(run, 'RUN', now, tune); // landed, between: ignored inside, no penalty
  }

  // The landing (made simpler on 6 Nov 2026 at Alistair's request): one tap of RUN or JUMP while the
  // hero is in the air is the two-foot landing. No tap before touchdown is a leap. Taps
  // during the push do not count, except RUN within jumpLandGraceMs of the flight start.
  function landPress(run, side, now) {
    if (run.stage !== 'flight' || now >= run.touchAt || run.landJudged) return;
    run.landFirst = { side, at: now };
    run.landJudged = true;
    run.landing = 'two';
  }

  // Only JUMP's release matters (it ends the push); RUN releases are ignored.
  function release(run, side, now, tune) {
    if (side !== 'J' || run.jumpDown === null) return;
    run.jumpDown = null;
    if (run.stage === 'takeoff' && run.phase !== 'done') startFlight(run, now, tune);
  }

  function step(run, dt, now, tune) {
    if (run.phase !== 'done' && run.firstTapAt !== null) run.t = (now - run.goAt) / 1000;
    if (run.stage === 'runup') stepRunup(run, dt, now, tune);
    if (run.stage === 'takeoff' && now - run.jumpAt >= pushMs(tune)) startFlight(run, run.jumpAt + pushMs(tune), tune);
    if (run.stage === 'flight') { stepFlight(run, now, tune); return; } // touchdown waits for the next frame to slide
    if (run.stage === 'landed') stepLanded(run, dt, tune);
  }

  function nextAttempt(run, now, opts, tune) {
    if (run.practice || run.phase === 'done' || run.stage !== 'between') return;
    if (opts.addShoe) run.shoes++;
    run.attempt++;
    resetAttempt(run, tune);
  }

  // ---- results ----

  function techniquePct(run) {
    return run.attempts.reduce((best, a) => Math.max(best, a.pct), 0);
  }

  function result(run) {
    const tune = run.tune;
    const finished = run.phase === 'done' && !run.practice;
    const legal = run.attempts.filter((a) => a.distanceM !== null).map((a) => a.distanceM);
    const allFour = run.attempts.filter((a) => a.pct === 100);
    const passed = finished && allFour.length > 0;
    let stars = 0;
    if (finished) stars = !passed ? 1 : allFour.some((a) => a.distanceM >= tune.jumpExcellentM) ? 3 : 2;
    return {
      kind: 'jump',
      timeSecs: run.timeSecs,
      pct: techniquePct(run),
      stars,
      passed,
      xp: run.xp,
      distanceM: legal.length ? Math.max(...legal) : 0,
      attempts: run.attempts.map((a) => ({ ...a, marks: { ...a.marks } })),
      shoes: run.shoes,
      energyLeft: 1,
    };
  }

  return {
    falseStarts: false,
    noCountdown: true, // ready state; the first tap starts the clock
    len: (tune) => runLen(tune),
    init, tap, release, step, nextAttempt, techniquePct, result,
  };
}
