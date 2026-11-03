import { Component, computed, inject, output, signal } from '@angular/core';
import { Pressable, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { isValidIsoDate } from '../../core/dates.ts';
import { Reminders } from '../../core/reminders.ts';
import { TrackerStore, type AppSettings, type Language, type RamadanLength } from '../../core/state.ts';
import { HourField } from './hour-field.ts';

type ReminderToggle =
  | 'azkarRemindersEnabled'
  | 'trackerReminderEnabled'
  | 'quranReminderEnabled'
  | 'taraweehReminderEnabled';
type ReminderHour =
  | 'morningAzkarHour'
  | 'eveningAzkarHour'
  | 'trackerReminderHour'
  | 'quranReminderHour'
  | 'taraweehReminderHour'
  | 'mulkReminderHour';

@Component({
  selector: 'app-settings',
  imports: [HourField, Pressable, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 18, gap: 16, paddingBottom: 28 }">
      <text class="title">{{ i18n.t('settings.title') }}</text>

      <view class="card">
        <text class="section-title">{{ i18n.t('settings.language') }}</text>
        <view class="row">
          @for (language of i18n.languages; track language) {
            <pressable
              class="option"
              accessibilityRole="button"
              [style]="optionStyle(currentLanguage() === language)"
              (press)="setLanguage(language)"
            >
              <text class="option-text" [style]="optionTextStyle(currentLanguage() === language)">{{
                language.toUpperCase()
              }}</text>
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
          placeholderTextColor="#75847b"
          autoCapitalize="none"
          [returnKeyType]="'done'"
          (changeText)="startInput.set($event)"
        />
        @if (startError()) {
          <text class="error">{{ i18n.t('settings.ramadanStartHint') }}</text>
        }
        <text class="section-title">{{ i18n.t('settings.ramadanLength') }}</text>
        <view class="row">
          @for (length of lengths; track length) {
            <pressable
              class="option"
              accessibilityRole="button"
              [style]="optionStyle(settings().ramadanLength === length)"
              (press)="setLength(length)"
            >
              <text class="option-text" [style]="optionTextStyle(settings().ramadanLength === length)">{{
                i18n.t('settings.days', { n: length })
              }}</text>
            </pressable>
          }
        </view>
        <pressable class="primary" accessibilityRole="button" (press)="saveStart()">
          <text class="primary-text">{{ i18n.t('common.save') }}</text>
        </pressable>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">{{ i18n.t('settings.notifications') }}</text>
          <pressable
            class="toggle"
            [style]="toggleStyle(settings().notificationsEnabled)"
            accessibilityRole="button"
            (press)="toggleNotifications()"
          >
            <text class="toggle-text" [style]="toggleTextStyle(settings().notificationsEnabled)">{{
              settings().notificationsEnabled ? i18n.t('settings.enabled') : i18n.t('settings.disabled')
            }}</text>
          </pressable>
        </view>
        @if (permissionDenied()) {
          <text class="error">{{ i18n.t('settings.permissionDenied') }}</text>
        }

        <view class="divider"></view>
        <view class="card-head">
          <text class="setting-label">{{ i18n.t('settings.trackerReminder') }}</text>
          <pressable
            class="toggle"
            [style]="toggleStyle(settings().trackerReminderEnabled)"
            accessibilityRole="button"
            [accessibilityLabel]="i18n.t('settings.trackerReminder')"
            (press)="toggleReminder('trackerReminderEnabled')"
          >
            <text class="toggle-text" [style]="toggleTextStyle(settings().trackerReminderEnabled)">{{
              settings().trackerReminderEnabled ? i18n.t('settings.enabled') : i18n.t('settings.disabled')
            }}</text>
          </pressable>
        </view>
        @if (settings().trackerReminderEnabled) {
          <app-hour-field
            [label]="i18n.t('settings.at', { hour: settings().trackerReminderHour })"
            [hour]="settings().trackerReminderHour"
            (changed)="setHour('trackerReminderHour', $event)"
          />
        }

        <view class="divider"></view>
        <view class="card-head">
          <text class="setting-label">{{ i18n.t('settings.azkarReminders') }}</text>
          <pressable
            class="toggle"
            [style]="toggleStyle(settings().azkarRemindersEnabled)"
            accessibilityRole="button"
            [accessibilityLabel]="i18n.t('settings.azkarReminders')"
            (press)="toggleReminder('azkarRemindersEnabled')"
          >
            <text class="toggle-text" [style]="toggleTextStyle(settings().azkarRemindersEnabled)">{{
              settings().azkarRemindersEnabled ? i18n.t('settings.enabled') : i18n.t('settings.disabled')
            }}</text>
          </pressable>
        </view>
        @if (settings().azkarRemindersEnabled) {
          <app-hour-field
            [label]="i18n.t('settings.morningAzkar')"
            [hour]="settings().morningAzkarHour"
            (changed)="setHour('morningAzkarHour', $event)"
          />
          <app-hour-field
            [label]="i18n.t('settings.eveningAzkar')"
            [hour]="settings().eveningAzkarHour"
            (changed)="setHour('eveningAzkarHour', $event)"
          />
        }

        <view class="divider"></view>
        <view class="card-head">
          <text class="setting-label">{{ i18n.t('settings.quranReminder') }}</text>
          <pressable
            class="toggle"
            [style]="toggleStyle(settings().quranReminderEnabled)"
            accessibilityRole="button"
            [accessibilityLabel]="i18n.t('settings.quranReminder')"
            (press)="toggleReminder('quranReminderEnabled')"
          >
            <text class="toggle-text" [style]="toggleTextStyle(settings().quranReminderEnabled)">{{
              settings().quranReminderEnabled ? i18n.t('settings.enabled') : i18n.t('settings.disabled')
            }}</text>
          </pressable>
        </view>
        @if (settings().quranReminderEnabled) {
          <app-hour-field
            [label]="i18n.t('settings.quranReminder')"
            [hour]="settings().quranReminderHour"
            (changed)="setHour('quranReminderHour', $event)"
          />
        }

        <view class="divider"></view>
        <view class="card-head">
          <text class="setting-label">{{ i18n.t('settings.taraweehReminder') }}</text>
          <pressable
            class="toggle"
            [style]="toggleStyle(settings().taraweehReminderEnabled)"
            accessibilityRole="button"
            [accessibilityLabel]="i18n.t('settings.taraweehReminder')"
            (press)="toggleReminder('taraweehReminderEnabled')"
          >
            <text class="toggle-text" [style]="toggleTextStyle(settings().taraweehReminderEnabled)">{{
              settings().taraweehReminderEnabled ? i18n.t('settings.enabled') : i18n.t('settings.disabled')
            }}</text>
          </pressable>
        </view>
        @if (settings().taraweehReminderEnabled) {
          <app-hour-field
            [label]="i18n.t('settings.taraweehReminder')"
            [hour]="settings().taraweehReminderHour"
            (changed)="setHour('taraweehReminderHour', $event)"
          />
        }

        @if (settings().mulkEnabled) {
          <view class="divider"></view>
          <app-hour-field
            [label]="i18n.t('settings.mulkReminder')"
            [hour]="settings().mulkReminderHour"
            (changed)="setHour('mulkReminderHour', $event)"
          />
        }
      </view>

      <pressable class="link-card" accessibilityRole="button" (press)="openFeedback.emit()">
        <text class="feedback-icon">◌</text>
        <view class="link-body">
          <text class="link-title">{{ i18n.t('settings.feedback') }}</text>
          <text class="link-subtitle">{{ i18n.t('settings.feedbackText') }}</text>
        </view>
        <text class="chevron">›</text>
      </pressable>

      <view class="card">
        <text class="section-title">{{ i18n.t('settings.about') }}</text>
        <text class="meta">{{ i18n.t('settings.aboutText') }}</text>
      </view>
    </scroll-view>
  `,
  styles: `
    .setting-label { color: #f3ecdf; font-size: 14px; font-weight: 600; flex: 1; padding-right: 8px; }
    .toggle { min-width: 64px; min-height: 38px; align-items: center; justify-content: center; padding: 8px 10px; border-radius: 11px; border-width: 1px; }
    .toggle-text { font-size: 12px; font-weight: 700; }
    .feedback-icon { color: #d5b576; font-size: 30px; }
  `,
})
export class SettingsScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);
  private readonly reminders = inject(Reminders);
  readonly openFeedback = output<void>();

  protected readonly settings = computed(() => this.store.settings());
  protected readonly currentLanguage = computed<Language>(() => this.settings().language);
  protected readonly startInput = signal('');
  protected readonly startError = signal(false);
  protected readonly permissionDenied = signal(false);
  protected readonly lengths: readonly RamadanLength[] = [29, 30];

  constructor() {
    const start = this.store.settings().ramadanStart;
    if (start) this.startInput.set(start);
  }

  protected setLanguage(language: Language): void {
    this.store.setLanguage(language);
  }

  protected setLength(length: RamadanLength): void {
    this.store.patchSettings({ ramadanLength: length });
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
    if (this.settings().notificationsEnabled) {
      await this.reminders.disable();
      return;
    }
    const granted = await this.reminders.enable();
    this.permissionDenied.set(!granted);
  }

  protected toggleReminder(field: ReminderToggle): void {
    this.store.patchSettings({ [field]: !this.settings()[field] });
  }

  protected setHour(field: ReminderHour, hour: number): void {
    this.store.patchSettings({ [field]: hour } as Partial<AppSettings>);
  }

  protected optionStyle(active: boolean) {
    return active ? { backgroundColor: '#d5b576', borderColor: '#d5b576' } : {};
  }

  protected optionTextStyle(active: boolean) {
    return active ? { color: '#142019', fontWeight: '700' } : {};
  }

  protected toggleStyle(active: boolean) {
    return active
      ? { backgroundColor: '#d5b576', borderColor: '#d5b576' }
      : { backgroundColor: '#1a2a25', borderColor: '#314038' };
  }

  protected toggleTextStyle(active: boolean) {
    return { color: active ? '#142019' : '#b5beb6' };
  }
}
