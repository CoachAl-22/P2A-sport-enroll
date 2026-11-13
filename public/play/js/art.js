// Scene and hero art. Draws on a 480x270 logical canvas, scaled up for crisp
// vector output. Browser-only at call time; safe to import in node.
import { HERO_OPTIONS } from './store.js';

const W = 480, H = 270, HERO_X = 120, PX = 12, FEET_Y = 252, MAX_SCALE = 4; // 4: the landscape stage fills a phone, about 700 CSS px wide at 3x
// The long jump is drawn zoomed in on the ground: at 12 px a metre the hero stands about 7.7 m tall
// and a 3.7 m jump looked like a hop (Alistair, 6 Nov). At 45 px a metre it is about two hero heights.
export const JUMP_PX = 45;
let ppm = PX; // pixels per metre for the run being drawn
const HERO_SCALE = 1.9;      // hero drawn about 92 logical units tall (feet stay put)
const SKIP_SCALE = 1.15;     // extra size in skip so the arm swing reads on a phone
const HERO_TOP = 48.3;       // hero height in its own unit space
const GHOST_STRIDE = 1.4;   // limb radians per metre of ghost distance (same as the hero's run cycle)
const SKIP_ARM = 1.9, RUN_ARM = 1.2, LEG_AMP = 0.95, ARM_LEN = 9.8;
const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
const COL = { navy: '#0a0a0a', navy2: '#111111', orange: '#F26522', cyan: '#00B4D8', gold: '#F5C842', white: '#ffffff', green: '#3ddc6b' };
const HAIR_COL = '#2b1b10';
const CROWD_COLS = ['#ffffff', '#00B4D8', '#F26522', '#9aa3b2', '#3d4657', '#00B4D8'];
const SHORTS = '#1b2a4a';
const JUMP_H_FLAT = 18, JUMP_H_FULL = 48; // flight peak height (logical units): flat jump up to a full push (raised with JUMP_PX so the longer arc doesn't look flat)
const JUMP_REACH_UNTIL = 0.55;            // share of the flight spent reaching before the landing pose
const FOUL_STRIP = 4, BOARD_MIN_W = 6;    // logical px: orange foul strip; the white board is the board zone, never under 6 px
const CONE_Y = 256, CONE_DX = -13;        // cones sit toward the camera and just behind the heel so they peek out beside the feet
const CROWD = Array.from({ length: 160 }, (_, i) => ({ x: i * 6 + (i % 3), row: i % 4, c: CROWD_COLS[i * 7 % 6] }));

let ctx = null; // set per createArt; helpers below draw to it
let G = {};     // static gradients for the current art, rebuilt on resize
let reduced = false; // prefers-reduced-motion: no crowd bob, no tangle wobble, no speed lines

function blob(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
}
function shadowText(t, x, y, c) {
  ctx.save();
  const a = ctx.globalAlpha;
  ctx.lineJoin = 'round'; ctx.strokeStyle = c; // soft glow without shadowBlur: two wider, fainter strokes in the popup colour
  ctx.globalAlpha = a * 0.18; ctx.lineWidth = 4 + 6; ctx.strokeText(t, x, y);
  ctx.globalAlpha = a * 0.35; ctx.lineWidth = 4 + 3; ctx.strokeText(t, x, y);
  ctx.globalAlpha = a;
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(t, x, y + 1);
  ctx.fillStyle = c; ctx.fillText(t, x, y);
  ctx.restore();
}
function shade(hex, k) { // darken a #rrggbb colour by fraction k (negative k lightens)
  const n = parseInt(String(hex).slice(1), 16);
  if (!Number.isFinite(n)) return hex;
  const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v * (1 - k) : v + (255 - v) * -k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function pick(list, i) { return list[Number.isInteger(i) && i >= 0 && i < list.length ? i : 0]; }
function compassBadge(x, y, r) {
  ctx.fillStyle = COL.navy2; circle(x, y, r);
  ctx.fillStyle = COL.cyan; ctx.beginPath();
  ctx.moveTo(x, y - r * 0.85); ctx.lineTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x + r * 0.85, y); ctx.lineTo(x + r * 0.25, y + r * 0.25);
  ctx.lineTo(x, y + r * 0.85); ctx.lineTo(x - r * 0.25, y + r * 0.25); ctx.lineTo(x - r * 0.85, y); ctx.lineTo(x - r * 0.25, y - r * 0.25);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.5, r * 0.14); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}

