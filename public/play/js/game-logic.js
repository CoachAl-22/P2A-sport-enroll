// Pure game logic for Explorer's Run: screen flow, level availability, HUD view-model,
// event-to-effect mapping, pad cue and the frame clock. No DOM, no clocks, no storage, no network.
import { CONTENT, SHARED } from './content.js';
import { applyAge } from './tune.js';
import { recordResult, addXp, setFlag } from './store.js';
import { UI, levelStatus, fmtM, MAP_ORDER } from './cards.js';
import { release } from './scoring.js';

export { levelStatus }; // availability lives with the map card that renders it

export const LEVELS = MAP_ORDER;
export const GOLD = '#F5C842';
export const CYAN = '#00B4D8';
export const BUZZ_GAP_MS = 600;

// ---------- flow ----------

// store.js has no "created" flag: a hero counts as made once it is renamed or an age is chosen.
export function isHeroCreated(state) {
  return !!state && (state.hero.name !== 'Explorer' || state.age !== null);
}

// screen: title | hero | age | map | confirm | learn | practice | run | between | result | reflect | unlock | share
// ctx: { created, age, action, unlockPending (any unlock still queued), kind (the level being played),
//   practiceDone (the long jump's landing practice is done on this device) }
// between belongs to the long jump only: the card after attempts 1 and 2. The 'practice' screen (a
// standing landing practice) is no longer reached: Alistair removed it on 6 Nov 2026 as confusing and
// not fun. The engine's practice mode and the practice screen handling are left in place, unused.
export function nextScreen(screen, ctx = {}) {
  const { created = false, age = null, action = null, unlockPending = false, kind = null, practiceDone = false } = ctx;
  switch (screen) {
    case 'title': return created ? (age ? 'map' : 'age') : 'hero';
    case 'hero': return age ? 'map' : 'age';
    case 'age': return 'map';
    case 'map':
      if (action === 'hero') return 'hero';
      if (action === 'age') return 'age';
      if (action === 'reset') return 'confirm';
      return 'learn';
    case 'confirm': return action === 'wipe' ? 'hero' : 'map';
    case 'learn': return 'run';
    case 'practice': return action === 'quit' ? 'map' : 'run';
    case 'run':
      if (action === 'quit') return 'map';
      return action === 'between' ? 'between' : 'result';
    case 'between': return action === 'quit' ? 'map' : 'run';
    case 'result': return action === 'again' ? 'run' : 'reflect';
    case 'reflect': return unlockPending ? 'unlock' : 'map';
    case 'unlock': return 'share';
    case 'share': return unlockPending ? 'unlock' : 'map';
    default: return 'title';
  }
}

// ---------- links from the My Athletic Journey app ----------

// The app's Play button opens the game with ?level=<kind>&from=maj. The link carries a level name
// and nothing else: no athlete, no name, no progress. Anything unexpected is ignored.
// search: location.search. kinds: the level kinds the game has. Returns { level, fromApp }.
export const APP_PATH = '/my-athletic-journey'; // fixed: the way back is never read from the link
export function readLink(search, kinds = []) {
  let q;
  try { q = new URLSearchParams(typeof search === 'string' ? search : ''); } catch { return { level: null, fromApp: false }; }
  const level = q.get('level');
  return { level: kinds.includes(level) ? level : null, fromApp: q.get('from') === 'maj' };
}

// ---------- tune ----------

export function buildTune(age, overrides = {}) {
  return { ...applyAge(age || 'older'), ...overrides };
}

// ---------- run reads ----------

export const innerRun = (run) => (run && run.kind === 'reel' ? run.inner : run);
export const activeKind = (run) => (run ? (run.kind === 'reel' ? run.activeKind : run.kind) : null);

// The result the store records. The reel result has no pct, so its lowest skill pct is used.
export function withPct(res, run) {
  const out = { ...res };
  if (res.kind === 'reel') out.pct = Math.min(...res.segments.map((s) => s.pct));
  if (res.kind === 'skip' && run) out.skips = run.skips;
  return out;
}

// The kind that a finished run unlocks for the first time, or null.
// The reel's result.passed is `master`, so a master run unlocks 'reel'.
export function firstUnlock(progress, res) {
  return res.passed && !(progress.unlocked && progress.unlocked[res.kind]) ? res.kind : null;
}

