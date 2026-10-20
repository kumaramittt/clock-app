import type { AlarmItem, LapItem } from '../types/clock.ts';

/**
 * Format milliseconds to MM:SS.cs or HH:MM:SS.cs
 */
export function formatMilliseconds(ms: number): {
  hours: string;
  minutes: string;
  seconds: string;
  centiseconds: string;
  formatted: string;
} {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const hStr = pad(hours);
  const mStr = pad(minutes);
  const sStr = pad(seconds);
  const csStr = pad(centiseconds);

  let formatted = '';
  if (hours > 0) {
    formatted = `${hStr}:${mStr}:${sStr}.${csStr}`;
  } else {
    formatted = `${mStr}:${sStr}.${csStr}`;
  }

  return {
    hours: hStr,
    minutes: mStr,
    seconds: sStr,
    centiseconds: csStr,
    formatted,
  };
}

/**
 * Convert 24-hour time "14:30" to 12-hour format "2:30 PM"
 */
export function formatTime12h(time24: string): {
  timeStr: string;
  period: 'AM' | 'PM';
  hours12: number;
  minutes: number;
} {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  const mPad = m.toString().padStart(2, '0');

  return {
    timeStr: `${hours12}:${mPad}`,
    period,
    hours12,
    minutes: m,
  };
}

/**
 * Calculates next timestamp when an alarm should ring.
 * Takes repeat days into account (0 = Sun, 1 = Mon, ..., 6 = Sat).
 * If days is empty array, it triggers once: today if time hasn't passed, or tomorrow.
 */
export function getNextAlarmTimestamp(alarm: AlarmItem, now: Date = new Date()): number | null {
  if (!alarm.enabled) return null;

  // If snoozed and snooze time is in future
  if (alarm.snoozedUntil && alarm.snoozedUntil > now.getTime()) {
    return alarm.snoozedUntil;
  }

  const [hStr, mStr] = alarm.time.split(':');
  const targetHour = parseInt(hStr, 10);
  const targetMinute = parseInt(mStr, 10);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const currentDayOfWeek = now.getDay();

  // If repeat days are specified
  if (alarm.days && alarm.days.length > 0) {
    let minDiffMs = Infinity;
    let closestTime = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const candidateDayOfWeek = (currentDayOfWeek + dayOffset) % 7;
      if (alarm.days.includes(candidateDayOfWeek)) {
        const candidateDate = new Date(currentYear, currentMonth, currentDate + dayOffset, targetHour, targetMinute, 0, 0);
        const diff = candidateDate.getTime() - now.getTime();
        if (diff > 500) { // at least 500ms in future
          if (diff < minDiffMs) {
            minDiffMs = diff;
            closestTime = candidateDate.getTime();
          }
        }
      }
    }

    if (closestTime > 0) {
      return closestTime;
    }

    // If all this week passed, roll to next week for the first repeating day
    const nextWeekDayOffset = 7;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const candidateDayOfWeek = (currentDayOfWeek + dayOffset) % 7;
      if (alarm.days.includes(candidateDayOfWeek)) {
        const candidateDate = new Date(currentYear, currentMonth, currentDate + nextWeekDayOffset + dayOffset, targetHour, targetMinute, 0, 0);
        return candidateDate.getTime();
      }
    }
  }

  // Once (no repeat days)
  const todayTarget = new Date(currentYear, currentMonth, currentDate, targetHour, targetMinute, 0, 0);
  if (todayTarget.getTime() - now.getTime() > 500) {
    return todayTarget.getTime();
  }

  const tomorrowTarget = new Date(currentYear, currentMonth, currentDate + 1, targetHour, targetMinute, 0, 0);
  return tomorrowTarget.getTime();
}

/**
 * Returns human-readable relative time until alarm rings
 */
