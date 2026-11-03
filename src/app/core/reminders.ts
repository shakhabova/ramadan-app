import { Injectable, inject } from '@angular/core';
import type { AndroidImportance } from 'expo-notifications';
import { Notifications, TriggerType } from '@ng-native/expo/notifications';
import { I18n } from './i18n';
import { TrackerStore } from './state';

const CHANNEL_ID = 'ramadan-tracker';

type ReminderCategory = 'tracker' | 'quran' | 'taraweeh' | 'azkar' | 'mulk';

/** Repeating local notifications. Native repeats survive a reboot; rebuilds are serialised. */
@Injectable({ providedIn: 'root' })
export class Reminders {
  private readonly notifications = inject(Notifications);
  private readonly store = inject(TrackerStore);
  private readonly i18n = inject(I18n);
  private queue: Promise<void> = Promise.resolve();

  configure(): void {
    this.notifications.setHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    void this.notifications.setChannel(CHANNEL_ID, {
      name: this.i18n.t('notif.channel'),
      importance: 4 as AndroidImportance,
    });
  }

  async enable(): Promise<boolean> {
    const granted = await this.notifications.permission.ensure();
    this.store.patchSettings({ notificationsEnabled: granted });
    return granted;
  }

  async disable(): Promise<void> {
    this.store.patchSettings({ notificationsEnabled: false });
  }

  /** A settings burst cannot leave overlapping cancel/schedule operations behind. */
  reschedule(): Promise<void> {
    const run = this.queue.then(() => this.rebuild(), () => this.rebuild());
    this.queue = run;
    return run;
  }

  private async rebuild(): Promise<void> {
    await this.notifications.cancelAll();
    const settings = this.store.settings();
    if (!settings.notificationsEnabled) return;

    const day = this.store.currentDay();
    if (settings.trackerReminderEnabled) {
      await this.scheduleDaily(
        settings.trackerReminderHour,
        'notif.tracker.title',
        'notif.tracker.body',
        'tracker',
        'ramadan-daily-reflection',
        day,
      );
    }
    if (settings.azkarRemindersEnabled) {
      await this.scheduleDaily(
        settings.morningAzkarHour,
        'notif.morningAzkar.title',
        'notif.morningAzkar.body',
        'azkar',
        'morning-azkar',
        day,
      );
      await this.scheduleDaily(
        settings.eveningAzkarHour,
        'notif.eveningAzkar.title',
        'notif.eveningAzkar.body',
        'azkar',
        'evening-azkar',
        day,
      );
    }
    if (settings.quranReminderEnabled) {
      await this.scheduleDaily(
        settings.quranReminderHour,
        'notif.quran.title',
        'notif.quran.body',
        'quran',
        'quran-tracker',
        day,
      );
    }
    if (settings.taraweehReminderEnabled) {
      await this.scheduleDaily(
        settings.taraweehReminderHour,
        'notif.taraweeh.title',
        'notif.taraweeh.body',
        'taraweeh',
        'taraweeh-tracker',
        day,
      );
    }
    if (settings.mulkEnabled) {
      await this.scheduleDaily(
        settings.mulkReminderHour,
        'notif.mulk.title',
        'notif.mulk.body',
        'mulk',
        'surah-al-mulk',
        day,
      );
    }
  }

  private scheduleDaily(
    hour: number,
    titleKey: string,
    bodyKey: string,
    category: ReminderCategory,
    source: string,
    day: number | null,
  ): Promise<string | null> {
    return this.notifications.schedule({
      content: {
        title: this.i18n.t(titleKey),
        body: this.i18n.t(bodyKey),
        data: { category, source, day },
      },
      trigger: {
        type: TriggerType.DAILY,
        hour,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  }
}
