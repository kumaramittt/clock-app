import React, { useEffect, useState } from 'react';
import { Bell, Clock, Square, Brain, AlertCircle } from 'lucide-react';
import type { AlarmItem, AppSettings } from '../types/clock.ts';
import { startAlarmSound, triggerVibration, SoundController, playClickSound } from '../utils/sound.ts';
import { formatTime12h, generateMathProblem } from '../utils/time.ts';
import { getTranslation } from '../utils/i18n.ts';

interface AlarmRingingModalProps {
  alarm: AlarmItem;
  onSnooze: (alarm: AlarmItem, minutes?: number) => void;
  onStop: (alarm: AlarmItem) => void;
  settings: AppSettings;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  onSnooze,
  onStop,
  settings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  // Math problem solver state
  const [mathProblem] = useState(() => generateMathProblem());
  const [userAnswer, setUserAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  useEffect(() => {
    const volume = alarm.volume !== undefined ? alarm.volume : 0.8;
    const gradual = !!alarm.gradualVolume;
    const controller: SoundController = startAlarmSound(alarm.sound || 'radar', volume, gradual);

    if (alarm.vibration !== false) {
      triggerVibration([500, 250, 500, 250, 1000]);
    }

    return () => {
      controller.stop();
    };
  }, [alarm.sound, alarm.volume, alarm.gradualVolume, alarm.vibration]);

  const { timeStr, period } = formatTime12h(alarm.time);
  const snoozeMins = alarm.snoozeDuration || 5;

  const handleAttemptStop = () => {
    if (alarm.mathDismiss) {
      const parsed = parseInt(userAnswer.trim(), 10);
      if (parsed === mathProblem.answer) {
        playClickSound();
        onStop(alarm);
      } else {
        setMathError(true);
        triggerVibration([100, 100, 100]);
        setTimeout(() => setMathError(false), 2000);
      }
    } else {
      playClickSound();
      onStop(alarm);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-ring-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent)] p-6 text-center shadow-2xl text-[var(--text)] flex flex-col items-center">
        {/* Pulsing icon halo */}
        <div className="relative mb-4 flex items-center justify-center">
          <span className="absolute w-24 h-24 rounded-full bg-[var(--accent-soft)] animate-ping" />
          <span className="absolute w-20 h-20 rounded-full bg-[var(--accent-soft)] animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center shadow-lg">
            <Bell className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <p className="text-xs uppercase font-semibold tracking-widest text-[var(--accent)] mb-1">
          {t('alarmRinging')}
        </p>

        {/* Big Time */}
        <div className="flex items-baseline justify-center gap-1.5 my-1">
          <span className="text-5xl font-mono font-bold tracking-tight text-[var(--text)]">
            {timeStr}
          </span>
          <span className="text-xl font-mono font-semibold text-[var(--accent)]">
            {period}
          </span>
        </div>

        {/* Label */}
        <h2 id="alarm-ring-title" className="text-base font-medium text-[var(--text-secondary)] mt-1 mb-4 px-4 truncate max-w-full">
          {alarm.label || 'Alarm'}
        </h2>

        {/* Math Challenge Box if mathDismiss is active */}
        {alarm.mathDismiss ? (
          <div className="w-full p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] text-left mb-5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span>{t('solveMath')}</span>
            </div>

            <div className="text-center font-mono text-2xl font-black text-[var(--text)] bg-[var(--surface)] py-2.5 rounded-xl border border-[var(--border)] mb-3 tracking-wide">
              {mathProblem.question}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                pattern="[0-9]*"
                autoFocus
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Answer"
                className="w-full bg-[var(--input-bg)] text-[var(--text)] font-mono text-center font-bold text-lg px-3 py-2 rounded-xl border border-[var(--border)] focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAttemptStop();
                }}
              />
              <button
                type="button"
                onClick={handleAttemptStop}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition shrink-0"
              >
                {t('submitAnswer')}
              </button>
            </div>

            {mathError && (
              <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('incorrectAnswer')}
              </p>
            )}
          </div>
        ) : null}

        {/* Action Buttons: Snooze & Stop */}
        <div className="w-full space-y-3">
          <button
            onClick={() => onSnooze(alarm, snoozeMins)}
            className="w-full py-3.5 px-6 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] active:scale-[0.98] border border-[var(--border)] text-[var(--text)] font-semibold text-base transition flex items-center justify-center gap-2.5 shadow-sm"
            aria-label={`Snooze alarm for ${snoozeMins} minutes`}
          >
            <Clock className="w-5 h-5 text-[var(--accent)]" />
            <span>
              {t('snooze')} ({snoozeMins} min)
            </span>
          </button>

          {!alarm.mathDismiss && (
            <button
              onClick={handleAttemptStop}
              className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-lg transition flex items-center justify-center gap-2.5 shadow-lg"
              aria-label="Stop alarm"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>{t('stopAlarm')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
