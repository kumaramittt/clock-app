import React, { useState } from 'react';
import { Calendar, Clock, Calculator } from 'lucide-react';
import { calculateDaysBetween, calculateDateShift } from '../utils/time.ts';
import type { AppSettings } from '../types/clock.ts';
import { getTranslation } from '../utils/i18n.ts';
import { playClickSound } from '../utils/sound.ts';

interface DateCalculatorTabProps {
  settings: AppSettings;
}

export const DateCalculatorTab: React.FC<DateCalculatorTabProps> = ({ settings }) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(settings.language, key);

  const todayStr = new Date().toISOString().split('T')[0];

  // Tab 1: Days between dates
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Tab 2: Add/Subtract days
  const [baseDate, setBaseDate] = useState(todayStr);
  const [shiftCount, setShiftCount] = useState(14);
  const [shiftDirection, setShiftDirection] = useState<'add' | 'subtract'>('add');

  const daysBetween = calculateDaysBetween(startDate, endDate);
  const shiftResult = calculateDateShift(
    baseDate,
    shiftDirection === 'add' ? shiftCount : -shiftCount
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[var(--accent)]" />
          {t('dateCalculator')}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
          Days between dates & date arithmetic
        </p>
      </div>

      {/* Section 1: Days Between Dates */}
      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[var(--accent)]" />
          {t('daysBetweenDates')}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">{t('startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                playClickSound();
                setStartDate(e.target.value);
              }}
              className="bg-[var(--input-bg)] text-[var(--text)] font-mono text-sm px-3 py-2 rounded-xl border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">{t('endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                playClickSound();
                setEndDate(e.target.value);
              }}
              className="bg-[var(--input-bg)] text-[var(--text)] font-mono text-sm px-3 py-2 rounded-xl border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[11px] text-[var(--text-secondary)] block">{t('totalDays')}</span>
            <span className="text-2xl font-mono font-extrabold text-[var(--accent)]">
              {daysBetween.totalDays}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[var(--text-secondary)] block">{t('weeks')}</span>
            <span className="text-lg font-mono font-bold text-[var(--text)]">
              {daysBetween.weeks}w {daysBetween.remainingDays}d
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[var(--text-secondary)] block">Workdays</span>
            <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {daysBetween.businessDays}d
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Add or Subtract Days */}
      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--accent)]" />
          {t('addSubtractDays')}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">{t('baseDate')}</label>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => {
                playClickSound();
                setBaseDate(e.target.value);
              }}
              className="bg-[var(--input-bg)] text-[var(--text)] font-mono text-sm px-3 py-2 rounded-xl border border-[var(--border)] w-full focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShiftDirection('add');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                shiftDirection === 'add'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-sm'
                  : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              + Add Days
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShiftDirection('subtract');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                shiftDirection === 'subtract'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                  : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              - Subtract Days
            </button>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">{t('numberOfDays')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="9999"
                value={shiftCount}
                onChange={(e) => setShiftCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-[var(--input-bg)] text-[var(--text)] font-mono text-base font-bold px-3 py-2 rounded-xl border border-[var(--border)] flex-1 focus:outline-none focus:border-[var(--accent)]"
              />
              <div className="flex gap-1">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShiftCount(d);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-secondary)] font-semibold border border-[var(--border)] transition"
                  >
                    +{d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shift Result Card */}
        <div className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] text-center">
          <span className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wider block mb-1">
            {t('resultDate')}
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[var(--text)]">
            {shiftResult.formattedResult}
          </span>
          <span className="text-xs text-[var(--text-secondary)] font-mono block mt-1">
            ({shiftResult.resultDateStr})
          </span>
        </div>
      </div>
    </div>
  );
};
