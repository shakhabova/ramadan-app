import { expect, test } from 'vitest';
import { injectService } from '@ng-native/testing';
import { localTodayIso } from './dates.ts';
import { TrackerStore } from './state.ts';

test('records Ramadan days and counts them in the stats', () => {
  const store = injectService(TrackerStore);

  store.updateDay(1, { fasting: true, taraweeh: 2 });
  store.updateDay(2, { fasting: false, quran: true });
  store.updateDay(3, { taraweeh: 1 });

  const stats = store.ramadanStats();
  expect(stats.fasting).toBe(1);
  expect(stats.notFasting).toBe(1);
  expect(stats.quran).toBe(1);
  expect(stats.taraweehTotal).toBe(2);
  expect(stats.taraweehMosque).toBe(1);
  expect(stats.taraweehHome).toBe(1);
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
