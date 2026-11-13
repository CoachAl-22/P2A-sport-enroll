// Typo-detecting unlock code, NOT security: nothing is signed, there is no secret.
// Format: NAME-SKILL-PCT-YYMMDD-CK, e.g. LEAH-SP-83-261105-7F

const SKILL_TO_CODE = { skip: 'SK', sprint: 'SP', tempo: 'TE', reel: 'HR', jump: 'LJ' };
const CODE_TO_SKILL = Object.fromEntries(Object.entries(SKILL_TO_CODE).map(([k, v]) => [v, k]));
const SHAPE = /^([A-Z]{4})-(SK|SP|TE|HR|LJ)-(\d{2})-(\d{6})-([0-9A-Z]{2})$/;

function checksum(text) {
  let sum = 0;
  for (let i = 0; i < text.length; i++) sum += (i + 1) * text.charCodeAt(i);
  return (sum % 1296).toString(36).toUpperCase().padStart(2, '0');
}

function nameLetters(name) {
  const letters = String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  return letters.slice(0, 4).padEnd(4, 'X');
}

const two = (n) => String(n).padStart(2, '0');

export function makeUnlockCode({ name, skill, pct, date }) {
  const p = Math.min(99, Math.max(0, Math.round(Number(pct) || 0)));
  const ymd = two(date.getFullYear() % 100) + two(date.getMonth() + 1) + two(date.getDate());
  const body = `${nameLetters(name)}-${SKILL_TO_CODE[skill]}-${two(p)}-${ymd}-`;
  return body + checksum(body);
}

export function checkUnlockCode(code) {
  try {
    if (typeof code !== 'string') return { ok: false };
    const clean = code.trim().toUpperCase();
    const m = SHAPE.exec(clean);
    if (!m) return { ok: false };
    const body = clean.slice(0, clean.length - 2);
    if (checksum(body) !== m[5]) return { ok: false };
    return {
      ok: true,
      fields: { name: m[1], skill: CODE_TO_SKILL[m[2]], pct: Number(m[3]), date: m[4] },
    };
  } catch {
    return { ok: false };
  }
}
