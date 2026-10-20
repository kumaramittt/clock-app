import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { formatTimerSeconds } from '../utils/time.ts';
import { startTimerCompleteSound, SoundController, triggerVibration, playClickSound } from '../utils/sound.ts';
import type { AppSettings } from '../types/clock.ts';
import { getTranslation } from '../utils/i18n.ts';

interface PomodoroTabProps {
  settings: AppSettings;
}

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const PomodoroTab: React.FC<PomodoroTabProps> = ({ settings }) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(DURATIONS.focus);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number>(DURATIONS.focus);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundControllerRef = useRef<SoundController | null>(null);

  const currentDuration = DURATIONS[mode];

  // Tick loop
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const diffMs = endTimeRef.current - Date.now();
        const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

        if (diffSec <= 0) {
          setIsRunning(false);
          setRemainingSeconds(0);
          triggerVibration([500, 200, 500]);
          soundControllerRef.current = startTimerCompleteSound();

          if (mode === 'focus') {
            const nextCount = sessionsCompleted + 1;
            setSessionsCompleted(nextCount);
            const nextMode = nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
            switchMode(nextMode);
          } else {
            switchMode('focus');
          }
        } else {
          setRemainingSeconds(diffSec);
        }
      }, 250);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, mode, sessionsCompleted]);

  useEffect(() => {
    return () => {
      if (soundControllerRef.current) soundControllerRef.current.stop();
    };
  }, []);

  const switchMode = (newMode: PomodoroMode) => {
    playClickSound();
    setIsRunning(false);
    setMode(newMode);
    setRemainingSeconds(DURATIONS[newMode]);
    pausedRemainingRef.current = DURATIONS[newMode];
  };

  const handleStart = () => {
    playClickSound();
    if (soundControllerRef.current) soundControllerRef.current.stop();
    endTimeRef.current = Date.now() + remainingSeconds * 1000;
    setIsRunning(true);
  };

  const handlePause = () => {
    playClickSound();
    setIsRunning(false);
    pausedRemainingRef.current = remainingSeconds;
  };

  const handleReset = () => {
    playClickSound();
    if (soundControllerRef.current) soundControllerRef.current.stop();
    setIsRunning(false);
    setRemainingSeconds(DURATIONS[mode]);
    pausedRemainingRef.current = DURATIONS[mode];
  };

  const handleSkip = () => {
    playClickSound();
    if (soundControllerRef.current) soundControllerRef.current.stop();
    setIsRunning(false);
    if (mode === 'focus') {
      const nextCount = sessionsCompleted + 1;
      setSessionsCompleted(nextCount);
      const nextMode = nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      switchMode(nextMode);
    } else {
      switchMode('focus');
    }
  };

  const progressPercent = (remainingSeconds / currentDuration) * 100;
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const { formatted } = formatTimerSeconds(remainingSeconds);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-[var(--accent)]" />
          {t('pomodoro')}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
          25m Focus • 5m Break • 15m Long Break
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
        <button
          onClick={() => switchMode('focus')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
            mode === 'focus'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          {t('focusSession')}
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
            mode === 'shortBreak'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          {t('shortBreak')}
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
            mode === 'longBreak'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          {t('longBreak')}
        </button>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center select-none my-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 250 250">
          <circle cx="125" cy="125" r={radius} stroke="var(--ring-track)" strokeWidth="12" fill="none" />
          <circle
            cx="125"
            cy="125"
            r={radius}
            stroke="var(--accent)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-mono font-black text-[var(--text)] tracking-tight">
            {formatted}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mt-2">
            {mode === 'focus' ? 'Deep Work' : 'Recharge Time'}
          </span>
        </div>
      </div>

      {/* Session Dots Counter */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center shadow-sm">
        <span className="text-xs text-[var(--text-secondary)] block mb-2">{t('sessionsCompleted')}</span>
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: 4 }).map((_, idx) => {
            const isFilled = idx < sessionsCompleted % 4 || (sessionsCompleted > 0 && sessionsCompleted % 4 === 0);
            return (
              <span
                key={idx}
                className={`w-4 h-4 rounded-full transition-all ${
                  isFilled
                    ? 'bg-[var(--accent)] ring-2 ring-[var(--accent-border)] shadow-sm scale-110'
                    : 'bg-[var(--surface-secondary)] border border-[var(--border)]'
                }`}
              />
            );
          })}
        </div>
        <span className="text-[11px] font-mono text-[var(--text-secondary)] mt-2 block">
          Total sessions: {sessionsCompleted}
        </span>
      </div>

      {/* Touch Action Controls */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleReset}
          className="py-3.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('reset')}</span>
        </button>

        {!isRunning ? (
          <button
            onClick={handleStart}
            className="py-3.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t('start')}</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="py-3.5 rounded-2xl bg-amber-500 text-black font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition shadow-md"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>{t('pause')}</span>
          </button>
        )}

        <button
          onClick={handleSkip}
          className="py-3.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <FastForward className="w-4 h-4" />
          <span>{t('skipSession')}</span>
        </button>
      </div>
    </div>
  );
};
