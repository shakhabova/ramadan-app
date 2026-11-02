import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from './core/state.ts';
import { App } from './app.ts';

test('opens on the Ramadan tab and switches tabs', async () => {
  await render(App);

  expect(screen.getByText('Трекер Рамадана')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Азкары' }));
  expect(screen.getAllByText('Утренние').length).toBeGreaterThan(0);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Коран' }));
  expect(screen.getByText('Сегодняшнее чтение')).toBeTruthy();
});

test('switches the whole UI language', async () => {
  const { componentRef } = await render(App);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Настройки' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'EN' }));

  expect(componentRef.injector.get(TrackerStore).settings().language).toBe('en');
  expect(screen.getByText('Notifications')).toBeTruthy();
});
