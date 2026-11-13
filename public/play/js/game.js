// Explorer's Run: DOM wiring. Input, frame loop, HUD, cards and the debug panel.
// Pure logic lives in game-logic.js (unit-tested); this file only touches the page inside boot().
// No network code of any kind: nothing about the hero or the runs ever leaves the device.
import { createRun, tap, step, result, nextAttempt } from './scoring.js';
import { TUNE } from './tune.js';
import { CONTENT } from './content.js';
import {
  loadState, saveMerged, mergeStates, clearState, isUntouchedState, normaliseName, HERO_OPTIONS, loadMuted, saveMuted,
} from './store.js';
import { makeUnlockCode } from './unlock-code.js';
import { createArt, JUMP_PX } from './art.js';
import { createAudio } from './audio.js';
import {
  UI, titleCard, heroMaker, ageCard, mapCard, learnCard, resultCard, reelResultCard,
  reflectCard, unlockCard, shareCard, confirmCard, attemptCard,
} from './cards.js';
import {
  nextScreen, isHeroCreated, buildTune, innerRun, activeKind, withPct, tapCounted, snap, settleRun,
  hudView, effectFor, allowBuzz, settleReflect, canSave, isSafeFocus, padCueFor, pushCapped, ageFx, createClock, createRunClock, planSteps, cardReady, nextFocusIndex,
  POPUP_CAP, DUST_CAP, CYAN,
  isLiveScreen, inputLive, sendRelease, jumpButtonState, boardGlow, readLink, APP_PATH, jumpCoach, frameDecision, settlePractice, releaseHeldPads, isFirstGo,
} from './game-logic.js';

const KEYS = { ArrowLeft: 'L', KeyA: 'L', KeyF: 'L', ArrowRight: 'R', KeyD: 'R', KeyJ: 'R' };
const JUMP_KEYS = ['Space', 'ArrowUp']; // long jump only: the JUMP button
const LAND_KEY = 'ArrowDown';           // long jump only: RUN and JUMP together (a keyboard landing)
const RESULT_DELAY_MS = 900;   // let the hero ease to a stop before the result card
const LONG_PRESS_MS = 800;     // debug panel toggle on the title
const IDLE_DRAW_MS = 200;      // the title scene under a dark card redraws at 5 fps, not 60

