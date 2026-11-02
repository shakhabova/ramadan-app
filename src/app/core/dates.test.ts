import { expect, test } from 'vitest';
import { addDays, dayOfRamadan, getPlural, isValidIsoDate, lastNDates, localTodayIso } from './dates.ts';

test('counts the day of Ramadan from the start date', () => {
  expect(dayOfRamadan('2027-02-18', '2027-02-18')).toBe(1);
  expect(dayOfRamadan('2027-02-18', '2027-02-20')).toBe(3);
  expect(dayOfRamadan('2027-02-18', '2027-02-17')).toBe(0);
});

test('adds days across a month boundary', () => {
  expect(addDays('2027-02-28', 2)).toBe('2027-03-02');
  expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
});

test('lists the last seven dates oldest first', () => {
  expect(lastNDates(7, '2027-03-05')).toEqual([
    '2027-02-27',
    '2027-02-28',
    '2027-03-01',
    '2027-03-02',
    '2027-03-03',
    '2027-03-04',
    '2027-03-05',
  ]);
});

test('formats today as a local date', () => {
  expect(localTodayIso(new Date(2027, 2, 5))).toBe('2027-03-05');
});

test('validates an ISO date', () => {
  expect(isValidIsoDate('2027-02-18')).toBe(true);
  expect(isValidIsoDate('2027-02-30')).toBe(false);
  expect(isValidIsoDate('18.02.2027')).toBe(false);
});

test('pluralises in Russian', () => {
  const forms: [string, string, string] = ['день', 'дня', 'дней'];
  expect(getPlural(1, forms)).toBe('день');
  expect(getPlural(3, forms)).toBe('дня');
  expect(getPlural(5, forms)).toBe('дней');
  expect(getPlural(11, forms)).toBe('дней');
  expect(getPlural(21, forms)).toBe('день');
});
