/**
 * High-fidelity Audio synthesis using Web Audio API
 * Fully offline, zero external audio asset dependencies.
 */

import type { AlarmSoundType } from '../types/clock.ts';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch {
    // ignore
  }
}

export function triggerVibration(pattern: number[] = [300, 150, 300, 150, 500]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // vibration not supported
  }
}

export interface SoundController {
  stop: () => void;
}

/**
 * Loops an alarm sound until stopped.
 * Supports volume multiplier (0.1 to 1.0) and gradual volume ramp.
 */
export function startAlarmSound(
  type: AlarmSoundType = 'radar',
  targetVolume: number = 0.8,
  gradual: boolean = false
): SoundController {
  let isPlaying = true;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const ctx = getAudioContext();
  const startTime = Date.now();

  const playBeepPattern = () => {
    if (!isPlaying) return;

    try {
      const now = ctx.currentTime;
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      // Calculate current volume with optional crescendo ramp over 25 seconds
      let currentVol = targetVolume;
      if (gradual) {
        const rampFactor = Math.min(1, Math.max(0.1, elapsedSeconds / 25));
        currentVol = targetVolume * rampFactor;
      }

      if (type === 'digital') {
        // High-pitch digital alarm beep (4 pulses)
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1200, now + i * 0.12);
          gain.gain.setValueAtTime(0, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.18 * currentVol, now + i * 0.12 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.09);
        }
        triggerVibration([100, 50, 100, 50, 100, 50, 100]);
        timerId = setTimeout(playBeepPattern, 1200);
      } else if (type === 'gentle') {
        // Warm Rhodes/marimba gentle morning arpeggio
        const notes = [392, 440, 523.25, 659.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.25 * currentVol, now + idx * 0.18 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.65);
        });
        triggerVibration([200, 100, 200]);
        timerId = setTimeout(playBeepPattern, 1800);
      } else if (type === 'chime') {
        // Cathedral bell resonance
        const freqs = [587.33, 880, 1174.66];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.3 * currentVol, now + idx * 0.15 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.85);
        });
        triggerVibration([250, 150, 250]);
        timerId = setTimeout(playBeepPattern, 2000);
      } else if (type === 'cosmic') {
        // Cosmic synth drone and bell
        const freqs = [261.63, 392.0, 523.25, 783.99]; // C4, G4, C5, G5
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 1.2);
          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.2 * currentVol, now + idx * 0.1 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.1);
          osc.stop(now + 1.5);
        });
        triggerVibration([300, 150, 300]);
        timerId = setTimeout(playBeepPattern, 1800);
      } else if (type === 'bell') {
        // Deep Tibetan singing bowl
        const fundamental = 330; // E4
        const harmonics = [fundamental, fundamental * 2.76, fundamental * 5.4];
        harmonics.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime((0.3 / (idx + 1)) * currentVol, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.9);
        });
        triggerVibration([400, 200]);
        timerId = setTimeout(playBeepPattern, 2200);
      } else if (type === 'sunrise') {
        // Warm Major 7th chord progression
        const notes = [261.63, 329.63, 392.0, 493.88, 523.25]; // C4, E4, G4, B4, C5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.22 * currentVol, now + idx * 0.12 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.95);
        });
        triggerVibration([200, 100, 200]);
        timerId = setTimeout(playBeepPattern, 2000);
      } else {
        // Radar (classic ascending sweep)
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const startTone = 750 + i * 200;
          osc.frequency.setValueAtTime(startTone, now + i * 0.15);
          gain.gain.setValueAtTime(0, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.25 * currentVol, now + i * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.13);
        }
        triggerVibration([200, 100, 200]);
        timerId = setTimeout(playBeepPattern, 1000);
      }
    } catch {
      // Audio error fallback
    }
  };

  playBeepPattern();

  return {
    stop: () => {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
    },
  };
}

