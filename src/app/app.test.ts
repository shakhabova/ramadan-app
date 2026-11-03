import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from './core/state.ts';
import { App } from './app.ts';

async function finishOnboarding(): Promise<void> {
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: 'Продолжить' }));
  await user.press(screen.getByRole('button', { name: 'Продолжить' }));
  await user.press(screen.getByRole('button', { name: 'Начать' }));
}

test('shows onboarding once, then opens Today and switches tabs', async () => {
  await render(App);

  expect(screen.getByText('Ваш Рамадан — в спокойном ритме')).toBeTruthy();
  await finishOnboarding();

  expect(screen.getByText('Напоминание дня')).toBeTruthy();
  expect(screen.getByText('Пост сегодня')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Азкары' }));
  expect(screen.getAllByText('Утренние').length).toBeGreaterThan(0);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Коран' }));
  expect(screen.getAllByText('Сегодняшнее чтение').length).toBeGreaterThan(0);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Прогресс' }));
  expect(screen.getByText('Календарь истории')).toBeTruthy();
});

test('switches the whole UI language', async () => {
  const { componentRef } = await render(App);
  await finishOnboarding();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Настройки' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'EN' }));

  expect(componentRef.injector.get(TrackerStore).settings().language).toBe('en');
  expect(screen.getByText('Notifications')).toBeTruthy();
});
