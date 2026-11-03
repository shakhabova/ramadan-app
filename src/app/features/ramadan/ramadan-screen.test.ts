import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from '../../core/state.ts';
import { RamadanScreen } from './ramadan-screen.ts';

test('records fasting and taraweeh on the selected day', async () => {
  const { componentRef } = await render(RamadanScreen);
  const store = componentRef.injector.get(TrackerStore);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Постился' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'В мечети' }));

  expect(store.record(1).fasting).toBe(true);
  expect(store.record(1).taraweeh).toBe(2);
});

test('picks another day, keeps records separate and clears a mark', async () => {
  const { componentRef } = await render(RamadanScreen);
  const store = componentRef.injector.get(TrackerStore);

  await userEvent.setup().press(screen.getByRole('button', { name: 'День 5' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Не постился' }));

  expect(store.record(5).fasting).toBe(false);
  expect(store.record(1).fasting).toBeUndefined();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Не постился' }));
  expect(store.record(5).fasting).toBeUndefined();
});

test('respects a 29-day Ramadan', async () => {
  const { componentRef } = await render(RamadanScreen);
  componentRef.injector.get(TrackerStore).patchSettings({ ramadanLength: 29 });
  componentRef.changeDetectorRef.detectChanges();

  expect(screen.queryByRole('button', { name: 'День 30' })).toBeNull();
  expect(screen.getByRole('button', { name: 'День 29' })).toBeTruthy();
});
