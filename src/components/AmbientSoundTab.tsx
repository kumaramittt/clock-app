import React, { useState } from 'react';
import { Headphones, CloudRain, Wind, Trees, Play, Square, Volume2 } from 'lucide-react';
import {
  playAmbientRain,
  stopAmbientRain,
  setAmbientRainVolume,
  playAmbientWhiteNoise,
  stopAmbientWhiteNoise,
  setAmbientWhiteNoiseVolume,
  playAmbientForest,
  stopAmbientForest,
  setAmbientForestVolume,
  stopAllAmbientSounds,
  playClickSound,
  unlockAudio,
} from '../utils/sound.ts';
import type { AppSettings } from '../types/clock.ts';
import { getTranslation } from '../utils/i18n.ts';

interface AmbientSoundTabProps {
  settings: AppSettings;
}

export const AmbientSoundTab: React.FC<AmbientSoundTabProps> = ({ settings }) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const [rainActive, setRainActive] = useState(false);
  const [rainVol, setRainVol] = useState(0.5);

  const [whiteActive, setWhiteActive] = useState(false);
  const [whiteVol, setWhiteVol] = useState(0.4);

  const [forestActive, setForestActive] = useState(false);
  const [forestVol, setForestVol] = useState(0.5);

  const toggleRain = () => {
    unlockAudio();
    playClickSound();
    if (rainActive) {
      stopAmbientRain();
      setRainActive(false);
    } else {
      playAmbientRain(rainVol);
      setRainActive(true);
    }
  };

  const handleRainVolume = (vol: number) => {
    setRainVol(vol);
    setAmbientRainVolume(vol);
  };

  const toggleWhite = () => {
    unlockAudio();
    playClickSound();
    if (whiteActive) {
      stopAmbientWhiteNoise();
      setWhiteActive(false);
    } else {
      playAmbientWhiteNoise(whiteVol);
      setWhiteActive(true);
    }
  };

  const handleWhiteVolume = (vol: number) => {
    setWhiteVol(vol);
    setAmbientWhiteNoiseVolume(vol);
  };

  const toggleForest = () => {
    unlockAudio();
    playClickSound();
    if (forestActive) {
      stopAmbientForest();
      setForestActive(false);
    } else {
      playAmbientForest(forestVol);
      setForestActive(true);
    }
  };

  const handleForestVolume = (vol: number) => {
    setForestVol(vol);
    setAmbientForestVolume(vol);
  };

  const handleStopAll = () => {
    playClickSound();
    stopAllAmbientSounds();
    setRainActive(false);
    setWhiteActive(false);
    setForestActive(false);
  };

  const anyActive = rainActive || whiteActive || forestActive;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-[var(--accent)]" />
            {t('ambientSounds')}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            Offline soothing white noise & atmosphere
          </p>
        </div>

        {anyActive && (
          <button
            onClick={handleStopAll}
            className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop All</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Gentle Rain */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            rainActive
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md'
              : 'bg-[var(--surface)] border-[var(--border)]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  rainActive
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">{t('rainSound')}</h4>
                <p className="text-xs text-[var(--text-secondary)]">Soft acoustic rainfall</p>
              </div>
            </div>

            <button
              onClick={toggleRain}
              className={`p-3 rounded-2xl transition active:scale-95 ${
                rainActive
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]'
              }`}
              aria-label={rainActive ? 'Stop rain sound' : 'Play rain sound'}
            >
              {rainActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-3 pt-1">
            <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={rainVol}
              onChange={(e) => handleRainVolume(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)] h-1.5 bg-[var(--surface-secondary)] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-[var(--text-secondary)] w-8 text-right">
              {Math.round(rainVol * 100)}%
            </span>
          </div>
        </div>

        {/* White Noise */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            whiteActive
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md'
              : 'bg-[var(--surface)] border-[var(--border)]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  whiteActive
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">{t('whiteNoise')}</h4>
                <p className="text-xs text-[var(--text-secondary)]">Steady focus & sleep mask</p>
              </div>
            </div>

            <button
              onClick={toggleWhite}
              className={`p-3 rounded-2xl transition active:scale-95 ${
                whiteActive
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]'
              }`}
              aria-label={whiteActive ? 'Stop white noise' : 'Play white noise'}
            >
              {whiteActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={whiteVol}
              onChange={(e) => handleWhiteVolume(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)] h-1.5 bg-[var(--surface-secondary)] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-[var(--text-secondary)] w-8 text-right">
              {Math.round(whiteVol * 100)}%
            </span>
          </div>
        </div>

        {/* Forest Wind */}
        <div
          className={`p-4 rounded-3xl border transition-all ${
            forestActive
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md'
              : 'bg-[var(--surface)] border-[var(--border)]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  forestActive
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text)]">{t('forestSound')}</h4>
                <p className="text-xs text-[var(--text-secondary)]">Gentle breeze & canopy resonance</p>
              </div>
            </div>

            <button
              onClick={toggleForest}
              className={`p-3 rounded-2xl transition active:scale-95 ${
                forestActive
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]'
              }`}
              aria-label={forestActive ? 'Stop forest sound' : 'Play forest sound'}
            >
              {forestActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={forestVol}
              onChange={(e) => handleForestVolume(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)] h-1.5 bg-[var(--surface-secondary)] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-[var(--text-secondary)] w-8 text-right">
              {Math.round(forestVol * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
