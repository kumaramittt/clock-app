import React from 'react';
import { Bell, Globe, Timer as StopwatchIcon, Hourglass, MoreHorizontal } from 'lucide-react';
import type { TabType, AppSettings } from '../types/clock.ts';
import { playClickSound } from '../utils/sound.ts';
import { getTranslation } from '../utils/i18n.ts';
import { getAccentTheme } from '../utils/theme.ts';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenMore: () => void;
  activeAlarmsCount?: number;
  timerRunning?: boolean;
  stopwatchRunning?: boolean;
  settings: AppSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenMore,
  activeAlarmsCount = 0,
  timerRunning = false,
  stopwatchRunning = false,
  settings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);
  const accentTheme = getAccentTheme(settings.accentColor);

  const tabs = [
    {
      id: 'alarm' as TabType,
      label: t('alarm'),
      icon: Bell,
      badge: activeAlarmsCount > 0 ? activeAlarmsCount : null,
    },
    {
      id: 'world' as TabType,
      label: t('worldClock'),
      icon: Globe,
      badge: null,
    },
    {
      id: 'stopwatch' as TabType,
      label: t('stopwatch'),
      icon: StopwatchIcon,
      badge: stopwatchRunning ? '•' : null,
    },
    {
      id: 'timer' as TabType,
      label: t('timer'),
      icon: Hourglass,
      badge: timerRunning ? '•' : null,
    },
  ];

  const isMoreActive = ['pomodoro', 'bedtime', 'ambient', 'datecalc', 'settings'].includes(activeTab);

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] px-1 pb-safe transition-colors"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound();
                onTabChange(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center h-full py-1 transition-all select-none group touch-manipulation ${
                isActive ? accentTheme.text : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
              aria-label={tab.label}
              aria-selected={isActive}
              role="tab"
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${
                  isActive ? 'bg-[var(--accent-soft)] scale-105' : 'group-hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span
                    className={`absolute top-2 right-[20%] flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full text-[10px] font-bold ${
                      tab.badge === '•'
                        ? `${accentTheme.primaryBg} text-[var(--accent-contrast)] animate-pulse`
                        : `${accentTheme.primaryBg} text-[var(--accent-contrast)] shadow-sm`
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 transition-colors truncate max-w-full px-1 ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span className={`absolute top-0 w-8 h-[2px] rounded-full ${accentTheme.primaryBg} shadow-sm`} />
              )}
            </button>
          );
        })}

        {/* 5th Tab: More */}
        <button
          onClick={() => {
            playClickSound();
            onOpenMore();
          }}
          className={`relative flex flex-col items-center justify-center h-full py-1 transition-all select-none group touch-manipulation ${
            isMoreActive ? accentTheme.text : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
          aria-label={t('more')}
          aria-selected={isMoreActive}
          role="tab"
        >
          <div
            className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${
              isMoreActive ? 'bg-[var(--accent-soft)] scale-105' : 'group-hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
              isMoreActive ? `font-bold ${accentTheme.text}` : 'font-medium'
            }`}
          >
            {t('more')}
          </span>

          {isMoreActive && (
            <span className={`absolute top-0 w-8 h-[2px] rounded-full ${accentTheme.primaryBg} shadow-sm`} />
          )}
        </button>
      </div>
    </nav>
  );
};
