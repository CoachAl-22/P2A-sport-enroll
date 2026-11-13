// Pure run engine for Explorer's Run. No DOM, no clocks: time arrives via `now` (ms) and `dt` (s).
// Per-kind rules live in RULES; add tempo / skip / reel beside sprint. The long jump lives in jump.js.

import { makeJumpRules } from './jump.js';

const push = (run, ev) => { run.events.push(ev); };

// Beat lights, shared by tempo and skip: they fade after a streak of good taps (combo)
// and come back after a run of misses (missRun).
function lightsGood(run, tune) {
  run.missRun = 0;
  if (run.lightsOn && run.combo >= tune.lightsOffAfter) { run.lightsOn = false; push(run, { type: 'lightsOff' }); }
}
function lightsMiss(run, tune) {
  run.missRun++;
  if (!run.lightsOn && run.missRun >= tune.lightsBackAfter) {
    run.lightsOn = true; run.missRun = 0;
    push(run, { type: 'lightsOn' });
  }
}

const RULES = {
  sprint: {
    falseStarts: true,
    len: (tune) => tune.sprintLen,
    tap(run, side, now, tune) {
      const interval = run.lastTapAt === null ? null : now - run.lastTapAt;
      run.taps++;
      if (run.firstTapAt === null) {
        run.firstTapAt = now;
        if (!run.rolling && now - run.goAt < tune.lightningMs) {
          run.xp += tune.xpBonus;
          push(run, { type: 'xp', amount: tune.xpBonus, label: 'LIGHTNING START' });
        }
      }
      if (run.lastSide === side) {
        run.bad++; run.combo = 0;
        run.speed *= tune.stumbleFactor; run.cad *= tune.stumbleFactor;
        run.lastTapAt = now;
        push(run, { type: 'stumble' });
        return;
      }
      run.lastSide = side; run.lastTapAt = now;
      const inst = interval === null ? tune.cadDefault : Math.min(tune.sprintMaxCad, 1000 / Math.max(interval, tune.minTapGapMs));
      run.cad = run.cad * tune.cadSmooth + inst * (1 - tune.cadSmooth);
      run.good++; run.combo++; run.xp += tune.sprintTapXp;
      if (run.combo % tune.sprintBonusEvery === 0) {
        run.xp += tune.xpBonus;
        push(run, { type: 'xp', amount: tune.xpBonus, label: `CLEAN ${tune.sprintBonusEvery}` });
      }
    },
    step(run, dt, now, tune) {
      if (run.lastTapAt !== null && now - run.lastTapAt > tune.sprintDecayMs) run.cad *= Math.max(0, 1 - tune.sprintDecayRate * dt);
      const target = run.phase === 'done' ? 0 : run.cad * tune.sprintStride;
      run.speed += (target - run.speed) * Math.min(1, dt * (run.phase === 'done' ? tune.speedEaseDown : tune.speedEaseUp));
    },
  },
  tempo: {
    falseStarts: false, // tapping along to the countdown is fine on a tempo run
    len: (tune) => tune.tempoLen,
    init(run) {
      run.beatAt = run.goAt; // ms of the next expected beat
      run.ghostDist = 0;
      run.wall = 0; run.walls = 0;
    },
    tap(run, side, now, tune) {
      const target = 1000 / tune.tempoIntervalMs;
      if (run.firstTapAt === null) run.firstTapAt = now;
      if (run.lastSide === side) {
        run.taps++; run.bad++; run.combo = 0;
        run.speed *= tune.tempoStumbleSpeed; run.cad *= tune.stumbleFactor;
        run.lastTapAt = now;
        push(run, { type: 'stumble' });
        return;
      }
      const interval = run.lastTapAt === null ? null : now - run.lastTapAt;
      run.lastSide = side; run.lastTapAt = now;
      if (interval === null) { run.cad = target * tune.tempoFirstCad; return; }
      const inst = 1000 / Math.max(interval, tune.minTapGapMs);
      run.cad = run.cad * tune.tempoCadSmooth + inst * (1 - tune.tempoCadSmooth);
      if (run.wall > 0) return; // no XP while recovering
      run.taps++;
      const ratio = interval / tune.tempoIntervalMs;
      const [on0, on1] = tune.tempoWindow, [near0, near1] = tune.nearWindow;
      const early = run.dist < tune.freeZone; // rewards only, the energy bar does the teaching
      if (ratio >= on0 && ratio <= on1) {
        run.good++; run.combo++; run.xp += tune.tempoTapXp;
        if (run.combo % tune.tempoComboEvery === 0) {
          run.xp += tune.xpBonus;
          push(run, { type: 'xp', amount: tune.xpBonus, label: 'LOCKED IN' });
        }
        lightsGood(run, tune);
        return;
      }
      const nearMiss = ratio >= near0 && ratio <= near1;
      run.combo = 0;
      if (nearMiss) {
        run.near++; run.xp += tune.tempoNearXp;
        if (!early) push(run, { type: 'near' });
      } else if (!early) {
        push(run, { type: ratio < 1 ? 'tooFast' : 'tooSlow' });
      }
      lightsMiss(run, tune);
    },
    step(run, dt, now, tune) {
      const target = 1000 / tune.tempoIntervalMs;
      if (run.lastTapAt !== null && now - run.lastTapAt > tune.tempoIntervalMs * tune.tempoDecayAfter) {
        run.cad *= Math.max(0, 1 - tune.tempoDecayRate * dt);
      }
      let goal = 0;
      if (run.phase !== 'done') {
        if (run.wall > 0) {
          run.wall -= dt;
          run.energy = Math.min(tune.wallRegenCap / tune.energyMax, run.energy + tune.wallRegen / tune.energyMax * dt);
          goal = tune.wallSpeed;
          if (run.wall <= 0) { run.cad = Math.min(run.cad, target); push(run, { type: 'recovered' }); }
        } else {
          const ratio = run.cad / target;
          run.energy -= tune.drainBase * Math.pow(ratio, 3) * dt / tune.energyMax;
          if (ratio < tune.restRatio) run.energy += tune.restRegen * dt / tune.energyMax;
          if (run.energy <= 0) {
            run.energy = 0; run.wall = tune.wallSecs; run.walls++; run.combo = 0;
            push(run, { type: 'wall' });
          }
          // Going faster than tempo buys very little speed, so mashing never beats pacing.
          const sf = ratio <= 1 ? ratio : Math.min(tune.speedCapRatio, 1 + (ratio - 1) * tune.speedCapSlope);
          goal = target * sf * tune.tempoStride;
        }
        run.energy = Math.max(0, Math.min(1, run.energy));
        run.ghostDist = Math.min(run.len + tune.ghostLead, run.ghostDist + target * tune.tempoStride * dt);
        if (now >= run.beatAt) {
          push(run, { type: 'beat', lightsOn: run.lightsOn });
          run.beatAt += tune.tempoIntervalMs * (Math.floor((now - run.beatAt) / tune.tempoIntervalMs) + 1);
        }
      }
      run.speed += (goal - run.speed) * Math.min(1, dt * (run.phase === 'done' ? tune.speedEaseDown : tune.tempoSpeedEaseUp));
    },
    // Pacing pays at the finish: energy left, and never hitting the wall. Labels are keys the UI maps to text.
    onFinish(run, tune) {
      const energyXp = Math.round(Math.max(0, Math.min(1, run.energy)) * tune.xpEnergyMax);
      if (energyXp > 0) { run.xp += energyXp; push(run, { type: 'xp', amount: energyXp, label: 'energy' }); }
      if (run.walls === 0 && tune.xpNoWall > 0) { run.xp += tune.xpNoWall; push(run, { type: 'xp', amount: tune.xpNoWall, label: 'noWall' }); }
    },
  },
  skip: {
    falseStarts: false,
    noCountdown: true, // ready state; the first tap starts the clock
    len: (tune) => tune.skipCount, // clean skips needed
    init(run) { run.skips = 0; run.tangled = false; run.swing = -1; run.prevSide = null; },
    tap(run, side, now, tune) {
      // Order is judged against the previous PHYSICAL tap (prevSide), so capped taps still flip the expected side.
      const prev = run.prevSide;
      run.prevSide = side;
      // The hero can only skip so fast: a tap this soon after the last counted one is ignored, never punished.
      if (run.lastTapAt !== null && now - run.lastTapAt < tune.skipMinGapMs) return;
      if (run.firstTapAt === null) { run.firstTapAt = now; run.goAt = now; }
      run.taps++;
      if (prev === side) { // order only: no timing judgement anywhere
        run.bad++; run.combo = 0; run.tangled = true;
        run.lastTapAt = now;
        push(run, { type: 'tangle' });
        lightsMiss(run, tune);
        return;
      }
      run.lastSide = side; run.lastTapAt = now;
      run.skips++; run.good++; run.combo++; run.tangled = false;
      run.swing = -run.swing;
      run.xp += tune.skipTapXp;
      push(run, { type: 'xp', amount: tune.skipTapXp, label: 'SKIP' });
      lightsGood(run, tune);
      if (run.skips >= run.len) { run.phase = 'done'; run.timeSecs = (now - run.goAt) / 1000; }
    },
    step(run, dt, now, tune) {
      // constant, tap rate never matters; the hero stops if the child stops (display only, timing unaffected)
      const idle = run.lastTapAt !== null && now - run.lastTapAt > tune.skipIdleMs;
      run.speed = run.taps > 0 && run.phase !== 'done' && !idle ? tune.skipPaceMps : 0;
    },
    finished: (run) => run.skips >= run.len,
  },
};
// The jump drives its own stages (the JUMP button, releases, attempts), so tap / step / release hand
// it the whole run. Its run-up reuses the sprint rule above.
RULES.jump = makeJumpRules({ sprint: RULES.sprint, push });