export function playSoundPreview(type: AlarmSoundType = 'radar', volume: number = 0.8): void {
  const controller = startAlarmSound(type, volume, false);
  setTimeout(() => controller.stop(), 1200);
}

export function startTimerCompleteSound(): SoundController {
  let isPlaying = true;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const ctx = getAudioContext();

  const playCycle = () => {
    if (!isPlaying) return;
    try {
      const now = ctx.currentTime;
      const tones = [523.25, 659.25, 783.99, 1046.5];
      tones.forEach((tone, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone, now + idx * 0.14);
        gain.gain.setValueAtTime(0, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.45);
      });
      triggerVibration([400, 150, 400, 150, 600]);
      timerId = setTimeout(playCycle, 1500);
    } catch {
      // ignore
    }
  };

  playCycle();

  return {
    stop: () => {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
    },
  };
}

export function playClickSound(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // ignore
  }
}

// ----------------------------------------------------
// Ambient Noise Synthesis: Rain, White Noise, Forest
// ----------------------------------------------------

interface AmbientSoundNode {
  gainNode: GainNode;
  stop: () => void;
}

const activeAmbientSounds: {
  rain?: AmbientSoundNode;
  white?: AmbientSoundNode;
  forest?: AmbientSoundNode;
} = {};

function createNoiseBuffer(ctx: AudioContext, seconds: number = 3): AudioBuffer {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Rain sound synthesis: lowpass filtered white noise + gentle random modulation
 */
export function playAmbientRain(volume: number = 0.5): void {
  stopAmbientRain();
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter to simulate soft rain
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    activeAmbientSounds.rain = {
      gainNode: gain,
      stop: () => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    // ignore
  }
}

export function setAmbientRainVolume(volume: number): void {
  if (activeAmbientSounds.rain) {
    activeAmbientSounds.rain.gainNode.gain.setValueAtTime(volume * 0.4, audioCtx?.currentTime || 0);
  }
}

export function stopAmbientRain(): void {
  if (activeAmbientSounds.rain) {
    activeAmbientSounds.rain.stop();
    delete activeAmbientSounds.rain;
  }
}

/**
 * White noise generator: pure unshaped noise
 */
export function playAmbientWhiteNoise(volume: number = 0.4): void {
  stopAmbientWhiteNoise();
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx, 3);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    activeAmbientSounds.white = {
      gainNode: gain,
      stop: () => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    // ignore
  }
}

export function setAmbientWhiteNoiseVolume(volume: number): void {
  if (activeAmbientSounds.white) {
    activeAmbientSounds.white.gainNode.gain.setValueAtTime(volume * 0.25, audioCtx?.currentTime || 0);
  }
}

export function stopAmbientWhiteNoise(): void {
  if (activeAmbientSounds.white) {
    activeAmbientSounds.white.stop();
    delete activeAmbientSounds.white;
  }
}

/**
 * Forest wind & canopy ambience: bandpass filtered noise with gentle sweeping LFO
 */
export function playAmbientForest(volume: number = 0.5): void {
  stopAmbientForest();
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx, 5);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Resonant bandpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    // LFO for swaying breeze effect
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 5-second breeze cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(200, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.35, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    lfo.start();

    activeAmbientSounds.forest = {
      gainNode: gain,
      stop: () => {
        try {
          source.stop();
          lfo.stop();
          source.disconnect();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    // ignore
  }
}

export function setAmbientForestVolume(volume: number): void {
  if (activeAmbientSounds.forest) {
    activeAmbientSounds.forest.gainNode.gain.setValueAtTime(volume * 0.35, audioCtx?.currentTime || 0);
  }
}

export function stopAmbientForest(): void {
  if (activeAmbientSounds.forest) {
    activeAmbientSounds.forest.stop();
    delete activeAmbientSounds.forest;
  }
}

export function stopAllAmbientSounds(): void {
  stopAmbientRain();
  stopAmbientWhiteNoise();
  stopAmbientForest();
}
