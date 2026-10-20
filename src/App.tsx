/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type {
  TabType,
  AlarmItem,
  CityItem,
  TimerItem,
  AppSettings,
  BedtimeSettings,
} from './types/clock.ts';
import { INITIAL_WORLD_CITIES } from './data/cities.ts';
import { Header } from './components/Header.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { AlarmTab } from './components/AlarmTab.tsx';
import { WorldClockTab } from './components/WorldClockTab.tsx';
import { StopwatchTab } from './components/StopwatchTab.tsx';
import { TimerTab } from './components/TimerTab.tsx';
import { PomodoroTab } from './components/PomodoroTab.tsx';
import { BedtimeTab } from './components/BedtimeTab.tsx';
import { AmbientSoundTab } from './components/AmbientSoundTab.tsx';
import { DateCalculatorTab } from './components/DateCalculatorTab.tsx';
import { FullScreenClock } from './components/FullScreenClock.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { MoreMenuModal } from './components/MoreMenuModal.tsx';
import { AlarmRingingModal } from './components/AlarmRingingModal.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { unlockAudio } from './utils/sound.ts';
import { applyTheme } from './utils/theme.ts';

const SETTINGS_KEY = 'chronos_settings_v2';
const ALARMS_KEY = 'chronos_alarms_v2';
const CITIES_KEY = 'chronos_world_cities_v2';
const TIMERS_KEY = 'chronos_timers_v2';
const BEDTIME_KEY = 'chronos_bedtime_v2';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  timeFormat: '12h',
  language: 'en',
  accentColor: 'amber',
  notificationsEnabled: false,
};

const DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'alarm-1',
    time: '07:00',
    label: 'Morning Routine',
    enabled: true,
    days: [1, 2, 3, 4, 5],
    sound: 'radar',
    volume: 0.8,
    gradualVolume: false,
    vibration: true,
    snoozeDuration: 5,
    mathDismiss: false,
    createdAt: Date.now() - 100000,
  },
  {
    id: 'alarm-2',
    time: '08:30',
    label: 'Weekend Relax',
    enabled: false,
    days: [0, 6],
    sound: 'gentle',
    volume: 0.8,
    gradualVolume: true,
    vibration: true,
    snoozeDuration: 10,
    mathDismiss: false,
    createdAt: Date.now() - 200000,
  },
];

const DEFAULT_TIMERS: TimerItem[] = [
  {
    id: 'timer-chai',
    label: 'Chai',
    initialDuration: 300, // 5 min
    remainingSeconds: 300,
    isRunning: false,
    isPaused: false,
    targetTimestamp: null,
  },
  {
    id: 'timer-padhai',
    label: 'Padhai',
    initialDuration: 1500, // 25 min
    remainingSeconds: 1500,
    isRunning: false,
    isPaused: false,
    targetTimestamp: null,
  },
];

