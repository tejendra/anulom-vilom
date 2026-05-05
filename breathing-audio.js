/**
 * Phase metronome only: short ticks on a steady beat (pitch + rhythm vary by phase).
 */
(function (global) {
  const AudioContextCtor =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof webkitAudioContext !== 'undefined'
        ? webkitAudioContext
        : null;

  /** @type {{ ctx: AudioContext; master: GainNode; cue: GainNode } | null} */
  let audioRef = null;

  const DEFAULT_SETTINGS = {
    masterVolume: 1,
    cueVolume: 1,
    tickIntervalSec: 1,
    tickDurationSec: 0.038,
    metronomeGain: 0.14,
    metronomeAccentGain: 0.2,
    holdTickIntervalMultiplier: 2,
  };

  function getAudioInternal() {
    if (audioRef) return audioRef;
    if (!AudioContextCtor) return null;

    const ctx = new AudioContextCtor();
    const master = ctx.createGain();
    const cue = ctx.createGain();

    cue.connect(master);
    master.connect(ctx.destination);

    audioRef = { ctx, master, cue };
    return audioRef;
  }

  function getAudio() {
    return getAudioInternal();
  }

  function applyLevels(s) {
    const g = getAudio();
    if (!g) return;
    g.master.gain.value = s.masterVolume;
    g.cue.gain.value = s.cueVolume;
  }

  function scheduleTick(ctx, cueBus, when, freq, peakGain, tickDur, oscType, attackSec) {
    const osc = ctx.createOscillator();
    osc.type = oscType || 'sine';
    osc.frequency.setValueAtTime(freq, when);
    const amp = ctx.createGain();
    const pk = Math.max(peakGain, 0.0002);
    const atk = attackSec != null ? attackSec : 0.004;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(pk, when + atk);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + tickDur);
    osc.connect(amp);
    amp.connect(cueBus);
    osc.start(when);
    osc.stop(when + tickDur + 0.018);
  }

  /**
   * durMul scales tick length; attackSec shapes how sharp the click is (inhale snappy vs exhale soft).
   */
  function tickProfileForPhase(label, phaseClass, baseInterval, settings) {
    const holdMult = Math.max(1, Number(settings.holdTickIntervalMultiplier) || 2);
    if (label === 'Get ready') {
      return { freq: 523, type: 'sine', interval: baseInterval, durMul: 1, attackSec: 0.004 };
    }
    switch (phaseClass) {
      case 'inhale':
        return {
          freq: 1175,
          type: 'sine',
          interval: baseInterval * holdMult,
          durMul: 0.68,
          attackSec: 0.0022,
        };
      case 'exhale':
        return {
          freq: 220,
          type: 'triangle',
          interval: baseInterval * holdMult,
          durMul: 1.35,
          attackSec: 0.008,
        };
      case 'hold-in':
        return { freq: 349, type: 'triangle', interval: baseInterval * holdMult, durMul: 1, attackSec: 0.004 };
      case 'hold-out':
        return { freq: 196, type: 'triangle', interval: baseInterval * holdMult, durMul: 1, attackSec: 0.004 };
      default:
        return { freq: 440, type: 'sine', interval: baseInterval, durMul: 1, attackSec: 0.004 };
    }
  }

  function playMetronomeCue(label, phaseClass, durationSec) {
    const g = getAudio();
    if (!g) return;
    const { ctx, cue } = g;
    const audio = global.BreathingAudio;
    const s = audio.settings;
    const now = ctx.currentTime;
    const dur = Math.max(Number(durationSec) || 0.2, 0.12);
    const baseInterval = Math.max(0.2, Number(s.tickIntervalSec) || 1);
    const baseTickDur = Math.min(0.06, Math.max(0.024, Number(s.tickDurationSec) || 0.038));
    const profile = tickProfileForPhase(label, phaseClass, baseInterval, s);
    const { freq, type, interval, durMul = 1, attackSec = 0.004 } = profile;
    const tickDur = Math.min(0.08, Math.max(0.018, baseTickDur * durMul));
    const accent = Math.max(Number(s.metronomeAccentGain) || 0.18, 0.0002);
    const normal = Math.max(Number(s.metronomeGain) || 0.12, 0.0002);

    if (dur <= interval + 1e-6) {
      scheduleTick(ctx, cue, now, freq, accent, tickDur, type, attackSec);
      return;
    }

    let i = 0;
    for (let t = 0; t <= dur + 1e-6; t += interval) {
      const when = now + t;
      if (when > now + dur + 0.02) break;
      const gPeak = i === 0 ? accent : normal * 0.9;
      scheduleTick(ctx, cue, when, freq, gPeak, tickDur, type, attackSec);
      i += 1;
    }
  }

  function unlockFromUserGesture() {
    const audio = global.BreathingAudio;
    if (!audio.enabled) return;
    const g = getAudio();
    if (!g) return;
    applyLevels(audio.settings);
    const { ctx, master } = g;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(audio.settings.masterVolume, now);
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  async function startSession() {
    const audio = global.BreathingAudio;
    if (!audio.enabled) return;
    const g = getAudio();
    if (!g) return;
    const { ctx, master } = g;
    applyLevels(audio.settings);
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(audio.settings.masterVolume, now);
    if (ctx.state === 'suspended') await ctx.resume();
  }

  function stopSession() {
    const g = getAudio();
    if (!g) return;
    const { ctx, master } = g;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  }

  async function playPhaseCue(label, phaseClass, durationSec) {
    const audio = global.BreathingAudio;
    if (!audio.enabled) return;
    const g = getAudio();
    if (!g) return;
    const { ctx } = g;
    if (ctx.state === 'suspended') await ctx.resume();

    const d = Math.max(Number(durationSec) || 0.2, 0.15);
    playMetronomeCue(label, phaseClass, d);
  }

  /** Total decay length for `playSessionEndGong` (seconds); keep in sync with deferred `stopSession` in index. */
  const SESSION_END_GONG_TAIL_SEC = 9.5;

  /**
   * Soft temple-gong style strike when the session time limit is reached (still respects `enabled`).
   */
  function playSessionEndGong() {
    const audio = global.BreathingAudio;
    if (!audio.enabled) return;
    const g = getAudio();
    if (!g) return;
    const { ctx, master } = g;
    if (ctx.state === 'suspended') void ctx.resume();
    applyLevels(audio.settings);
    const now = ctx.currentTime;
    const dur = SESSION_END_GONG_TAIL_SEC;
    const partials = [
      { f: 196, peak: 0.12, decay: dur },
      { f: 392, peak: 0.048, decay: dur * 0.82 },
      { f: 587, peak: 0.024, decay: dur * 0.58 },
    ];
    partials.forEach(({ f, peak, decay }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.97, now + decay);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.linearRampToValueAtTime(peak, now + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gn);
      gn.connect(master);
      osc.start(now);
      osc.stop(now + decay + 0.025);
    });
  }

  global.BreathingAudio = {
    enabled: true,
    settings: { ...DEFAULT_SETTINGS },
    getAudio,
    unlockFromUserGesture,
    startSession,
    stopSession,
    playPhaseCue,
    playSessionEndGong,
    /** Milliseconds; defer master fade after session-end gong so the tail isn’t cut off. */
    SESSION_END_GONG_TAIL_MS: Math.round(SESSION_END_GONG_TAIL_SEC * 1000),
    applyLevels,
    DEFAULT_SETTINGS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
