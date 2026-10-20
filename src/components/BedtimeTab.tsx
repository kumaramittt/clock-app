import React, { useState } from 'react';
import { Moon, Sun, Bell } from 'lucide-react';
import type { BedtimeSettings, AppSettings } from '../types/clock.ts';
import { calculateSleepDuration, calculateSleepCycles } from '../utils/time.ts';
import { playClickSound } from '../utils/sound.ts';
import { getTranslation } from '../utils/i18n.ts';

interface BedtimeTabProps {
  bedtimeSettings: BedtimeSettings;
  onUpdateBedtime: (newSettings: BedtimeSettings) => void;
  appSettings: AppSettings;
}

export const BedtimeTab: React.FC<BedtimeTabProps> = ({
  bedtimeSettings,
  onUpdateBedtime,
  appSettings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(appSettings.language, key);

  const [enabled, setEnabled] = useState(bedtimeSettings.enabled);
  const [bedtime, setBedtime] = useState(bedtimeSettings.bedtime);
  const [wakeTime, setWakeTime] = useState(bedtimeSettings.wakeTime);
  const [reminderMinutes, setReminderMinutes] = useState(
    bedtimeSettings.reminderMinutesBefore || 30
  );

  const { durationHours, durationMins } = calculateSleepDuration(bedtime, wakeTime);
  const sleepCycles = calculateSleepCycles(durationHours, durationMins);

  const handleToggle = () => {
    playClickSound();
    const next = !enabled;
    setEnabled(next);
    onUpdateBedtime({ ...bedtimeSettings, enabled: next });
  };

  const handleSave = () => {
    onUpdateBedtime({
      ...bedtimeSettings,
      enabled,
      bedtime,
      wakeTime,
      reminderMinutesBefore: reminderMinutes,
    });
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
            {t('bedtimeSchedule')}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            Optimize rest & wind-down reminders
          </p>
        </div>

        {/* Enable / Disable switch */}
        <button
          onClick={handleToggle}
          role="switch"
          aria-checked={enabled}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? 'bg-[var(--accent)]' : 'bg-[var(--surface-secondary)] border border-[var(--border)]'
          }`}
          aria-label="Toggle bedtime reminder"
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md transition duration-200 ease-in-out ${
              enabled ? 'translate-x-6 bg-[var(--accent-contrast)]' : 'translate-x-0 bg-[var(--text-secondary)]'
            }`}
          />
        </button>
      </div>

      {/* Sleep Target Stats Card */}
      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-md">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5 mb-1.5">
              <Moon className="w-3.5 h-3.5" />
              Bedtime
            </span>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => {
                setBedtime(e.target.value);
                handleSave();
              }}
              className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-2xl px-3 py-1.5 rounded-xl border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5 mb-1.5">
              <Sun className="w-3.5 h-3.5" />
              Wake Up
            </span>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => {
                setWakeTime(e.target.value);
                handleSave();
              }}
              className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-2xl px-3 py-1.5 rounded-xl border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Calculated Stats */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-secondary)]">{t('sleepDuration')}</span>
            <div className="text-2xl font-bold font-mono text-[var(--text)] mt-0.5">
              {durationHours}h {durationMins > 0 ? `${durationMins}m` : ''}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-[var(--text-secondary)]">{t('sleepCycles')}</span>
            <div className="text-lg font-bold font-mono text-[var(--accent)] mt-0.5">
              ~{sleepCycles} cycles
            </div>
          </div>
        </div>
      </div>

      {/* Wind-down Reminder Before Bed */}
      <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Wind-down Reminder</h3>
            <p className="text-xs text-[var(--text-secondary)]">Receive an alert before your sleep time</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          {[15, 30, 45, 60].map((mins) => {
            const isSelected = reminderMinutes === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setReminderMinutes(mins);
                  playClickSound();
                  onUpdateBedtime({ ...bedtimeSettings, reminderMinutesBefore: mins });
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-sm font-bold'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {mins} mins
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
