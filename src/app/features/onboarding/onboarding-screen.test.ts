import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from '../../core/state.ts';
import { OnboardingScreen } from './onboarding-screen.ts';

test('saves the language, local start date, month length and reminder time', async () => {
  const { componentRef } = await render(OnboardingScreen);
  const store = componentRef.injector.get(TrackerStore);
  const user = userEvent.setup();

  await user.press(screen.getByRole('button', { name: 'Продолжить' }));
  await user.press(screen.getByRole('button', { name: 'Продолжить' }));
  await user.type(screen.getByPlaceholderText('2027-02-18'), '2027-02-18');
  await user.press(screen.getByRole('button', { name: '29 дней' }));
  await user.press(screen.getByRole('button', { name: 'Ежедневные отметки +' }));
  await user.press(screen.getByRole('button', { name: 'Начать' }));

  expect(store.settings()).toMatchObject({
    onboardingCompleted: true,
    ramadanStart: '2027-02-18',
    ramadanLength: 29,
    trackerReminderHour: 21,
  });
});
