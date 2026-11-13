// Device-local store. The hero name is a first name or nickname only, kept on
// this device and never transmitted. No network code belongs in this file.

export const HERO_OPTIONS = {
  skin: ['#f6d2b8', '#e0ac85', '#c48a5a', '#8d5a3b', '#5b3a26'],
  hair: ['short', 'curly', 'ponytail', 'braids', 'buzz'],
  kit: ['#00B4D8', '#F26522', '#111111'],
};

const MUTE_KEY = 'explorers-run-muted'; // second storage key, see loadMuted; clearState removes it too
const KEY = 'explorers-run-v1';
const KINDS = ['skip', 'sprint', 'tempo', 'reel', 'jump'];
const FLAGS = ['jumpPractice']; // known boolean flags; see setFlag
const MAX_NAME = 12;

// Splits into user-perceived characters, so the cap never cuts an emoji or a flag in half.
function graphemes(text) {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
    }
  } catch { /* fall back to code points */ }
  return [...text];
}

export function normaliseName(raw) {
  if (typeof raw !== 'string') return 'Explorer';
  const clean = raw.trim().split(/\s+/)[0]; // first word only: no last names
  if (!clean) return 'Explorer';
  return graphemes(clean).slice(0, MAX_NAME).join('').trim() || 'Explorer';
}

export function defaultHero() {
  return { name: 'Explorer', skin: 0, hair: 0, kit: 0, quest: 1 };
}

export const STATE_VERSION = 1;

