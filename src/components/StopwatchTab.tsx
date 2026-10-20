import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Award, Copy, Check, Share2 } from 'lucide-react';
import type { LapItem, AppSettings } from '../types/clock.ts';
import { formatMilliseconds, findFastestAndSlowestLaps } from '../utils/time.ts';
import { playClickSound } from '../utils/sound.ts';
import { getTranslation } from '../utils/i18n.ts';

interface StopwatchTabProps {
  settings: AppSettings;
}

export const StopwatchTab: React.FC<StopwatchTabProps> = ({ settings }) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState<LapItem[]>([]);
  const [copied, setCopied] = useState(false);

  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const lastLapElapsedRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now();

      const updateTimer = () => {
        const now = performance.now();
        const delta = now - startTimeRef.current;
        setElapsedTime(accumulatedTimeRef.current + delta);
        animFrameRef.current = requestAnimationFrame(updateTimer);
      };

      animFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    playClickSound();
    setIsRunning(true);
  };

  const handlePause = () => {
    playClickSound();
    setIsRunning(false);
    accumulatedTimeRef.current = elapsedTime;
  };

  const handleResume = () => {
    playClickSound();
    setIsRunning(true);
  };

  const handleReset = () => {
    playClickSound();
    setIsRunning(false);
    setElapsedTime(0);
    accumulatedTimeRef.current = 0;
    lastLapElapsedRef.current = 0;
    setLaps([]);
  };

  const handleLap = () => {
    playClickSound();
    const currentOverall = elapsedTime;
    const lapDuration = currentOverall - lastLapElapsedRef.current;
    lastLapElapsedRef.current = currentOverall;

    const newLap: LapItem = {
      lapNumber: laps.length + 1,
      lapTime: lapDuration,
      overallTime: currentOverall,
    };

    setLaps([newLap, ...laps]);
  };

  const generateLapText = () => {
    return [
      `Chronos Stopwatch - Lap Summary`,
      `Total Time: ${formatMilliseconds(elapsedTime).formatted}`,
      `Total Laps: ${laps.length}`,
      `----------------------------`,
      ...laps.map(
        (l) =>
          `Lap ${l.lapNumber}: ${formatMilliseconds(l.lapTime).formatted} (Total: ${
            formatMilliseconds(l.overallTime).formatted
          })`
      ),
    ].join('\n');
  };

  const handleCopyLaps = () => {
    playClickSound();
    const text = generateLapText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLaps = async () => {
    playClickSound();
    const text = generateLapText();
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Stopwatch Lap Times',
          text,
        });
        return;
      } catch {
        // user cancelled or fallback
      }
    }

    // Fallback: download as text file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stopwatch_laps_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { hours, minutes, seconds, centiseconds } = formatMilliseconds(elapsedTime);
  const { fastestLapNumber, slowestLapNumber } = findFastestAndSlowestLaps(laps);

  const currentLapDuration = elapsedTime - lastLapElapsedRef.current;
  const currentLapFormatted = formatMilliseconds(currentLapDuration).formatted;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t('stopwatch')}</h2>
        <p className="text-xs text-[var(--accent)] font-medium mt-0.5">
          Millisecond precision timer
        </p>
      </div>

      {/* Main Digital Display Dial */}
      <div className="relative rounded-3xl p-6 bg-[var(--surface)] border border-[var(--border)] text-center shadow-md">
        <div className="text-xs font-mono font-medium text-[var(--text-secondary)] mb-2">
          {laps.length > 0 ? (
            <span>
              Lap {laps.length + 1}: <span className="text-[var(--accent)]">{currentLapFormatted}</span>
            </span>
          ) : (
            <span>{t('ready')}</span>
          )}
        </div>

        <div className="flex items-baseline justify-center select-all">
          {parseInt(hours, 10) > 0 && (
            <>
              <span className="text-5xl sm:text-6xl font-mono font-extrabold text-[var(--text)] tracking-tight">
                {hours}
              </span>
              <span className="text-3xl font-mono text-[var(--accent)] mx-1">:</span>
            </>
          )}
          <span className="text-5xl sm:text-6xl font-mono font-extrabold text-[var(--text)] tracking-tight">
            {minutes}
          </span>
          <span className="text-3xl font-mono text-[var(--accent)] mx-1">:</span>
          <span className="text-5xl sm:text-6xl font-mono font-extrabold text-[var(--text)] tracking-tight">
            {seconds}
          </span>
          <span className="text-2xl font-mono text-[var(--accent)] ml-1 font-bold">.</span>
          <span className="text-2xl sm:text-3xl font-mono font-bold text-[var(--accent)] w-12 text-left">
            {centiseconds}
          </span>
        </div>
      </div>

      {/* Large Touch Controls */}
      <div className="grid grid-cols-2 gap-4">
        {!isRunning ? (
          <button
            onClick={handleReset}
            disabled={elapsedTime === 0}
            className={`py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all active:scale-95 shadow-sm ${
              elapsedTime > 0
                ? 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]'
                : 'bg-[var(--surface-secondary)]/50 text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
            }`}
            aria-label="Reset stopwatch"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('reset')}</span>
          </button>
        ) : (
          <button
            onClick={handleLap}
            className="py-4 px-6 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] active:scale-95 text-[var(--accent)] border border-[var(--accent-border)] flex items-center justify-center gap-2 font-bold text-base transition shadow-sm"
            aria-label="Record lap"
          >
            <Flag className="w-5 h-5" />
            <span>{t('lap')}</span>
          </button>
        )}

        {!isRunning ? (
          <button
            onClick={elapsedTime === 0 ? handleStart : handleResume}
            className="py-4 px-6 rounded-2xl bg-[var(--accent)] active:scale-95 text-[var(--accent-contrast)] flex items-center justify-center gap-2 font-extrabold text-lg transition shadow-md"
            aria-label={elapsedTime === 0 ? 'Start stopwatch' : 'Resume stopwatch'}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{elapsedTime === 0 ? t('start') : t('resume')}</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center gap-2 font-extrabold text-lg transition shadow-md"
            aria-label="Pause stopwatch"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span>{t('pause')}</span>
          </button>
        )}
      </div>

      {/* Laps List */}
      {laps.length > 0 && (
        <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[var(--accent)]" />
              {t('laps')} ({laps.length})
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLaps}
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] px-2.5 py-1 rounded-lg hover:bg-[var(--surface-secondary)] transition"
                aria-label="Copy lap times"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied') : t('copy')}</span>
              </button>

              <button
                onClick={handleShareLaps}
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] px-2.5 py-1 rounded-lg hover:bg-[var(--surface-secondary)] transition"
                aria-label="Share or export lap times"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{t('share')}</span>
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[var(--border)]">
            {laps.map((lap) => {
              const isFastest = lap.lapNumber === fastestLapNumber;
              const isSlowest = lap.lapNumber === slowestLapNumber;
              const formattedLap = formatMilliseconds(lap.lapTime).formatted;
              const formattedTotal = formatMilliseconds(lap.overallTime).formatted;

              return (
                <div
                  key={lap.lapNumber}
                  className={`flex items-center justify-between py-2 px-2 rounded-xl transition ${
                    isFastest
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30'
                      : isSlowest
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/30'
                      : 'text-[var(--text)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--text-secondary)] w-12">
                      #{lap.lapNumber}
                    </span>
                    {isFastest && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                        {t('fastest')}
                      </span>
                    )}
                    {isSlowest && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                        {t('slowest')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-bold text-[var(--text)]">
                      +{formattedLap}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-secondary)] w-16 text-right">
                      {formattedTotal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