export function formatTimeUntilAlarm(diffMs: number): string {
  if (diffMs <= 0) return 'less than a minute';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    return 'less than a minute';
  }
  if (hours === 0) {
    return `${minutes} min${minutes === 1 ? '' : 's'}`;
  }
  if (minutes === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${hours} hr${hours === 1 ? '' : 's'} ${minutes} min${minutes === 1 ? '' : 's'}`;
}

/**
 * Get timezone details relative to local browser time
 */
export function getTimezoneInfo(timezone: string, baseDate: Date = new Date()): {
  timeStr: string;
  timeStr12h: string;
  period: string;
  dateStr: string;
  diffHours: number;
  diffDescription: string;
  isDaytime: boolean;
  dayShift: 'Today' | 'Tomorrow' | 'Yesterday';
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const parts = formatter.formatToParts(baseDate);
    const hour = parts.find((p) => p.type === 'hour')?.value || '12';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const second = parts.find((p) => p.type === 'second')?.value || '00';
    const period = parts.find((p) => p.type === 'dayPeriod')?.value || 'AM';

    const timeStr12h = `${hour}:${minute} ${period}`;
    const timeStr = `${hour}:${minute}:${second}`;

    const hour24Formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hourCycle: 'h23',
    });
    const hour24 = parseInt(hour24Formatter.format(baseDate), 10);
    const isDaytime = hour24 >= 6 && hour24 < 18;

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const dateStr = dateFormatter.format(baseDate);

    // Calculate time difference in minutes
    // We can format the local date and target timezone date in ISO-like parts to get the difference
    const tzDateStr = baseDate.toLocaleString('en-US', { timeZone: timezone });
    const localDateStr = baseDate.toLocaleString('en-US');
    const tzDate = new Date(tzDateStr);
    const localDate = new Date(localDateStr);
    const diffMs = tzDate.getTime() - localDate.getTime();
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2; // round to nearest 0.5 hour

    // Calculate day shift
    const localDay = baseDate.toLocaleDateString('en-US', { weekday: 'short' });
    const tzDay = baseDate.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });

    let dayShift: 'Today' | 'Tomorrow' | 'Yesterday' = 'Today';
    const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const localIdx = daysOrder.indexOf(localDay);
    const tzIdx = daysOrder.indexOf(tzDay);
    if (tzIdx !== -1 && localIdx !== -1) {
      if ((localIdx + 1) % 7 === tzIdx) {
        dayShift = 'Tomorrow';
      } else if ((localIdx + 6) % 7 === tzIdx) {
        dayShift = 'Yesterday';
      }
    }

    let diffDescription = 'Same time';
    if (diffHours > 0) {
      const formattedDiff = Number.isInteger(diffHours) ? `${diffHours}` : `${diffHours}`;
      diffDescription = `+${formattedDiff} hrs • ${dayShift}`;
    } else if (diffHours < 0) {
      const formattedDiff = Number.isInteger(diffHours) ? `${Math.abs(diffHours)}` : `${Math.abs(diffHours)}`;
      diffDescription = `-${formattedDiff} hrs • ${dayShift}`;
    } else {
      diffDescription = `Same time • ${dayShift}`;
    }

    return {
      timeStr,
      timeStr12h,
      period,
      dateStr,
      diffHours,
      diffDescription,
      isDaytime,
      dayShift,
    };
  } catch {
    return {
      timeStr: '--:--',
      timeStr12h: '--:--',
      period: '',
      dateStr: '',
      diffHours: 0,
      diffDescription: 'Local time',
      isDaytime: true,
      dayShift: 'Today',
    };
  }
}

/**
 * Finds fastest and slowest lap numbers for display highlighting
 */
export function findFastestAndSlowestLaps(laps: LapItem[]): {
  fastestLapNumber: number | null;
  slowestLapNumber: number | null;
} {
  if (laps.length < 2) {
    return { fastestLapNumber: null, slowestLapNumber: null };
  }

  let minTime = Infinity;
  let maxTime = -Infinity;
  let fastestLapNumber: number | null = null;
  let slowestLapNumber: number | null = null;

  for (const lap of laps) {
    if (lap.lapTime < minTime) {
      minTime = lap.lapTime;
      fastestLapNumber = lap.lapNumber;
    }
    if (lap.lapTime > maxTime) {
      maxTime = lap.lapTime;
      slowestLapNumber = lap.lapNumber;
    }
  }

  return { fastestLapNumber, slowestLapNumber };
}

/**
 * Format total seconds into HH:MM:SS
 */
export function formatTimerSeconds(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatted = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, formatted };
}

/**
 * Generates a simple, solvable math challenge for alarm dismissal
 */
export function generateMathProblem(): {
  question: string;
  answer: number;
} {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];

  let a = 0;
  let b = 0;
  let answer = 0;

  if (op === '+') {
    a = Math.floor(Math.random() * 25) + 6;
    b = Math.floor(Math.random() * 25) + 4;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 30) + 15;
    b = Math.floor(Math.random() * (a - 4)) + 3;
    answer = a - b;
  } else {
    // Multiplication
    a = Math.floor(Math.random() * 9) + 3;
    b = Math.floor(Math.random() * 8) + 2;
    answer = a * b;
  }

  return {
    question: `${a} ${op} ${b} = ?`,
    answer,
  };
}

/**
 * Calculates days and business days between two dates (YYYY-MM-DD)
 */
export function calculateDaysBetween(
  startDateStr: string,
  endDateStr: string
): {
  totalDays: number;
  weeks: number;
  remainingDays: number;
  businessDays: number;
  weekendDays: number;
} {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const absDays = Math.abs(totalDays);
  const weeks = Math.floor(absDays / 7);
  const remainingDays = absDays % 7;

  let businessDays = 0;
  let weekendDays = 0;

  const earlier = start < end ? new Date(start) : new Date(end);
  const later = start < end ? new Date(end) : new Date(start);

  const cur = new Date(earlier);
  while (cur < later) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else {
      businessDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return {
    totalDays,
    weeks,
    remainingDays,
    businessDays,
    weekendDays,
  };
}

/**
 * Adds or subtracts days from a given date (YYYY-MM-DD)
 */
export function calculateDateShift(
  baseDateStr: string,
  daysShift: number
): {
  resultDateStr: string;
  formattedResult: string;
} {
  const date = new Date(baseDateStr);
  date.setDate(date.getDate() + daysShift);

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const resultDateStr = `${y}-${m}-${d}`;

  const formattedResult = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    resultDateStr,
    formattedResult,
  };
}

export interface MeetingHourSlot {
  hour1: number; // 0-23
  hour2: number; // 0-23
  timeStr1: string; // e.g. "9:00 AM"
  timeStr2: string; // e.g. "5:00 PM"
  status: 'optimal' | 'acceptable' | 'off-hours';
}

/**
 * Computes 24-hour working hours overlap between two timezones
 */
export function calculateMeetingOverlap(
  tz1: string,
  tz2: string,
  baseDate: Date = new Date()
): MeetingHourSlot[] {
  const slots: MeetingHourSlot[] = [];

  for (let h = 0; h < 24; h++) {
    // Construct date for this hour in tz1
    const testDate = new Date(baseDate);
    testDate.setHours(h, 0, 0, 0);

    const formatter1 = new Intl.DateTimeFormat('en-US', {
      timeZone: tz1,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const formatter2 = new Intl.DateTimeFormat('en-US', {
      timeZone: tz2,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const h24_1 = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: tz1, hour: 'numeric', hourCycle: 'h23' }).format(testDate),
      10
    );
    const h24_2 = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: tz2, hour: 'numeric', hourCycle: 'h23' }).format(testDate),
      10
    );

    const isWorking1 = h24_1 >= 9 && h24_1 <= 18;
    const isWorking2 = h24_2 >= 9 && h24_2 <= 18;

    const isNearWorking1 = h24_1 >= 8 && h24_1 <= 20;
    const isNearWorking2 = h24_2 >= 8 && h24_2 <= 20;

    let status: 'optimal' | 'acceptable' | 'off-hours' = 'off-hours';
    if (isWorking1 && isWorking2) {
      status = 'optimal';
    } else if (isNearWorking1 && isNearWorking2) {
      status = 'acceptable';
    }

    slots.push({
      hour1: h24_1,
      hour2: h24_2,
      timeStr1: formatter1.format(testDate),
      timeStr2: formatter2.format(testDate),
      status,
    });
  }

  return slots;
}

export function calculateSleepDuration(
  bedtime: string,
  wakeTime: string
): { durationHours: number; durationMins: number } {
  const [bH, bM] = bedtime.split(':').map((v) => parseInt(v, 10));
  const [wH, wM] = wakeTime.split(':').map((v) => parseInt(v, 10));

  let totalMinutes = wH * 60 + wM - (bH * 60 + bM);
  if (totalMinutes <= 0) {
    totalMinutes += 24 * 60;
  }

  const durationHours = Math.floor(totalMinutes / 60);
  const durationMins = totalMinutes % 60;

  return { durationHours, durationMins };
}

export function calculateSleepCycles(durationHours: number, durationMins: number): number {
  const totalMinutes = durationHours * 60 + durationMins;
  return Math.round((totalMinutes / 90) * 10) / 10;
}

