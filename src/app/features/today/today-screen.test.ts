import { expect, test } from 'vitest';
import { render, screen, userEvent } from '@ng-native/testing';
import { TrackerStore } from '../../core/state.ts';
import { TodayScreen } from './today-screen.ts';

test('puts the daily reminder first and records all three quick trackers', async () => {
  const { componentRef } = await render(TodayScreen);
  const store = componentRef.injector.get(TrackerStore);
  const user = userEvent.setup();

  expect(screen.getByText('Напоминание дня')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Поделиться карточкой' })).toBeTruthy();

  await user.press(screen.getByRole('button', { name: 'Постился' }));
  await user.press(screen.getByRole('button', { name: 'Читал' }));
  await user.press(screen.getByRole('button', { name: 'Дома' }));

  expect(store.record(1)).toEqual({ fasting: true, quran: true, taraweeh: 1 });
});
