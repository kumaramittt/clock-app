import React, { useState } from 'react';
import { X, Moon, Sun, Smartphone, Clock, Globe, Palette, Bell, Check } from 'lucide-react';
import type { AppSettings, AccentColor } from '../types/clock.ts';
import { getTranslation } from '../utils/i18n.ts';
import { playClickSound } from '../utils/sound.ts';
import { ACCENT_PALETTE, getEffectiveTheme } from '../utils/theme.ts';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

const ACCENT_COLORS: { id: AccentColor; name: string }[] = [
  { id: 'amber', name: 'Amber Gold' },
  { id: 'sky', name: 'Sky Cyan' },
  { id: 'emerald', name: 'Emerald Mint' },
  { id: 'indigo', name: 'Neon Indigo' },
  { id: 'rose', name: 'Crimson Rose' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);
  const effectiveTheme = getEffectiveTheme(settings.theme);

  const handleRequestNotifications = async () => {
    playClickSound();
    if (typeof Notification !== 'undefined') {
      try {
        const result = await Notification.requestPermission();
        setNotificationStatus(result);
        if (result === 'granted') {
          onUpdateSettings({ notificationsEnabled: true });
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[var(--modal-bg)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[var(--text)] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
          <h3 id="settings-title" className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent)]" />
            {t('settings')}
          </h3>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-secondary)] transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Switch: Light / Dark / System */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2.5">
              {t('theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ theme: 'light' });
                }}
                className={`py-3 px-2 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-semibold transition ${
                  settings.theme === 'light'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{t('lightTheme')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ theme: 'dark' });
                }}
                className={`py-3 px-2 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-semibold transition ${
                  settings.theme === 'dark'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t('darkTheme')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ theme: 'system' });
                }}
                className={`py-3 px-2 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-semibold transition ${
                  settings.theme === 'system'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{t('systemTheme')}</span>
              </button>
            </div>
          </div>

          {/* Time Format: 12-hour vs 24-hour */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2.5">
              {t('timeFormat')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ timeFormat: '12h' });
                }}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                  settings.timeFormat === '12h'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{t('hours12')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ timeFormat: '24h' });
                }}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                  settings.timeFormat === '24h'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{t('hours24')}</span>
              </button>
            </div>
          </div>

          {/* Language: English / Hindi */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2.5">
              {t('language')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ language: 'en' });
                }}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                  settings.language === 'en'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>English</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ language: 'hi' });
                }}
                className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                  settings.language === 'hi'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>हिंदी (Hindi)</span>
              </button>
            </div>
          </div>

          {/* Accent Color: 5 colors */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2.5">
              {t('accentColor')}
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {ACCENT_COLORS.map((color) => {
                const isSelected = settings.accentColor === color.id;
                const palette = ACCENT_PALETTE[color.id][effectiveTheme];

                return (
                  <button
                    key={color.id}
                    type="button"
                    style={{ backgroundColor: palette.hex }}
                    onClick={() => {
                      playClickSound();
                      onUpdateSettings({ accentColor: color.id });
                    }}
                    className={`h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-4 ring-[var(--text)] scale-105 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-100'
                    }`}
                    aria-label={`Select ${color.name} accent`}
                  >
                    {isSelected && (
                      <Check
                        className="w-5 h-5 stroke-[3]"
                        style={{ color: palette.contrast }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Permission */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2.5">
              {t('notifications')}
            </label>
            <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    {notificationStatus === 'granted'
                      ? t('notificationsAllowed')
                      : 'System Notifications'}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {notificationStatus === 'granted'
                      ? 'Enabled for alarms & reminders'
                      : 'Needed for background alerts'}
                  </div>
                </div>
              </div>

              {notificationStatus === 'granted' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold transition shadow-sm active:scale-95"
                >
                  {t('requestPermission')}
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="mt-6 w-full py-3 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] font-semibold text-sm border border-[var(--border)] transition"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};
