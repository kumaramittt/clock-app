import React from 'react';
import { Minimize2, Bell } from 'lucide-react';
import type { AppSettings, AlarmItem } from '../types/clock.ts';
import { getNextAlarmTimestamp, formatTimeUntilAlarm } from '../utils/time.ts';

interface FullScreenClockProps {
  currentTime: Date;
  settings: AppSettings;
  alarms: AlarmItem[];
  onClose: () => void;
}

export const FullScreenClock: React.FC<FullScreenClockProps> = ({
  currentTime,
  settings,
  alarms,
  onClose,
}) => {
  // Next active alarm
  const enabledAlarms = alarms.filter((a) => a.enabled);
  let nextRingText: string | null = null;
  if (enabledAlarms.length > 0) {
    const nextTimestamps = enabledAlarms
      .map((a) => getNextAlarmTimestamp(a))
      .filter((ts): ts is number => ts !== null);

    if (nextTimestamps.length > 0) {
      const minTs = Math.min(...nextTimestamps);
      nextRingText = formatTimeUntilAlarm(minTs - Date.now());
    }
  }

  // Format time according to 12h / 24h setting
  const is12h = settings.timeFormat === '12h';
  const hours = is12h
    ? (currentTime.getHours() % 12 || 12).toString().padStart(2, '0')
    : currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const period = is12h ? (currentTime.getHours() >= 12 ? 'PM' : 'AM') : '';

  const dateFormatted = currentTime.toLocaleDateString(
    settings.language === 'hi' ? 'hi-IN' : 'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-between p-6 select-none cursor-pointer animate-in fade-in duration-300 transition-colors"
      title="Tap anywhere to exit full screen"
    >
      {/* Top hint */}
      <div className="w-full flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
        <span className="flex items-center gap-1.5">
          <Minimize2 className="w-4 h-4 text-[var(--accent)]" />
          Tap anywhere to exit
        </span>
        {nextRingText && (
          <span className="flex items-center gap-1.5 text-[var(--accent)] font-medium">
            <Bell className="w-3.5 h-3.5" />
            Alarm in {nextRingText}
          </span>
        )}
      </div>

      {/* Center Huge Clock */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="flex items-baseline justify-center tracking-tight font-mono font-extrabold text-[var(--accent)] drop-shadow-sm">
          <span className="text-7xl sm:text-9xl md:text-[14rem] leading-none">{hours}</span>
          <span className="text-5xl sm:text-7xl md:text-[10rem] opacity-70 mx-1 sm:mx-3 animate-pulse leading-none">
            :
          </span>
          <span className="text-7xl sm:text-9xl md:text-[14rem] leading-none">{minutes}</span>
          {is12h && (
            <span className="text-2xl sm:text-4xl md:text-5xl ml-3 sm:ml-6 font-bold opacity-80">
              {period}
            </span>
          )}
        </div>

        {/* Seconds bar */}
        <div className="flex items-center gap-2 mt-4 text-[var(--text-secondary)] font-mono text-xl sm:text-3xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
          <span>{seconds}s</span>
        </div>

        {/* Full Date */}
        <p className="text-base sm:text-2xl text-[var(--text)] font-medium tracking-wide mt-4">
          {dateFormatted}
        </p>
      </div>

      {/* Bottom info */}
      <div className="text-[var(--text-muted)] text-xs text-center font-mono">
        Ambient Display • Chronos Clock
      </div>
    </div>
  );
};
