// Card HTML builders for Explorer's Run. Pure: no DOM, no storage, no network.
// Every builder returns { html, actions: [{ id, label, primary }], headingId }.
// Every button carries data-action="<id>"; game.js attaches the listeners.
// Every dynamic value goes through esc(); the hero name is user input.
import { SHARED, CONTENT } from './content.js';
import { TUNE, AGE } from './tune.js';
import { canOpenReel } from './scoring.js';

// UI chrome (not coach voice). Australian English, no long dashes, plain words.
export const UI = {
  play: 'Play',
  gotIt: 'Got it',
  tryAgain: 'Try again',
  next: 'Next',
  map: 'Map',
  sound: 'Sound',
  backToMap: 'Back to map',
  letsGo: "Let's go",
  changeHero: 'Change hero',
  changeAge: 'Change age',
  startAgain: 'Start again',
  startAgainHeading: 'Start again?',
  startAgainBody: 'This removes your hero and all progress from this device.',
  yesStartAgain: 'Yes, start again',
  keepPlaying: 'Keep playing',
  titleHeading: "Explorer's Run",
  heroHeading: 'Make your hero',
  nameLabel: 'Your hero name',
  nameHint: 'Nickname or first name only. No last names. It stays on this device.',
  differentPlayer: 'Different player? Use Start again.',
  clearFailed: 'Could not clear this device. Try closing other tabs.',
  skin: 'Skin',
  hair: 'Hair',
  kit: 'Kit',
  hairNames: ['Short', 'Curly', 'Pony', 'Braids', 'Buzz'],
  kitNames: ['Blue', 'Orange', 'Black'],
  ageHeading: 'How old are you?',
  ageHint: 'This sets the beat for the tempo run. You can change it on the map.',
  mapHeading: 'Your map',
  totalXp: 'Total XP',
  hero: 'Hero',
  best: 'Best',
  backToApp: 'Back to My Athletic Journey',
  notPlayed: 'Not played yet',
  lockedSkip: 'Play Skip Trail first',
  lockedAll: 'Unlock all three skills first',
  coachAl: 'Coach Al',
  learnXp: 'Learn',
  finished: 'Finished!',
  time: 'Time',
  skips: 'skips',
  technique: 'Technique',
  passedLine: 'Skill unlocked!',
  gameScore: 'Game score. Your coach checks the real thing.',
  unlockedInGame: 'Unlocked in the game. Now show your coach for real.',
  shareCareful: 'Only share this with people you know.',
  notYetLine: (p) => `Get ${p}% technique to unlock this skill.`,
  reflectXp: 'Any answer is fine.',
  passed: 'Passed',
  notYet: 'Not yet',
  masterYes: 'You earned it!',
  masterNo: 'Pass all three to earn it.',
  showCoach: 'Show this to your coach or a parent.',
  code: 'Unlock code',
  starsOf: (n) => `${n} of 3 stars`,
  waitGo: 'Wait for GO',
  energySaved: 'Energy saved',
  noWall: 'No wall',
  otherSide: 'Other side',
  getReady: 'Get ready',
  go: 'GO',
  skip: 'Skip',
  distance: 'Distance',
  metres: 'm',
  testMode: 'TEST MODE',
  testNotSaved: 'Test mode: not saved',
  debugTitle: 'Tuning (this session only)',
  resetTuning: 'Reset tuning',
  resetProgress: 'Reset progress',
  overrides: 'Changes',
  // long jump
  lockedSprint: 'Unlock Sprint Drive first',
  jump: 'JUMP',
  run: 'RUN',
  left: 'LEFT',
  practiseLanding: 'Practise landing',
  skipPractice: 'Skip practice',
  practice: 'Practice',
  attempt: 'Attempt',
  attemptOf: (n, total) => `Attempt ${n} of ${total}`,
  nOf: (n, total) => `${n} of ${total}`,
  markFast: 'Fast at the board',
  markBoard: 'On the board',
  markPush: 'Pushed up',
  markLanding: 'Two-foot landing',
  markDone: 'done',
  markNotYet: 'not yet',
  good: 'Good',
  allFourLine: 'All four. That is a real long jump.',
  allFour: 'All four',
  moveShoe: 'Back one shoe',
  tooEarly: 'Too early. Wait for the white board.',
  tapToLand: 'TAP!',
  nextGo: 'Next go: hit JUMP on the white board.',
  needAllFour: 'Need all four in one jump',
  howToPlay: 'How to play',
  howTo: ['Tap RUN fast to run.', 'Hit JUMP on the white board. Hold it.', 'Let go. In the air, tap to land.'],
  keepStart: 'Keep my start',
  nextAttempt: 'Next attempt',
  noLegalJump: 'No legal jump yet',
  foul: 'Foul',
  noJump: 'No jump',
  overBoard: 'Over the board',
  jumpNotYet: 'Get all four in one jump to unlock this skill.',
  none: '-',
};

