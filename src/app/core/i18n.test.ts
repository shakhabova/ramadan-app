import { expect, test } from 'vitest';
import { injectService } from '@ng-native/testing';
import { I18n } from './i18n.ts';
import { TrackerStore } from './state.ts';

test('translates and switches language at runtime', () => {
  injectService(TrackerStore);
  const i18n = injectService(I18n);

  expect(i18n.t('tab.azkar')).toBe('Азкары');
  expect(i18n.t('ramadan.dayTitle', { n: 3 })).toBe('День 3');

  injectService(TrackerStore).setLanguage('en');

  expect(i18n.t('tab.azkar')).toBe('Azkar');
  expect(i18n.t('ramadan.dayTitle', { n: 3 })).toBe('Day 3');
});

test('pluralises a count in the current language', () => {
  injectService(TrackerStore);
  const i18n = injectService(I18n);

  expect(i18n.count(3, 'unit.day')).toBe('дня');
  expect(i18n.count(1, 'unit.page')).toBe('страница');

  injectService(TrackerStore).setLanguage('en');
  expect(i18n.count(3, 'unit.day')).toBe('days');
  expect(i18n.count(1, 'unit.day')).toBe('day');
});
