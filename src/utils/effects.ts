import confetti from 'canvas-confetti';

const PREF_KEY = 'synapse-effects';

interface EffectsPrefs {
  confetti: boolean;
  sounds: boolean;
}

const defaultPrefs: EffectsPrefs = { confetti: true, sounds: true };

function readPrefs(): EffectsPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

export function setEffectsPrefs(prefs: Partial<EffectsPrefs>) {
  try {
    const next = { ...readPrefs(), ...prefs };
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
  } catch {/* noop */}
}

export function getEffectsPrefs() {
  return readPrefs();
}

/** Burst confetti from the center of the screen */
export function celebrate(intensity: 'small' | 'medium' | 'large' = 'medium') {
  if (!readPrefs().confetti) return;
  const counts = { small: 40, medium: 100, large: 200 };
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#0EA5E9'];
  confetti({ particleCount: counts[intensity], spread: 80, origin: { y: 0.6 }, colors });
}

/** Burst from a specific element */
export function celebrateFrom(el: HTMLElement | null, intensity: 'small' | 'medium' | 'large' = 'medium') {
  if (!readPrefs().confetti || !el) return;
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  const counts = { small: 30, medium: 75, large: 150 };
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'];
  confetti({ particleCount: counts[intensity], spread: 70, origin: { x, y }, colors });
}

/** Lightweight Web Audio beep — no audio files needed */
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

type SoundType = 'click' | 'success' | 'error' | 'unlock' | 'message';

const SOUND_PRESETS: Record<SoundType, { freqs: number[]; duration: number; type: OscillatorType; volume?: number }> = {
  click:   { freqs: [880],            duration: 0.04, type: 'sine',     volume: 0.05 },
  success: { freqs: [523, 659, 784],  duration: 0.12, type: 'triangle', volume: 0.08 },
  error:   { freqs: [220, 165],       duration: 0.18, type: 'sawtooth', volume: 0.06 },
  unlock:  { freqs: [392, 523, 659, 784, 988], duration: 0.18, type: 'triangle', volume: 0.09 },
  message: { freqs: [659, 784],       duration: 0.1,  type: 'sine',     volume: 0.06 },
};

export function playSound(type: SoundType) {
  if (!readPrefs().sounds) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const preset = SOUND_PRESETS[type];
  const start = ctx.currentTime;
  preset.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = preset.type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(preset.volume ?? 0.05, start + i * preset.duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (i + 1) * preset.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + i * preset.duration);
    osc.stop(start + (i + 1) * preset.duration);
  });
}
