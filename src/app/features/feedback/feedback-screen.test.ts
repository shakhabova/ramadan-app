import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { FeedbackScreen } from './feedback-screen.ts';

test('validates and prepares a feedback message', async () => {
  await render(FeedbackScreen);
  const user = userEvent.setup();

  await user.press(screen.getByRole('button', { name: /Открыть почту/ }));
  expect(screen.getByText('Напишите сообщение, чтобы продолжить.')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: /Сообщить об ошибке/ }));
  await user.type(screen.getByPlaceholderText('Ваше сообщение…'), 'Проверка обратной связи');
  await user.press(screen.getByRole('button', { name: /Открыть почту/ }));

  expect(screen.queryByText('Напишите сообщение, чтобы продолжить.')).toBeNull();
});
