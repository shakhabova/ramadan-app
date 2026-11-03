import { expect, test } from 'vitest';
import { injectService } from '@ng-native/testing';
import { Notifications } from '@ng-native/expo/notifications';
import { Reminders } from './reminders.ts';
import { TrackerStore } from './state.ts';

interface ScheduledRequest {
  trigger?: { hour?: number };
  content?: { data?: Record<string, unknown> };
}

function fakeNotifications() {
  const scheduled: ScheduledRequest[] = [];
  const active: ScheduledRequest[] = [];
  const listener = { remove(): void {} };
  const native = {
    addNotificationReceivedListener: () => listener,
    addNotificationResponseReceivedListener: () => listener,
    addNotificationsDroppedListener: () => listener,
    addPushTokenListener: () => listener,
    getLastNotificationResponseAsync: async () => null,
    getPermissionsAsync: async () => ({ status: 'granted', granted: true, canAskAgain: true }),
    requestPermissionsAsync: async () => ({ status: 'granted', granted: true, canAskAgain: true }),
    scheduleNotificationAsync: async (request: ScheduledRequest) => {
      scheduled.push(request);
      active.push(request);
      return 'scheduled';
    },
    cancelAllScheduledNotificationsAsync: async () => {
      active.splice(0);
    },
    setNotificationChannelAsync: async () => null,
  };
  return { native, scheduled, active };
}

function remindersWith(native: ReturnType<typeof fakeNotifications>['native']): Reminders {
  return injectService(Reminders, {
    providers: [{ provide: Notifications.SOURCE, useValue: native as never }],
  });
}

test('schedules daily check-in, azkar and Quran reminders with source metadata', async () => {
  const { native, scheduled } = fakeNotifications();
  const reminders = remindersWith(native);
  const store = injectService(TrackerStore);

  store.patchSettings({
    notificationsEnabled: true,
    morningAzkarHour: 5,
    eveningAzkarHour: 17,
    quranReminderHour: 21,
    taraweehReminderEnabled: false,
    mulkEnabled: false,
  });
  await reminders.reschedule();

  expect(scheduled.map((request) => request.trigger?.hour)).toEqual([20, 5, 17, 21]);
  expect(scheduled[0].content?.data).toMatchObject({
    category: 'tracker',
    source: 'ramadan-daily-reflection',
  });
});

test('adds optional taraweeh and Al-Mulk reminders', async () => {
  const { native, scheduled } = fakeNotifications();
  const reminders = remindersWith(native);
  const store = injectService(TrackerStore);

  store.patchSettings({
    notificationsEnabled: true,
    taraweehReminderEnabled: true,
    taraweehReminderHour: 22,
    mulkEnabled: true,
    mulkReminderHour: 23,
  });
  await reminders.reschedule();

  expect(scheduled.map((request) => request.trigger?.hour)).toContain(22);
  expect(scheduled.map((request) => request.trigger?.hour)).toContain(23);
});

test('serialises rebuilds so concurrent settings changes leave no duplicates', async () => {
  const { native, active } = fakeNotifications();
  const reminders = remindersWith(native);
  injectService(TrackerStore).patchSettings({ notificationsEnabled: true });

  await Promise.all([reminders.reschedule(), reminders.reschedule(), reminders.reschedule()]);

  expect(active.map((request) => request.trigger?.hour)).toEqual([20, 5, 17, 21]);
});

test('schedules nothing while reminders are off', async () => {
  const { native, scheduled } = fakeNotifications();
  const reminders = remindersWith(native);
  injectService(TrackerStore).patchSettings({ notificationsEnabled: false });

  await reminders.reschedule();

  expect(scheduled).toHaveLength(0);
});
