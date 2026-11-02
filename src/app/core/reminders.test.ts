import { expect, test } from 'vitest';
import { injectService, render, screen, userEvent } from '@ng-native/testing';
import { Notifications } from '@ng-native/expo/notifications';
import { Reminders } from './reminders.ts';
import { TrackerStore } from './state.ts';

function fakeNotifications() {
  const scheduled: { trigger?: { hour?: number } }[] = [];
  const listener = { remove(): void {} };
  const native = {
    addNotificationReceivedListener: () => listener,
    addNotificationResponseReceivedListener: () => listener,
    addNotificationsDroppedListener: () => listener,
    addPushTokenListener: () => listener,
    getLastNotificationResponseAsync: async () => null,
    getPermissionsAsync: async () => ({ status: 'granted', granted: true, canAskAgain: true }),
    requestPermissionsAsync: async () => ({ status: 'granted', granted: true, canAskAgain: true }),
    scheduleNotificationAsync: async (request: { trigger?: { hour?: number } }) => {
      scheduled.push(request);
      return 'scheduled';
    },
    cancelAllScheduledNotificationsAsync: async () => {},
    setNotificationChannelAsync: async () => null,
  };
  return { native, scheduled };
}

test('schedules one daily reminder per enabled feature', async () => {
  const { native, scheduled } = fakeNotifications();
  const reminders = injectService(Reminders, {
    providers: [{ provide: Notifications.SOURCE, useValue: native as never }],
  });
  const store = injectService(TrackerStore);

  store.patchSettings({
    notificationsEnabled: true,
    morningAzkarHour: 5,
    eveningAzkarHour: 17,
    quranReminderHour: 21,
    mulkEnabled: false,
  });
  await reminders.reschedule();

  expect(scheduled.map((request) => request.trigger?.hour)).toEqual([5, 17, 21]);
});

test('adds the Al-Mulk reminder when the tracker is on', async () => {
  const { native, scheduled } = fakeNotifications();
  const reminders = injectService(Reminders, {
    providers: [{ provide: Notifications.SOURCE, useValue: native as never }],
  });
  const store = injectService(TrackerStore);

  store.patchSettings({
    notificationsEnabled: true,
    mulkEnabled: true,
    mulkReminderHour: 22,
  });
  await reminders.reschedule();

  expect(scheduled.map((request) => request.trigger?.hour)).toContain(22);
});

test('schedules nothing while reminders are off', async () => {
  const { native, scheduled } = fakeNotifications();
  const reminders = injectService(Reminders, {
    providers: [{ provide: Notifications.SOURCE, useValue: native as never }],
  });
  injectService(TrackerStore).patchSettings({ notificationsEnabled: false });

  await reminders.reschedule();

  expect(scheduled).toHaveLength(0);
});
