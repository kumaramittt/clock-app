import React from 'react';
import {
  X,
  Flame,
  Bed,
  Headphones,
  Calendar,
  Maximize2,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { TabType, AppSettings } from '../types/clock.ts';
import { getTranslation } from '../utils/i18n.ts';
import { playClickSound } from '../utils/sound.ts';

interface MoreMenuModalProps {
  onSelectTab: (tab: TabType) => void;
  onOpenFullScreen: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
  settings: AppSettings;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  onSelectTab,
  onOpenFullScreen,
  onOpenSettings,
  onClose,
  settings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const menuItems = [
    {
      id: 'pomodoro' as TabType,
      title: t('pomodoro'),
      desc: '25m Focus • 5m Break with session dots',
      icon: Flame,
      color: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30',
      action: () => {
        onSelectTab('pomodoro');
        onClose();
      },
    },
    {
      id: 'bedtime' as TabType,
      title: t('bedtime'),
      desc: 'Sleep schedule, 90m cycles & reminders',
      icon: Bed,
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-500/15 border-indigo-500/30',
      action: () => {
        onSelectTab('bedtime');
        onClose();
      },
    },
    {
      id: 'ambient' as TabType,
      title: t('ambient'),
      desc: 'Synthesized Rain, White Noise & Forest',
      icon: Headphones,
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      action: () => {
        onSelectTab('ambient');
        onClose();
      },
    },
    {
      id: 'datecalc' as TabType,
      title: t('dateCalc'),
      desc: 'Days between dates & date arithmetic',
      icon: Calendar,
      color: 'text-sky-500 dark:text-sky-400',
      bg: 'bg-sky-500/15 border-sky-500/30',
      action: () => {
        onSelectTab('datecalc');
        onClose();
      },
    },
    {
      id: 'fullscreen' as const,
      title: t('bigClock'),
      desc: 'Full-screen digital clock display',
      icon: Maximize2,
      color: 'text-[var(--accent)]',
      bg: 'bg-[var(--accent-soft)] border-[var(--accent-border)]',
      action: () => {
        onClose();
        onOpenFullScreen();
      },
    },
    {
      id: 'settings' as const,
      title: t('settings'),
      desc: 'Light/Dark/System, 12h/24h, Hindi/English & Colors',
      icon: Settings,
      color: 'text-[var(--text-secondary)]',
      bg: 'bg-[var(--surface-secondary)] border-[var(--border)]',
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-menu-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[var(--modal-bg)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto text-[var(--text)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <h3 id="more-menu-title" className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            {t('more')}
          </h3>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-secondary)] transition"
            aria-label="Close more menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => {
                  playClickSound();
                  item.action();
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${item.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text)] transition shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
