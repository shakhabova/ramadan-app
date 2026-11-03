import { expect, test } from 'vitest';
import { injectService } from '@ng-native/testing';
import { addDays, localTodayIso } from './dates.ts';
import { TrackerStore } from './state.ts';

test('records Ramadan days and counts marked, missed and unmarked days', () => {
  const store = injectService(TrackerStore);

  store.updateDay(1, { fasting: true, taraweeh: 2 });
  store.updateDay(2, { fasting: false, quran: true, taraweeh: 0 });
  store.updateDay(3, { taraweeh: 1 });

  const stats = store.ramadanStats();
  expect(stats.fasting).toBe(1);
  expect(stats.notFasting).toBe(1);
  expect(stats.fastingUnmarked).toBe(28);
  expect(stats.quran).toBe(1);
  expect(stats.quranUnmarked).toBe(29);
  expect(stats.taraweehTotal).toBe(2);
  expect(stats.taraweehMosque).toBe(1);
  expect(stats.taraweehHome).toBe(1);
  expect(stats.taraweehMissed).toBe(1);
  expect(stats.taraweehUnmarked).toBe(27);
});

test('uses 29 days in both the current day and monthly totals', () => {
  const store = injectService(TrackerStore);
  store.patchSettings({ ramadanLength: 29, ramadanStart: localTodayIso() });

  expect(store.currentDay()).toBe(1);
  expect(store.ramadanStats().fastingUnmarked).toBe(29);
  store.updateDay(29, { fasting: true });
  expect(store.ramadanStats().fastingUnmarked).toBe(28);
});

test('keeps Quran marks in the daily and Ramadan records in sync', () => {
  const store = injectService(TrackerStore);
  const start = localTodayIso();
  store.patchSettings({ ramadanStart: start });

  store.updateDay(1, { quran: true });
  expect(store.state().quran[start]?.read).toBe(true);

  store.updateQuran(start, { read: true, pages: 5 });
  expect(store.record(1).quran).toBe(true);

  store.updateQuran(addDays(start, 1), { read: false });
  expect(store.record(2).quran).toBe(false);
});

test('counts today in each weekly tracker', () => {
  const store = injectService(TrackerStore);
  const today = localTodayIso();

  store.updateAzkar(today, { morning: true });
  store.updateQuran(today, { read: true, pages: 5 });
  store.updateMulk(today, true);

  expect(store.azkarWeek().morning).toBe(1);
  expect(store.azkarWeek().evening).toBe(0);
  expect(store.quranWeek().daysRead).toBe(1);
  expect(store.quranWeek().pages).toBe(5);
  expect(store.mulkWeek().daysRead).toBe(1);
});

test('follows the language setting', () => {
  const store = injectService(TrackerStore);
  expect(store.settings().language).toBe('ru');

  store.setLanguage('en');
  expect(store.settings().language).toBe('en');

  store.patchSettings({ morningAzkarHour: 4 });
  expect(store.settings().morningAzkarHour).toBe(4);
  expect(store.settings().language).toBe('en');
});