// The one "may this be saved" rule, used by every save path (run result, Learn XP, Reflect XP,
// unlock queue). runTest: the run was played (or finished) with debug overrides active.
// overridesActive: any debug override is active right now.
export function canSave({ runTest = false, overridesActive = false } = {}) {
  return !runTest && !overridesActive;
}

// Saved XP amounts always come from the un-overridden tune for the hero's age.
const baseTune = (state) => buildTune(state.age);

// Settles a finished run into the saved state.
// Learn XP is paid here, once per finished run that came through a Learn card (never on "Got it",
// never on a Try again run, never on a quit). Nothing is saved unless canSave allows it.
// Returns { state, unlocked: kind | null, preview: kind | null }. In test mode nothing is saved and
// unlocked is null, but preview names the skill a real run would have unlocked, so the unlock and
// share screens can still be shown (marked "not saved") during a play-test.
export function settleRun(state, res, { fromLearn = false, runTest = false, overridesActive = false } = {}) {
  const first = firstUnlock(state.progress, res);
  if (!canSave({ runTest, overridesActive })) return { state, unlocked: null, preview: first };
  let next = recordResult(state, res);
  if (fromLearn) next = addXp(next, baseTune(state).xpLearn);
  return { state: next, unlocked: first, preview: first };
}

// Reflect XP for choosing any answer, under the same save rule.
export function settleReflect(state, { runTest = false, overridesActive = false } = {}) {
  if (!canSave({ runTest, overridesActive })) return state;
  return addXp(state, baseTune(state).xpReflect);
}

// Where focus may go back to when a card closes. Never a text field, never the Map (quit)
// button, never anything in the debug panel, never a hidden, disabled or detached element.
export function isSafeFocus(node) {
  if (!node || typeof node.focus !== 'function' || node.isConnected === false) return false;
  const tag = String(node.tagName || '').toUpperCase();
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BODY', 'HTML'].includes(tag)) return false;
  if (node.id === 'quit' || node.isContentEditable || node.disabled) return false;
  if (typeof node.closest === 'function' && (node.closest('[hidden]') || node.closest('#debug'))) return false;
  if (typeof node.getClientRects === 'function' && node.getClientRects().length === 0) return false;
  return true;
}

// Card buttons ignore presses this soon after a card opens, so a double tap (or a child still
// tapping as the run ends; one young tempo beat is 480 ms) cannot skip a card.
export const CARD_GUARD_MS = 600;

// Focus trap for an open card: the index to move to on Tab (back = Shift+Tab), wrapping.
// current is -1 when focus is outside the list.
export function nextFocusIndex(current, count, back = false) {
  if (count <= 0) return -1;
  if (back) return current <= 0 ? count - 1 : current - 1;
  return current < 0 || current >= count - 1 ? 0 : current + 1;
}
export const cardReady = (openedAt, now) => now - openedAt >= CARD_GUARD_MS;

// First phrase of a level cue, used as the neutral nudge on a tangle or stumble.
export function cuePhrase(kind) {
  const cue = (CONTENT[kind] || CONTENT.skip).learn.cue;
  return cue.split(/[.,]/)[0].trim();
}

// A tap counted when the engine took it as a clean (or in-tempo-window-agnostic) step:
// it moved lastTapAt and did not add a bad tap.
export function tapCounted(before, after) {
  return after.lastTapAt !== before.lastTapAt && after.bad === before.bad;
}
export const snap = (r) => ({ lastTapAt: r.lastTapAt, bad: r.bad, lastSide: r.lastSide });

// Tempo gauge scale: gap ratios from 0.4 to 1.8 map to 0..100 %.
const R_LO = 0.4, R_HI = 1.8;
export const ratioPct = (r) => ((Math.max(R_LO, Math.min(R_HI, r)) - R_LO) / (R_HI - R_LO)) * 100;

