import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, X, Bell } from 'lucide-react';
import type { TimerItem, AppSettings } from '../types/clock.ts';
import { formatTimerSeconds } from '../utils/time.ts';
import { startTimerCompleteSound, SoundController, triggerVibration, playClickSound } from '../utils/sound.ts';
import { getTranslation } from '../utils/i18n.ts';

interface TimerTabProps {
  timers: TimerItem[];
  onAddTimer: (timer: Omit<TimerItem, 'id'>) => void;
  onUpdateTimer: (timer: TimerItem) => void;
  onDeleteTimer: (id: string) => void;
  settings: AppSettings;
}

const PRESET_BUTTONS = [
  { label: '5m', name: 'Quick 5m', duration: 300 },
  { label: '10m', name: 'Focus 10m', duration: 600 },
  { label: '15m', name: 'Break 15m', duration: 900 },
  { label: '25m', name: 'Pomodoro', duration: 1500 },
];

export const TimerTab: React.FC<TimerTabProps> = ({
  timers,
  onAddTimer,
  onUpdateTimer,
  onDeleteTimer,
  settings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('Timer');
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);

  const [finishedTimer, setFinishedTimer] = useState<TimerItem | null>(null);
  const soundControllerRef = useRef<SoundController | null>(null);

  // Background ticker loop for running timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      timers.forEach((timer) => {
        if (timer.isRunning && timer.targetTimestamp) {
          const diffMs = timer.targetTimestamp - now;
          const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

          if (diffSec <= 0) {
            // Timer expired
            onUpdateTimer({
              ...timer,
              remainingSeconds: 0,
              isRunning: false,
              isPaused: false,
              targetTimestamp: null,
            });

            // Trigger ring & vibration
            if (!finishedTimer) {
              triggerVibration([500, 200, 500, 200, 1000]);
              soundControllerRef.current = startTimerCompleteSound();
              setFinishedTimer(timer);
            }
          } else {
            // Update remaining seconds in local tick without hammering storage unnecessarily
            if (timer.remainingSeconds !== diffSec) {
              onUpdateTimer({
                ...timer,
                remainingSeconds: diffSec,
              });
            }
          }
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [timers, finishedTimer, onUpdateTimer]);

  useEffect(() => {
    return () => {
      if (soundControllerRef.current) soundControllerRef.current.stop();
    };
  }, []);

  const handleStartTimer = (timer: TimerItem) => {
    playClickSound();
    const targetTimestamp = Date.now() + timer.remainingSeconds * 1000;
    onUpdateTimer({
      ...timer,
      isRunning: true,
      isPaused: false,
      targetTimestamp,
    });
  };

  const handlePauseTimer = (timer: TimerItem) => {
    playClickSound();
    onUpdateTimer({
      ...timer,
      isRunning: false,
      isPaused: true,
      targetTimestamp: null,
    });
  };

  const handleResetTimer = (timer: TimerItem) => {
    playClickSound();
    onUpdateTimer({
      ...timer,
      remainingSeconds: timer.initialDuration,
      isRunning: false,
      isPaused: false,
      targetTimestamp: null,
    });
  };

  const handleAddMinute = (timer: TimerItem) => {
    playClickSound();
    const nextRem = timer.remainingSeconds + 60;
    const nextInit = timer.initialDuration + 60;
    const targetTimestamp = timer.isRunning
      ? (timer.targetTimestamp || Date.now()) + 60 * 1000
      : null;

    onUpdateTimer({
      ...timer,
      initialDuration: nextInit,
      remainingSeconds: nextRem,
      targetTimestamp,
    });
  };

  const handleCreateNewTimer = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const totalSec = inputHours * 3600 + inputMinutes * 60 + inputSeconds;
    if (totalSec <= 0) return;

    onAddTimer({
      label: label.trim() || 'Timer',
      initialDuration: totalSec,
      remainingSeconds: totalSec,
      isRunning: true,
      isPaused: false,
      targetTimestamp: Date.now() + totalSec * 1000,
    });

    setModalOpen(false);
  };

  const handleAddPresetDirect = (durationSec: number, name: string) => {
    playClickSound();
    onAddTimer({
      label: name,
      initialDuration: durationSec,
      remainingSeconds: durationSec,
      isRunning: true,
      isPaused: false,
      targetTimestamp: Date.now() + durationSec * 1000,
    });
  };

  const handleDismissFinished = () => {
    playClickSound();
    if (soundControllerRef.current) {
      soundControllerRef.current.stop();
      soundControllerRef.current = null;
    }
    setFinishedTimer(null);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t('timer')}</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            {timers.filter((t) => t.isRunning).length} running in parallel
          </p>
        </div>

        <button
          onClick={() => {
            playClickSound();
            setLabel('Timer');
            setInputHours(0);
            setInputMinutes(10);
            setInputSeconds(0);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs shadow-md active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('addTimer')}</span>
        </button>
      </div>

      {/* Preset Buttons Bar */}
      <div>
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2 px-1">
          {t('quickPresets')}
        </span>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_BUTTONS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleAddPresetDirect(p.duration, p.name)}
              className="py-2.5 px-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] text-[var(--text)] font-semibold text-xs active:scale-95 transition text-center shadow-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timers List (Multiple running at same time) */}
      {timers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] p-8 text-center bg-[var(--surface)] my-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text)]">No active timers</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[240px] mx-auto">
            Tap a quick preset above or tap + Add Timer to run multiple countdowns simultaneously.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {timers.map((timer) => {
            const { formatted } = formatTimerSeconds(timer.remainingSeconds);
            const progress =
              timer.initialDuration > 0
                ? Math.max(0, Math.min(100, (timer.remainingSeconds / timer.initialDuration) * 100))
                : 0;

            const radius = 42;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;

            return (
              <div
                key={timer.id}
                className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Mini Circular Ring */}
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} stroke="var(--ring-track)" strokeWidth="6" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="var(--accent)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                    <span className="absolute font-mono text-sm font-black text-[var(--text)]">
                      {formatted}
                    </span>
                  </div>

                  {/* Middle: Details & quick +1m */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-[var(--text)] truncate">{timer.label}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Total: {formatTimerSeconds(timer.initialDuration).formatted}
                    </p>

                    <button
                      onClick={() => handleAddMinute(timer)}
                      className="mt-2 text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-lg border border-[var(--accent-border)] active:scale-95 transition"
                    >
                      +1 Min
                    </button>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onDeleteTimer(timer.id)}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 rounded-lg transition"
                      aria-label={`Delete timer ${timer.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleResetTimer(timer)}
                        className="p-2.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] active:scale-95 transition"
                        title="Reset"
                        aria-label="Reset this timer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {!timer.isRunning ? (
                        <button
                          onClick={() => handleStartTimer(timer)}
                          className="p-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md active:scale-95 transition"
                          title="Start"
                          aria-label="Start this timer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePauseTimer(timer)}
                          className="p-2.5 rounded-xl bg-amber-500 text-black font-bold shadow-md active:scale-95 transition"
                          title="Pause"
                          aria-label="Pause this timer"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Timer Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-timer-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[var(--modal-bg)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] text-[var(--text)]">
            <form onSubmit={handleCreateNewTimer}>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                <h3 id="new-timer-title" className="text-lg font-bold text-[var(--text)]">
                  {t('addTimer')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Label */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  {t('timerName')}
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Chai, Padhai, Workout..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Time Pickers */}
              <div className="bg-[var(--surface-secondary)] rounded-2xl p-4 border border-[var(--border)] flex items-center justify-center gap-3 mb-5">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Hours</span>
                  <select
                    value={inputHours}
                    onChange={(e) => setInputHours(parseInt(e.target.value, 10))}
                    className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-2xl px-3 py-2 rounded-xl border border-[var(--border)]"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i} className="bg-[var(--surface)] text-[var(--text)]">
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-2xl font-mono font-bold text-[var(--text-secondary)] mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Minutes</span>
                  <select
                    value={inputMinutes}
                    onChange={(e) => setInputMinutes(parseInt(e.target.value, 10))}
                    className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-2xl px-3 py-2 rounded-xl border border-[var(--border)]"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i} className="bg-[var(--surface)] text-[var(--text)]">
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-2xl font-mono font-bold text-[var(--text-secondary)] mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Seconds</span>
                  <select
                    value={inputSeconds}
                    onChange={(e) => setInputSeconds(parseInt(e.target.value, 10))}
                    className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-2xl px-3 py-2 rounded-xl border border-[var(--border)]"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i} className="bg-[var(--surface)] text-[var(--text)]">
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={inputHours === 0 && inputMinutes === 0 && inputSeconds === 0}
                className="w-full py-3.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-extrabold text-base shadow-md active:scale-95 transition disabled:opacity-50"
              >
                {t('startTimer')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Finished Alert Modal */}
      {finishedTimer && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-md animate-in fade-in duration-300"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent)] p-6 text-center shadow-2xl text-[var(--text)]">
            <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bell className="w-8 h-8 animate-bounce" />
            </div>

            <p className="text-xs uppercase font-semibold text-[var(--accent)] mb-1">{t('timesUp')}</p>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{finishedTimer.label}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Your {formatTimerSeconds(finishedTimer.initialDuration).formatted} countdown has completed.
            </p>

            <button
              onClick={handleDismissFinished}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base transition shadow-md"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