// ---------- scene layers ----------
function sky(cam) {
  ctx.fillStyle = G.sky; ctx.fillRect(0, 0, W, 190);
  ctx.fillStyle = G.sun; ctx.fillRect(290, 0, 200, 140);
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  for (let i = 0; i < 6; i++) {
    const x = ((i * 150 - cam * 0.06) % 900 + 900) % 900 - 100, y = 26 + (i % 3) * 16;
    blob(x, y, 24, 8); blob(x + 16, y - 6, 16, 10); blob(x + 34, y - 1, 14, 7);
  }
}

function hillLayer(off, base, col, period, amp) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 190);
  for (let x = 0; x <= W; x += 4) {
    const t = (x + off) / period;
    ctx.lineTo(x, base - Math.abs(Math.sin(t)) * amp - Math.sin(t * 0.37) * 6);
  }
  ctx.lineTo(W, 190); ctx.closePath(); ctx.fill();
}
function hills(cam) {
  hillLayer(cam * 0.12, 118, '#79c68a', 70, 26);
  hillLayer(cam * 0.25 + 160, 128, '#47a65f', 46, 18);
}

function bannerAt(x) { // orange banner with a compass motif, no text
  ctx.fillStyle = 'rgba(0,0,0,.25)'; roundRect(x - 15, 138, 30, 22, 3);
  ctx.fillStyle = COL.orange; roundRect(x - 15, 136, 30, 22, 3);
  compassBadge(x, 147, 8);
}
function flagAt(x) { // cyan flag on a pole
  ctx.fillStyle = '#d9dde4'; ctx.fillRect(x, 120, 1.5, 16);
  ctx.fillStyle = COL.cyan; ctx.beginPath(); ctx.moveTo(x + 1.5, 120); ctx.lineTo(x + 12, 123.5); ctx.lineTo(x + 1.5, 127); ctx.closePath(); ctx.fill();
}
function stand(cam, now) {
  ctx.fillStyle = G.stand; ctx.fillRect(0, 134, W, 56);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let r = 0; r < 4; r++) ctx.fillRect(0, 141 + r * 12, W, 1);
  const off = cam * 0.5;
  for (const p of CROWD) {
    const x = ((p.x - off) % 960 + 960) % 960 - 10;
    if (x < -6 || x > W) continue;
    const bob = !reduced && (Math.floor(now / 250 + p.x) % 5 === 0) ? -1.5 : 0;
    ctx.fillStyle = p.c; blob(x + 2, 146.5 + p.row * 12 + bob, 2.4, 3);
    ctx.fillStyle = '#e8c39e'; circle(x + 2, 142 + p.row * 12 + bob, 1.5);
  }
  for (let i = 0; i < 4; i++) { // banners and flags scroll with the stand
    const bx = ((i * 260 - off) % 1040 + 1040) % 1040 - 40;
    if (bx > -20 && bx < W + 20) bannerAt(bx);
    const fx = ((i * 260 + 130 - off) % 1040 + 1040) % 1040 - 40;
    if (fx > -20 && fx < W + 20) flagAt(fx);
  }
  ctx.fillStyle = '#171b23'; ctx.fillRect(0, 186, W, 4);
}

function track(run, r, dist) {
  ctx.fillStyle = G.track; ctx.fillRect(0, 190, W, 70);
  ctx.fillStyle = 'rgba(255,255,255,.92)'; [190, 222, 258].forEach((y) => ctx.fillRect(0, y, W, 1.5));
  ctx.fillStyle = G.grass; ctx.fillRect(0, 260, W, 10);
  if (!run) return;
  const isJump = run.kind === 'jump';
  const mx = (m) => HERO_X + (m - dist) * ppm;
  const first = Math.max(10, Math.ceil((dist - HERO_X / ppm - 2) / 10) * 10);
  for (let m = first; mx(m) < W + 20; m += 10) {
    const x = mx(m);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x - 0.75, 224, 1.5, 34);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; roundRect(x - 4, 215, 8, 6, 2); // marker tab, no text
  }
  const sx = mx(0);
  if (!isJump && sx > -10 && sx < W + 10) { ctx.fillStyle = COL.white; ctx.fillRect(sx - 1.5, 190, 3, 70); }
  if (!r) return;
  const kind = run.kind === 'reel' ? run.activeKind : run.kind;
  if ((kind === 'sprint' || kind === 'tempo') && r.len > 0) finishLine(HERO_X + (r.len - (r.dist || 0)) * PX);
  else if (kind === 'skip' && r.len > 0 && r.len - (r.skips || 0) <= 3) finishLine(HERO_X + (r.len - (r.skips || 0)) * 2 * PX); // one skip is about 2 m
}

