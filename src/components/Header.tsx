import React from 'react';
import { Settings, Maximize2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import type { AppSettings } from '../types/clock.ts';
import { playClickSound } from '../utils/sound.ts';
import { getAccentTheme } from '../utils/theme.ts';

interface HeaderProps {
  currentTime: Date;
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenFullScreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  settings,
  onOpenSettings,
  onOpenFullScreen,
}) => {
  const accentTheme = getAccentTheme(settings.accentColor);
  const is12h = settings.timeFormat === '12h';
  const timeFormatted = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: is12h,
  });

  // Calculate live clock hand angles for the mini clock in the header box
  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours();

  const secondAngle = seconds * 6;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const hourAngle = ((hours % 12) + minutes / 60) * 30;

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5">
        <div
          onClick={() => {
            playClickSound();
            onOpenFullScreen();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              playClickSound();
              onOpenFullScreen();
            }
          }}
          title="Live clock - tap to enlarge"
          aria-label="Live clock - tap to enlarge"
          className={`w-8 h-8 rounded-xl bg-[var(--accent)] p-[1.5px] shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform ${accentTheme.shadow}`}
        >
          <div className="w-full h-full bg-[var(--surface)] rounded-[10px] flex items-center justify-center overflow-hidden relative">
            <svg
              className="w-full h-full p-0.5 select-none"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dial face */}
              <circle cx="16" cy="16" r="14" fill="var(--surface-secondary)" />
              <circle cx="16" cy="16" r="14" stroke="var(--border)" strokeWidth="1" />

              {/* 12, 3, 6, 9 ticks */}
              <line x1="16" y1="3.5" x2="16" y2="6.5" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="28.5" y1="16" x2="25.5" y2="16" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="16" y1="28.5" x2="16" y2="25.5" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="3.5" y1="16" x2="6.5" y2="16" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />

              {/* Hour hand */}
              <line
                x1="16"
                y1="16"
                x2="16"
                y2="8"
                stroke="var(--text)"
                strokeWidth="2.2"
                strokeLinecap="round"
                transform={`rotate(${hourAngle}, 16, 16)`}
              />

              {/* Minute hand */}
              <line
                x1="16"
                y1="16"
                x2="16"
                y2="5"
                stroke="var(--text)"
                strokeWidth="1.6"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle}, 16, 16)`}
              />

              {/* Second hand */}
              <line
                x1="16"
                y1="19"
                x2="16"
                y2="4"
                stroke="var(--accent)"
                strokeWidth="1.1"
                strokeLinecap="round"
                transform={`rotate(${secondAngle}, 16, 16)`}
              />

              {/* Center pivot */}
              <circle cx="16" cy="16" r="1.8" fill="var(--accent)" />
              <circle cx="16" cy="16" r="0.7" fill="var(--surface)" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider uppercase text-[var(--text)] flex items-center gap-1.5">
            Clock
            <span className="text-[10px] font-normal tracking-normal px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              PWA
            </span>
          </h1>
          <p className="text-[11px] font-mono text-[var(--text-secondary)]">
            {timeFormatted}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            playClickSound();
            onOpenFullScreen();
          }}
          className="p-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)] transition active:scale-95"
          title="Full-screen clock"
          aria-label="Open full-screen big clock"
        >
          <Maximize2 className={`w-4 h-4 ${accentTheme.text}`} />
        </button>

        <button
          onClick={() => {
            playClickSound();
            onOpenSettings();
          }}
          className="p-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)] transition active:scale-95"
          title="Settings"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <PWAInstallButton />
      </div>
    </header>
  );
};
