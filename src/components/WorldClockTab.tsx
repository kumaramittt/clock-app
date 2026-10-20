import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Compass,
  MapPin,
  Clock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Briefcase,
  Sun,
  Moon,
} from 'lucide-react';
import type { CityItem, AppSettings } from '../types/clock.ts';
import { POPULAR_CITIES } from '../data/cities.ts';
import { getTimezoneInfo, calculateMeetingOverlap } from '../utils/time.ts';
import { playClickSound } from '../utils/sound.ts';
import { getTranslation } from '../utils/i18n.ts';

interface WorldClockTabProps {
  cities: CityItem[];
  onAddCity: (city: CityItem) => void;
  onRemoveCity: (id: string) => void;
  onReorderCities: (cities: CityItem[]) => void;
  currentTime: Date;
  settings: AppSettings;
}

// Mini Analog SVG Clock Component
const MiniAnalogClock: React.FC<{ timezone?: string; baseDate: Date; size?: number }> = ({
  timezone,
  baseDate,
  size = 48,
}) => {
  const [time, setTime] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone || undefined,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).formatToParts(baseDate);

      let h = 0;
      let m = 0;
      let s = 0;

      for (const part of parts) {
        if (part.type === 'hour') h = parseInt(part.value, 10);
        if (part.type === 'minute') m = parseInt(part.value, 10);
        if (part.type === 'second') s = parseInt(part.value, 10);
      }

      setTime({ hours: h, minutes: m, seconds: s });
    } catch {
      setTime({
        hours: baseDate.getHours(),
        minutes: baseDate.getMinutes(),
        seconds: baseDate.getSeconds(),
      });
    }
  }, [timezone, baseDate]);

  const secDeg = (time.seconds / 60) * 360;
  const minDeg = (time.minutes / 60) * 360 + (time.seconds / 60) * 6;
  const hourDeg = ((time.hours % 12) / 12) * 360 + (time.minutes / 60) * 30;

  return (
    <div style={{ width: size, height: size }} className="relative shrink-0">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="var(--surface-secondary)" stroke="var(--border)" strokeWidth="3" />
        <circle cx="50" cy="12" r="2.5" fill="var(--text-secondary)" />
        <circle cx="88" cy="50" r="2.5" fill="var(--text-secondary)" />
        <circle cx="50" cy="88" r="2.5" fill="var(--text-secondary)" />
        <circle cx="12" cy="50" r="2.5" fill="var(--text-secondary)" />

        {/* Hour Hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="26"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${hourDeg} 50 50)`}
        />
        {/* Minute Hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="18"
          stroke="var(--text)"
          strokeWidth="2.8"
          strokeLinecap="round"
          transform={`rotate(${minDeg} 50 50)`}
        />
        {/* Second Hand */}
        <line
          x1="50"
          y1="54"
          x2="50"
          y2="14"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${secDeg} 50 50)`}
        />
        <circle cx="50" cy="50" r="3" fill="var(--accent)" />
      </svg>
    </div>
  );
};

export const WorldClockTab: React.FC<WorldClockTabProps> = ({
  cities,
  onAddCity,
  onRemoveCity,
  onReorderCities,
  currentTime,
  settings,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const [modalOpen, setModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [clockViewMode, setClockViewMode] = useState<'digital' | 'analog'>('digital');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Meeting Planner selector cities
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [plannerCity1, setPlannerCity1] = useState(localTimezone);
  const [plannerCity2, setPlannerCity2] = useState('America/New_York');

  const localInfo = useMemo(() => {
    return getTimezoneInfo(localTimezone, currentTime);
  }, [localTimezone, currentTime]);

  // Reordering helpers
  const moveCity = (index: number, direction: 'up' | 'down') => {
    playClickSound();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= cities.length) return;

    const copy = [...cities];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    onReorderCities(copy);
  };

  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) return;

    const copy = [...cities];
    const [moved] = copy.splice(draggedIdx, 1);
    copy.splice(targetIndex, 0, moved);
    onReorderCities(copy);
    setDraggedIdx(null);
  };

  // Search filter
  const existingIds = new Set(cities.map((c) => c.id));
  const filteredCities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return POPULAR_CITIES.filter((c) => !existingIds.has(c.id));
    return POPULAR_CITIES.filter(
      (c) =>
        !existingIds.has(c.id) &&
        (c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.timezone.toLowerCase().includes(q))
    );
  }, [searchQuery, existingIds]);

  const handleAdd = (city: CityItem) => {
    playClickSound();
    onAddCity(city);
    setSearchQuery('');
    setModalOpen(false);
  };

  // Meeting overlap calculation
  const overlapSlots = useMemo(() => {
    return calculateMeetingOverlap(plannerCity1, plannerCity2, currentTime);
  }, [plannerCity1, plannerCity2, currentTime]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t('worldClock')}</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            {cities.length} {t('citiesTracked')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View: Analog / Digital */}
          <div className="flex p-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl">
            <button
              onClick={() => {
                playClickSound();
                setClockViewMode('digital');
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                clockViewMode === 'digital'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              12:00
            </button>
            <button
              onClick={() => {
                playClickSound();
                setClockViewMode('analog');
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                clockViewMode === 'analog'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Meeting Planner Button */}
          <button
            onClick={() => {
              playClickSound();
              setMeetingModalOpen(true);
            }}
            className="p-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)] transition"
            title="Meeting Planner"
            aria-label="Open Meeting Planner"
          >
            <Briefcase className="w-4 h-4" />
          </button>

          {/* Add City Button */}
          <button
            onClick={() => {
              playClickSound();
              setModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs shadow-md active:scale-95 transition"
            aria-label="Add city to World Clock"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t('addCity')}</span>
          </button>
        </div>
      </div>

      {/* Local Time Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-[var(--surface)] border border-[var(--border)] shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('yourLocalTime')}</span>
            </div>
            <h3 className="text-sm text-[var(--text)] font-semibold truncate max-w-[200px]">
              {localTimezone.replace('_', ' ')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{localInfo.dateStr}</p>
          </div>

          <MiniAnalogClock baseDate={currentTime} size={54} />
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--text)]">
            {settings.timeFormat === '24h'
              ? currentTime.toLocaleTimeString([], { hour12: false })
              : localInfo.timeStr12h}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
            Base
          </span>
        </div>
      </div>

      {/* Tracked Cities List with Reordering */}
      <div className="space-y-3">
        {cities.map((city, idx) => {
          const info = getTimezoneInfo(city.timezone, currentTime);

          return (
            <div
              key={city.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className="relative rounded-3xl p-4 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] transition shadow-sm group cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Reorder controls + Clock / Details */}
                <div className="flex items-center gap-3">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCity(idx, 'up')}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-20 disabled:hover:text-[var(--text-secondary)] rounded hover:bg-[var(--surface-secondary)] transition"
                      aria-label={`Move ${city.name} up`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === cities.length - 1}
                      onClick={() => moveCity(idx, 'down')}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-20 disabled:hover:text-[var(--text-secondary)] rounded hover:bg-[var(--surface-secondary)] transition"
                      aria-label={`Move ${city.name} down`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {clockViewMode === 'analog' ? (
                    <MiniAnalogClock timezone={city.timezone} baseDate={currentTime} size={46} />
                  ) : null}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[var(--text)] tracking-tight">{city.name}</h4>
                      {info.isDaytime ? (
                        <span title="Daytime" className="text-amber-500">
                          <Sun className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span title="Nighttime" className="text-indigo-500 dark:text-indigo-400">
                          <Moon className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate max-w-[130px]">{city.country}</p>
                    <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-0.5">
                      {info.diffDescription}
                    </p>
                  </div>
                </div>

                {/* Right: City time & delete */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold tracking-tight text-[var(--text)]">
                      {settings.timeFormat === '24h' ? info.timeStr : info.timeStr12h}
                    </span>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono">{info.dateStr}</p>
                  </div>

                  <button
                    onClick={() => {
                      playClickSound();
                      onRemoveCity(city.id);
                    }}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-500 rounded-xl hover:bg-[var(--surface-secondary)] transition opacity-60 group-hover:opacity-100"
                    aria-label={`Remove ${city.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meeting Planner Modal */}
      {meetingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-planner-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[var(--modal-bg)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto text-[var(--text)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
              <h3 id="meeting-planner-title" className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--accent)]" />
                {t('meetingPlanner')}
              </h3>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-secondary)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">{t('selectTwoCities')}</p>

            {/* City Pickers */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                  Primary City
                </label>
                <select
                  value={plannerCity1}
                  onChange={(e) => setPlannerCity1(e.target.value)}
                  className="w-full bg-[var(--input-bg)] text-[var(--text)] text-xs px-2.5 py-2 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value={localTimezone}>Your Local ({localTimezone.split('/')[1] || 'Local'})</option>
                  {POPULAR_CITIES.map((c) => (
                    <option key={`c1-${c.id}`} value={c.timezone} className="bg-[var(--surface)] text-[var(--text)]">
                      {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1">
                  Secondary City
                </label>
                <select
                  value={plannerCity2}
                  onChange={(e) => setPlannerCity2(e.target.value)}
                  className="w-full bg-[var(--input-bg)] text-[var(--text)] text-xs px-2.5 py-2 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={`c2-${c.id}`} value={c.timezone} className="bg-[var(--surface)] text-[var(--text)]">
                      {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Overlap Table */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-1">
                24-Hour Working Overlap (09:00 - 18:00)
              </div>
              {overlapSlots.map((slot, i) => {
                const isOptimal = slot.status === 'optimal';
                const isAcceptable = slot.status === 'acceptable';

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-mono transition border ${
                      isOptimal
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : isAcceptable
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                        : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span>{slot.timeStr1}</span>
                    <span className="text-[10px] uppercase font-sans font-semibold">
                      {isOptimal ? 'Optimal Overlap' : isAcceptable ? 'Early / Late' : 'Off-Hours'}
                    </span>
                    <span>{slot.timeStr2}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setMeetingModalOpen(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs font-semibold border border-[var(--border)] transition"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-city-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[var(--modal-bg)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col text-[var(--text)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
              <h3 id="search-city-title" className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[var(--accent)]" />
                {t('addCity')}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-secondary)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchCity')}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
              {filteredCities.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                  No cities found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredCities.map((city) => {
                  const info = getTimezoneInfo(city.timezone, currentTime);

                  return (
                    <button
                      key={city.id}
                      onClick={() => handleAdd(city)}
                      className="w-full text-left p-3 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between transition group active:scale-[0.99]"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
                          {city.name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {city.country} • {info.diffDescription}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-[var(--text)]">
                          {info.timeStr12h}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
