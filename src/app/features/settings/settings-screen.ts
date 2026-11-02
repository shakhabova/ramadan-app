import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { isValidIsoDate } from '../../core/dates.ts';
import { Reminders } from '../../core/reminders.ts';
import { TrackerStore, type Language } from '../../core/state.ts';
import { HourField } from './hour-field.ts';

@Component({
  selector: 'app-settings',
  imports: [HourField, Pressable, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 16, gap: 16 }">
      <text class="title">{{ i18n.t('settings.title') }}</text>

      <view class="card">
        <text class="section-title">{{ i18n.t('settings.language') }}</text>
        <view class="row">
          @for (language of i18n.languages; track language) {
            <pressable
              class="option"
              accessibilityRole="button"
              [style]="{ backgroundColor: currentLanguage() === language ? '#1f8a5b' : undefined }"
              (press)="setLanguage(language)"
            >
              <text
                class="option-text"
                [style]="{ color: currentLanguage() === language ? '#ffffff' : undefined }"
                >{{ language.toUpperCase() }}</text
              >
            </pressable>
          }
        </view>
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('settings.ramadanStart') }}</text>
        <text class="meta">{{ i18n.t('settings.ramadanStartHint') }}</text>
        <text-input
          class="input"
          [value]="startInput()"
          placeholder="2027-02-18"
          placeholderTextColor="#9aa8a0"
          autoCapitalize="none"
          [returnKeyType]="'done'"
          (changeText)="startInput.set($event)"
        />
        @if (startError()) {
          <text class="error">{{ i18n.t('settings.ramadanStartHint') }}</text>
        }
        <pressable class="primary" accessibilityRole="button" (press)="saveStart()">
          <text class="primary-text">{{ i18n.t('common.save') }}</text>
        </pressable>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">{{ i18n.t('settings.notifications') }}</text>
          <pressable
            class="toggle"
            accessibilityRole="button"
            [style]="{ backgroundColor: notificationsEnabled() ? '#b3564d' : '#1f8a5b' }"
            (press)="toggleNotifications()"
          >
            <text class="toggle-text">{{
              notificationsEnabled()
                ? i18n.t('settings.disableNotifications')
                : i18n.t('settings.enableNotifications')
            }}</text>
          </pressable>
        </view>
        @if (permissionDenied()) {
          <text class="error">{{ i18n.t('settings.permissionDenied') }}</text>
        }

        <app-hour-field
          [label]="i18n.t('settings.morningAzkar')"
          [hour]="settings().morningAzkarHour"
          [min]="0"
          [max]="23"
          (changed)="setHour('morningAzkarHour', $event)"
        />
        <app-hour-field
          [label]="i18n.t('settings.eveningAzkar')"
          [hour]="settings().eveningAzkarHour"
          (changed)="setHour('eveningAzkarHour', $event)"
        />
        <app-hour-field
          [label]="i18n.t('settings.quranReminder')"
          [hour]="settings().quranReminderHour"
          (changed)="setHour('quranReminderHour', $event)"
        />
        @if (settings().mulkEnabled) {
          <app-hour-field
            [label]="i18n.t('settings.mulkReminder')"
            [hour]="settings().mulkReminderHour"
            (changed)="setHour('mulkReminderHour', $event)"
          />
        }
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('settings.about') }}</text>
        <text class="meta">{{ i18n.t('settings.aboutText') }}</text>
      </view>
    </scroll-view>
  `,
  styles: `
    .screen {
      flex: 1;
      background-color: #f4f7f5;
    }
    .title {
      font-size: 26px;
      font-weight: 700;
      color: #101a14;
    }
    .card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 16px;
      gap: 10px;
      border-width: 1px;
      border-color: #e6ece8;
    }
    .card-head {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #101a14;
    }
    .meta {
      font-size: 13px;
      color: #6b7a71;
      line-height: 1.5;
    }
    .row {
      flex-direction: row;
      gap: 8px;
    }
    .option {
      flex: 1;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      background-color: #eef2ef;
    }
    .option-text {
      font-size: 15px;
      font-weight: 600;
      color: #24312b;
    }
    .input {
      background-color: #f1f5f2;
      border-radius: 12px;
      padding: 12px;
      font-size: 16px;
      color: #101a14;
    }
    .primary {
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      background-color: #1f8a5b;
    }
    .primary-text {
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
    }
    .toggle {
      padding: 8px 12px;
      border-radius: 10px;
    }
    .toggle-text {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
    }
    .error {
      font-size: 13px;
      color: #b3564d;
    }
    @media (prefers-color-scheme: dark) {
      .screen {
        background-color: #0e1512;
      }
      .title,
      .section-title {
        color: #eaf2ec;
      }
      .meta {
        color: #93a49a;
      }
      .card {
        background-color: #17211c;
        border-color: #22302a;
      }
      .option {
        background-color: #1e2a24;
      }
      .option-text {
        color: #d6e2da;
      }
      .input {
        background-color: #1e2a24;
        color: #eaf2ec;
      }
    }
  `,
})
export class SettingsScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);
  private readonly reminders = inject(Reminders);

  protected readonly settings = computed(() => this.store.settings());
  protected readonly currentLanguage = computed<Language>(() => this.settings().language);
  protected readonly notificationsEnabled = computed(
    () => this.settings().notificationsEnabled,
  );

  protected readonly startInput = signal('');
  protected readonly startError = signal(false);
  protected readonly permissionDenied = signal(false);

  constructor() {
    const start = this.store.settings().ramadanStart;
    if (start) this.startInput.set(start);
  }

  protected setLanguage(language: Language): void {
    this.store.setLanguage(language);
  }

  protected saveStart(): void {
    const value = this.startInput().trim();
    if (!isValidIsoDate(value)) {
      this.startError.set(true);
      return;
    }
    this.startError.set(false);
    this.store.patchSettings({ ramadanStart: value });
  }

  protected async toggleNotifications(): Promise<void> {
    if (this.notificationsEnabled()) {
      await this.reminders.disable();
      return;
    }
    const granted = await this.reminders.enable();
    this.permissionDenied.set(!granted);
  }

  protected setHour(
    field: 'morningAzkarHour' | 'eveningAzkarHour' | 'quranReminderHour' | 'mulkReminderHour',
    hour: number,
  ): void {
    this.store.patchSettings({ [field]: hour });
  }
}