function finishLine(fx) {
  if (fx < -50 || fx > W + 50) return;
  for (let y = 190; y < 260; y += 5) for (let k = 0; k < 2; k++) {
    ctx.fillStyle = ((y / 5 + k) % 2 === 0) ? COL.white : COL.navy2; ctx.fillRect(fx - 5 + k * 5, y, 5, 5);
  }
  const g = ctx.createLinearGradient(fx - 32, 0, fx - 26, 0); g.addColorStop(0, '#f2f2f2'); g.addColorStop(1, '#9aa0ab');
  ctx.fillStyle = g; roundRect(fx - 32, 118, 5, 72, 2); roundRect(fx + 27, 118, 5, 72, 2);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; roundRect(fx - 36, 112, 72, 18, 4);
  ctx.fillStyle = COL.orange; roundRect(fx - 36, 110, 72, 18, 4);
  compassBadge(fx, 119, 6.5);
}

// ---------- long jump scene ----------
const INK = 'rgba(10,10,10,.75)';
function cone(x, y, faint) { // orange on an orange track needs an outline: dark under white
  if (x < -14 || x > W + 14) return;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - 6.5, y); ctx.lineTo(x + 6.5, y); ctx.lineTo(x + 2, y - 14); ctx.lineTo(x - 2, y - 14); ctx.closePath();
  ctx.lineJoin = 'round';
  if (faint) {
    ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.stroke();
  } else {
    ctx.fillStyle = COL.orange; ctx.strokeStyle = COL.white; ctx.lineWidth = 2; ctx.stroke(); ctx.fill();
    ctx.fillStyle = COL.white; ctx.fillRect(x - 4.2, y - 8, 8.4, 2.4);
  }
  ctx.restore();
}
// The white board is drawn exactly as wide as the "on the board" zone (with the first attempt's
// widening), so a take-off anywhere on the white earns the mark. "Wait for the white board" is true.
export function boardZoneM(run) {
  const tune = run.tune || {};
  return (Number(tune.jumpZoneM) || 0) + (run.attempt === 0 ? Number(tune.jumpWideFirstM) || 0 : 0);
}
// Where the landing flag goes, in metres from the start cone: where the jump is measured to. On a
// leap that is short of the touchdown point by the leap cut. null until a legal landing.
export function flagM(run) {
  const to = run.takeoff;
  const landed = run.stage === 'landed' || run.stage === 'between' || run.phase === 'done';
  if (!landed || !to || to.foul || !run.landing || !Number.isFinite(run.flight)) return null;
  const cut = run.landing === 'two' ? 0 : Number((run.tune || {}).jumpLeapCut) || 0;
  return to.pos + run.flight * (1 - cut);
}
function jumpGround(run, dist, lit = false) { // under the hero: sandpit, white board (the board zone) and foul strip
  const tune = run.tune || {};
  const pit = tune.jumpPitLen || 8;
  const board = Number.isFinite(run.boardAt) ? run.boardAt : 0;
  // A strip of runway between the foul line and the sand, as on a real long jump runway, so a
  // take-off on the board is drawn over the track, not the pit (Alistair, 6 Nov).
  const gap = Number.isFinite(tune.jumpPitGapM) && tune.jumpPitGapM > 0 ? tune.jumpPitGapM : 0;
  const mx = (m) => HERO_X + (m - dist) * ppm;
  const bx = mx(board), zw = Math.max(BOARD_MIN_W, boardZoneM(run) * ppm);
  const sx = mx(board + gap);
  const px0 = Math.max(-10, sx), px1 = Math.min(W + 10, mx(board + gap + pit));
  if (px1 > px0) { // sandpit replaces the track in its span, with a slightly darker rim
    ctx.fillStyle = G.sand; ctx.fillRect(px0, 190, px1 - px0, 70);
    ctx.fillStyle = 'rgba(120,84,36,.45)';
    ctx.fillRect(px0, 190, px1 - px0, 2); ctx.fillRect(px0, 258, px1 - px0, 2);
    if (sx >= -10) ctx.fillRect(sx, 190, 2, 70); // near rim
    if (mx(board + gap + pit) <= W + 10) ctx.fillRect(mx(board + gap + pit) - 2, 190, 2, 70);
  }
  if (bx > -zw - 10 && bx < W + 20) {
    ctx.fillStyle = INK; ctx.fillRect(bx - zw - 1, 190, zw + 2 + FOUL_STRIP + 1, 70); // dark edges
    ctx.fillStyle = lit ? COL.green : COL.white; ctx.fillRect(bx - zw, 190, zw, 70);
    if (lit) { ctx.fillStyle = 'rgba(61,220,107,.28)'; ctx.fillRect(bx - zw - 4, 186, zw + 8, 78); } // soft glow round the lit board
    ctx.fillStyle = COL.orange; ctx.fillRect(bx, 190, FOUL_STRIP, 70); // foul strip, just past the line
  }
}
function jumpMarks(run, dist) { // over the hero: start cones and the landing flag
  const tune = run.tune || {};
  const shoeM = tune.jumpShoeM || 0;
  const mx = (m) => HERO_X + (m - dist) * ppm + CONE_DX;
  const shoes = Math.max(0, run.shoes | 0);
  for (let k = 1; k <= shoes; k++) cone(mx(k * shoeM), CONE_Y, true); // where the start used to be
  cone(mx(0), CONE_Y, false);
  const at = flagM(run);
  if (at !== null) {
    const fx = HERO_X + (at - dist) * ppm;
    if (fx > -16 && fx < W + 16) {
      ctx.save();
      ctx.fillStyle = INK; ctx.fillRect(fx - 1.7, 230, 3.4, 26);
      ctx.fillStyle = '#e6e9ee'; ctx.fillRect(fx - 0.8, 231, 1.6, 24);
      ctx.beginPath(); ctx.moveTo(fx + 0.8, 231); ctx.lineTo(fx + 15, 236.5); ctx.lineTo(fx + 0.8, 242); ctx.closePath();
      ctx.lineJoin = 'round'; ctx.strokeStyle = COL.white; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = COL.cyan; ctx.fill();
      ctx.restore();
    }
  }
}