// ---------- HUD view-model ----------
// ctx: { now, baseXp, lastRatio }
export function hudView(run, tune, ctx = {}) {
  const { now = 0, baseXp = 0, lastRatio = null } = ctx;
  const inner = innerRun(run);
  const kind = activeKind(run);
  const v = { xpLabel: UI.totalXp, xp: String(baseXp + Math.round(run.xp)), timeLabel: UI.time };
  if (run.kind === 'jump') return jumpHud(run, tune, v);
  if (run.kind === 'reel' && run.phase === 'banner') {
    // between segments: the upcoming segment at zero, not the finished one's numbers
    const len = run.segments[run.segIndex].len;
    v.distLabel = kind === 'skip' ? UI.skip : UI.distance;
    v.dist = kind === 'skip' ? `0 / ${len}` : `0 / ${len} ${UI.metres}`;
  } else if (kind === 'skip') {
    v.distLabel = UI.skip;
    v.dist = `${inner.skips} / ${inner.len}`;
  } else {
    v.distLabel = UI.distance;
    v.dist = `${Math.min(inner.len, Math.floor(inner.dist))} / ${inner.len} ${UI.metres}`;
  }
  if (run.phase === 'count') v.time = String(Math.max(1, Math.ceil((run.goAt - now) / 1000)));
  else v.time = (run.t || 0).toFixed(1);
  const tempo = kind === 'tempo' && !(run.kind === 'reel' && run.phase === 'banner');
  v.showEnergy = tempo;
  v.showTempo = tempo;
  v.energyPct = Math.round(Math.max(0, Math.min(1, inner.energy)) * 100);
  v.low = tempo && inner.energy < 0.25;
  const [w0, w1] = tune.tempoWindow;
  v.zoneLeft = ratioPct(w0);
  v.zoneWidth = ratioPct(w1) - ratioPct(w0);
  v.needle = ratioPct(lastRatio === null ? 1 : lastRatio);
  return v;
}

// Long jump HUD: Total XP / Attempt N of 3 (Practice during the practice landing) / Best. No meters.
function jumpHud(run, tune, v) {
  const total = tune.jumpAttempts;
  const best = bestLegalM(run);
  v.distLabel = UI.attempt;
  v.dist = run.practice ? UI.practice : UI.nOf(Math.min(total, run.attempt + 1), total);
  v.timeLabel = UI.best;
  v.time = best === null ? UI.none : fmtM(best);
  v.showEnergy = false;
  v.showTempo = false;
  v.energyPct = 100;
  v.low = false;
  v.zoneLeft = 0; v.zoneWidth = 0; v.needle = 0;
  return v;
}

// ---------- long jump ----------

// Best legal distance so far in this run (metres), or null when there is none.
export function bestLegalM(run) {
  const legal = (run.attempts || []).filter((a) => a.outcome === 'jump' && a.distanceM !== null).map((a) => a.distanceM);
  return legal.length ? Math.max(...legal) : null;
}

// The jump has no lights-off streak of its own: the lights stay on until an all-four attempt.
export const jumpLightsOn = (run) => !(run.attempts || []).some((a) => a.pct === 100);

// Long jump: the white board glows green while the hero is in the take-off zone (the JUMP button's
// 'now'), a cue for when to press (Alistair, 6 Nov: "a green lit zone"). Like the other lights it
// fades: once jumpBoardGlowHits attempts in this play have earned the board mark, the kid judges it alone.
export function boardGlow(run, tune = run && run.tune) {
  if (!run || run.kind !== 'jump' || run.practice || !tune) return false;
  const hits = (run.attempts || []).filter((a) => a.marks && a.marks.board).length;
  const limit = Number.isFinite(tune.jumpBoardGlowHits) ? tune.jumpBoardGlowHits : 2;
  return hits < limit && jumpButtonState(run, tune) === 'now';
}

// The JUMP button never moves: for the whole jump level the pads row is RUN (left) and JUMP (right).
// Its state: 'off' (dim, flat: presses do nothing), 'ready' (armed: Hero Gold, pulsing), 'now' (armed
// and the hero is inside the board zone, judged exactly as the engine judges onBoard: brighter, bigger
// pulse), 'held' (pushing, or still held in flight). In flight, once let go, it is 'ready' again: it is
// one of the two landing thumbs. After touchdown it is 'off'. null for any other kind.
export function jumpButtonState(run, tune = run && run.tune) {
  if (!run || run.kind !== 'jump') return null;
  if (run.phase === 'done') return 'off';
  if (run.stage === 'takeoff') return 'held';
  if (run.stage === 'flight') return run.jumpDown !== null && run.jumpDown !== undefined ? 'held' : 'ready';
  if (!run.armed || !(run.stage === 'ready' || run.stage === 'runup')) return 'off';
  const gapM = run.boardAt - run.pos; // boardAt already carries the shoes, as the engine's take-off gap does
  const zone = tune.jumpZoneM + (run.attempt === 0 ? tune.jumpWideFirstM : 0);
  const onBoard = gapM >= -tune.jumpToeM && Math.max(0, gapM) <= zone;
  return onBoard ? 'now' : 'ready';
}

