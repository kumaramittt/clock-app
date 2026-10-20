import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMilliseconds,
  formatTime12h,
  getNextAlarmTimestamp,
  findFastestAndSlowestLaps,
  formatTimerSeconds,
  generateMathProblem,
  calculateDaysBetween,
  calculateDateShift,
  calculateMeetingOverlap,
} from './time.ts';
import type { AlarmItem, LapItem } from '../types/clock.ts';

test('formatMilliseconds formats ms correctly without hours', () => {
  const result = formatMilliseconds(65430); // 1m 5s 430ms => 01:05.43
  assert.equal(result.formatted, '01:05.43');
  assert.equal(result.minutes, '01');
  assert.equal(result.seconds, '05');
  assert.equal(result.centiseconds, '43');
});

test('formatMilliseconds formats ms with hours', () => {
  const result = formatMilliseconds(3661200); // 1h 1m 1s 200ms
  assert.equal(result.formatted, '01:01:01.20');
  assert.equal(result.hours, '01');
  assert.equal(result.minutes, '01');
  assert.equal(result.seconds, '01');
});

test('formatTime12h parses AM and PM times', () => {
  const am = formatTime12h('07:30');
  assert.equal(am.timeStr, '7:30');
  assert.equal(am.period, 'AM');

  const noon = formatTime12h('12:00');
  assert.equal(noon.timeStr, '12:00');
  assert.equal(noon.period, 'PM');

  const pm = formatTime12h('21:45');
  assert.equal(pm.timeStr, '9:45');
  assert.equal(pm.period, 'PM');

  const midnight = formatTime12h('00:15');
  assert.equal(midnight.timeStr, '12:15');
  assert.equal(midnight.period, 'AM');
});

test('getNextAlarmTimestamp handles snoozed alarms', () => {
  const futureSnooze = Date.now() + 300000;
  const alarm: AlarmItem = {
    id: '1',
    time: '08:00',
    label: 'Work',
    enabled: true,
    days: [1, 2, 3, 4, 5],
    sound: 'radar',
    volume: 0.8,
    gradualVolume: false,
    vibration: true,
    snoozeDuration: 5,
    mathDismiss: false,
    snoozedUntil: futureSnooze,
    createdAt: Date.now(),
  };

  const nextRing = getNextAlarmTimestamp(alarm);
  assert.equal(nextRing, futureSnooze);
});

test('getNextAlarmTimestamp returns null for disabled alarm', () => {
  const alarm: AlarmItem = {
    id: '2',
    time: '08:00',
    label: 'Off',
    enabled: false,
    days: [],
    sound: 'radar',
    volume: 0.8,
    gradualVolume: false,
    vibration: true,
    snoozeDuration: 5,
    mathDismiss: false,
    createdAt: Date.now(),
  };
  assert.equal(getNextAlarmTimestamp(alarm), null);
});

test('getNextAlarmTimestamp schedules later today or tomorrow for once-off', () => {
  const now = new Date(2026, 9, 20, 10, 0, 0); // 10:00 AM

  const laterTodayAlarm: AlarmItem = {
    id: '3',
    time: '14:30', // 2:30 PM
    label: 'Doctor',
    enabled: true,
    days: [],
    sound: 'chime',
    volume: 0.8,
    gradualVolume: false,
    vibration: true,
    snoozeDuration: 5,
    mathDismiss: false,
    createdAt: Date.now(),
  };
  const ring1 = getNextAlarmTimestamp(laterTodayAlarm, now);
  assert.ok(ring1 !== null);
  const ring1Date = new Date(ring1);
  assert.equal(ring1Date.getDate(), 20);
  assert.equal(ring1Date.getHours(), 14);
  assert.equal(ring1Date.getMinutes(), 30);

  const pastTodayAlarm: AlarmItem = {
    id: '4',
    time: '07:00', // 7:00 AM passed
    label: 'Morning run',
    enabled: true,
    days: [],
    sound: 'chime',
    volume: 0.8,
    gradualVolume: false,
    vibration: true,
    snoozeDuration: 5,
    mathDismiss: false,
    createdAt: Date.now(),
  };
  const ring2 = getNextAlarmTimestamp(pastTodayAlarm, now);
  assert.ok(ring2 !== null);
  const ring2Date = new Date(ring2);
  assert.equal(ring2Date.getDate(), 21); // Scheduled for next day
  assert.equal(ring2Date.getHours(), 7);
  assert.equal(ring2Date.getMinutes(), 0);
});

test('findFastestAndSlowestLaps identifies min and max lap correctly', () => {
  const laps: LapItem[] = [
    { lapNumber: 1, lapTime: 45000, overallTime: 45000 },
    { lapNumber: 2, lapTime: 32000, overallTime: 77000 }, // Fastest
    { lapNumber: 3, lapTime: 58000, overallTime: 135000 }, // Slowest
    { lapNumber: 4, lapTime: 41000, overallTime: 176000 },
  ];

  const result = findFastestAndSlowestLaps(laps);
  assert.equal(result.fastestLapNumber, 2);
  assert.equal(result.slowestLapNumber, 3);
});

test('formatTimerSeconds formats countdown times properly', () => {
  const shortTimer = formatTimerSeconds(75); // 1m 15s
  assert.equal(shortTimer.formatted, '01:15');

  const longTimer = formatTimerSeconds(3665); // 1h 1m 5s
  assert.equal(longTimer.formatted, '01:01:05');
});

test('generateMathProblem produces valid solvable math equation', () => {
  const problem = generateMathProblem();
  assert.ok(problem.question.includes('= ?'));
  assert.equal(typeof problem.answer, 'number');
  assert.ok(!isNaN(problem.answer));
});

test('calculateDaysBetween computes difference, weeks, and business days', () => {
  const result = calculateDaysBetween('2026-10-01', '2026-10-15');
  assert.equal(result.totalDays, 14);
  assert.equal(result.weeks, 2);
  assert.equal(result.remainingDays, 0);
  assert.equal(result.businessDays + result.weekendDays, 14);
});

test('calculateDateShift correctly shifts days forward and backward', () => {
  const forward = calculateDateShift('2026-10-20', 10);
  assert.equal(forward.resultDateStr, '2026-10-30');

  const backward = calculateDateShift('2026-10-20', -5);
  assert.equal(backward.resultDateStr, '2026-10-15');
});

test('calculateMeetingOverlap returns 24 hours of comparison', () => {
  const slots = calculateMeetingOverlap('America/New_York', 'Europe/London');
  assert.equal(slots.length, 24);
  const optimal = slots.filter((s) => s.status === 'optimal');
  assert.ok(optimal.length > 0);
});

