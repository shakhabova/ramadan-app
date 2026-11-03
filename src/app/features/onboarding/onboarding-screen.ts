import { Component, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { isValidIsoDate } from '../../core/dates.ts';
import { I18n } from '../../core/i18n.ts';
import { Reminders } from '../../core/reminders.ts';
import { TrackerStore, type Language, type RamadanLength } from '../../core/state.ts';
import { HourField } from '../settings/hour-field.ts';

@Component({
  selector: 'app-onboarding',
  imports: [HourField, Pressable, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 24, gap: 22, paddingBottom: 32 }">
      <view class="onboarding-brand">
        <text class="moon">☾</text>
        <text class="brand-title">{{ i18n.t('app.name') }}</text>
        <text class="brand-subtitle">{{ i18n.t('app.tagline') }}</text>
      </view>

      @switch (step()) {
        @case (0) {
          <view class="hero">
            <text class="title">{{ i18n.t('onboarding.welcome') }}</text>
            <text class="hero-text">{{ i18n.t('onboarding.intro') }}</text>
          </view>
          <pressable class="primary" accessibilityRole="button" (press)="next()">
            <text class="primary-text">{{ i18n.t('onboarding.next') }}</text>
          </pressable>
        }
        @case (1) {
          <view class="hero">
            <text class="title">{{ i18n.t('onboarding.trackersTitle') }}</text>
          </view>
          <view class="feature-list">
            @for (feature of features; track feature.title) {
              <view class="feature">
                <text class="feature-mark">✦</text>
                <view class="feature-copy">
                  <text class="section-title">{{ i18n.t(feature.title) }}</text>
                  <text class="meta">{{ i18n.t(feature.text) }}</text>
                </view>
              </view>
            }
          </view>
          <pressable class="primary" accessibilityRole="button" (press)="next()">
            <text class="primary-text">{{ i18n.t('onboarding.next') }}</text>
          </pressable>
        }
        @case (2) {
          <view class="hero">
            <text class="title">{{ i18n.t('onboarding.setupTitle') }}</text>
            <text class="meta">{{ i18n.t('onboarding.setupText') }}</text>
          </view>

          <view class="setup-group">
            <text class="section-title">{{ i18n.t('settings.language') }}</text>
            <view class="row">
              @for (language of i18n.languages; track language) {
                <pressable
                  class="option"
                  accessibilityRole="button"
                  [style]="optionStyle(i18n.language() === language)"
                  (press)="setLanguage(language)"
                >
                  <text class="option-text" [style]="optionTextStyle(i18n.language() === language)">{{
                    language.toUpperCase()
                  }}</text>
                </pressable>
              }
            </view>
          </view>

          <view class="setup-group">
            <text class="section-title">{{ i18n.t('settings.ramadanStart') }}</text>
            <text-input
              class="input"
              [value]="startInput()"
              placeholder="2027-02-18"
              placeholderTextColor="#75847b"
              autoCapitalize="none"
              (changeText)="startInput.set($event)"
            />
            <text class="meta">{{ i18n.t('settings.ramadanStartHint') }}</text>
            @if (startError()) {
              <text class="error">{{ i18n.t('settings.ramadanStartHint') }}</text>
            }
          </view>

          <view class="setup-group">
            <text class="section-title">{{ i18n.t('settings.ramadanLength') }}</text>
            <view class="row">
              @for (length of lengths; track length) {
                <pressable
                  class="option"
                  accessibilityRole="button"
                  [style]="optionStyle(settingsLength() === length)"
                  (press)="setLength(length)"
                >
                  <text class="option-text" [style]="optionTextStyle(settingsLength() === length)">{{
                    i18n.t('settings.days', { n: length })
                  }}</text>
                </pressable>
              }
            </view>
          </view>

          <app-hour-field
            [label]="i18n.t('settings.trackerReminder')"
            [hour]="trackerHour()"
            (changed)="trackerHour.set($event)"
          />

          <pressable
            class="notification-choice"
            accessibilityRole="button"
            [accessibilityState]="{ checked: notifications() }"
            (press)="notifications.set(!notifications())"
          >
            <text class="meta notification-copy">{{ i18n.t('onboarding.notifications') }}</text>
            <text class="choice-check">{{ notifications() ? '✓' : '○' }}</text>
          </pressable>

          <pressable class="primary" accessibilityRole="button" (press)="finish()">
            <text class="primary-text">{{ i18n.t('onboarding.start') }}</text>
          </pressable>
        }
      }

      <view class="steps" accessibilityRole="progressbar" [accessibilityValue]="{ min: 1, max: 3, now: step() + 1 }">
        @for (item of [0, 1, 2]; track item) {
          <view class="step-dot" [style]="{ backgroundColor: step() === item ? '#d5b576' : '#354239' }"></view>
        }
      </view>
    </scroll-view>
  `,
  styles: `
    .onboarding-brand { align-items: center; gap: 3px; padding-bottom: 8px; }
    .moon { color: #d5b576; font-family: serif; font-size: 70px; }
    .hero { gap: 12px; }
    .hero-text { color: #b5beb6; font-size: 16px; line-height: 1.55; }
    .feature-list { gap: 20px; }
    .feature { flex-direction: row; gap: 14px; align-items: flex-start; }
    .feature-mark { color: #d5b576; font-size: 20px; padding-top: 1px; }
    .feature-copy { flex: 1; gap: 5px; }
    .setup-group { gap: 10px; }
    .notification-choice {
      min-height: 48px;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      background-color: #12201c;
      border-radius: 12px;
      padding: 12px;
    }
    .notification-copy { flex: 1; }
    .choice-check { color: #d5b576; font-size: 22px; }
    .steps { flex-direction: row; justify-content: center; gap: 7px; padding: 6px; }
    .step-dot { width: 7px; height: 7px; border-radius: 4px; }
  `,
})
export class OnboardingScreen {
  protected readonly i18n = inject(I18n);
  private readonly store = inject(TrackerStore);
  private readonly reminders = inject(Reminders);

  protected readonly step = signal(0);
  protected readonly startInput = signal(this.store.settings().ramadanStart ?? '');
  protected readonly startError = signal(false);
  protected readonly settingsLength = signal<RamadanLength>(this.store.settings().ramadanLength);
  protected readonly trackerHour = signal(this.store.settings().trackerReminderHour);
  protected readonly notifications = signal(false);
  protected readonly lengths: readonly RamadanLength[] = [29, 30];
  protected readonly features = [
    { title: 'onboarding.fasting', text: 'onboarding.fastingText' },
    { title: 'onboarding.quran', text: 'onboarding.quranText' },
    { title: 'onboarding.reminders', text: 'onboarding.remindersText' },
  ];

  protected next(): void {
    this.step.update((value) => Math.min(2, value + 1));
  }

  protected setLanguage(language: Language): void {
    this.store.setLanguage(language);
  }

  protected setLength(length: RamadanLength): void {
    this.settingsLength.set(length);
  }

  protected optionStyle(active: boolean) {
    return active ? { backgroundColor: '#d5b576', borderColor: '#d5b576' } : {};
  }

  protected optionTextStyle(active: boolean) {
    return active ? { color: '#142019', fontWeight: '700' } : {};
  }

  protected async finish(): Promise<void> {
    const start = this.startInput().trim();
    if (start && !isValidIsoDate(start)) {
      this.startError.set(true);
      return;
    }
    this.startError.set(false);
    this.store.patchSettings({
      onboardingCompleted: true,
      ramadanStart: start || null,
      ramadanLength: this.settingsLength(),
      trackerReminderHour: this.trackerHour(),
    });
    if (this.notifications()) await this.reminders.enable();
  }
}