// Metres to two decimals, e.g. "3.17 m".
export const fmtM = (m) => `${(Number(m) || 0).toFixed(2)} ${UI.metres}`;

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Map order. The long jump sits between Sprint and Tempo.
export const MAP_ORDER = ['skip', 'sprint', 'jump', 'tempo', 'reel'];

// Skip is always open; Sprint and Tempo once Skip has been played (any result, saved or this
// session); the Long Jump once Sprint Drive is unlocked; the Reel via canOpenReel.
// need: null | 'skip' | 'sprint' | 'all'.
export function levelStatus(progress, playedSkip = false) {
  const skipDone = !!(progress && progress.best && progress.best.skip) || !!playedSkip;
  const sprintDone = !!(progress && progress.unlocked && progress.unlocked.sprint);
  const reel = canOpenReel(progress);
  return {
    skip: { open: true, need: null },
    sprint: { open: skipDone, need: skipDone ? null : 'skip' },
    jump: { open: sprintDone, need: sprintDone ? null : 'sprint' },
    tempo: { open: skipDone, need: skipDone ? null : 'skip' },
    reel: { open: reel, need: reel ? null : 'all' },
  };
}

// Tip by technique %: low under 50, mid under 90, high otherwise.
export function pickTip(pct, tips) {
  if (pct < 50) return tips.low;
  if (pct < 90) return tips.mid;
  return tips.high;
}

const btn = (a) => `<button type="button" class="btn${a.primary ? ' primary' : ''}" data-action="${esc(a.id)}">${esc(a.label)}</button>`;
const row = (acts) => `<div class="row">${acts.map(btn).join('')}</div>`;
const h2 = (id, text, cls = '') => `<h2 id="${id}" tabindex="-1"${cls ? ` class="${cls}"` : ''}>${esc(text)}</h2>`;
const starsHtml = (n) => {
  const k = Math.max(0, Math.min(3, n | 0));
  return `<div class="stars" role="img" aria-label="${esc(UI.starsOf(k))}">${[0, 1, 2].map((i) => (i < k ? '★' : '<span class="off">★</span>')).join('')}</div>`;
};
const fmtTime = (s) => `${(Number(s) || 0).toFixed(1)} s`;

export function titleCard() {
  const actions = [{ id: 'play', label: UI.play, primary: true }];
  const html = `${h2('h-title', UI.titleHeading)}<p>${esc(SHARED.intro)}</p>${row(actions)}`;
  return { html, actions, headingId: 'h-title' };
}