function rulesFor(kind) {
  const rules = RULES[kind];
  if (!rules) throw new Error('unknown kind');
  return rules;
}

export function createRun(kind, tune, now, opts = {}) {
  if (kind === 'reel') return createReel(tune, now);
  const rules = rulesFor(kind);
  const run = {
    kind, tune,
    len: opts.len ?? rules.len(tune),
    phase: 'count', t: 0, dist: 0, speed: 0, cad: 0,
    xp: 0, good: 0, near: 0, bad: 0, taps: 0, combo: 0, missRun: 0,
    lightsOn: true, energy: 1,
    lastSide: null, lastTapAt: null, firstTapAt: null,
    goAt: now + tune.countMs, timeSecs: 0,
    events: [],
  };
  if (rules.noCountdown || opts.rolling) { run.phase = 'go'; run.goAt = now; } // rolling: the reel is already moving
  if (opts.rolling) run.rolling = true;
  if (rules.init) rules.init(run, tune, opts);
  return run;
}

export function tap(run, side, now) {
  if (side === 'J' && run.kind !== 'jump') return run; // the JUMP button belongs to the long jump only
  if (run.kind === 'reel') return tapReel(run, side, now);
  if (run.kind === 'jump') { RULES.jump.tap(run, side, now, run.tune); return run; }
  if (run.phase === 'count' && now >= run.goAt) run.phase = 'go'; // step has not run yet this frame
  if (run.phase === 'count' && !rulesFor(run.kind).falseStarts) return run;
  if (run.phase === 'count') {
    push(run, { type: 'falseStart' });
    run.goAt = now + run.tune.countMs; // restart the countdown, as in the spike
    return run;
  }
  if (run.phase === 'done') return run;
  if (run.lastTapAt !== null && now - run.lastTapAt < run.tune.dupTapMs) return run; // same touch, dropped
  if (run.phase === 'go') run.phase = 'run';
  rulesFor(run.kind).tap(run, side, now, run.tune);
  return run;
}

