// Tuning knobs for Explorer's Run. Values carried over from spike/index.html.
export const TUNE = {
  sprintLen: 60,           // metres
  tempoLen: 300,           // metres
  pxPerM: 12,
  sprintStride: 0.95,      // m/s per tap-per-second
  sprintMaxCad: 11,        // taps per second cap
  sprintDecayMs: 350,      // no tap for this long and you slow down
  tempoIntervalMs: 400,    // the target beat between taps (set by age profile)
  tempoStride: 3.4,
  tempoWindow: [0.7, 1.4], // tap gap / target gap counted as "on tempo" (set by age profile)
  nearWindow: [0.5, 1.75], // just outside the window still earns a little
  drainBase: 1.3,          // energy per second at perfect tempo
  wallSecs: 2.5,
  freeZone: 100,           // metres with rewards only, no warnings
  lightsOffAfter: 8,       // on-tempo taps in a row before the beat lights fade
  lightsBackAfter: 2,      // misses in a row that bring the lights back
  passPct: 70,             // technique % needed to unlock a skill
  skipCount: 20,
  skipPaceMps: 2.2,
  skipTapXp: 3,            // xp per clean skip
  skipIdleMs: 1500,        // display only: no counted skip for this long and the hero stops
  skipMinGapMs: 280,       // fastest counted skip; taps sooner than this after the last counted skip tap are ignored
  lightningMs: 350,
  maxDt: 0.1,
  sprintBonusEvery: 10,
  tempoComboEvery: 8,
  xpLearn: 5,
  xpReflect: 5,
  xpEnergyMax: 20,         // tempo finish: energy left (0..1) times this, as XP
  xpNoWall: 10,            // tempo finish: bonus when the run never hit the wall
  star3Pct: 90,            // technique % for 3 stars (2 stars is passPct)
  countMs: 2100,           // countdown length before GO
  dupTapMs: 25,            // a tap this soon after the last counted tap is the same touch; dropped
  minTapGapMs: 60,         // floor on tap gap when working out cadence
  cadDefault: 4,           // cadence (taps/s) credited to the first tap
  cadSmooth: 0.55,         // weight of the old cadence when blending in a new tap
  stumbleFactor: 0.5,      // speed and cadence multiplier on a same-side tap
  sprintDecayRate: 3,      // cadence loss per second once taps stop
  speedEaseUp: 4,          // how fast speed chases its target while running
  speedEaseDown: 1.5,      // how fast speed settles to zero after the finish
  sprintTapXp: 2,          // xp per clean sprint tap
  xpBonus: 10,             // xp for a lightning start or a clean-tap streak
  tempoTapXp: 3,           // xp per on-tempo tap
  tempoNearXp: 1,          // xp per near-miss tap
  tempoFirstCad: 0.8,      // first tap credits this fraction of the target cadence
  tempoCadSmooth: 0.5,     // weight of the old cadence when blending in a tempo tap
  tempoStumbleSpeed: 0.75, // speed multiplier on a same-side tempo tap (cadence uses stumbleFactor)
  tempoDecayAfter: 1.6,    // no tap for this many target gaps and cadence starts to fade
  tempoDecayRate: 1.5,     // cadence loss per second once it fades
  tempoSpeedEaseUp: 3,     // how fast tempo speed chases its target while running
  energyMax: 100,          // the drain, regen and cap numbers below are out of this
  restRatio: 0.6,          // cadence ratio below this lets energy recover
  restRegen: 1.5,          // energy regained per second while resting
  wallSpeed: 2.5,          // m/s crawl while hitting the wall
  wallRegen: 12,           // energy regained per second during the wall
  wallRegenCap: 30,        // the wall tops energy up to this much, no higher
  speedCapRatio: 1.2,      // fastest speed factor, however quick the taps
  speedCapSlope: 0.25,     // speed factor gained per unit of cadence ratio above 1
  ghostLead: 20,           // metres the ghost pacer may run past the finish
  reelSkipCount: 10,       // reel: clean skips in the opening skip segment
  reelSprintLen: 40,       // reel: metres in the first sprint segment
  reelTempoLen: 150,       // reel: metres in the tempo segment
  reelFinishLen: 30,       // reel: metres in the finishing sprint
  reelBannerSecs: 1.5,     // reel: pause between segments, taps ignored
  jumpRunLen: 30,          // long jump: metres from the start cone to the foul line
  jumpPitGapM: 1,          // long jump: metres of runway between the foul line and the sand (drawing only)
  jumpPitLen: 18,          // long jump: metres of sand past the foul line (tripled 6 Nov at Coach Al's request)
  jumpRunThroughM: 6,      // long jump: metres past the foul line with no JUMP before it counts as a no-jump
  jumpMaxCad: 6.8,         // long jump: run-up cadence cap (taps/s), lower than the sprint's
  jumpZoneM: 0.6,          // long jump: board zone, metres before the foul line that earn "on the board" (0.8 until 6 Nov: looked too wide zoomed in)
  jumpToeM: 0.1,           // long jump: a toe this far over the line is still legal (gap 0)
  jumpPushMs: 220,         // long jump: holding JUMP this long is a full push
  jumpPushMark: 0.8,       // long jump: push fraction that earns the push mark
  jumpFastPct: 0.85,       // long jump: take-off speed / top speed that earns the fast mark
  jumpStutterM: 5,         // long jump: a stutter (pause in tapping) this close before take-off loses the fast mark
  jumpStutterMs: 350,      // long jump: a gap between RUN taps longer than this is a stutter
  jumpLeapCut: 0.15,       // long jump: distance lost on a leap landing
  jumpLagMs: 80,           // long jump: phone touch delay; the take-off is judged where the hero was this long before the press
  jumpShoeM: 0.3,          // long jump: one shoe back moves the start this far
  jumpAttempts: 3,
  jumpMarkXp: 5,           // long jump: xp per mark earned on an attempt
  jumpAllFourXp: 10,       // long jump: bonus for an attempt with all four marks
  jumpExcellentM: 4.0,     // long jump: distance for 3 stars
  jumpDistScale: 4.95,     // long jump: flight metres at full run-up speed and full push
  jumpFlatShare: 0.7,      // long jump: share of the flight a jab (no push) still gets
  jumpMaxM: 5.2,           // long jump: longest possible flight
  jumpGravity: 9.8,        // long jump: m/s^2, for the flight arc
  jumpWideFirstM: 0.3,
  jumpBoardGlowHits: 2,    // long jump: the board stops glowing green once this many attempts have been on the board     // long jump: extra board zone on the first attempt of the level
  jumpIdleSecs: 6,         // long jump: standing still on the runway this long ends the attempt (no jump)
  jumpIdleMps: 0.2,        // long jump: below this speed the hero counts as standing still
  jumpHangScale: 1.8,      // long jump: the flight plays this many times slower than real, for the landing tap
  jumpMinFlightSecs: 0.35, // long jump: shortest flight, so there is always time to land
  jumpSandEase: 6,         // long jump: how fast the hero slows to a stop in the sand
  jumpPracticeMps: 4.5,    // long jump: nominal speed for the standing practice landing
  jumpArmM: 4,             // long jump: JUMP only takes off within this many metres of the foul line
  jumpFastMinPct: 0.6,     // long jump: fast mark needs a top speed of at least this share of full speed
  jumpSpeedPow: 1.5,       // long jump: flight grows with (take-off speed / full speed) to this power
  jumpLandGraceMs: 60      // long jump: landing pads this soon before the flight starts still count
};

// Age profiles: younger athletes get a slower beat and a wider window.
// Stride scales so the ghost pace stays similar.
export const AGE = {
  young: { label: '8 to 9', tempoIntervalMs: 480, tempoWindow: [0.6, 1.6], tempoStride: 4.1, lightningMs: 500,
    jumpZoneM: 0.9, jumpExcellentM: 3.0, jumpDistScale: 3.8 },
  older: { label: '10 to 12', tempoIntervalMs: 400, tempoWindow: [0.7, 1.4], tempoStride: 3.4 }
};

// Returns a new object with the age profile applied over base. base is never mutated.
export function applyAge(key, base = TUNE) {
  return { ...base, ...(AGE[key] || {}) };
}
