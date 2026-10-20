import React, { useState, useMemo } from 'react';
import {
  Plus,
  Bell,
  Trash2,
  Brain,
  Volume2,
  TrendingUp,
  Vibrate,
  Clock,
  Check,
} from 'lucide-react';
import type { AlarmItem, AlarmSoundType, AppSettings } from '../types/clock.ts';
import { formatTime12h, getNextAlarmTimestamp, formatTimeUntilAlarm } from '../utils/time.ts';
import { playSoundPreview, playClickSound } from '../utils/sound.ts';
import { getTranslation } from '../utils/i18n.ts';
import { getAccentTheme } from '../utils/theme.ts';

interface AlarmTabProps {
  alarms: AlarmItem[];
  onAddAlarm: (alarm: Omit<AlarmItem, 'id' | 'createdAt'>) => void;
  onUpdateAlarm: (alarm: AlarmItem) => void;
  onDeleteAlarm: (id: string) => void;
  onTriggerAlarm: (alarm: AlarmItem) => void;
  settings: AppSettings;
}

const DAYS = [
  { label: 'S', full: 'Sun', day: 0 },
  { label: 'M', full: 'Mon', day: 1 },
  { label: 'T', full: 'Tue', day: 2 },
  { label: 'W', full: 'Wed', day: 3 },
  { label: 'T', full: 'Thu', day: 4 },
  { label: 'F', full: 'Fri', day: 5 },
  { label: 'S', full: 'Sat', day: 6 },
];

const SOUND_LIST: { id: AlarmSoundType; nameKey: Parameters<typeof getTranslation>[1] }[] = [
  { id: 'radar', nameKey: 'radar' },
  { id: 'gentle', nameKey: 'gentle' },
  { id: 'chime', nameKey: 'chime' },
  { id: 'digital', nameKey: 'digital' },
  { id: 'cosmic', nameKey: 'cosmic' },
  { id: 'bell', nameKey: 'bell' },
  { id: 'sunrise', nameKey: 'sunrise' },
];