// What the frame loop does after stepping a live run (the same decision for every kind; the long
// jump adds the practice finish and the between card). ctx: { doneAt, attemptAt, now, delayMs }.
// Returns 'practiceDone' | 'finish' | 'advance' | 'between' | null.
export function frameDecision(run, { doneAt = null, attemptAt = null, now = 0, delayMs = 0 } = {}) {
  if (!run) return null;
  if (run.phase === 'done') {
    if (doneAt === null) return run.practice ? 'practiceDone' : 'finish';
    return now - doneAt >= delayMs ? 'advance' : null;
  }
  return jumpCardDue(run, attemptAt, now) ? 'between' : null;
}

// Coach line by stage. Practice opens with its own line; after landing nothing until the card.
export function jumpCoach(run, content = CONTENT.jump) {
  switch (run.stage) {
    case 'ready':
    case 'runup':
      if (run.practice) return content.coach.practice;
      return run.armed ? content.phases.takeoff : content.learn.cue;
    case 'takeoff': return content.phases.push;
    case 'flight': return content.phases.landing;
    default: return null;
  }
}

// The between card opens once the hero has stopped in the sand and JUMP_SETTLE_MS (run clock) have
// passed since the attempt was recorded. After the last attempt the run finishes instead.
export const JUMP_SETTLE_MS = 700;
export function jumpCardDue(run, attemptAt, now) {
  return !!run && run.kind === 'jump' && !run.practice && run.phase !== 'done'
    && run.stage === 'between' && attemptAt !== null && now - attemptAt >= JUMP_SETTLE_MS;
}

// Screens where a run is live on the canvas and the pads reach the engine.
export const isLiveScreen = (screen) => screen === 'run' || screen === 'practice';

// Presses and releases reach the engine only on a live screen, with no card open and the run clock
// running. gate: { screen, cardOpen, paused }.
export function inputLive({ screen, cardOpen = false, paused = false } = {}) {
  return isLiveScreen(screen) && !cardOpen && !paused;
}

// A pad lifted: forwarded to the engine (run clock time) only when input is live. Returns whether it was sent.
export function sendRelease(run, side, now, gate) {
  if (!run || !inputLive(gate)) return false;
  release(run, side, now);
  return true;
}

// Before a pause: every pad the UI believes is down is released (while input is still live), so
// nothing stays stuck. down: { L, R, J } booleans, cleared here. Returns the sides sent to the engine.
export function releaseHeldPads(run, down, now, gate) {
  const sent = [];
  for (const s of ['L', 'R', 'J']) {
    if (!down[s]) continue;
    down[s] = false;
    if (sendRelease(run, s, now, gate)) sent.push(s);
  }
  return sent;
}

// The first attempt of the first play on this device (no saved jump best yet): the between card
// shows only what went right.
export function isFirstGo(progress, run) {
  return !(progress && progress.best && progress.best.jump) && !!run && (run.attempts || []).length === 1;
}

// The practice-done flag, under the one save rule. Test mode leaves the state untouched.
export function settlePractice(state, { runTest = false, overridesActive = false } = {}) {
  if (!canSave({ runTest, overridesActive })) return state;
  return setFlag(state, 'jumpPractice', true);
}

// ---------- events to effects ----------
const XP_LABELS = { energy: 'energySaved', noWall: 'noWall' };