// A pad lifted. Only the jump listens; every other kind (and the reel) is returned untouched.
export function release(run, side, now) {
  if (run.kind === 'jump') RULES.jump.release(run, side, now, run.tune);
  return run;
}

// Long jump: from 'between', start the next attempt; opts.addShoe moves the start back one shoe.
// Every other kind (and the reel) is returned untouched.
export function nextAttempt(run, now, opts = {}) {
  if (run.kind === 'jump') RULES.jump.nextAttempt(run, now, opts, run.tune);
  return run;
}

export function step(run, dt, now) {
  const tune = run.tune;
  dt = Math.min(dt, tune.maxDt);
  if (run.kind === 'reel') return stepReel(run, dt, now);
  if (run.kind === 'jump') { RULES.jump.step(run, dt, now, tune); return run; }
  if (run.phase === 'count' && now >= run.goAt) run.phase = 'go';
  if (run.phase === 'count') return run;
  const rules = rulesFor(run.kind);
  rules.step(run, dt, now, tune);
  run.dist += run.speed * dt;
  if (run.phase !== 'done' && !(rules.noCountdown && run.taps === 0)) {
    run.t = (now - run.goAt) / 1000;
    const finished = rules.finished ? rules.finished(run) : run.dist >= run.len;
    if (finished) {
      run.phase = 'done'; run.timeSecs = run.t;
      if (rules.onFinish) rules.onFinish(run, tune);
    }
  }
  return run;
}

export function techniquePct(run) {
  if (run.kind === 'reel') return reelLowestPct(run);
  if (run.kind === 'jump') return RULES.jump.techniquePct(run);
  return run.taps ? Math.round(100 * (run.good + run.near * 0.5) / run.taps) : 0;
}

export function stars(pct, finished, tune) {
  if (!finished) return 0;
  if (pct >= tune.star3Pct) return 3;
  return pct >= tune.passPct ? 2 : 1;
}

export function result(run) {
  if (run.kind === 'reel') return reelResult(run);
  if (run.kind === 'jump') return RULES.jump.result(run);
  const pct = techniquePct(run);
  const finished = run.phase === 'done';
  return {
    kind: run.kind,
    timeSecs: run.timeSecs,
    pct,
    stars: stars(pct, finished, run.tune),
    passed: finished && pct >= run.tune.passPct,
    xp: run.xp,
    energyLeft: run.energy,
  };
}

// ---- Highlight reel: skip, sprint, tempo, sprint stitched into one continuous run ----

const pctOf = (good, near, taps) => (taps ? Math.round(100 * (good + near * 0.5) / taps) : 0);