// options: HERO_OPTIONS from store.js. Compact layout: one row per option group, so the live
// preview on the scene canvas stays visible above the card.
export function heroMaker(hero, options, opts = {}) {
  const sw = (group, list, labelFor, colour) => list.map((v, i) => {
    const sel = hero[group] === i;
    // Colour goes in a data attribute; game.js applies it via element.style (CSP forbids style="").
    const style = colour ? ` data-colour="${esc(v)}"` : '';
    return `<button type="button" data-action="pick:${group}:${i}" class="${sel ? 'sel' : ''}" aria-pressed="${sel}" aria-label="${esc(`${UI[group]} ${labelFor(v, i)}`)}"${style}>${colour ? '' : esc(labelFor(v, i))}</button>`;
  }).join('');
  const line = (group, cls, inner) => `<div class="swrow"><span>${esc(UI[group])}</span><div class="${cls}" role="group" aria-label="${esc(UI[group])}">${inner}</div></div>`;
  const name = hero.name === 'Explorer' ? '' : hero.name;
  const actions = [{ id: 'hero-done', label: UI.letsGo, primary: true }];
  const html = [
    h2('h-hero', UI.heroHeading),
    `<input type="text" id="heroName" maxlength="12" autocomplete="off" autocapitalize="words" enterkeyhint="done" inputmode="text" spellcheck="false" aria-label="${esc(UI.nameLabel)}" placeholder="${esc(UI.nameLabel)}" value="${esc(name)}">`,
    `<p class="hint">${esc(UI.nameHint)}</p>`,
    opts.fromMap ? `<p class="hint">${esc(UI.differentPlayer)}</p>` : '',
    opts.clearFailed ? `<p class="hint">${esc(UI.clearFailed)}</p>` : '',
    line('skin', 'sw', sw('skin', options.skin, (v, i) => i + 1, true)),
    line('hair', 'sw pills', sw('hair', options.hair, (v, i) => UI.hairNames[i] || v, false)),
    line('kit', 'sw', sw('kit', options.kit, (v, i) => UI.kitNames[i] || i + 1, true)),
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-hero' };
}

export function ageCard(age) {
  const actions = ['young', 'older'].map((k) => ({ id: `age:${k}`, label: AGE[k].label, primary: age === k }));
  const html = `${h2('h-age', UI.ageHeading)}<p>${esc(UI.ageHint)}</p>${row(actions)}`;
  return { html, actions, headingId: 'h-age' };
}

// opts: { hero, playedSkip, ageLabel }
export function mapCard(progress, content, opts = {}) {
  const { hero = { name: 'Explorer' }, playedSkip = false, backToApp = false } = opts;
  const status = levelStatus(progress, playedSkip);
  const levels = MAP_ORDER.map((kind) => {
    const c = content[kind];
    const st = status[kind];
    const best = progress.best && progress.best[kind];
    let detail;
    if (!st.open) detail = st.need === 'all' ? UI.lockedAll : st.need === 'sprint' ? UI.lockedSprint : UI.lockedSkip;
    else if (best) {
      detail = `${UI.best}: ${'★'.repeat(best.stars)}${'☆'.repeat(3 - best.stars)} ${best.pct}%`;
      if (kind === 'jump' && best.distanceM > 0) detail += ` · ${fmtM(best.distanceM)}`;
      if (kind === 'jump' && !(progress.unlocked && progress.unlocked.jump)) detail += ` · ${UI.needAllFour}`; // what is missing
    } else detail = UI.notPlayed;
    const unlocked = progress.unlocked && progress.unlocked[kind];
    return {
      id: `level:${kind}`, open: st.open, kind,
      label: `${c.title}: ${c.skillName}`,
      inner: `<b>${esc(c.title)}${unlocked ? ' ✓' : ''}</b><br>${esc(c.skillName)} · ${esc(c.week)}<br><span>${esc(detail)}</span>`,
    };
  });
  const chrome = [
    { id: 'change-hero', label: UI.changeHero, primary: false },
    { id: 'change-age', label: UI.changeAge, primary: false },
    { id: 'start-again', label: UI.startAgain, primary: false },
  ];
  // Opened from the My Athletic Journey app: a way back. Only on the map, so Reflect is never skipped.
  const back = backToApp ? [{ id: 'back-app', label: UI.backToApp, primary: false }] : [];
  const html = [
    h2('h-map', UI.mapHeading),
    `<p>${esc(UI.hero)}: <b class="hero-name">${esc(hero.name)}</b> · ${esc(UI.totalXp)}: <b>${esc(progress.xp)}</b></p>`,
    `<div class="choices">${levels.map((l) => `<button type="button" data-action="${l.id}" data-level="${l.kind}"${l.open ? '' : ' disabled aria-disabled="true"'}>${l.inner}</button>`).join('')}</div>`,
    row(chrome),
    back.length ? row(back) : '',
  ].join('');
  const actions = [...levels.map((l) => ({ id: l.id, label: l.label, primary: false, disabled: !l.open })), ...chrome, ...back];
  return { html, actions, headingId: 'h-map' };
}

// level: { kind, ...CONTENT[kind] }
// opts: { practice } adds a "Practise landing" button (the long jump, once its practice is done).
// The long jump also gets a short "How to play" block: the JUMP button is new to every child.
export function learnCard(level, opts = {}) {
  const actions = [{ id: 'learn-go', label: UI.gotIt, primary: true }];
  if (opts.practice) actions.push({ id: 'learn-practice', label: UI.practiseLanding, primary: false });
  const html = [
    h2('h-learn', level.title),
    `<p><b>${esc(level.learn.heading)}</b></p>`,
    `<p class="cue">${esc(level.learn.cue)}</p>`,
    ...level.learn.lines.map((l) => `<p>${esc(l)}</p>`),
    `<p><b>${esc(UI.coachAl)}</b></p>`,
    level.kind === 'jump' ? `<div class="howto"><p><b>${esc(UI.howToPlay)}</b></p><ol>${UI.howTo.map((l) => `<li>${esc(l)}</li>`).join('')}</ol></div>` : '',
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-learn' };
}

// res: result() plus skips for skip. tip defaults to the low/mid/high pick.
// opts: { testMode } adds the "not saved" line for runs played with debug overrides;
// { firstUnlock } says "Skill unlocked!" only on the run that unlocks it, "Passed" on repeats.
export function resultCard(res, level, tip, passPct = TUNE.passPct, opts = {}) {
  if (res.kind === 'jump') return jumpResultCard(res, level, tip, opts);
  const t = tip === undefined ? pickTip(res.pct, level.tips) : tip;
  const big = res.kind === 'skip' ? `${esc(res.skips ?? '')} ${esc(UI.skips)}` : esc(fmtTime(res.timeSecs));
  const sub = res.kind === 'skip' ? `<p>${esc(UI.time)}: <b>${esc(fmtTime(res.timeSecs))}</b></p>` : '';
  const actions = [
    { id: 'again', label: UI.tryAgain, primary: false },
    { id: 'next', label: UI.next, primary: true },
  ];
  const html = [
    h2('h-result', `${level.title}: ${UI.finished}`),
    starsHtml(res.stars),
    `<div class="big">${big}</div>`,
    sub,
    `<p>${esc(UI.technique)}: <b>${esc(res.pct)}%</b></p>`,
    `<p>${esc(!res.passed ? UI.notYetLine(passPct) : opts.firstUnlock ? UI.passedLine : UI.passed)}</p>`,
    `<p>${esc(t)}</p>`,
    `<p class="hint">${esc(UI.gameScore)}</p>`,
    opts.testMode ? `<p class="hint">${esc(UI.testNotSaved)}</p>` : '',
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-result' };
}

// ---------- long jump ----------

// The four marks in judging order, with their labels and the coach line when one is missing.
// A legal jump can only miss the board by taking off before the zone: that line is the too-early one.
const MARKS = [
  { key: 'fast', label: () => UI.markFast, tryLine: (c) => c.learn.cue },
  { key: 'board', label: () => UI.markBoard, tryLine: () => UI.tooEarly },
  { key: 'push', label: () => UI.markPush, tryLine: (c) => c.phases.push },
  { key: 'landing', label: () => UI.markLanding, tryLine: (c) => c.phases.landing },
];
const MARK = Object.fromEntries(MARKS.map((m) => [m.key, m]));
const hasLegal = (rec) => !!rec && rec.outcome === 'jump' && rec.distanceM !== null && rec.distanceM !== undefined;
const outcomeText = (rec) => (rec.outcome === 'foul' ? UI.foul : rec.outcome === 'nojump' ? UI.noJump : fmtM(rec.distanceM));
// A legal take-off from before the board zone (the engine's onBoard is false only then, or on a foul).
export const tooEarly = (rec) => !!rec && rec.outcome === 'jump' && !(rec.marks && rec.marks.board);

// For a legal jump: one good thing first (when any mark is earned), then one thing to try. Timing
// comes first: a too-early take-off gets the too-early line; otherwise the first missing of fast,
// push, landing. All four has its own line.
export function attemptLines(rec, content = CONTENT.jump) {
  const marks = rec.marks || {};
  const got = MARKS.filter((m) => marks[m.key]);
  if (got.length === MARKS.length) return { good: null, coach: UI.allFourLine };
  const missing = tooEarly(rec) ? MARK.board : MARKS.find((m) => m.key !== 'board' && !marks[m.key]) || MARK.board;
  return { good: got.length ? `${UI.good}: ${got[0].label()}` : null, coach: missing.tryLine(content) };
}

// Between attempts. rec: an attempt record from the engine; n: 1-based attempt number.
// One coach line per card: a foul says coach.foul and offers one shoe back; a no-jump says coach.noJump;
// a legal jump gets the too-early line or the cue for its first missing mark (or the all-four line).
// opts.firstGo (the first attempt of the first play, see isFirstGo): only what went right. Ticked
// marks only, no fault line, no shoe offer, one Next attempt button. With no legal distance, or a
// too-early take-off, one neutral how-to line instead.
export function attemptCard(rec, n, total, opts = {}, content = CONTENT.jump) {
  const marks = rec.marks || {};
  const first = !!opts.firstGo;
  const foul = rec.outcome === 'foul' && !first;
  const legal = hasLegal(rec);
  const lines = attemptLines(rec, content);
  const anyMark = MARKS.some((m) => marks[m.key]);
  let head = legal ? `<div class="big">${esc(fmtM(rec.distanceM))}</div>` : '';
  let coach = '';
  if (first) {
    if (!legal || tooEarly(rec)) coach = `<p class="calm">${esc(UI.nextGo)}</p>`;
    else if (lines.good === null && anyMark) coach = `<p class="cue">${esc(UI.allFourLine)}</p>`; // all four: praise only
  } else if (!legal) {
    head += `<p class="calm">${esc(foul ? content.coach.foul : content.coach.noJump)}</p>`;
  } else {
    coach = `<p class="cue">${esc(lines.coach)}</p>`;
  }
  const rows = MARKS.filter((m) => !first || marks[m.key]).map((m) => {
    const on = !!marks[m.key];
    return `<li class="${on ? 'on' : 'off'}"><span class="tick" aria-hidden="true">${on ? '✓' : '○'}</span>${esc(m.label())}<span class="sr"> ${esc(on ? UI.markDone : UI.markNotYet)}</span></li>`;
  }).join('');
  const actions = foul
    ? [{ id: 'attempt-shoe', label: UI.moveShoe, primary: true }, { id: 'attempt-keep', label: UI.keepStart, primary: false }]
    : [{ id: 'attempt-next', label: UI.nextAttempt, primary: true }];
  const html = [
    h2('h-attempt', UI.attemptOf(n, total)),
    head,
    rows ? `<ul class="marks">${rows}</ul>` : '',
    lines.good ? `<p class="good">${esc(lines.good)}</p>` : '',
    coach,
    foul ? `<p>${esc(content.coach.oneShoe)}</p>` : '',
    foul ? `<div class="row stack">${actions.map(btn).join('')}</div>` : row(actions),
  ].join('');
  return { html, actions, headingId: 'h-attempt' };
}

// The jump result tip, from what actually happened (not the pct band):
// passed: tips.high; nobody took off: coach.noJump; else the best take-off (highest pct, then the
// longest distance) and its first missing mark in the order board, fast, push, landing.
export function jumpTip(res, content = CONTENT.jump) {
  if (res.passed) return content.tips.high;
  const tookOff = (res.attempts || []).filter((a) => a.outcome !== 'nojump');
  if (!tookOff.length) return content.coach.noJump;
  const dist = (a) => (a.distanceM === null || a.distanceM === undefined ? -1 : a.distanceM);
  const best = [...tookOff].sort((a, b) => (b.pct - a.pct) || (dist(b) - dist(a)))[0];
  const m = best.marks || {};
  if (!m.board) return best.outcome === 'foul' ? content.coach.foul : UI.tooEarly;
  if (!m.fast) return content.learn.cue;
  if (!m.push) return content.phases.push;
  if (!m.landing) return content.phases.landing;
  return content.tips.high;
}

// The long jump result: best legal distance, the three attempts, technique, stars.
// The skill unlocks on one all-four attempt, so the not-yet line says that instead of a %.
export function jumpResultCard(res, level, tip, opts = {}) {
  const t = tip === undefined ? jumpTip(res, level) : tip;
  const attempts = res.attempts || [];
  const legal = attempts.some(hasLegal);
  const tries = attempts.map((a, i) => `<li><span>${esc(UI.attempt)} ${esc(i + 1)}</span><b>${esc(outcomeText(a))}</b></li>`).join('');
  const actions = [
    { id: 'again', label: UI.tryAgain, primary: false },
    { id: 'next', label: UI.next, primary: true },
  ];
  const html = [
    h2('h-result', `${level.title}: ${UI.finished}`),
    starsHtml(res.stars),
    `<div class="big">${esc(legal ? fmtM(res.distanceM) : UI.none)}</div>`,
    legal ? '' : `<p>${esc(UI.noLegalJump)}</p>`,
    `<ol class="tries">${tries}</ol>`,
    `<p>${esc(UI.technique)}: <b>${esc(res.pct)}%</b></p>`,
    `<p>${esc(!res.passed ? UI.jumpNotYet : opts.firstUnlock ? UI.passedLine : UI.passed)}</p>`,
    `<p>${esc(t)}</p>`,
    `<p class="hint">${esc(UI.gameScore)}</p>`,
    opts.testMode ? `<p class="hint">${esc(UI.testNotSaved)}</p>` : '',
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-result' };
}

// res: reel result(). Tiles are labelled with each skill name; the tip follows the lowest pct.
export function reelResultCard(res, level = { kind: 'reel', ...CONTENT.reel }, opts = {}) {
  const lowest = Math.min(...res.segments.map((s) => s.pct));
  const tip = pickTip(lowest, level.tips);
  const tiles = res.segments.map((s) => `<div>${esc(CONTENT[s.kind] ? CONTENT[s.kind].skillName : s.kind)}<b>${esc(s.pct)}%</b>${esc(s.passed ? UI.passed : UI.notYet)}</div>`).join('');
  const actions = [
    { id: 'again', label: UI.tryAgain, primary: false },
    { id: 'next', label: UI.next, primary: true },
  ];
  const html = [
    h2('h-result', `${level.title}: ${UI.finished}`),
    starsHtml(res.stars),
    `<div class="big">${esc(fmtTime(res.timeSecs))}</div>`,
    `<div class="pcts">${tiles}</div>`,
    `<p><b>${esc(level.skillName)}</b>: ${esc(res.master ? UI.masterYes : UI.masterNo)}</p>`,
    `<p>${esc(tip)}</p>`,
    `<p class="hint">${esc(UI.gameScore)}</p>`,
    opts.testMode ? `<p class="hint">${esc(UI.testNotSaved)}</p>` : '',
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-result' };
}

export function confirmCard() {
  const actions = [
    { id: 'confirm-wipe', label: UI.yesStartAgain, primary: false },
    { id: 'keep-playing', label: UI.keepPlaying, primary: true },
  ];
  const html = `${h2('h-confirm', UI.startAgainHeading)}<p>${esc(UI.startAgainBody)}</p>${row(actions)}`;
  return { html, actions, headingId: 'h-confirm' };
}

export function reflectCard(level) {
  const actions = level.reflect.choices.map((c, i) => ({ id: `reflect:${i}`, label: c, primary: false }));
  const html = [
    h2('h-reflect', level.reflect.question),
    `<p>${esc(UI.reflectXp)}</p>`,
    `<div class="choices">${actions.map((a) => `<button type="button" data-action="${esc(a.id)}">${esc(a.label)}</button>`).join('')}</div>`,
  ].join('');
  return { html, actions, headingId: 'h-reflect' };
}

export function unlockHeading(hero, level) {
  return `${String(hero.name).toUpperCase()} UNLOCKED: ${String(level.skillName).toUpperCase()}`;
}

// opts: { testMode } marks a play-test unlock that is not saved.
export function unlockCard(hero, level, res, opts = {}) {
  const actions = [{ id: 'unlock-next', label: UI.next, primary: true }];
  const html = [
    h2('h-unlock', unlockHeading(hero, level), 'gold'),
    `<div class="share">`,
    `<p>${esc(level.unlock.line)}</p>`,
    `<p><b>${esc(SHARED.creed)}</b></p>`,
    `<p>${esc(level.unlock.nowDoIt)}</p>`,
    `<p class="hint">${esc(UI.unlockedInGame)}</p>`,
    opts.testMode ? `<p class="hint">${esc(UI.testNotSaved)}</p>` : '',
    `</div>`,
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-unlock' };
}

// The date is not shown (it stays inside the unlock code); the parameter is kept so callers need no change.
// opts: { testMode } drops the unlock code (nothing was earned for real) and says "not saved".
export function shareCard(hero, level, res, code, date = new Date(), opts = {}) {
  const showCode = !opts.testMode && !!code;
  const actions = [{ id: 'share-done', label: UI.backToMap, primary: true }];
  const html = [
    h2('h-share', hero.name, 'gold'),
    `<div class="share">`,
    `<h3>${esc(level.skillName)}</h3>`,
    res.kind === 'jump'
      ? `<p>${esc(UI.distance)}: <b>${esc(fmtM(res.distanceM))}</b> · ${esc(UI.technique)}: <b>${esc(res.pct)}%</b></p>`
      : `<p>${esc(UI.time)}: <b>${esc(fmtTime(res.timeSecs))}</b> · ${esc(UI.technique)}: <b>${esc(res.pct)}%</b></p>`,
    showCode ? `<p>${esc(UI.code)}</p>` : '',
    showCode ? `<div class="big code">${esc(code)}</div>` : '',
    `<p>${esc(UI.showCoach)}</p>`,
    opts.testMode ? `<p class="hint">${esc(UI.testNotSaved)}</p>` : '',
    `<p class="hint">${esc(UI.unlockedInGame)}</p>`,
    `<p class="hint">${esc(UI.shareCareful)}</p>`,
    `</div>`,
    row(actions),
  ].join('');
  return { html, actions, headingId: 'h-share' };
}
