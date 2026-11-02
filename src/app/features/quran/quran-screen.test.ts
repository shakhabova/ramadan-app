import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { QuranScreen } from './quran-screen.ts';

test('marks the Quran as read', async () => {
  await render(QuranScreen);

  await userEvent.setup().press(screen.getByRole('button', { name: /Читал/ }));

  expect(screen.getByText('📖 Коран прочитан ✅')).toBeTruthy();
});

test('records a page count', async () => {
  await render(QuranScreen);

  await userEvent.setup().press(screen.getByRole('button', { name: /Указать страницы/ }));
  await userEvent.setup().type(screen.getByPlaceholderText('30'), '5');
  await userEvent.setup().press(screen.getByRole('button', { name: /Сохранить/ }));

  expect(screen.getAllByText(/5 страниц/).length).toBeGreaterThan(0);
});

test('marks Al-Mulk as read', async () => {
  await render(QuranScreen);

  await userEvent.setup().press(screen.getByRole('button', { name: /Прочитал/ }));

  expect(screen.getByText('🌑 Сура Аль-Мульк прочитана ✅')).toBeTruthy();
});
