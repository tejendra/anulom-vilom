/**
 * Phase cues from MP3 clips with crossfaded hand-offs (separate from metronome `breathing-audio.js`).
 */
(function (global) {
  const AudioContextCtor =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof webkitAudioContext !== 'undefined'
        ? webkitAudioContext
        : null;

  const FILES = {
    inhale: 'assets/inhale.mp3',
    exhale: 'assets/exhale.mp3',
    hold: 'assets/hold.mp3',
  };

  /** @type {{ ctx: AudioContext; master: GainNode } | null} */
  let bus = null;
  /** @type {Promise<{ inhale: AudioBuffer; exhale: AudioBuffer; hold: AudioBuffer }> | null} */
  let decodePromise = null;
  /** @type {{ source: AudioBufferSourceNode; gain: GainNode } | null} */
  let current = null;

  let enabled = false;

  const SESSION_END_MASTER_FADE_SEC = 4.2;

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

  function loadBuffers(ctx) {
    if (decodePromise) return decodePromise;
    decodePromise = (async () => {
      const entries = Object.entries(FILES);
      const buffers = {};
      for (const [key, file] of entries) {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Failed to load ${file}`);
        const arr = await res.arrayBuffer();
        buffers[key] = await ctx.decodeAudioData(arr.slice(0));
      }
      return buffers;
    })();
    return decodePromise;
  }

  function bufferForPhase(phaseClass) {
    switch (phaseClass) {
      case 'inhale':
        return 'inhale';
      case 'exhale':
        return 'exhale';
      case 'hold-in':
      case 'hold-out':
        return 'hold';
      default:
        return 'hold';
    }
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
    if (!enabled) return;
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(1, now);
    if (ctx.state === 'suspended') void ctx.resume();
    void loadBuffers(ctx);
  }

  async function startSession() {
    if (!enabled) return;
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(1, now);
    if (ctx.state === 'suspended') await ctx.resume();
    await loadBuffers(ctx);
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

  /**
   * Long master fade when the session timer ends (no synth gong in this engine).
   */
  function notifySessionTimeEnd() {
    if (!enabled) return;
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const tail = SESSION_END_MASTER_FADE_SEC;
    fadeOutCurrent(now, Math.min(0.9, tail * 0.22));
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.linearRampToValueAtTime(0.0001, now + tail);
  }

  async function playPhaseCue(_label, phaseClass, durationSec) {
    if (!enabled) return;
    const b = getBus();
    if (!b) return;
    const { ctx, master } = b;
    if (ctx.state === 'suspended') await ctx.resume();

    let buffers;
    try {
      buffers = await loadBuffers(ctx);
    } catch {
      return;
    }

    const key = bufferForPhase(phaseClass);
    const buffer = buffers[key];
    if (!buffer) return;

    const now = ctx.currentTime;
    const dur = Math.max(Number(durationSec) || 0.12, 0.12);
    const cf = crossfadeSec(dur);
    const peak = 0.26;
    const outTail = Math.min(0.55, Math.max(0.1, dur * 0.32));
    const releaseAt = now + Math.max(cf + 0.02, dur - outTail);
    const floor = peak * 0.2;

    fadeOutCurrent(now, cf);

    const gain = ctx.createGain();
    gain.connect(master);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + cf);
    gain.gain.linearRampToValueAtTime(peak, Math.min(releaseAt, now + dur - 0.02));
    gain.gain.linearRampToValueAtTime(floor, now + dur);

    const stopWhen =
      now + Math.min(Math.max(dur + 0.18, cf + 0.12), Math.max(0.2, buffer.duration - 0.02));
    try {
      source.start(now, 0);
      source.stop(stopWhen);
    } catch (_) {
      return;
    }

    current = { source, gain };
  }

  global.BreathingAudioMp3 = {
    get enabled() {
      return enabled;
    },
    set enabled(v) {
      enabled = !!v;
    },
    unlockFromUserGesture,
    startSession,
    stopSession,
    playPhaseCue,
    notifySessionTimeEnd,
    SESSION_END_TAIL_MS: Math.round(SESSION_END_MASTER_FADE_SEC * 1000) + 500,
  };
})(typeof window !== 'undefined' ? window : globalThis);