function defaultState() {
  return {
    v: STATE_VERSION,
    hero: defaultHero(),
    age: null,
    progress: {
      xp: 0,
      unlocked: { skip: false, sprint: false, tempo: false, reel: false, jump: false },
      best: {},
    },
    flags: { jumpPractice: false },
  };
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function clampIndex(v, list) {
  if (!Number.isInteger(v)) return 0;
  return Math.min(Math.max(v, 0), list.length - 1);
}

// Kinds from a later version: carried through untouched so this code, as a stale tab, never strips
// them when it saves. Unlocks must be booleans; a best must be an object with a numeric pct.
const BAD_KEYS = ['__proto__', 'constructor', 'prototype'];
const unknownKind = (k) => !KINDS.includes(k) && !BAD_KEYS.includes(k);

function sanitise(raw) {
  const s = defaultState();
  if (!isObj(raw)) return s;
  // Unknown top-level fields (from a later version) are carried through untouched, so an old
  // cached tab never strips them when it saves.
  for (const [k, v] of Object.entries(raw)) if (!(k in s)) s[k] = v;
  if (isNum(raw.v) && raw.v > STATE_VERSION) s.v = raw.v;
  if (isObj(raw.hero)) {
    const h = raw.hero;
    s.hero.name = normaliseName(h.name);
    s.hero.skin = clampIndex(h.skin, HERO_OPTIONS.skin);
    s.hero.hair = clampIndex(h.hair, HERO_OPTIONS.hair);
    s.hero.kit = clampIndex(h.kit, HERO_OPTIONS.kit);
    if (Number.isInteger(h.quest) && h.quest >= 1) s.hero.quest = h.quest;
  }
  if (raw.age === 'young' || raw.age === 'older') s.age = raw.age;
  if (isObj(raw.progress)) {
    const p = raw.progress;
    if (isNum(p.xp) && p.xp >= 0) s.progress.xp = p.xp;
    if (isObj(p.unlocked)) {
      for (const k of KINDS) s.progress.unlocked[k] = p.unlocked[k] === true;
      for (const [k, v] of Object.entries(p.unlocked)) if (unknownKind(k) && typeof v === 'boolean') s.progress.unlocked[k] = v;
    }
    if (isObj(p.best)) {
      for (const k of KINDS) {
        const b = p.best[k];
        if (isObj(b) && isNum(b.timeSecs) && isNum(b.pct) && isNum(b.stars)) {
          if (k === 'jump') {
            if (isNum(b.distanceM)) {
              s.progress.best[k] = { timeSecs: b.timeSecs, pct: b.pct, stars: b.stars, distanceM: b.distanceM };
            }
          } else {
            s.progress.best[k] = { timeSecs: b.timeSecs, pct: b.pct, stars: b.stars };
          }
        }
      }
      for (const [k, b] of Object.entries(p.best)) if (unknownKind(k) && isObj(b) && isNum(b.pct)) s.progress.best[k] = { ...b };
    }
  }
  if (isObj(raw.flags)) {
    // Unknown flag names (from a later version) are carried through; known ones must be booleans.
    for (const [k, v] of Object.entries(raw.flags)) if (!FLAGS.includes(k)) s.flags[k] = v;
    for (const k of FLAGS) s.flags[k] = raw.flags[k] === true;
  }
  return s;
}

export function loadState(storage) {
  try {
    const st = storage === undefined ? getStorage() : storage;
    if (!st) return defaultState();
    const text = st.getItem(KEY);
    if (typeof text !== 'string') return defaultState();
    return sanitise(JSON.parse(text));
  } catch {
    return defaultState();
  }
}

export function saveState(state, storage) {
  try {
    const st = storage === undefined ? getStorage() : storage;
    if (!st) return false;
    st.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Deliberate wipe ("Start again"): removes the progress key and the remembered mute flag
// entirely. Never throws.
export function clearState(storage) {
  try {
    const st = storage === undefined ? getStorage() : storage;
    if (!st) return false;
    st.removeItem(KEY);
    st.removeItem(MUTE_KEY);
    return true;
  } catch {
    return false;
  }
}

function clone(state) {
  return {
    ...state,
    hero: { ...state.hero },
    flags: { ...state.flags },
    age: state.age,
    progress: {
      xp: state.progress.xp,
      unlocked: { ...state.progress.unlocked },
      best: Object.fromEntries(Object.entries(state.progress.best).map(([k, v]) => [k, { ...v }])),
    },
  };
}

// Returns a new state with one device flag set (coerced to a boolean).
export function setFlag(state, name, value) {
  const next = clone(state);
  next.flags[name] = !!value;
  return next;
}

export function addXp(state, amount) {
  const next = clone(state);
  if (isNum(amount)) next.progress.xp += amount;
  return next;
}

// ---------- sound setting (a device convenience, not progress) ----------
export function loadMuted(storage) {
  try {
    const st = storage === undefined ? getStorage() : storage;
    return !!st && st.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted, storage) {
  try {
    const st = storage === undefined ? getStorage() : storage;
    if (!st) return false;
    st.setItem(MUTE_KEY, muted ? '1' : '0');
    return true;
  } catch {
    return false;
  }
}

// ---------- several tabs ----------

// True for the fresh default hero and age: nothing chosen yet on this device.
export function isUntouchedState(state) {
  const h = state && state.hero;
  const d = defaultHero();
  return !!h && state.age === null && h.name === d.name && h.skin === d.skin && h.hair === d.hair && h.kit === d.kit;
}

// True when best `cand` should replace best `cur` for this kind: higher pct first, then the
// longer distance for the jump or the faster time for every other kind. The one rule used by
// recordResult and mergeStates, so the two cannot drift.
function isBetter(kind, cand, cur) {
  if (!cur) return true;
  if (cand.pct !== cur.pct) return cand.pct > cur.pct;
  return kind === 'jump' ? cand.distanceM > cur.distanceM : cand.timeSecs < cur.timeSecs;
}

// The better of two bests for one kind.
function betterBest(kind, a, b) {
  if (!a) return b ? { ...b } : undefined;
  if (!b) return { ...a };
  return { ...(isBetter(kind, b, a) ? b : a) };
}

// Merges this tab's state with what another tab saved, so neither erases the other's progress.
// unlocked: OR per skill; best: the better entry; flags: OR per flag; xp: the larger; hero and age: stored when mine
// is the untouched default, else mine. Pure; both inputs are sanitised first.
export function mergeStates(mine, stored) {
  const a = sanitise(mine);
  const b = sanitise(stored);
  const who = isUntouchedState(a) ? b : a;
  const out = { ...b, ...a, v: Math.max(a.v, b.v), hero: { ...who.hero }, age: who.age };
  const best = {};
  for (const k of KINDS) {
    const m = betterBest(k, a.progress.best[k], b.progress.best[k]);
    if (m) best[k] = m;
  }
  const unlocked = Object.fromEntries(KINDS.map((k) => [k, a.progress.unlocked[k] || b.progress.unlocked[k]]));
  // Unknown (later) kinds: unlocked is OR; best keeps the higher pct (mine on a tie).
  const later = (o) => Object.keys(o).filter(unknownKind);
  for (const k of new Set([...later(a.progress.unlocked), ...later(b.progress.unlocked)])) {
    unlocked[k] = a.progress.unlocked[k] === true || b.progress.unlocked[k] === true;
  }
  for (const k of new Set([...later(a.progress.best), ...later(b.progress.best)])) {
    const x = a.progress.best[k], y = b.progress.best[k];
    best[k] = { ...(!x ? y : !y ? x : y.pct > x.pct ? y : x) };
  }
  out.progress = { xp: Math.max(a.progress.xp, b.progress.xp), unlocked, best };
  out.flags = { ...b.flags, ...a.flags };
  for (const k of FLAGS) out.flags[k] = a.flags[k] || b.flags[k];
  return out;
}

// The one save path: re-reads storage, merges, writes. Returns { state: merged, ok }.
// With no storage the state comes back unchanged and ok is false.
export function saveMerged(state, storage) {
  const st = storage === undefined ? getStorage() : storage;
  if (!st) return { state, ok: false };
  const merged = mergeStates(state, loadState(st));
  return { state: merged, ok: saveState(merged, st) };
}

export function recordResult(state, result) {
  const next = addXp(state, result.xp);
  const kind = result.kind;
  if (result.passed) next.progress.unlocked[kind] = true;
  const cur = next.progress.best[kind];
  if (isNum(result.pct) && isNum(result.timeSecs) && (kind !== 'jump' || isNum(result.distanceM))) {
    const cand = { timeSecs: result.timeSecs, pct: result.pct, stars: result.stars };
    if (kind === 'jump') cand.distanceM = result.distanceM; // only the best is saved, never the attempts
    if (isBetter(kind, cand, cur)) next.progress.best[kind] = cand;
  }
  return next;
}
