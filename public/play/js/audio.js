// Synthesised sound effects: oscillators and gain envelopes only, no files, no network.
// Nothing touches AudioContext until unlock() is called from a user gesture.

const FANFARE = [523, 659, 784, 1046];

export function createAudio() {
  let ac = null;
  let muted = false;

  function tone(freq, dur = 0.06, type = 'square', vol = 0.05, delay = 0) {
    if (!ac || muted || vol <= 0) return;
    try {
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); // 5 ms attack, no onset click
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.02));
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch { /* audio is optional */ }
  }

  const fanfare = () => FANFARE.forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.11));

  const sounds = {
    stepL: () => tone(330, 0.04, 'square', 0.03),
    stepR: () => tone(495, 0.04, 'square', 0.03), // a fifth above stepL
    tick: () => tone(1568, 0.025, 'sine', 0.05),
    good: () => { tone(988, 0.07, 'square', 0.04); tone(1319, 0.1, 'square', 0.04, 0.06); },
    buzz: () => tone(110, 0.18, 'sawtooth', 0.05),
    nearly: () => { tone(494, 0.07, 'sine', 0.04); tone(440, 0.1, 'sine', 0.04, 0.07); },
    land: () => { tone(100, 0.16, 'sine', 0.06); tone(300, 0.025, 'triangle', 0.012); }, // soft low thud; the short quiet 300 Hz partner is the sand tick (phone speakers roll off below ~150 Hz)
    fanfare,
    unlock: () => { fanfare(); tone(784, 0.7, 'triangle', 0.05, 0.5); }, // held fifth note over the root
  };

  return {
    unlock() {
      if (!ac) {
        try {
          const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
          ac = Ctor ? new Ctor() : null;
        } catch { ac = null; }
      }
      // 'suspended' after load, 'interrupted' on iOS after a phone call: resume either way
      if (ac && ac.state !== 'running' && ac.state !== 'closed') {
        try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ }
      }
    },
    play(name) {
      if (!ac || muted) return;
      const fn = Object.prototype.hasOwnProperty.call(sounds, name) ? sounds[name] : null;
      if (fn) fn();
    },
    setMuted(v) { muted = !!v; },
    get muted() { return muted; },
  };
}
