import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from '../../core/state.ts';
import { SettingsScreen } from './settings-screen.ts';

test('switches language', async () => {
  const { componentRef } = await render(SettingsScreen);

  await userEvent.setup().press(screen.getByRole('button', { name: 'EN' }));

  expect(componentRef.injector.get(TrackerStore).settings().language).toBe('en');
});

test('saves a valid Ramadan start date and rejects a bad one', async () => {
  const { componentRef } = await render(SettingsScreen);
  const store = componentRef.injector.get(TrackerStore);

  await userEvent.setup().type(screen.getByPlaceholderText('2027-02-18'), 'nope');
  await userEvent.setup().press(screen.getByRole('button', { name: /Сохранить/ }));
  expect(store.settings().ramadanStart).toBeNull();

  await userEvent.setup().clear(screen.getByPlaceholderText('2027-02-18'));
  await userEvent.setup().type(screen.getByPlaceholderText('2027-02-18'), '2027-02-18');
  await userEvent.setup().press(screen.getByRole('button', { name: /Сохранить/ }));

  expect(store.settings().ramadanStart).toBe('2027-02-18');
});
