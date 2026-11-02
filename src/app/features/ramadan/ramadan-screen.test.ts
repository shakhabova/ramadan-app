import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from '../../core/state.ts';
import { RamadanScreen } from './ramadan-screen.ts';

test('records fasting and taraweeh on the selected day', async () => {
  const { componentRef } = await render(RamadanScreen);
  const store = componentRef.injector.get(TrackerStore);

  await userEvent.setup().press(screen.getByRole('button', { name: /Постился/ }));
  await userEvent.setup().press(screen.getByRole('button', { name: /В мечети/ }));

  expect(store.record(1).fasting).toBe(true);
  expect(store.record(1).taraweeh).toBe(2);
});

test('picks another day and keeps the record separate', async () => {
  const { componentRef } = await render(RamadanScreen);
  const store = componentRef.injector.get(TrackerStore);

  await userEvent.setup().press(screen.getByRole('button', { name: /День 5/ }));
  await userEvent.setup().press(screen.getByRole('button', { name: '❌ Пропустил' }));

  expect(store.record(5).fasting).toBe(false);
  expect(store.record(1).fasting).toBeUndefined();
});
