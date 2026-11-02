import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { AzkarScreen } from './azkar-screen.ts';

test('reads through the azkar and counts a repeated one', async () => {
  await render(AzkarScreen);

  const openButtons = screen.getAllByRole('button', { name: /Открыть/ });
  await userEvent.setup().press(openButtons[0]);

  expect(screen.getByText(/Утренний азкар №1/)).toBeTruthy();

  await userEvent.setup().press(screen.getByRole('button', { name: /Дальше/ }));
  await userEvent.setup().press(screen.getByRole('button', { name: /Счётчик: 0 \/ 10/ }));

  expect(screen.getByText(/Счётчик: 1 \/ 10/)).toBeTruthy();
});