// ctx: { tune, kind (active kind when the event is handled), nextKind (reel: upcoming segment),
//   practice (the long jump's practice landing: it is armed from the start, so 'armed' says nothing) }
// Returns { popup: {text, color} | null, sound: name | null, coach: text | null, beat: bool,
//   sand: bool (a dust burst in the pit), settle: bool (start the between-card settle) }.
export function effectFor(ev, ctx) {
  const { tune, kind, nextKind = null, practice = false } = ctx;
  const out = { popup: null, sound: null, coach: null, beat: false, sand: false, settle: false };
  switch (ev.type) {
    case 'xp': {
      if (ev.label === 'marks') { out.popup = { text: `+${ev.amount}`, color: CYAN }; break; } // long jump marks
      if (ev.label === 'allFour') {
        out.popup = { text: `${UI.allFour} +${ev.amount}`, color: GOLD };
        out.sound = 'good';
        break;
      }
      const bonus = ev.amount >= tune.xpBonus;
      const named = XP_LABELS[ev.label]; // tempo finish bonuses carry a key, not text
      const text = named ? `${UI[named]} +${ev.amount}` : bonus ? ev.label : `+${ev.amount}`;
      out.popup = { text, color: bonus ? GOLD : CYAN };
      if (bonus) out.sound = 'good';
      break;
    }
    case 'tangle': // skip: the cue names the fix
      out.popup = { text: cuePhrase(kind), color: CYAN };
      out.sound = 'buzz';
      break;
    case 'stumble': // sprint and tempo: the mistake is the same side twice
      out.popup = { text: kind === 'skip' ? cuePhrase(kind) : UI.otherSide, color: CYAN };
      out.sound = 'buzz';
      break;
    case 'falseStart': // calm: no buzz, no capitals
      out.popup = { text: UI.waitGo, color: CYAN };
      break;
    case 'near':
      out.popup = { text: SHARED.nearly, color: CYAN };
      out.sound = 'nearly';
      break;
    case 'tooFast':
    case 'tooSlow':
      out.coach = CONTENT.tempo.learn.cue;
      break;
    case 'lightsOff':
      out.coach = SHARED.lightsOff;
      break;
    case 'lightsOn':
      out.coach = CONTENT[kind] ? CONTENT[kind].learn.cue : null;
      break;
    case 'beat':
      out.beat = true;
      if (ev.lightsOn) out.sound = 'tick';
      break;
    case 'wall':
      out.coach = CONTENT.tempo.learn.lines[0];
      break;
    case 'recovered':
      out.coach = CONTENT.tempo.learn.cue;
      break;
    case 'segment':
      out.popup = { text: `${ev.pct}%`, color: CYAN };
      out.coach = nextKind ? CONTENT[nextKind].learn.cue : null;
      break;
    // long jump: calm on a foul or a no-jump (cyan, no sound, never red)
    case 'armed':
      if (practice) break; // practice stands armed (and re-arms on every retry): the practice line leads
      out.coach = CONTENT.jump.phases.takeoff;
      out.sound = 'tick';
      break;
    case 'takeoff':
      if (ev.onBoard) out.sound = 'good';
      break;
    case 'foul':
      out.popup = { text: UI.overBoard, color: CYAN };
      break;
    case 'nojump':
      out.popup = { text: UI.noJump, color: CYAN };
      break;
    case 'flight': // in the air: tell the child to tap for the two-foot landing (not if they already have)
      if (!ev.landed) { out.popup = { text: UI.tapToLand, color: GOLD, big: true }; out.sound = 'tick'; }
      break;
    case 'land':
      out.sound = 'land';
      out.sand = true;
      break;
    case 'attempt': {
      const m = ev.marks || {};
      const all = !!(m.fast && m.board && m.push && m.landing);
      if (ev.outcome === 'jump' && ev.distanceM !== null) out.popup = { text: fmtM(ev.distanceM), color: all ? GOLD : CYAN };
      out.settle = true;
      break;
    }
    case 'practiceRetry':
      out.popup = { text: UI.tryAgain, color: CYAN };
      break;
    default:
      break;
  }
  return out;
}

// Buzz plays at most once per BUZZ_GAP_MS.
export function allowBuzz(lastAt, now) {
  return lastAt === null || now - lastAt >= BUZZ_GAP_MS;
}

// ---------- pad cue ----------
// Which pads glow gold. Only while the lights are on and the run is live.
// lastSide is the side the cue is judged against (see padCueFor):
// skip/sprint: the side opposite it (both before the first tap).
// tempo: on a beat flash only, the side opposite it (LEFT before the first).
export function padCue({ kind, phase, lightsOn, lastSide, beatFlash = false }) {
  const none = { L: false, R: false };
  if (!lightsOn || phase === 'count' || phase === 'banner' || phase === 'done') return none;
  if (kind === 'tempo') {
    if (!beatFlash) return none;
    return lastSide === 'L' ? { L: false, R: true } : { L: true, R: false };
  }
  if (kind === 'skip' || kind === 'sprint') {
    if (lastSide === null || lastSide === undefined) return { L: true, R: true };
    return lastSide === 'L' ? { L: false, R: true } : { L: true, R: false };
  }
  return none;
}