export function canOpenReel(progress) {
  const u = progress && progress.unlocked;
  return !!(u && u.skip && u.sprint && u.tempo);
}

function createReel(tune, now) {
  const segments = [
    { kind: 'skip', len: tune.reelSkipCount },
    { kind: 'sprint', len: tune.reelSprintLen },
    { kind: 'tempo', len: tune.reelTempoLen },
    { kind: 'sprint', len: tune.reelFinishLen },
  ];
  const reel = {
    kind: 'reel', tune, segments, segIndex: 0, phase: 'run',
    activeKind: segments[0].kind, inner: null,
    xp: 0, dist: 0, speed: 0, energy: 1, lightsOn: true, t: 0, timeSecs: 0,
    startAt: null, baseXp: 0, baseDist: 0, bannerEnd: 0,
    events: [],
  };
  startSegment(reel, now);
  return reel;
}

// The first segment is a skip run with no countdown; the rest roll straight on.
function startSegment(reel, now) {
  const seg = reel.segments[reel.segIndex];
  seg.run = createRun(seg.kind, reel.tune, now, { len: seg.len, rolling: reel.segIndex > 0 });
  reel.inner = seg.run;
  reel.activeKind = seg.kind;
  reel.phase = 'run';
}

function syncReel(reel, now) {
  const inner = reel.inner;
  if (inner.events.length) { reel.events.push(...inner.events); inner.events.length = 0; }
  if (reel.startAt === null && inner.firstTapAt !== null) reel.startAt = inner.firstTapAt;
  // A finished segment is already in baseXp; only a live one adds its own xp.
  reel.xp = reel.baseXp + (reel.phase === 'run' ? inner.xp : 0);
  if (reel.phase === 'run') {
    reel.dist = reel.baseDist + inner.dist;
    reel.speed = inner.speed; reel.energy = inner.energy; reel.lightsOn = inner.lightsOn;
  } else {
    reel.speed = 0;
  }
  if (reel.startAt !== null) reel.t = Math.max(reel.t, (now - reel.startAt) / 1000);
}

function endSegmentIfDone(reel, now) {
  const inner = reel.inner;
  if (reel.phase !== 'run' || inner.phase !== 'done') return;
  if (inner.events.length) { reel.events.push(...inner.events); inner.events.length = 0; } // before the segment event
  push(reel, { type: 'segment', kind: inner.kind, pct: techniquePct(inner) });
  reel.baseXp += inner.xp;
  reel.baseDist += inner.dist;
  if (reel.segIndex === reel.segments.length - 1) {
    reel.phase = 'done';
    reel.timeSecs = reel.t;
  } else {
    reel.segIndex++;
    reel.activeKind = reel.segments[reel.segIndex].kind; // the upcoming one
    reel.phase = 'banner';
    reel.bannerEnd = now + reel.tune.reelBannerSecs * 1000;
  }
}

function tapReel(reel, side, now) {
  if (reel.phase !== 'run') return reel; // banner and done ignore taps, no penalty
  tap(reel.inner, side, now);
  endSegmentIfDone(reel, now);
  syncReel(reel, now);
  return reel;
}

function stepReel(reel, dt, now) {
  if (reel.phase === 'done') return reel;
  if (reel.phase === 'banner') {
    if (now >= reel.bannerEnd) startSegment(reel, now);
  } else {
    step(reel.inner, dt, now);
    endSegmentIfDone(reel, now);
  }
  syncReel(reel, now);
  return reel;
}

// Per-skill counts. Both sprint segments are one skill.
function skillStats(reel) {
  const out = {};
  for (const seg of reel.segments) {
    const run = seg.run;
    if (!run) continue;
    const s = out[seg.kind] || (out[seg.kind] = { good: 0, near: 0, bad: 0, taps: 0 });
    s.good += run.good; s.near += run.near; s.bad += run.bad; s.taps += run.taps;
  }
  return out;
}

function reelLowestPct(reel) {
  const pcts = Object.values(skillStats(reel)).filter((s) => s.taps > 0).map((s) => pctOf(s.good, s.near, s.taps));
  return pcts.length ? Math.min(...pcts) : 0;
}

function reelResult(reel) {
  const stats = skillStats(reel);
  const segments = ['skip', 'sprint', 'tempo'].map((kind) => {
    const s = stats[kind];
    const pct = s ? pctOf(s.good, s.near, s.taps) : 0;
    return { kind, pct, passed: pct >= reel.tune.passPct };
  });
  const finished = reel.phase === 'done';
  const master = finished && segments.every((s) => s.passed);
  const lowest = Math.min(...segments.map((s) => s.pct));
  return {
    kind: 'reel',
    segments,
    master,
    timeSecs: reel.timeSecs,
    xp: reel.xp,
    stars: stars(lowest, finished, reel.tune),
    passed: master,
  };
}
