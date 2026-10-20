export type TabType =
  | 'alarm'
  | 'world'
  | 'stopwatch'
  | 'timer'
  | 'pomodoro'
  | 'bedtime'
  | 'ambient'
  | 'datecalc'
  | 'settings';

export type AlarmSoundType =
  | 'radar'
  | 'gentle'
  | 'chime'
  | 'digital'
  | 'cosmic'
  | 'bell'
  | 'sunrise';

export interface AlarmItem {
  id: string;
  time: string; // "HH:MM" in 24h format e.g. "07:30"
  label: string;
  enabled: boolean;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat (empty array means "Once")
  sound: AlarmSoundType;
  volume: number; // 0.1 to 1.0 (default 0.8)
  gradualVolume: boolean; // sound slowly ramps up over 20-30s
  vibration: boolean; // vibration toggle
  snoozeDuration: 5 | 10 | 15; // custom snooze minutes
  mathDismiss: boolean; // solve math problem to dismiss
  snoozedUntil?: number | null; // timestamp ms if snoozed
  createdAt: number;
}

export interface CityItem {
  id: string;
  name: string;
  country: string;
  timezone: string; // e.g. "Asia/Tokyo"
  countryCode?: string;
}

export interface LapItem {
  lapNumber: number;
  lapTime: number; // in milliseconds
  overallTime: number; // in milliseconds
}

export interface TimerItem {
  id: string;
  label: string;
  initialDuration: number; // in seconds
  remainingSeconds: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  targetTimestamp: number | null; // ms timestamp
}

export type AccentColor = 'amber' | 'sky' | 'emerald' | 'indigo' | 'rose';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  timeFormat: '12h' | '24h';
  language: 'en' | 'hi';
  accentColor: AccentColor;
  notificationsEnabled: boolean;
}

export interface BedtimeSettings {
  enabled: boolean;
  bedtime: string; // "23:00"
  wakeTime: string; // "07:00"
  reminderMinutesBefore: number; // 15 | 30 | 45 | 60
  days: number[]; // days of week active
}
