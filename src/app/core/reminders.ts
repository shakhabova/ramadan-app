import { Injectable, inject } from '@angular/core';
import type { AndroidImportance } from 'expo-notifications';
import { Notifications, TriggerType } from '@ng-native/expo/notifications';
import { I18n } from './i18n';
import { TrackerStore } from './state';

const CHANNEL_ID = 'ramadan-tracker';

/**
 * Local reminders, the app's replacement for the bot's scheduled Telegram messages. One daily
 * notification per feature, at the hour the user chose, cancelled and rebuilt whenever a setting
 * changes so there is never a stale schedule behind a new one.
 */
@Injectable({ providedIn: 'root' })
export class Reminders {
  private readonly notifications = inject(Notifications);
  private readonly store = inject(TrackerStore);
  private readonly i18n = inject(I18n);

  /** Installs the foreground handler and Android channel. Safe to call more than once. */
  configure(): void {
    this.notifications.setHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // A channel is Android-only, and `setChannel` already resolves to null on iOS, so this runs
    // unconditionally rather than reaching for `Platform` (whose module pulls React Native's Flow
    // source into the test runner).
    void this.notifications.setChannel(CHANNEL_ID, {
      name: this.i18n.t('notif.channel'),
      importance: 4 as AndroidImportance,
    });
  }

  async enable(): Promise<boolean> {
    const granted = await this.notifications.permission.ensure();
    // Changing the setting is enough: the app's effect on the settings reschedules from it.
    this.store.patchSettings({ notificationsEnabled: granted });
    return granted;
  }

  async disable(): Promise<void> {
    this.store.patchSettings({ notificationsEnabled: false });
  }

  async reschedule(): Promise<void> {
    await this.notifications.cancelAll();

    const settings = this.store.settings();
    if (!settings.notificationsEnabled) return;

    await this.scheduleDaily(
      settings.morningAzkarHour,
      'notif.morningAzkar.title',
      'notif.morningAzkar.body',
    );
    await this.scheduleDaily(
      settings.eveningAzkarHour,
      'notif.eveningAzkar.title',
      'notif.eveningAzkar.body',
    );
    await this.scheduleDaily(
      settings.quranReminderHour,
      'notif.quran.title',
      'notif.quran.body',
    );
    if (settings.mulkEnabled) {
      await this.scheduleDaily(
        settings.mulkReminderHour,
        'notif.mulk.title',
        'notif.mulk.body',
      );
    }
  }

  private scheduleDaily(hour: number, titleKey: string, bodyKey: string): Promise<string | null> {
    return this.notifications.schedule({
      content: {
        title: this.i18n.t(titleKey),
        body: this.i18n.t(bodyKey),
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