const DEFAULT_BEDTIME: BedtimeSettings = {
  enabled: true,
  bedtime: '23:00',
  wakeTime: '07:00',
  reminderMinutesBefore: 30,
  days: [0, 1, 2, 3, 4, 5, 6],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('alarm');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);

  // Modals state
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Alarms
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const saved = localStorage.getItem(ALARMS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_ALARMS;
  });

  // World Cities
  const [cities, setCities] = useState<CityItem[]>(() => {
    try {
      const saved = localStorage.getItem(CITIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_WORLD_CITIES;
  });

  // Timers (Multiple simultaneous)
  const [timers, setTimers] = useState<TimerItem[]>(() => {
    try {
      const saved = localStorage.getItem(TIMERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_TIMERS;
  });

  // Bedtime
  const [bedtimeSettings, setBedtimeSettings] = useState<BedtimeSettings>(() => {
    try {
      const saved = localStorage.getItem(BEDTIME_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_BEDTIME;
  });

  const firedMinutesRef = useRef<Set<string>>(new Set());

  // Apply Theme & sync with OS preference when on 'system'
  useEffect(() => {
    applyTheme(settings.theme, settings.accentColor);

    if (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system', settings.accentColor);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme, settings.accentColor]);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    } catch {
      // ignore
    }
  }, [alarms]);

  useEffect(() => {
    try {
      localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
    } catch {
      // ignore
    }
  }, [cities]);

  useEffect(() => {
    try {
      localStorage.setItem(TIMERS_KEY, JSON.stringify(timers));
    } catch {
      // ignore
    }
  }, [timers]);

  useEffect(() => {
    try {
      localStorage.setItem(BEDTIME_KEY, JSON.stringify(bedtimeSettings));
    } catch {
      // ignore
    }
  }, [bedtimeSettings]);

  // Unlock audio on first touch
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudio();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Master Clock & Alarm Checker Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay();
      const currentMinuteKey = `${now.toDateString()}_${currentTimeString}`;

      // Alarm Ring Check
      if (!ringingAlarm) {
        for (const alarm of alarms) {
          if (!alarm.enabled) continue;

          // Snoozed alarm check
          if (alarm.snoozedUntil && now.getTime() >= alarm.snoozedUntil) {
            setRingingAlarm(alarm);
            break;
          }

          // Regular scheduled time check
          if (alarm.time === currentTimeString) {
            const alarmFiredKey = `${alarm.id}_${currentMinuteKey}`;
            if (!firedMinutesRef.current.has(alarmFiredKey)) {
              const matchesDay = alarm.days.length === 0 || alarm.days.includes(currentDay);
              if (matchesDay) {
                firedMinutesRef.current.add(alarmFiredKey);
                setRingingAlarm(alarm);
                break;
              }
            }
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [alarms, ringingAlarm]);

  // Alarm Handlers
  const handleAddAlarm = (newAlarmData: Omit<AlarmItem, 'id' | 'createdAt'>) => {
    const newAlarm: AlarmItem = {
      ...newAlarmData,
      id: `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setAlarms((prev) => [newAlarm, ...prev]);
  };

  const handleUpdateAlarm = (updated: AlarmItem) => {
    setAlarms((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    if (ringingAlarm?.id === id) {
      setRingingAlarm(null);
    }
  };

  const handleSnoozeAlarm = (alarm: AlarmItem, minutes: number = 5) => {
    const snoozeDurationMs = minutes * 60 * 1000;
    const snoozedUntil = Date.now() + snoozeDurationMs;

    setAlarms((prev) =>
      prev.map((a) => (a.id === alarm.id ? { ...a, snoozedUntil } : a))
    );
    setRingingAlarm(null);
  };

  const handleStopAlarm = (alarm: AlarmItem) => {
    const isOnce = alarm.days.length === 0;

    setAlarms((prev) =>
      prev.map((a) =>
        a.id === alarm.id
          ? {
              ...a,
              enabled: isOnce ? false : a.enabled,
              snoozedUntil: null,
            }
          : a
      )
    );
    setRingingAlarm(null);
  };

  // World Cities Handlers
  const handleAddCity = (city: CityItem) => {
    setCities((prev) => [...prev, city]);
  };

  const handleRemoveCity = (id: string) => {
    setCities((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReorderCities = (newCities: CityItem[]) => {
    setCities(newCities);
  };

  // Timers Handlers (Multiple Timers)
  const handleAddTimer = (timerData: Omit<TimerItem, 'id'>) => {
    const newTimer: TimerItem = {
      ...timerData,
      id: `timer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setTimers((prev) => [newTimer, ...prev]);
  };

  const handleUpdateTimer = (updated: TimerItem) => {
    setTimers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const activeAlarmsCount = alarms.filter((a) => a.enabled).length;
  const anyTimerRunning = timers.some((t) => t.isRunning);

  return (
    <div className="min-h-screen flex justify-center selection:bg-[var(--accent)] selection:text-[var(--accent-contrast)] font-sans transition-colors duration-200 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md min-h-screen flex flex-col shadow-2xl relative transition-colors duration-200 bg-[var(--bg)] border-x border-[var(--border)]">
        <OfflineIndicator />
        <Header
          currentTime={currentTime}
          settings={settings}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenFullScreen={() => setFullScreenOpen(true)}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'alarm' && (
            <AlarmTab
              alarms={alarms}
              onAddAlarm={handleAddAlarm}
              onUpdateAlarm={handleUpdateAlarm}
              onDeleteAlarm={handleDeleteAlarm}
              onTriggerAlarm={(alarm) => setRingingAlarm(alarm)}
              settings={settings}
            />
          )}

          {activeTab === 'world' && (
            <WorldClockTab
              cities={cities}
              onAddCity={handleAddCity}
              onRemoveCity={handleRemoveCity}
              onReorderCities={handleReorderCities}
              currentTime={currentTime}
              settings={settings}
            />
          )}

          {activeTab === 'stopwatch' && <StopwatchTab settings={settings} />}

          {activeTab === 'timer' && (
            <TimerTab
              timers={timers}
              onAddTimer={handleAddTimer}
              onUpdateTimer={handleUpdateTimer}
              onDeleteTimer={handleDeleteTimer}
              settings={settings}
            />
          )}

          {/* New Extra Tabs */}
          {activeTab === 'pomodoro' && <PomodoroTab settings={settings} />}

          {activeTab === 'bedtime' && (
            <BedtimeTab
              bedtimeSettings={bedtimeSettings}
              onUpdateBedtime={setBedtimeSettings}
              appSettings={settings}
            />
          )}

          {activeTab === 'ambient' && <AmbientSoundTab settings={settings} />}

          {activeTab === 'datecalc' && <DateCalculatorTab settings={settings} />}
        </main>

        {/* Ringing Alarm Alert Modal */}
        {ringingAlarm && (
          <AlarmRingingModal
            alarm={ringingAlarm}
            onSnooze={handleSnoozeAlarm}
            onStop={handleStopAlarm}
            settings={settings}
          />
        )}

        {/* More Menu Modal */}
        {moreMenuOpen && (
          <MoreMenuModal
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setMoreMenuOpen(false);
            }}
            onOpenFullScreen={() => {
              setMoreMenuOpen(false);
              setFullScreenOpen(true);
            }}
            onOpenSettings={() => {
              setMoreMenuOpen(false);
              setSettingsOpen(true);
            }}
            onClose={() => setMoreMenuOpen(false)}
            settings={settings}
          />
        )}

        {/* Settings Modal */}
        {settingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {/* Full Screen Clock Modal */}
        {fullScreenOpen && (
          <FullScreenClock
            currentTime={currentTime}
            settings={settings}
            alarms={alarms}
            onClose={() => setFullScreenOpen(false)}
          />
        )}

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenMore={() => setMoreMenuOpen(true)}
          activeAlarmsCount={activeAlarmsCount}
          timerRunning={anyTimerRunning}
          settings={settings}
        />
      </div>
    </div>
  );
}
