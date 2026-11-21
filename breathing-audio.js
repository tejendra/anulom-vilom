/**
 * Phase cues: soft looped brown-noise beds with crossfaded hand-offs between phases.
 */
(function (global) {
  const AudioContextCtor =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof webkitAudioContext !== 'undefined'
        ? webkitAudioContext
        : null;

  const NOISE_LOOP_SEC = 2;

  /** @type {{ ctx: AudioContext; master: GainNode } | null} */
  let bus = null;
  /** @type {AudioBuffer | null} */
  let noiseLoop = null;
  /** @type {{ source: AudioBufferSourceNode; gain: GainNode } | null} */
  let current = null;

  /** Last tone ends ~1.78s after t0; tail used to defer stopSession until the chime finishes. */
  const SESSION_COMPLETE_CHIME_SEC = 1.85;

  function getBus() {
    if (bus) return bus;
    if (!AudioContextCtor) return null;
    const ctx = new AudioContextCtor();
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    bus = { ctx, master };
    return bus;
  }

  function getNoiseLoop(ctx) {
    if (noiseLoop) return noiseLoop;
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * NOISE_LOOP_SEC));
    const buffer = ctx.createBuffer(1, len, rate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      brown = brown * 0.98 + white * 0.14;
      data[i] = brown * 0.35;
    }
    noiseLoop = buffer;
    return noiseLoop;
  }

  function crossfadeSec(phaseDurationSec) {
    const d = Math.max(Number(phaseDurationSec) || 0.12, 0.12);
    return Math.min(0.72, Math.max(0.07, d * 0.38));
  }

  function fadeOutCurrent(now, cf) {
    if (!current) return;
    const { source, gain } = current;
    const g = gain.gain;
    g.cancelScheduledValues(now);
    const v = Math.max(1e-4, g.value);
    g.setValueAtTime(v, now);
    g.linearRampToValueAtTime(0.0001, now + cf);
    const stopAt = now + cf + 0.04;
    try {
      source.stop(stopAt);
    } catch (_) {
      /* already stopped */
    }
    current = null;
  }

  function unlockFromUserGesture() {
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(1, now);
    if (ctx.state === 'suspended') void ctx.resume();
    getNoiseLoop(ctx);
  }

  async function startSession() {
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(1, now);
    if (ctx.state === 'suspended') await ctx.resume();
    getNoiseLoop(ctx);
  }

  function stopSession() {
    const b = bus;
    if (!b) return;
    const { ctx, master } = b;
    const now = ctx.currentTime;
    fadeOutCurrent(now, Math.min(0.32, 0.12));
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.36);
  }

  /** G4 → A4 → B4: audible on small speakers without the old high sine sting. */
  const PREP_COUNTDOWN_FREQS = { 3: 392, 2: 440, 1: 493.88 };

  /** Short sine chime for prep / session end (clearer than low triangle tones). */
  function playChimeAt(freq, dur, startAt, peak = 0.12) {
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    const start = startAt ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const attack = 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function playPrepCountdownTone(secondsLeft) {
    const freq = PREP_COUNTDOWN_FREQS[secondsLeft];
    if (freq) playChimeAt(freq, 0.3, undefined, 0.11);
  }

  /** Three ascending tones when the 15-minute session finishes (not on early stop). */
  function playSessionComplete() {
    const b = getBus();
    if (!b) return;
    const t0 = b.ctx.currentTime;
    playChimeAt(392, 0.45, t0);
    playChimeAt(440, 0.45, t0 + 0.28);
    playChimeAt(493.88, 0.82, t0 + 0.56);
  }

  /** Fade any phase cue, then play the session-complete chime. */
  function notifySessionTimeEnd() {
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    fadeOutCurrent(now, 0.28);
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(1, now);
    playSessionComplete();
  }

  function schedulePhaseGain(gain, now, dur, cf, peak) {
    const outTail = Math.min(0.55, Math.max(0.1, dur * 0.32));
    const releaseAt = now + Math.max(cf + 0.02, dur - outTail);
    const floor = peak * 0.15;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + cf);
    gain.gain.linearRampToValueAtTime(peak, Math.min(releaseAt, now + dur - 0.02));
    gain.gain.linearRampToValueAtTime(floor, now + dur);
  }

  function playPhaseBed(phaseClass, now, ctx, master, dur, cf) {
    const buffer = getNoiseLoop(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.45;

    const gain = ctx.createGain();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    const end = now + dur;
    let peak = 0.1;

    if (phaseClass === 'inhale') {
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.linearRampToValueAtTime(780, end);
      peak = 0.11;
    } else if (phaseClass === 'exhale') {
      filter.frequency.setValueAtTime(780, now);
      filter.frequency.linearRampToValueAtTime(300, end);
      peak = 0.11;
    } else {
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.linearRampToValueAtTime(240, end);
      peak = 0.055;
    }

    schedulePhaseGain(gain, now, dur, cf, peak);

    const stopWhen = end + 0.1;
    try {
      source.start(now);
      source.stop(stopWhen);
    } catch (_) {
      return;
    }
    current = { source, gain };
  }

  async function playPhaseCue(label, phaseClass, durationSec) {
    if (label === 'Get ready') return;
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    const dur = Math.max(Number(durationSec) || 0.12, 0.12);
    const cf = crossfadeSec(dur);

    fadeOutCurrent(now, cf);
    playPhaseBed(phaseClass, now, ctx, master, dur, cf);
  }

  global.BreathingAudio = {
    unlockFromUserGesture,
    startSession,
    stopSession,
    playPhaseCue,
    notifySessionTimeEnd,
    playSessionComplete,
    playPrepCountdownTone,
    SESSION_END_TAIL_MS: Math.round(SESSION_COMPLETE_CHIME_SEC * 1000) + 300,
  };
})(typeof window !== 'undefined' ? window : globalThis);