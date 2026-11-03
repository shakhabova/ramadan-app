import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from '../../core/state.ts';
import { QuranScreen } from './quran-screen.ts';

test('marks the Quran as read and can return it to unmarked', async () => {
  const { componentRef } = await render(QuranScreen);
  const store = componentRef.injector.get(TrackerStore);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Читал' }));
  expect(screen.getByText('✓ Коран прочитан')).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: 'Снять отметку' }));
  expect(Object.values(store.state().quran)[0].read).toBeUndefined();
});

test('records a page count', async () => {
  await render(QuranScreen);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Добавить прогресс' }));
  await userEvent.setup().type(screen.getByPlaceholderText('0'), '5');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Сохранить' }));

  expect(screen.getAllByText(/5 страниц/).length).toBeGreaterThan(0);
});

test('stores juz instead of pages so progress is not counted twice', async () => {
  const { componentRef } = await render(QuranScreen);
  const store = componentRef.injector.get(TrackerStore);
  const user = userEvent.setup();

  await user.press(screen.getByRole('button', { name: 'Добавить прогресс' }));
  await user.press(screen.getByRole('button', { name: 'Джузы' }));
  await user.type(screen.getByPlaceholderText('0'), '1.5');
  await user.press(screen.getByRole('button', { name: 'Сохранить' }));

  const today = Object.values(store.state().quran)[0];
  expect(today.juz).toBe(1.5);
  expect(today.pages).toBeUndefined();
});

test('enables and marks Al-Mulk as read', async () => {
  await render(QuranScreen);

  await userEvent.setup().press(screen.getByRole('button', { name: 'Выкл.' }));
  await userEvent.setup().press(screen.getByRole('button', { name: /Прочитал/ }));

  expect(screen.getByText(/Сура Аль-Мульк прочитана/)).toBeTruthy();
});