// The pad cue for a live run. Skip judges order against the previous PHYSICAL tap
// (scoring.js prevSide, so a rate-capped tap still flips the expected side), so the skip cue
// must too: following the light can never tangle. Sprint and tempo use the last counted tap.
export function padCueFor(run, beatFlash = false) {
  if (run.kind === 'jump') return jumpPadCue(run);
  const inner = innerRun(run);
  const kind = activeKind(run);
  const side = kind === 'skip' ? inner.prevSide : inner.lastSide;
  return padCue({
    kind,
    phase: run.kind === 'reel' && run.phase === 'run' ? inner.phase : run.phase,
    lightsOn: run.lightsOn,
    lastSide: side,
    beatFlash,
  });
}

// Long jump: the RUN button (the left pad) glows on the run-up, and keeps glowing once JUMP is ready
// (the child must keep running to the board); in flight it glows with JUMP for the landing. Off while
// pushing, in practice before the flight, and once an all-four attempt exists. The right pad is hidden
// for the jump, so R is never lit. The JUMP button's own look is jumpButtonState.
export function jumpPadCue(run) {
  const none = { L: false, R: false };
  if (!jumpLightsOn(run) || run.phase === 'done') return none;
  switch (run.stage) {
    case 'ready':
    case 'runup':
      return run.practice ? none : { L: true, R: false };
    case 'flight': return { L: true, R: false };
    default: return none;
  }
}

// ---------- popups and dust ----------
export const POPUP_CAP = 6;
export const DUST_CAP = 12;

export function pushCapped(list, item, cap) {
  list.push(item);
  while (list.length > cap) list.shift();
  return list;
}

// Ages every item by dt; removes spent ones. vy moves popups up; vx drifts dust.
export function ageFx(list, dt) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life -= dt;
    if (p.vy) p.y += p.vy * dt;
    if (p.vx) p.x += p.vx * dt;
    if (p.life <= 0) list.splice(i, 1);
  }
  return list;
}

// ---------- run clock ----------
// Engine time that excludes paused time. now(wall) is wall time minus every paused stretch;
// while paused it holds at the moment of pausing. pause and resume are idempotent.
export function createRunClock() {
  let offset = 0;
  let pausedAt = null;
  return {
    get paused() { return pausedAt !== null; },
    now(wall) { return (pausedAt !== null ? pausedAt : wall) - offset; },
    pause(wall) { if (pausedAt === null) pausedAt = wall; },
    resume(wall) { if (pausedAt !== null) { offset += wall - pausedAt; pausedAt = null; } },
    // Drops ms of run time (a stalled frame beyond the sub-step budget), like a tiny pause.
    drop(ms) { if (ms > 0) offset += ms; },
  };
}

// ---------- sub-steps ----------
// A long frame (a slow phone) is split into engine steps of at most maxDt each, so run time and
// distance stay in step. More than capSecs in one frame is a stall: the excess is returned as
// dropMs for the caller to remove from the run clock (createRunClock().drop).
export const MAX_FRAME_SECS = 0.5;
// A maxDt that is not a finite number of at least 5 ms (the debug panel takes any input) falls
// back to 0.1; a non-finite span is no time at all; at most MAX_PLAN_STEPS steps come back.
const MIN_STEP_SECS = 0.005;
const FALLBACK_STEP_SECS = 0.1;
const MAX_PLAN_STEPS = 200;
export function planSteps(fromMs, toMs, maxDt, capSecs = MAX_FRAME_SECS) {
  const stepMax = Number.isFinite(maxDt) && maxDt >= MIN_STEP_SECS ? maxDt : FALLBACK_STEP_SECS;
  const raw = (toMs - fromMs) / 1000;
  let span = Number.isFinite(raw) && raw > 0 ? raw : 0;
  const dropMs = span > capSecs ? (span - capSecs) * 1000 : 0;
  span = Math.min(span, capSecs);
  const steps = [];
  let t = fromMs;
  while (span > 1e-9 && steps.length < MAX_PLAN_STEPS) {
    const dt = Math.min(stepMax, span);
    span -= dt;
    t += dt * 1000;
    steps.push({ dt, now: t });
  }
  return { steps, dropMs };
}

// ---------- frame clock ----------
// tick(now) returns the seconds since the last tick, capped at maxDt; 0 while paused.
// resume(now) restarts from now, so the first frame after a hidden tab has a tiny dt.
export function createClock(now, maxDt) {
  let last = now;
  let paused = false;
  return {
    get paused() { return paused; },
    pause() { paused = true; },
    resume(t) { paused = false; last = t; },
    tick(t) {
      if (paused) { last = t; return 0; }
      const dt = Math.max(0, Math.min(maxDt, (t - last) / 1000));
      last = t;
      return dt;
    },
  };
}