export function boot() {
  const $ = (id) => document.getElementById(id);
  const el = {
    cv: $('cv'), xp: $('hXP'), dist: $('hDist'), time: $('hTime'), hud2: $('hud2'),
    energy: $('hEnergy'), tempo: $('hTempo'), zone: $('hZone'), needle: $('hNeedle'),
    coach: $('coachline'), padL: $('padL'), padR: $('padR'), padJ: $('padJ'), veil: $('veil'), card: $('card'),
    debug: $('debug'), quit: $('quit'), mute: $('mute'), title: $('title'), skip: $('skipPractice'),
  };
  el.pads = el.padL.parentElement;
  el.quit.textContent = UI.map;
  el.mute.textContent = UI.sound;
  el.skip.textContent = UI.skipPractice;
  el.padJ.querySelector('.pad-label').textContent = UI.jump;
  el.distCaption = el.dist.previousElementSibling;
  el.timeCaption = el.time.previousElementSibling;
  el.xpCaption = el.xp.previousElementSibling;
  el.energyMeter = el.energy.closest('.meter');
  if (!el.coach.hasAttribute('aria-live')) el.coach.setAttribute('aria-live', 'polite');

  const art = createArt(el.cv);
  const audio = createAudio();
  audio.setMuted(loadMuted()); // remembered on this device
  el.mute.setAttribute('aria-pressed', String(!audio.muted));
  const clock = createClock(performance.now(), TUNE.maxDt); // frame dt
  const runClock = createRunClock(); // engine time: wall time minus paused time
  const rnow = () => runClock.now(performance.now());
  const reducedMotion = (() => {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { return false; }
  })();
  let lastIdleDraw = -Infinity;
  let state = loadState();
  let overrides = {}; // debug panel, this session only; TUNE is never mutated
  // The one save path: re-read storage, merge (another tab may have saved), write. false when
  // storage is off; the game carries on.
  const save = () => { const r = saveMerged(state); state = r.state; return r.ok; };
  const testMode = () => Object.keys(overrides).length > 0;
  const testTag = document.createElement('span');
  testTag.className = 'testtag';
  testTag.textContent = UI.testMode;
  testTag.hidden = true;
  el.title.parentElement.append(testTag);

  const S = {
    link: readLink(window.location.search, Object.keys(CONTENT)), // { level, fromApp } from the app's Play button
    screen: 'title', level: null, draft: null, primary: null, cardOpenedAt: 0, focusBefore: null,
    run: null, runTune: null, baseXp: 0, evKind: null, prevPhase: null, doneAt: null,
    fromLearn: false, heroFromMap: false, clearFailed: false, lastFirst: false, runTest: false, lastRes: null, pendings: [], playedSkip: false,
    lastRatio: null, beatFlashUntil: 0, lastBuzz: null, limb: 0, popups: [], dust: [], coach: null,
    // long jump: when the last attempt was recorded (run clock), resume the same run after the
    // between card, practice retries so far, and which pads the UI believes are held down
    attemptAt: null, keepRun: false, practiceRetries: 0, down: { L: false, R: false, J: false },
  };

  const levelOf = (kind) => ({ kind, ...CONTENT[kind] });
  const flowCtx = (action = null) => ({
    created: isHeroCreated(state), age: state.age, action,
    unlockPending: S.pendings.length > 0,
    kind: S.level, practiceDone: practiceDone(),
  });
  const practiceDone = () => !!(state.flags && state.flags.jumpPractice);
  const advance = (action) => show(nextScreen(S.screen, flowCtx(action)));

  // ---------- coach line and fx ----------
  function setCoach(text) {
    if (text === S.coach) return;
    S.coach = text;
    if (!text) { el.coach.textContent = ''; return; }
    const who = document.createElement('b');
    who.textContent = `${UI.coachAl}: `;
    el.coach.replaceChildren(who, document.createTextNode(text));
  }
  const popup = (text, color, big = false) => pushCapped(S.popups, { text, color, big, life: 0.9, y: 0, vy: -24 }, POPUP_CAP);
  const puff = (speed) => pushCapped(S.dust, { x: 114 + Math.random() * 10, y: 250, life: 0.35, vx: -(speed * (S.run && S.run.kind === 'jump' ? JUMP_PX : 12)) - 20 }, DUST_CAP);
  const sandBurst = () => { // long jump touchdown: a spray of sand both ways around the feet
    for (let i = 0; i < 6; i++) {
      pushCapped(S.dust, { x: 110 + Math.random() * 20, y: 248 + Math.random() * 5, life: 0.3 + Math.random() * 0.2, vx: (Math.random() - 0.5) * 70, vy: -(8 + Math.random() * 18) }, DUST_CAP);
    }
  };
  // "Skip practice" sits in the title's place once the practice landing has needed a retry.
  function syncSkip() {
    const on = S.screen === 'practice' && S.practiceRetries >= 1 && S.doneAt === null;
    el.skip.hidden = !on;
    el.title.hidden = on;
  }

  // ---------- cards ----------
  function openCard(c, { peek = false } = {}) {
    if (el.veil.hidden) S.focusBefore = document.activeElement;
    S.cardOpenedAt = performance.now();
    el.card.innerHTML = c.html; // cards.js escapes every dynamic value
    paintSwatches();
    el.card.setAttribute('aria-labelledby', c.headingId);
    el.veil.classList.toggle('peek', peek);
    el.veil.hidden = false;
    clearPads();
    const prim = c.actions.find((a) => a.primary);
    S.primary = prim ? prim.id : null;
    const target = (S.primary && el.card.querySelector(`[data-action="${S.primary}"]`)) || $(c.headingId);
    if (target) target.focus({ preventScroll: true });
  }
  // The CSP forbids style="" in HTML strings, so swatch colours ride in data-colour.
  function paintSwatches() {
    el.card.querySelectorAll('[data-colour]').forEach((n) => { n.style.backgroundColor = n.dataset.colour; });
  }
  // Deliberate wipe: storage key removed, memory back to defaults, pending unlocks dropped.
  // A hard wipe: no merge. If the key could not be removed and progress is still stored, the
  // hero maker says so instead of pretending.
  function wipeAll() {
    const ok = clearState();
    S.clearFailed = !ok && !isUntouchedState(loadState());
    state = loadState(null); // null storage gives the fresh default state
    audio.setMuted(false); // the stored mute flag went with the wipe; match it now
    el.mute.setAttribute('aria-pressed', 'true');
    S.playedSkip = false; S.pendings = [];
  }
  // Another tab saved: fold its progress in, unless a run is live. Re-render the map if showing.
  function refreshFromStorage() {
    if (S.run && (isLiveScreen(S.screen) || S.screen === 'between')) return;
    const before = JSON.stringify(state);
    state = mergeStates(state, loadState());
    if (JSON.stringify(state) !== before && S.screen === 'map') show('map');
  }
  function closeCard() {
    el.veil.hidden = true;
    el.veil.classList.remove('peek');
    S.primary = null;
    const f = S.focusBefore;
    S.focusBefore = null;
    const back = isSafeFocus(f) ? f : el.padL;
    back.focus({ preventScroll: true });
  }

  function show(screen) {
    S.screen = screen;
    // Map stays reachable on the between card too (above the veil there), so a child can leave mid-level.
    el.quit.hidden = !(isLiveScreen(screen) || screen === 'between');
    el.quit.classList.toggle('over', screen === 'between');
    if (screen !== 'run' && screen !== 'result') setCoach('');
    switch (screen) {
      case 'title': S.run = null; openCard(titleCard()); break;
      case 'hero': S.run = null; S.draft = { ...state.hero }; openCard(heroMaker(S.draft, HERO_OPTIONS, { fromMap: S.heroFromMap, clearFailed: S.clearFailed }), { peek: true }); break;
      case 'age': openCard(ageCard(state.age)); break;
      case 'map':
        S.run = null;
        if (S.link.level) { // opened from the app's Play button: straight to that level's Learn card, once
          S.level = S.link.level; S.link = { ...S.link, level: null };
          show('learn');
          return;
        }
        openCard(mapCard(state.progress, CONTENT, { hero: state.hero, playedSkip: S.playedSkip, backToApp: S.link.fromApp }));
        break;
      case 'confirm': openCard(confirmCard()); break;
      case 'learn': openCard(learnCard(levelOf(S.level))); break;
      case 'practice': closeCard(); startRun({ practice: true }); break;
      case 'run':
        closeCard();
        if (S.keepRun) S.keepRun = false; // the long jump's next attempt: same run, same clock
        else startRun();
        break;
      case 'between': {
        const recs = S.run.attempts;
        openCard(attemptCard(recs[recs.length - 1], recs.length, S.runTune.jumpAttempts, { firstGo: isFirstGo(state.progress, S.run) }));
        break;
      }
      case 'result':
        openCard(S.lastRes.kind === 'reel'
          ? reelResultCard(S.lastRes, levelOf('reel'), { testMode: S.runTest })
          : resultCard(S.lastRes, levelOf(S.level), undefined, S.runTune.passPct, { testMode: S.runTest, firstUnlock: S.lastFirst }));
        break;
      case 'reflect': openCard(reflectCard(levelOf(S.level))); break;
      case 'unlock':
        audio.play('unlock');
        openCard(unlockCard(state.hero, levelOf(S.pendings[0].kind), S.pendings[0].res, { testMode: S.pendings[0].test }));
        break;
      case 'share': {
        const { kind, res, test } = S.pendings.shift();
        const date = new Date();
        const code = test ? null : makeUnlockCode({ name: state.hero.name, skill: kind, pct: res.pct, date });
        openCard(shareCard(state.hero, levelOf(kind), res, code, date, { testMode: test }));
        break;
      }
      default: break;
    }
    syncSkip();
  }

  function onAction(id) {
    if (!id) return;
    const [verb, a, b] = id.split(':');
    switch (verb) {
      case 'play': case 'learn-go': case 'next': case 'unlock-next': case 'share-done':
        if (verb === 'learn-go') S.fromLearn = true; // Learn XP is paid when this run finishes
        advance();
        break;
      case 'pick': {
        S.draft[a] = Number(b);
        el.card.querySelectorAll(`[data-action^="pick:${a}:"]`).forEach((btn) => {
          const on = btn.dataset.action === id;
          btn.classList.toggle('sel', on);
          btn.setAttribute('aria-pressed', String(on));
        });
        break;
      }
      case 'hero-done': {
        const input = $('heroName');
        state = { ...state, hero: { ...S.draft, name: normaliseName(input ? input.value : '') } };
        save();
        S.heroFromMap = false; S.clearFailed = false;
        advance();
        break;
      }
      case 'age': state = { ...state, age: a }; save(); advance(); break;
      case 'level': S.level = a; advance(); break;
      case 'learn-practice': S.fromLearn = true; advance('practice'); break;
      case 'attempt-next': case 'attempt-keep': resumeJump(false); break;
      case 'attempt-shoe': resumeJump(true); break;
      case 'change-hero': S.heroFromMap = true; advance('hero'); break;
      case 'start-again': advance('reset'); break;
      case 'keep-playing': advance('keep'); break;
      case 'confirm-wipe': wipeAll(); S.heroFromMap = false; advance('wipe'); break;
      case 'change-age': advance('age'); break;
      case 'back-app': window.location.assign(APP_PATH); break;
      case 'again': S.fromLearn = false; advance('again'); break;
      case 'reflect':
        if (canSave({ runTest: S.runTest, overridesActive: testMode() })) {
          state = settleReflect(state, { runTest: S.runTest, overridesActive: testMode() });
          save();
        }
        advance();
        break;
      default: break;
    }
  }

  el.card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled || !el.card.contains(btn)) return;
    if (!cardReady(S.cardOpenedAt, performance.now())) return; // a double tap must not skip a card
    audio.unlock();
    onAction(btn.dataset.action);
  });
  el.card.addEventListener('input', (e) => { // live hero name in the draft
    if (e.target && e.target.id === 'heroName' && S.draft) S.draft.name = normaliseName(e.target.value);
  });

  // ---------- runs ----------
  // opts.practice: the long jump's standing practice landing (no XP, no result).
  function startRun(opts = {}) {
    const now = rnow();
    S.runTune = buildTune(state.age, overrides);
    S.runTest = testMode();
    S.run = createRun(S.level, S.runTune, now, opts.practice ? { practice: true } : {});
    S.baseXp = state.progress.xp;
    S.evKind = activeKind(S.run);
    S.prevPhase = S.run.phase;
    S.lastStepAt = now;
    S.doneAt = null; S.lastRatio = null; S.beatFlashUntil = 0; S.limb = 0;
    S.attemptAt = null; S.keepRun = false; S.practiceRetries = 0;
    S.popups.length = 0; S.dust.length = 0;
    setCoach(opts.practice ? CONTENT.jump.coach.practice : CONTENT[S.evKind].learn.cue);
  }

  // Practice landing done (or skipped): the flag is saved under the one save rule, never in test mode.
  function finishPractice() {
    const gate = { runTest: S.runTest || testMode(), overridesActive: testMode() };
    if (canSave(gate)) { state = settlePractice(state, gate); save(); }
  }

  // Between-attempts card buttons: the next attempt of the same run, from the run clock.
  function resumeJump(addShoe) {
    if (S.screen !== 'between' || !S.run) return;
    const now = rnow();
    nextAttempt(S.run, now, { addShoe });
    S.lastStepAt = now; // no catch-up steps for the time the card was open
    S.attemptAt = null;
    S.keepRun = true;
    advance();
  }

  function finishRun() {
    const run = S.run;
    const kind = run.kind;
    const res = withPct(result(run), run);
    S.runTest = S.runTest || testMode(); // snapshot at finish; later override changes never relabel it
    const settled = settleRun(state, res, { fromLearn: S.fromLearn, runTest: S.runTest, overridesActive: testMode() });
    S.fromLearn = false;
    if (canSave({ runTest: S.runTest, overridesActive: testMode() })) {
      state = settled.state;
      save();
      if (settled.unlocked) S.pendings.push({ kind: settled.unlocked, res, test: false });
    } else if (settled.preview) {
      // play-test: show the unlock moment, save nothing; a later real pass unlocks it for real
      S.pendings.push({ kind: settled.preview, res, test: true });
    }
    S.lastFirst = !!settled.preview;
    if (kind === 'skip') S.playedSkip = true;
    S.lastRes = res;
    audio.play('fanfare');
  }

  const gate = () => ({ screen: S.screen, cardOpen: !el.veil.hidden, paused: runClock.paused });
  function press(side) {
    const run = S.run;
    if (!run || !inputLive(gate())) return;
    const now = rnow();
    const inner = innerRun(run);
    const before = snap(inner);
    tap(run, side, now);
    if (!tapCounted(before, inner)) return;
    audio.play(side === 'L' ? 'stepL' : 'stepR');
    puff(run.speed || 0);
    if (activeKind(run) === 'tempo' && before.lastTapAt !== null) {
      S.lastRatio = (now - before.lastTapAt) / S.runTune.tempoIntervalMs;
    }
  }

  // The JUMP button (long jump only). Its sound comes from the take-off event.
  function pressJump() {
    const run = S.run;
    if (!run || run.kind !== 'jump' || !inputLive(gate())) return;
    tap(run, 'J', rnow());
  }
  // A pad lifted: the UI lets go, and the engine hears it when input is live (run clock time).
  function lift(side) {
    S.down[side] = false;
    padFor(side).classList.remove('down');
    sendRelease(S.run, side, rnow(), gate());
  }

  function handleEvents(run, now) {
    const evs = run.events.splice(0);
    for (const ev of evs) {
      const nextKind = run.kind === 'reel' && run.phase !== 'done' ? run.activeKind : null;
      const fx = effectFor(ev, { tune: S.runTune, kind: S.evKind, nextKind, practice: !!run.practice });
      if (fx.popup) popup(fx.popup.text, fx.popup.color, !!fx.popup.big);
      if (fx.sound === 'buzz') {
        if (allowBuzz(S.lastBuzz, now)) { S.lastBuzz = now; audio.play('buzz'); }
      } else if (fx.sound) {
        audio.play(fx.sound);
      }
      if (fx.coach && run.kind !== 'jump') setCoach(fx.coach); // the jump's coach line follows its stage
      if (fx.sand) sandBurst();
      if (fx.settle) S.attemptAt = now;
      if (ev.type === 'practiceRetry') { S.practiceRetries++; syncSkip(); }
      if (fx.beat) S.beatFlashUntil = now + Math.min(220, S.runTune.tempoIntervalMs * 0.5);
      if (ev.type === 'segment') { S.evKind = run.activeKind; S.lastRatio = null; }
    }
  }

  // ---------- HUD ----------
  const setText = (node, t) => { if (node.textContent !== t) node.textContent = t; };
  const setStyle = (node, prop, v) => { if (node.style[prop] !== v) node.style[prop] = v; };
  function renderHud(run, now) {
    setText(el.xpCaption, UI.totalXp);
    if (!run) {
      setText(el.xp, String(state.progress.xp));
      setText(el.distCaption, UI.distance);
      setText(el.dist, `0 ${UI.metres}`);
      setText(el.timeCaption, UI.time);
      setText(el.time, '0.0');
      el.hud2.hidden = true;
      el.padL.classList.remove('cue'); el.padR.classList.remove('cue');
      showJump(false, 'off');
      return;
    }
    const v = hudView(run, S.runTune, { now, baseXp: S.baseXp, lastRatio: S.lastRatio });
    setText(el.xp, v.xp);
    setText(el.distCaption, v.distLabel);
    setText(el.dist, v.dist);
    setText(el.timeCaption, v.timeLabel);
    setText(el.time, v.time);
    el.hud2.hidden = !(v.showEnergy || v.showTempo);
    el.energyMeter.hidden = !v.showEnergy;
    el.tempo.hidden = !v.showTempo;
    if (v.showEnergy) {
      setStyle(el.energy, 'width', `${v.energyPct}%`);
      el.energyMeter.classList.toggle('low', v.low);
    }
    if (v.showTempo) {
      setStyle(el.zone, 'left', `${v.zoneLeft}%`);
      setStyle(el.zone, 'width', `${v.zoneWidth}%`);
      setStyle(el.needle, 'left', `${v.needle}%`);
    }
    const live = isLiveScreen(S.screen) && el.veil.hidden;
    const cue = live ? padCueFor(run, now < S.beatFlashUntil) : { L: false, R: false };
    el.padL.classList.toggle('cue', cue.L);
    el.padR.classList.toggle('cue', cue.R);
    const jumpRow = run.kind === 'jump' && (isLiveScreen(S.screen) || S.screen === 'between');
    showJump(jumpRow, live ? jumpButtonState(run) : 'off');
    if (live && run.kind === 'jump') setCoach(jumpCoach(run) || '');
  }
  // The long jump's pads row is RUN (the left pad, relabelled) and JUMP (in place of the hidden right
  // pad) for the whole level: nothing moves under the thumbs. Every other kind keeps LEFT and RIGHT
  // (JUMP hidden). state: jumpButtonState.
  function showJump(on, state) {
    if (el.padJ.hidden === on) {
      el.padJ.hidden = !on;
      el.padR.hidden = on;
      el.pads.classList.toggle('jump', on);
      setText(el.padL.querySelector('.pad-label'), on ? UI.run : UI.left);
    }
    const st = on ? state : 'off';
    if (el.padJ.dataset.state !== st) {
      el.padJ.dataset.state = st;
      el.padJ.setAttribute('aria-disabled', String(st === 'off'));
    }
  }

  // ---------- loop ----------
  function frame() {
    const wall = performance.now();
    const dt = clock.tick(wall);
    let now = runClock.now(wall); // every engine timestamp excludes paused time
    const run = S.run;
    if (run && isLiveScreen(S.screen) && !runClock.paused) {
      // A long frame is split into maxDt sub-steps so slow phones do not play in slow motion.
      const plan = planSteps(S.lastStepAt, now, S.runTune.maxDt);
      if (plan.dropMs) { runClock.drop(plan.dropMs); now = runClock.now(wall); }
      for (const s of plan.steps) {
        step(run, s.dt, s.now);
        handleEvents(run, s.now);
      }
      S.lastStepAt = now;
      if (S.prevPhase === 'count' && run.phase !== 'count') popup(UI.go, CYAN);
      S.prevPhase = run.phase;
      switch (frameDecision(run, { doneAt: S.doneAt, attemptAt: S.attemptAt, now, delayMs: RESULT_DELAY_MS })) {
        case 'practiceDone': S.doneAt = now; finishPractice(); syncSkip(); break; // then attempt 1
        case 'finish': S.doneAt = now; finishRun(); break;
        case 'advance': advance(); break;
        case 'between': S.attemptAt = null; advance('between'); break;
        default: break;
      }
    }
    if (run) {
      S.limb += (run.speed || 0) * dt * 1.4;
      ageFx(S.popups, dt);
      ageFx(S.dust, dt);
      const boardLit = isLiveScreen(S.screen) && el.veil.hidden && boardGlow(run);
      art.draw({ run, hero: state.hero, popups: S.popups, dust: S.dust, now, limb: S.limb, reducedMotion, boardLit });
    } else {
      // Under a dark card the scene barely shows: redraw it slowly to save battery. The hero maker
      // (a light veil, live preview) keeps full rate.
      const dim = !el.veil.hidden && !el.veil.classList.contains('peek');
      if (!dim || wall - lastIdleDraw >= IDLE_DRAW_MS) {
        lastIdleDraw = wall;
        art.drawTitleScene(wall, S.screen === 'hero' && S.draft ? S.draft : state.hero, reducedMotion);
      }
    }
    renderHud(S.run, now);
    requestAnimationFrame(frame);
  }

  // ---------- input ----------
  function clearPads() {
    for (const p of [el.padL, el.padR, el.padJ]) p.classList.remove('down');
    S.down.L = S.down.R = S.down.J = false;
  }
  const padFor = (side) => (side === 'L' ? el.padL : side === 'R' ? el.padR : el.padJ);

  // Every lift is forwarded as a release (only the long jump listens; other kinds ignore it).
  function bindPad(pad, side) {
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.unlock();
      pad.classList.add('down');
      S.down[side] = true;
      if (side === 'J') pressJump(); else press(side);
    });
    const up = () => lift(side);
    for (const t of ['pointerup', 'pointercancel', 'pointerleave']) pad.addEventListener(t, up);
    if (side === 'J') pad.addEventListener('lostpointercapture', up); // capture lost mid-press: still lets go
    pad.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindPad(el.padL, 'L');
  bindPad(el.padR, 'R');
  bindPad(el.padJ, 'J');
  const jumpRun = () => !!S.run && S.run.kind === 'jump';

  const isTyping = (t) => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

  window.addEventListener('keydown', (e) => {
    audio.unlock();
    const t = e.target;
    if (!el.veil.hidden) { // a card is open: pads and keys never reach the engine
      if (e.key === 'Tab') { // focus stays inside the card (plus Sound)
        const list = [...el.card.querySelectorAll('button:not([disabled]), input')];
        if (!el.quit.hidden) list.push(el.quit); // Map, above the between card
        list.push(el.mute);
        const i = nextFocusIndex(list.indexOf(document.activeElement), list.length, e.shiftKey);
        if (i >= 0) { e.preventDefault(); list[i].focus(); }
        return;
      }
      if (e.key !== 'Enter' || e.repeat) return;
      if (!cardReady(S.cardOpenedAt, performance.now())) { e.preventDefault(); return; }
      if (t && t.id === 'heroName') { e.preventDefault(); onAction(S.primary); return; }
      if (t && t.tagName === 'INPUT') return; // e.g. a debug input: never the card's primary
      if (t && t.tagName === 'BUTTON' && el.card.contains(t)) return; // the button's own click handles it
      if (S.primary) { e.preventDefault(); onAction(S.primary); }
      return;
    }
    if (isTyping(t)) return;
    if (jumpRun() && (JUMP_KEYS.includes(e.code) || e.code === LAND_KEY)) {
      e.preventDefault();
      if (e.repeat) return;
      const sides = e.code === LAND_KEY ? ['L', 'J'] : ['J'];
      for (const s of sides) {
        padFor(s).classList.add('down');
        S.down[s] = true;
        if (s === 'J') pressJump(); else press(s);
      }
      return;
    }
    const side = jumpRun() && KEYS[e.code] ? 'L' : KEYS[e.code]; // long jump: either arrow is RUN
    if (!side) return;
    e.preventDefault();
    if (e.repeat) return;
    padFor(side).classList.add('down');
    S.down[side] = true;
    press(side);
  });
  window.addEventListener('keyup', (e) => {
    if (jumpRun() && JUMP_KEYS.includes(e.code)) { lift('J'); return; }
    if (jumpRun() && e.code === LAND_KEY) { lift('L'); lift('J'); return; }
    const side = jumpRun() && KEYS[e.code] ? 'L' : KEYS[e.code];
    if (side) lift(side);
  });
  window.addEventListener('pointerdown', () => audio.unlock(), { capture: true });

  el.quit.addEventListener('click', () => { // inert once the run is done (finish delay)
    if (!(isLiveScreen(S.screen) || S.screen === 'between') || S.doneAt !== null) return;
    S.fromLearn = false;
    advance('quit');
  });
  el.skip.addEventListener('click', () => { // practice landing: the child chose to skip it
    if (S.screen !== 'practice' || S.doneAt !== null) return;
    audio.unlock();
    finishPractice();
    advance();
  });
  el.mute.addEventListener('click', () => {
    audio.unlock();
    audio.setMuted(!audio.muted);
    saveMuted(audio.muted);
    el.mute.setAttribute('aria-pressed', String(!audio.muted));
  });

  // ---------- pause, resume, resize ----------
  // Before the clock stops, every pad the UI believes is down is let go, so nothing stays stuck.
  const pause = () => {
    releaseHeldPads(S.run, S.down, rnow(), gate());
    clock.pause(); runClock.pause(performance.now()); clearPads();
  };
  const resume = () => {
    if (document.hidden) return;
    const w = performance.now();
    clock.resume(w);
    runClock.resume(w);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); return; }
    resume();
    refreshFromStorage();
  });
  window.addEventListener('storage', refreshFromStorage);
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', resume);
  window.addEventListener('resize', () => art.resize());
  window.addEventListener('orientationchange', () => art.resize());

  // ---------- debug panel (coach only: long-press the title) ----------
  let pressTimer = null;
  const cancelLong = () => { clearTimeout(pressTimer); pressTimer = null; };
  // Hit-tested by position because the card veil sits over the title bar while a card is open.
  const onTitle = (e) => {
    const r = el.title.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };
  document.addEventListener('pointerdown', (e) => {
    cancelLong();
    if (onTitle(e)) pressTimer = setTimeout(toggleDebug, LONG_PRESS_MS);
  }, { capture: true });
  for (const t of ['pointerup', 'pointercancel']) document.addEventListener(t, cancelLong, { capture: true });
  document.addEventListener('pointermove', (e) => { if (pressTimer && !onTitle(e)) cancelLong(); }, { capture: true });
  el.title.addEventListener('contextmenu', (e) => e.preventDefault());

  function toggleDebug() {
    pressTimer = null;
    if (el.debug.hidden) { buildDebug(); el.debug.hidden = false; } else el.debug.hidden = true;
  }

  function applyTuning() {
    if (S.runTune) Object.assign(S.runTune, buildTune(state.age, overrides)); // live: the run reads its own tune object
    if (testMode() && S.run && (isLiveScreen(S.screen) || S.screen === 'between') && S.doneAt === null) S.runTest = true; // tuned mid-run: not saved
    testTag.hidden = !testMode();
    const out = el.debug.querySelector('code');
    if (out) out.textContent = JSON.stringify(overrides);
  }

  function setOverride(key, index, value) {
    if (index === null) overrides[key] = value;
    else {
      const arr = [...(overrides[key] || buildTune(state.age)[key])];
      arr[index] = value;
      overrides[key] = arr;
    }
    applyTuning();
  }

  function mk(tag, text) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; return n; }

  function buildDebug() {
    const d = el.debug;
    d.textContent = '';
    d.append(mk('b', UI.debugTitle), mk('br'));
    const tune = buildTune(state.age, overrides);
    const addInput = (key, index, value) => {
      const label = mk('label', `${key}${index === null ? '' : `[${index}]`} `);
      const input = document.createElement('input');
      input.type = 'number'; input.step = 'any'; input.value = String(value);
      input.addEventListener('input', () => {
        const n = Number(input.value);
        if (input.value !== '' && Number.isFinite(n)) setOverride(key, index, n);
      });
      label.append(input);
      d.append(label);
    };
    for (const [key, val] of Object.entries(tune)) {
      if (typeof val === 'number') addInput(key, null, val);
      else if (Array.isArray(val) && val.every((n) => typeof n === 'number')) val.forEach((v, i) => addInput(key, i, v));
    }
    d.append(mk('br'));
    const resetTune = mk('button', UI.resetTuning);
    resetTune.type = 'button';
    resetTune.addEventListener('click', () => { overrides = {}; applyTuning(); buildDebug(); });
    // Same path as Start again on the map: the confirm card, with Keep playing as the safe choice.
    const erase = mk('button', UI.resetProgress);
    erase.type = 'button';
    erase.addEventListener('click', () => {
      el.debug.hidden = true;
      S.fromLearn = false;
      S.run = null;
      show('confirm');
    });
    d.append(resetTune, erase, mk('br'), mk('span', `${UI.overrides}: `), mk('code', JSON.stringify(overrides)));
  }

  // ---------- start ----------
  show('title');
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') boot();