export const AlarmTab: React.FC<AlarmTabProps> = ({
  alarms,
  onAddAlarm,
  onUpdateAlarm,
  onDeleteAlarm,
  onTriggerAlarm,
  settings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);
  const accentTheme = getAccentTheme(settings.accentColor);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);

  // Form State
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<AlarmSoundType>('radar');
  const [volume, setVolume] = useState(0.8);
  const [gradualVolume, setGradualVolume] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState<5 | 10 | 15>(5);
  const [mathDismiss, setMathDismiss] = useState(false);

  // Next active alarm time calculation
  const nextRingText = useMemo(() => {
    const enabledAlarms = alarms.filter((a) => a.enabled);
    if (enabledAlarms.length === 0) return null;

    const nextTimestamps = enabledAlarms
      .map((a) => getNextAlarmTimestamp(a))
      .filter((ts): ts is number => ts !== null);

    if (nextTimestamps.length === 0) return null;

    const minTimestamp = Math.min(...nextTimestamps);
    const diffMs = minTimestamp - Date.now();
    return formatTimeUntilAlarm(diffMs);
  }, [alarms]);

  const openCreateModal = () => {
    playClickSound();
    setEditingAlarm(null);
    const now = new Date();
    let currentHour = now.getHours();
    const isPM = currentHour >= 12;
    currentHour = currentHour % 12 || 12;

    setHour(currentHour.toString().padStart(2, '0'));
    setMinute(now.getMinutes().toString().padStart(2, '0'));
    setPeriod(isPM ? 'PM' : 'AM');
    setLabel('');
    setSelectedDays([1, 2, 3, 4, 5]); // Weekdays default
    setSound('radar');
    setVolume(0.8);
    setGradualVolume(false);
    setVibration(true);
    setSnoozeDuration(5);
    setMathDismiss(false);
    setModalOpen(true);
  };

  const openEditModal = (alarm: AlarmItem) => {
    playClickSound();
    setEditingAlarm(alarm);
    const [hStr, mStr] = alarm.time.split(':');
    let hNum = parseInt(hStr, 10);
    const isPM = hNum >= 12;
    hNum = hNum % 12 || 12;

    setHour(hNum.toString().padStart(2, '0'));
    setMinute(mStr);
    setPeriod(isPM ? 'PM' : 'AM');
    setLabel(alarm.label);
    setSelectedDays([...alarm.days]);
    setSound(alarm.sound || 'radar');
    setVolume(alarm.volume !== undefined ? alarm.volume : 0.8);
    setGradualVolume(!!alarm.gradualVolume);
    setVibration(alarm.vibration !== false);
    setSnoozeDuration(alarm.snoozeDuration || 5);
    setMathDismiss(!!alarm.mathDismiss);
    setModalOpen(true);
  };

  const toggleDay = (day: number) => {
    playClickSound();
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const setDaysPreset = (preset: 'weekdays' | 'weekends' | 'everyday' | 'once') => {
    playClickSound();
    if (preset === 'weekdays') setSelectedDays([1, 2, 3, 4, 5]);
    if (preset === 'weekends') setSelectedDays([0, 6]);
    if (preset === 'everyday') setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    if (preset === 'once') setSelectedDays([]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    let hNum = parseInt(hour, 10);
    if (period === 'PM' && hNum < 12) hNum += 12;
    if (period === 'AM' && hNum === 12) hNum = 0;
    const time24 = `${hNum.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;

    if (editingAlarm) {
      onUpdateAlarm({
        ...editingAlarm,
        time: time24,
        label: label.trim() || 'Alarm',
        days: selectedDays,
        sound,
        volume,
        gradualVolume,
        vibration,
        snoozeDuration,
        mathDismiss,
        enabled: true,
      });
    } else {
      onAddAlarm({
        time: time24,
        label: label.trim() || 'Alarm',
        enabled: true,
        days: selectedDays,
        sound,
        volume,
        gradualVolume,
        vibration,
        snoozeDuration,
        mathDismiss,
      });
    }
    setModalOpen(false);
  };

  const handleToggle = (alarm: AlarmItem) => {
    playClickSound();
    onUpdateAlarm({
      ...alarm,
      enabled: !alarm.enabled,
      snoozedUntil: null,
    });
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Banner / Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t('alarms')}</h2>
          {nextRingText ? (
            <p className="text-xs text-[var(--accent)] font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              {t('nextAlarmIn')} {nextRingText}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t('noActiveAlarms')}</p>
          )}
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm shadow-md active:scale-95 transition"
          aria-label="Add new alarm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('addAlarm')}</span>
        </button>
      </div>

      {/* Alarm List */}
      {alarms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] p-8 text-center bg-[var(--surface)] my-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text)]">{t('noAlarms')}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[240px] mx-auto">
            Set custom alarms with repeat days, volume ramps, math puzzle dismissal, and offline ringtones.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold transition"
          >
            {t('addAlarm')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm) => {
            const { timeStr, period: p } = formatTime12h(alarm.time);
            const isSnoozed = alarm.snoozedUntil && alarm.snoozedUntil > Date.now();

            return (
              <div
                key={alarm.id}
                className={`relative rounded-3xl p-4 transition-all border ${
                  alarm.enabled
                    ? 'bg-[var(--surface)] border-[var(--border)] shadow-md'
                    : 'bg-[var(--surface-secondary)]/50 border-[var(--border)] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => openEditModal(alarm)}
                    className="cursor-pointer flex-1 select-none pr-3"
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit alarm ${alarm.label || 'Alarm'}`}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-mono font-bold tracking-tight text-[var(--text)]">
                        {settings.timeFormat === '24h' ? alarm.time : timeStr}
                      </span>
                      {settings.timeFormat !== '24h' && (
                        <span className="text-lg font-mono font-semibold text-[var(--accent)]">
                          {p}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-[var(--text-secondary)] truncate max-w-[150px]">
                        {alarm.label || 'Alarm'}
                      </span>
                      {isSnoozed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] animate-pulse">
                          {t('snoozed')}
                        </span>
                      )}
                      {alarm.mathDismiss && (
                        <span
                          title="Math problem required to dismiss"
                          className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30"
                        >
                          <Brain className="w-3 h-3" />
                          Math
                        </span>
                      )}
                      {alarm.gradualVolume && (
                        <span
                          title="Gradual volume crescendo"
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                        >
                          Ramp
                        </span>
                      )}
                    </div>

                    {/* Days badges */}
                    <div className="flex items-center gap-1 mt-2.5">
                      {alarm.days.length === 0 ? (
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">Once</span>
                      ) : alarm.days.length === 7 ? (
                        <span className="text-[11px] font-medium text-[var(--accent)]">Every day</span>
                      ) : alarm.days.length === 5 &&
                        [1, 2, 3, 4, 5].every((d) => alarm.days.includes(d)) ? (
                        <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">Weekdays</span>
                      ) : alarm.days.length === 2 &&
                        [0, 6].every((d) => alarm.days.includes(d)) ? (
                        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Weekends</span>
                      ) : (
                        DAYS.map((d) => {
                          const isDayActive = alarm.days.includes(d.day);
                          return (
                            <span
                              key={d.full}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                                isDayActive
                                  ? alarm.enabled
                                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]'
                                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            >
                              {d.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Actions: Test ring, Delete & Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTriggerAlarm(alarm)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] active:scale-90 transition rounded-xl hover:bg-[var(--surface-secondary)]"
                      aria-label={`Test alarm ring for ${alarm.label}`}
                      title="Test alarm ring"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteAlarm(alarm.id)}
                      className="p-2 text-[var(--text-secondary)] hover:text-red-500 active:scale-90 transition rounded-xl hover:bg-[var(--surface-secondary)]"
                      aria-label={`Delete alarm ${alarm.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggle(alarm)}
                      aria-checked={alarm.enabled}
                      role="switch"
                      aria-label={`Toggle alarm for ${timeStr} ${p}`}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                        alarm.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--surface-secondary)] border border-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                          alarm.enabled ? 'translate-x-6 bg-[var(--accent-contrast)]' : 'translate-x-0 bg-[var(--text-secondary)]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Alarm Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alarm-dialog-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[var(--modal-bg)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto text-[var(--text)]">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                <h3 id="alarm-dialog-title" className="text-lg font-bold text-[var(--text)]">
                  {editingAlarm ? t('editAlarm') : t('newAlarm')}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-secondary)] transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold transition shadow-md"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>

              {/* Time Selector */}
              <div className="bg-[var(--surface-secondary)] rounded-2xl p-4 border border-[var(--border)] flex items-center justify-center gap-3 my-3">
                <div className="flex flex-col items-center">
                  <label htmlFor="alarm-hour" className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                    Hour
                  </label>
                  <select
                    id="alarm-hour"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-3xl px-3 py-2 rounded-xl border border-[var(--border)] text-center focus:outline-none focus:border-[var(--accent)]"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const val = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={val} value={val} className="bg-[var(--surface)] text-[var(--text)]">
                          {val}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <span className="text-3xl font-mono font-bold text-[var(--text-secondary)] mt-4">:</span>

                <div className="flex flex-col items-center">
                  <label htmlFor="alarm-minute" className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                    Minute
                  </label>
                  <select
                    id="alarm-minute"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="bg-[var(--input-bg)] text-[var(--text)] font-mono font-bold text-3xl px-3 py-2 rounded-xl border border-[var(--border)] text-center focus:outline-none focus:border-[var(--accent)]"
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const val = i.toString().padStart(2, '0');
                      return (
                        <option key={val} value={val} className="bg-[var(--surface)] text-[var(--text)]">
                          {val}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* AM/PM toggle */}
                <div className="flex flex-col gap-1.5 ml-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setPeriod('AM');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      period === 'AM'
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                        : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setPeriod('PM');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      period === 'PM'
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                        : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Label */}
              <div className="mb-3">
                <label htmlFor="alarm-label" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {t('alarmLabel')}
                </label>
                <input
                  id="alarm-label"
                  type="text"
                  maxLength={30}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Wake up, Gym, Meditation..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Repeat Days */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('repeatDays')}</label>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDaysPreset('weekdays')}
                      className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysPreset('weekends')}
                      className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]"
                    >
                      Weekends
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysPreset('everyday')}
                      className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]"
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysPreset('once')}
                      className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]"
                    >
                      Once
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((d) => {
                    const isSelected = selectedDays.includes(d.day);
                    return (
                      <button
                        key={d.full}
                        type="button"
                        onClick={() => toggleDay(d.day)}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-sm'
                            : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Repeat on ${d.full}`}
                      >
                        <span className="text-xs">{d.label}</span>
                        <span className="text-[9px] opacity-80">{d.full}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alarm Tone */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  {t('alarmSound')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SOUND_LIST.map((snd) => {
                    const isSelected = sound === snd.id;
                    return (
                      <div
                        key={snd.id}
                        onClick={() => {
                          playClickSound();
                          setSound(snd.id);
                        }}
                        className={`cursor-pointer flex items-center justify-between p-2.5 rounded-xl border transition ${
                          isSelected
                            ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--text)]'
                            : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-semibold truncate">{t(snd.nameKey)}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSoundPreview(snd.id, volume);
                          }}
                          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface)] transition"
                          title="Preview sound"
                          aria-label={`Preview ${snd.id} sound`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider & Gradual Volume Option */}
              <div className="p-3 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3 mb-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold flex items-center gap-1.5 text-[var(--text)]">
                      <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                      {t('volume')}
                    </span>
                    <span className="font-mono text-[var(--accent)] font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)] h-1.5 bg-[var(--surface)] rounded-lg cursor-pointer"
                  />
                </div>

                {/* Gradual Volume Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <span className="text-xs font-semibold text-[var(--text)] block">
                        {t('gradualVolume')}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        Starts softly and gently increases over 25 seconds
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={gradualVolume}
                    onChange={(e) => setGradualVolume(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                  />
                </div>

                {/* Vibration Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-[var(--text)]">{t('vibration')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={vibration}
                    onChange={(e) => setVibration(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Snooze Duration (5, 10, 15 min) */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {t('snoozeDuration')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([5, 10, 15] as const).map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSnoozeDuration(duration);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        snoozeDuration === duration
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] font-bold shadow-sm'
                          : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      {duration} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Math Problem Dismissal Option */}
              <div className="p-3 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--text)] block">
                      {t('mathDismiss')}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      Must solve arithmetic problem to turn off alarm
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={mathDismiss}
                  onChange={(e) => setMathDismiss(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 dark:accent-purple-500 rounded cursor-pointer"
                />
              </div>

              {/* Delete button if editing */}
              {editingAlarm && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onDeleteAlarm(editingAlarm.id);
                    setModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-semibold text-xs border border-red-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete this alarm</span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