function speedLines(run, now) {
  if (!run || run.speed <= 7) return;
  ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.5, (run.speed - 7) / 8 + 0.15)})`; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const y = 196 + i * 13 + Math.sin(now / 33 + i) * 2, l = 20 + i * 6 + (run.speed - 5) * 2.5;
    ctx.beginPath(); ctx.moveTo(HERO_X - 26 - i * 4, y); ctx.lineTo(HERO_X - 26 - i * 4 - l, y); ctx.stroke();
  }
}

function dustPuffs(dust) {
  for (const d of dust || []) {
    ctx.fillStyle = `rgba(255,224,196,${Math.min(0.8, d.life * 2)})`;
    circle(d.x, d.y, Math.max(0.5, 1.5 + (0.35 - d.life) * 9) * 1.6);
  }
}

function popups(list, baseY) {
  if (!list || !list.length) return;
  ctx.textAlign = 'center'; ctx.font = '900 22px ' + DISPLAY;
  const shown = list.slice(-3);
  shown.forEach((p, i) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    if (p.big) ctx.font = '900 44px ' + DISPLAY; // the long jump's TAP!: twice the size, it must not be missed
    shadowText(p.text, W / 2, baseY + (p.y || 0) - (shown.length - 1 - i) * 24, p.color || COL.white);
    if (p.big) ctx.font = '900 22px ' + DISPLAY;
    ctx.globalAlpha = 1;
  });
}

// ---------- hero ----------
function hairBack(kind, hx, hy, c) { // drawn before the head
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = 'round';
  if (kind === 'ponytail') { ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(hx - 4.5, hy - 2); ctx.quadraticCurveTo(hx - 11, hy - 1, hx - 10, hy + 6); ctx.stroke(); }
  if (kind === 'braids') {
    ctx.lineWidth = 2.2;
    for (const dx of [-5, -3]) { ctx.beginPath(); ctx.moveTo(hx + dx, hy); ctx.lineTo(hx + dx - 3, hy + 8); ctx.stroke(); }
  }
}
function hairFront(kind, hx, hy, c) { // drawn over the head
  ctx.fillStyle = c;
  if (kind === 'curly') { for (const [dx, dy, r] of [[-4, -3.5, 2.8], [0, -5.2, 3], [4, -3.5, 2.8], [-5.4, 0, 2.3], [-2.2, -4.2, 2.6], [2.2, -4.2, 2.6]]) circle(hx + dx, hy + dy, r); return; }
  const top = kind === 'buzz' ? 5.8 : 6.3;
  ctx.beginPath(); ctx.arc(hx, hy - 0.4, top, Math.PI * 1.02, Math.PI * 1.98);
  ctx.lineTo(hx + 5, hy - 1.5); ctx.lineTo(hx - 6, hy - 1); ctx.closePath(); ctx.fill();
  if (kind === 'short') { ctx.beginPath(); ctx.moveTo(hx - 6, hy - 1); ctx.lineTo(hx - 6.5, hy + 3); ctx.lineTo(hx - 3.5, hy - 1); ctx.fill(); }
  if (kind === 'ponytail') circle(hx - 5, hy - 2.5, 2);
}

// Limb angles in radians, positive = swung forward. Opposite arm, opposite leg:
// the far arm always pairs with the near leg, and the near arm with the far leg.
export function runPose(limb) {
  const s = Math.sin(limb);
  return { farLeg: -s * LEG_AMP, nearLeg: s * LEG_AMP, farArm: s * RUN_ARM, nearArm: -s * RUN_ARM };
}
// Skip: every limb comes from the one eased swing value e (-1..1), so the rule cannot drift.
export function skipPose(e) {
  return { farLeg: -e * LEG_AMP, nearLeg: e * LEG_AMP, farArm: e * SKIP_ARM, nearArm: -e * SKIP_ARM };
}
// Elbow and hand relative to the shoulder. In skip the elbow straightens on the forward swing.
export function armPoints(th, skip, elbow, k = 1) {
  const bend = skip && th > 0 ? 1 - 0.9 * Math.min(1, th / SKIP_ARM) : 1;
  const fa = th + (typeof elbow === 'number' ? elbow : 1.5 * bend);
  const len = ARM_LEN * k;
  const ex = Math.sin(th) * len, ey = Math.cos(th) * len;
  return { ex, ey, hx: ex + Math.sin(fa) * len, hy: ey + Math.cos(fa) * len };
}
// Named jump poses as data. Angles in radians, positive = forward, 0 = hanging down; an arm past pi/2 is overhead.
// elbowBend is added to the arm angle for the forearm; kneeBend is how far each shin folds back from its thigh.
const POSES = {
  run: { ...runPose(0), kneeBend: 0 },
  stand: { farLeg: 0.08, nearLeg: -0.08, farArm: 0.12, nearArm: -0.12, elbowBend: 0.35, kneeBend: 0 },
  // long jump take-off: the take-off foot (near) is planted on the ground line, the far knee drives up, and
  // the opposite (near) arm punches up and forward while the far arm drives back. (Not jet wings: that is
  // the standing broad jump, Coach Al 6 Nov 2026.)
  drive: { farLeg: 1.5, nearLeg: -0.15, farArm: -0.9, nearArm: 2.1, elbowBend: 0.35, kneeBend: 1.5, nearKnee: 0 },
  // arms straight and long, clearly over the head and slightly forward (drawn after the head)
  reach: { farLeg: 1.6, nearLeg: -0.45, farArm: 2.75, nearArm: 2.6, elbowBend: 0, kneeBend: 1.4, nearKnee: 0.9, armK: 1.25 },
  moto: { farLeg: 0.7, nearLeg: 0.7, farArm: 1.45, nearArm: 1.45, elbowBend: 0.1, kneeBend: 0.7 },
  leap: { farLeg: 1.15, nearLeg: -0.65, farArm: 1.9, nearArm: -0.5, elbowBend: 0.5, kneeBend: 0.35, nearKnee: 0.9 },
  hang: { farLeg: 1.0, nearLeg: 0.2, farArm: 1.7, nearArm: 1.5, elbowBend: 0.3, kneeBend: 1.0, nearKnee: 0.8 }, // reach easing down (before the landing is chosen)
};
const POSE_TIP = { run: 0, stand: 0, drive: 0.2, reach: 0.05, moto: 0.12, leap: 0.32, hang: 0.1 }; // body lean, radians, clockwise = forward
const SHOULDER_Y = -33, HEAD_TOP_Y = -47.6, HIP_Y = -20; // hero unit space (feet at 0)
export function poseAngles(pose) {
  const p = POSES[pose] || POSES.run;
  return { farLeg: p.farLeg, nearLeg: p.nearLeg, farArm: p.farArm, nearArm: p.nearArm,
    elbowBend: p.elbowBend === undefined ? 1.5 : p.elbowBend, kneeBend: p.kneeBend,
    farKnee: p.farKnee === undefined ? p.kneeBend : p.farKnee, nearKnee: p.nearKnee === undefined ? p.kneeBend : p.nearKnee,
    armK: p.armK === undefined ? 1 : p.armK };
}
export function poseTip(pose) { return POSE_TIP[pose] || 0; }
// Hand end-points relative to the shoulder, hero unit space (before the body tip).
export function poseHands(pose) {
  const a = poseAngles(pose);
  const h = (th) => { const q = armPoints(th, false, a.elbowBend, a.armK); return { x: q.hx, y: q.hy }; };
  return { far: h(a.farArm), near: h(a.nearArm) };
}
// Foot position in hero unit space (feet origin at 0,0; up is negative) after the body tip.
export function poseFoot(pose, which) {
  const a = poseAngles(pose), th = which === 'far' ? a.farLeg : a.nearLeg, kb = which === 'far' ? a.farKnee : a.nearKnee;
  const sa = th - kb;
  const x = Math.sin(th) * 10 + Math.sin(sa) * 10, y = HIP_Y + Math.cos(th) * 10 + Math.cos(sa) * 10;
  const t = poseTip(pose), dy = y - HIP_Y;
  return { x: x * Math.cos(t) - dy * Math.sin(t), y: HIP_Y + x * Math.sin(t) + dy * Math.cos(t) };
}
export const HERO_GEOM = { shoulderY: SHOULDER_Y, headTopY: HEAD_TOP_Y };
function mixPose(a, b, k) {
  const o = {};
  for (const key of Object.keys(a)) o[key] = a[key] + (b[key] - a[key]) * k;
  return o;
}
export function jumpPose(stage, flightFrac, landing, speed) {
  if (stage === 'takeoff') return 'drive';
  if (stage === 'flight') return flightFrac >= JUMP_REACH_UNTIL && landing === 'two' ? 'moto' : 'reach';
  if (stage === 'landed' || stage === 'between') return landing === 'two' ? 'moto' : landing === 'leap' ? 'leap' : speed < 0.3 ? 'stand' : 'run'; // no jump: keeps running pose while sliding, stands when stopped
  return 'run';
}
// Height above the ground in logical units: a parabola, taller with a bigger push.
// The take-off pose is drawn so its planted foot sits on the point the take-off is judged at (run.pos).
// The shift eases back to zero over the first half of the flight, where the hero is in the air.
export function jumpHeroDx(stage, flightFrac) {
  const full = -poseFoot('drive', 'near').x * HERO_SCALE;
  if (stage === 'takeoff') return full;
  if (stage !== 'flight' || !Number.isFinite(flightFrac)) return 0;
  const e = Math.min(1, Math.max(0, flightFrac / 0.5));
  return full * (1 - e * e * (3 - 2 * e));
}
export function jumpLift(flightFrac, push) {
  const f = Number(flightFrac), p = Math.max(0, Math.min(1, Number(push) || 0));
  if (!(f > 0 && f < 1)) return 0;
  return (JUMP_H_FLAT + (JUMP_H_FULL - JUMP_H_FLAT) * p) * 4 * f * (1 - f);
}
export function heroHeight(skip = false, scale = 1) { return HERO_TOP * HERO_SCALE * (skip ? SKIP_SCALE : 1) * scale; }

// opts: { limb (run-cycle radians), swing (eased skip swing -1..1; its presence selects skip mode),
//         lean, tangled, hero, alpha, ghost, scale, now,
//         pose ('run' default | 'stand' | 'drive' | 'reach' | 'moto' | 'leap'), angles (explicit poseAngles-shaped override, for eased blends),
//         tip (body lean override), wobble (radians, landed leap) }
function drawHero(x, y, opts = {}) {
  const { limb = 0, swing, lean = 0.2, tangled = false, hero, alpha = 1, ghost = false, scale = 1, now = 0, pose: poseName = 'run', angles, tip: tipOpt, wobble = 0 } = opts;
  const h = hero || {};
  const skinHex = pick(HERO_OPTIONS.skin, h.skin), kitHex = pick(HERO_OPTIONS.kit, h.kit), hair = pick(HERO_OPTIONS.hair, h.hair);
  const C = ghost
    ? { far: '#8fe3f5', near: '#22c6e8', shirt: '#22c6e8', shorts: '#0b93b8', skin: '#cdf3ff', hair: '#1aa9c9', shoe: '#ffffff', reach: '#8fe3f5' }
    : { far: shade(skinHex, 0.16), near: skinHex, shirt: kitHex, shorts: SHORTS, skin: skinHex, hair: HAIR_COL, shoe: COL.cyan, reach: shade(skinHex, -0.2) };
  const skip = typeof swing === 'number';
  let pose;
  if (tangled) pose = { farLeg: 0.08, nearLeg: -0.08, farArm: SKIP_ARM, nearArm: SKIP_ARM * 0.85 }; // both arms forward, legs together
  else if (poseName !== 'run' && POSES[poseName]) {
    pose = angles || poseAngles(poseName);
  } else pose = skip ? skipPose(Math.max(-1, Math.min(1, swing))) : runPose(limb);
  const tip = poseName !== 'run' && !tangled ? (typeof tipOpt === 'number' ? tipOpt : poseTip(poseName)) : 0;
  const armsOver = poseName === 'reach' && pose.armK > 1.1; // arms overhead are drawn after the head
  const bounce = skip && !tangled ? 3 * (1 - Math.abs(swing)) : 0;
  const k = HERO_SCALE * scale * (skip ? SKIP_SCALE : 1);
  const hipY = -20, shY = -34, lx = lean * 6;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y - bounce); ctx.scale(k, k);
  if (tangled && !reduced) ctx.rotate(Math.sin(now / 55) * 0.09);
  const rot = tip + (wobble && !reduced ? Math.sin(now / 70) * wobble : 0);
  if (rot) { ctx.translate(0, hipY); ctx.rotate(rot); ctx.translate(0, -hipY); } // tip the whole body about the hips
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const leg = (th, col, kb) => {
    const kx = Math.sin(th) * 10, ky = hipY + Math.cos(th) * 10;
    const sa = typeof kb === 'number' ? th - kb : th < 0 ? th - 1.0 : th * 0.2;
    const fx = kx + Math.sin(sa) * 10, fy = ky + Math.cos(sa) * 10;
    ctx.strokeStyle = col; ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = C.shoe; ctx.save(); ctx.translate(fx + 1, fy + 0.5); ctx.rotate(sa * 0.3); blob(0, 0, 4.2, 2.4); ctx.restore();
  };
  const arm = (th, col) => {
    const a = armPoints(th, skip, pose.elbowBend, pose.armK), sx = lx, sy = shY + 1;
    const thick = skip ? 1.35 : 1;
    ctx.strokeStyle = skip && th > 0.6 ? C.reach : col; // the reaching arm reads lighter against the body
    ctx.lineWidth = 3.4 * thick;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + a.ex, sy + a.ey); ctx.lineTo(sx + a.hx, sy + a.hy); ctx.stroke();
    if (skip || typeof pose.elbowBend === 'number') { ctx.fillStyle = col; circle(sx + a.hx, sy + a.hy, 2.3); } // hand
  };
  leg(pose.farLeg, C.far, pose.farKnee); if (!armsOver) arm(pose.farArm, C.far);
  ctx.strokeStyle = C.shorts; ctx.lineWidth = 9.5;
  ctx.beginPath(); ctx.moveTo(0, hipY - 0.5); ctx.lineTo(lx * 0.35, hipY - 6); ctx.stroke();
  ctx.strokeStyle = C.shirt; ctx.lineWidth = 9.5;
  ctx.beginPath(); ctx.moveTo(lx * 0.35, hipY - 6); ctx.lineTo(lx, shY + 2); ctx.stroke();
  if (!ghost) compassBadge(lx + 0.5, shY + 7, 2.8);
  leg(pose.nearLeg, C.near, pose.nearKnee); if (!armsOver) arm(pose.nearArm, C.near);
  const hx = lx + 1, hy = shY - 8;
  if (!ghost) hairBack(hair, hx, hy, C.hair);
  ctx.fillStyle = C.skin; circle(hx, hy, 5.6);
  hairFront(hair, hx, hy, C.hair);
  if (!ghost) { ctx.fillStyle = '#1a1a1a'; circle(hx + 2.6, hy + 0.3, 1); }
  if (armsOver) { arm(pose.farArm, C.far); arm(pose.nearArm, C.near); }
  ctx.restore();
}

// ---------- factory ----------
function buildGradients(c) {
  const lin = (y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const sun = c.createRadialGradient(392, 42, 0, 392, 42, 90);
  sun.addColorStop(0, 'rgba(255,246,200,.95)'); sun.addColorStop(0.25, 'rgba(255,246,200,.5)'); sun.addColorStop(1, 'rgba(255,246,200,0)');
  return {
    sky: lin(0, 190, '#3b86e6', '#c6e5ff'), sun,
    stand: lin(134, 190, '#626d82', '#2a303c'), track: lin(190, 260, '#d6623b', '#b4451f'), sand: lin(190, 260, '#f3e2b3', '#d8bb80'), grass: lin(260, 270, '#45c468', '#2a9a4c'),
  };
}

export function createArt(canvas) {
  const c2d = canvas.getContext('2d');
  let scale = 1;
  let grads = {};
  let armSwing = -1; // eased skip swing, kept between frames
  let lastNow = 0;
  let motoMix = 0, lastJump = 0; // reach -> moto blend, kept between frames

  function resize() {
    scale = Math.min(MAX_SCALE, Math.max(1, Math.ceil((canvas.clientWidth || W) * (globalThis.devicePixelRatio || 1) / W)));
    canvas.width = W * scale; canvas.height = H * scale;
    c2d.setTransform(scale, 0, 0, scale, 0, 0);
    c2d.imageSmoothingEnabled = true;
    grads = buildGradients(c2d);
  }

  function easeSwing(target, now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;
    armSwing += (target - armSwing) * Math.min(1, dt * 14);
    return armSwing;
  }

  function ghostPacer(r, activeKind, now, dist) {
    if (activeKind !== 'tempo' || !r || !Number.isFinite(r.ghostDist) || r.phase === 'count') return;
    const gx = HERO_X + (r.ghostDist - (r.dist || 0)) * PX; // inner-relative on both sides
    if (gx < -40 || gx > W + 40) return;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; blob(gx, 228, 17, 3.5);
    drawHero(gx, 226, { limb: r.ghostDist * GHOST_STRIDE, lean: 0.5, ghost: true, alpha: 0.5, scale: 0.85 });
  }

  // Jump hero for this frame: pose name, eased limb angles through the flight, lift, wobble.
  function jumpHero(run, now) {
    const f = run.flightFrac, flying = run.stage === 'flight';
    const pose = jumpPose(run.stage, f, run.landing, run.speed);
    const dt = Math.min(0.1, Math.max(0, (now - lastJump) / 1000));
    lastJump = now;
    const target = run.landing === 'two' ? 1 : 0;
    motoMix = flying ? motoMix + (target - motoMix) * Math.min(1, dt * 18) : target; // reach/hang eases into the landing pose over ~0.1 s
    const opts = { pose, wobble: pose === 'leap' ? 0.05 : 0 };
    if (flying && f > JUMP_REACH_UNTIL) {
      const e = Math.min(1, (f - JUMP_REACH_UNTIL) / (1 - JUMP_REACH_UNTIL));
      const hang = mixPose(poseAngles('reach'), poseAngles('hang'), e);
      opts.angles = mixPose(hang, poseAngles('moto'), motoMix);
      opts.tip = POSE_TIP.reach + (POSE_TIP.hang - POSE_TIP.reach) * e + (POSE_TIP.moto - POSE_TIP.hang) * motoMix;
      opts.pose = motoMix > 0.5 ? 'moto' : 'reach';
    }
    return { lift: flying ? jumpLift(f, run.push) : 0, dx: jumpHeroDx(run.stage, f), opts };
  }

  function draw(state = {}) {
    const { run = null, hero = null, popups: pops = [], dust = [], now = 0, limb = 0, reducedMotion = false, boardLit = false } = state;
    reduced = !!reducedMotion;
    ctx = c2d; G = grads;
    const dist = run ? run.dist || 0 : 0; // reel total drives parallax
    ppm = run && run.kind === 'jump' ? JUMP_PX : PX;
    const cam = run ? dist * ppm : now * 0.04;
    const r = run && run.kind === 'reel' ? run.inner || null : run; // inner-relative reads
    const activeKind = run ? (run.kind === 'reel' ? run.activeKind : run.kind) : null;
    const isJump = !!run && run.kind === 'jump';
    sky(cam); hills(cam); stand(cam, now); track(run, r, dist);
    if (isJump) jumpGround(run, dist, !!boardLit);
    ghostPacer(r, activeKind, now, dist);
    if (!reduced) speedLines(run, now);
    dustPuffs(dust);
    const crouch = !!run && run.phase === 'count';
    const lean = run ? Math.min(1, (run.speed || 0) / 8) : 0.2;
    const tangled = !!(r && r.tangled) && activeKind === 'skip';
    const swing = activeKind === 'skip' && r ? easeSwing(r.swing === 1 ? 1 : -1, now) : undefined;
    const k = HERO_SCALE * (typeof swing === 'number' ? SKIP_SCALE : 1);
    const jh = isJump ? jumpHero(run, now) : null;
    const lift = jh ? jh.lift : 0;
    const shrink = 1 - Math.min(0.6, lift / (JUMP_H_FULL * 1.6)); // shadow stays on the ground and shrinks with height
    const hx = HERO_X + (jh ? jh.dx : 0);
    ctx.fillStyle = `rgba(0,0,0,${(0.22 * (0.5 + 0.5 * shrink)).toFixed(3)})`; blob(hx + 1, 255, 12 * k * shrink, 3 * k * shrink);
    drawHero(hx, FEET_Y - lift, { limb: crouch ? 0.15 : limb, swing, lean: crouch ? 1.4 : lean, tangled, hero, now, ...(jh ? jh.opts : null) });
    if (isJump) jumpMarks(run, dist);
    popups(pops, FEET_Y - lift - HERO_TOP * k - 10); // anchored above the head, including the flight lift
  }

  function drawTitleScene(now = 0, hero, reducedMotion = false) {
    draw({ run: null, hero: hero || { skin: 0, hair: 0, kit: 0 }, now, limb: now / 130, popups: [], dust: [], reducedMotion });
  }

  resize();
  return {
    resize, draw, drawTitleScene,
    drawHero(x, y, opts) { ctx = c2d; G = grads; drawHero(x, y, opts); },
  };
}
