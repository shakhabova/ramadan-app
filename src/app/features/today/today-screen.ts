import { Component, computed, inject, output, signal, viewChild } from '@angular/core';
import { NativeRef, Pressable, ScrollView, Text, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { dayOfRamadan } from '../../core/dates.ts';
import { ShareCard } from '../../core/share-card.ts';
import { TrackerStore, type TaraweehStatus } from '../../core/state.ts';
import { getMessageForDay } from '../ramadan/daily-messages.ts';

@Component({
  selector: 'app-today',
  imports: [NativeRef, Pressable, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 18, gap: 14, paddingBottom: 28 }">
      <view class="card-head">
        <view class="brand">
          <text class="brand-title">☾ {{ i18n.t('app.name') }}</text>
          <text class="brand-subtitle">{{ i18n.t('app.tagline') }}</text>
        </view>
        <text class="day-pill">{{ dayLabel() }}</text>
      </view>

      <view class="reminder-shell">
        <view nativeRef class="reminder-card">
          <text class="reminder-kicker">{{ i18n.t('today.reminder') }}</text>
          <text class="crescent">☾</text>
          <text class="reminder-text">{{ message() }}</text>
          <text class="reminder-footer">{{ i18n.t('app.name') }} · {{ dayLabel() }}</text>
        </view>
        <pressable
          class="share-button"
          accessibilityRole="button"
          [accessibilityLabel]="i18n.t('today.share')"
          [disabled]="sharing()"
          (press)="share()"
        >
          <text class="share-text">↗ {{ i18n.t('today.share') }}</text>
        </pressable>
        @if (shareError()) {
          <text class="error">{{ i18n.t('today.shareError') }}</text>
        }
      </view>

      <view class="day-heading">
        <text class="title">{{
          store.currentDay()
            ? i18n.t('today.ramadanDay', { day: day() })
            : i18n.t('app.name')
        }}</text>
        <text class="meta">{{ daySubtitle() }}</text>
      </view>

      <text class="section-title quick-title">{{ i18n.t('today.quick') }}</text>

      <view class="card tracker-card">
        <view class="tracker-heading">
          <text class="tracker-icon">☀</text>
          <view class="tracker-copy">
            <text class="section-title">{{ i18n.t('today.fasting') }}</text>
            <text class="meta">{{ i18n.t('ramadan.fasting') }}</text>
          </view>
        </view>
        <view class="row">
          <pressable
            class="option"
            accessibilityRole="button"
            [style]="optionStyle(record().fasting === true)"
            (press)="setFasting(true)"
          >
            <text class="option-text" [style]="optionTextStyle(record().fasting === true)">{{
              i18n.t('ramadan.fastingYes')
            }}</text>
          </pressable>
          <pressable
            class="option"
            accessibilityRole="button"
            [style]="optionStyle(record().fasting === false)"
            (press)="setFasting(false)"
          >
            <text class="option-text" [style]="optionTextStyle(record().fasting === false)">{{
              i18n.t('ramadan.fastingNo')
            }}</text>
          </pressable>
        </view>
      </view>

      <view class="card tracker-card">
        <view class="tracker-heading">
          <text class="tracker-icon">▤</text>
          <view class="tracker-copy">
            <text class="section-title">{{ i18n.t('today.quran') }}</text>
            <text class="meta">{{ i18n.t('quran.today') }}</text>
          </view>
        </view>
        <view class="row">
          <pressable
            class="option"
            accessibilityRole="button"
            [style]="optionStyle(record().quran === true)"
            (press)="setQuran(true)"
          >
            <text class="option-text" [style]="optionTextStyle(record().quran === true)">{{
              i18n.t('ramadan.quranYes')
            }}</text>
          </pressable>
          <pressable
            class="option"
            accessibilityRole="button"
            [style]="optionStyle(record().quran === false)"
            (press)="setQuran(false)"
          >
            <text class="option-text" [style]="optionTextStyle(record().quran === false)">{{
              i18n.t('ramadan.quranNo')
            }}</text>
          </pressable>
        </view>
      </view>

      <view class="card tracker-card">
        <view class="tracker-heading">
          <text class="tracker-icon">☾</text>
          <view class="tracker-copy">
            <text class="section-title">{{ i18n.t('today.taraweeh') }}</text>
            <text class="meta">{{ i18n.t('ramadan.taraweeh') }}</text>
          </view>
        </view>
        <view class="row">
          @for (option of taraweehOptions; track option.status) {
            <pressable
              class="option"
              accessibilityRole="button"
              [style]="optionStyle(record().taraweeh === option.status)"
              (press)="setTaraweeh(option.status)"
            >
              <text class="option-text" [style]="optionTextStyle(record().taraweeh === option.status)">{{
                i18n.t(option.labelKey)
              }}</text>
            </pressable>
          }
        </view>
      </view>

      <pressable
        class="card progress-card"
        accessibilityRole="button"
        [accessibilityLabel]="i18n.t('today.viewProgress')"
        (press)="openProgress.emit()"
      >
        <view class="card-head">
          <text class="section-title">{{ i18n.t('today.progress') }}</text>
          <text class="chevron">›</text>
        </view>
        <view class="row">
          <view class="progress-stat">
            <text class="meta">{{ i18n.t('today.fastingShort') }}</text>
            <text class="progress-value">{{ stats().fasting }} / {{ settings().ramadanLength }}</text>
          </view>
          <view class="progress-stat">
            <text class="meta">{{ i18n.t('today.quranShort') }}</text>
            <text class="progress-value">{{ stats().quran }} / {{ settings().ramadanLength }}</text>
          </view>
        </view>
      </pressable>

      <pressable
        class="link-card"
        accessibilityRole="button"
        [accessibilityLabel]="i18n.t('today.feedback')"
        (press)="openFeedback.emit()"
      >
        <text class="feedback-icon">◌</text>
        <view class="link-body">
          <text class="link-title">{{ i18n.t('today.feedback') }}</text>
          <text class="link-subtitle">{{ i18n.t('today.feedbackText') }}</text>
        </view>
        <text class="chevron">›</text>
      </pressable>
    </scroll-view>
  `,
  styles: `
    .day-pill {
      color: #e3d3ae;
      background-color: #1b2923;
      border-color: #3b463a;
      border-width: 1px;
      border-radius: 14px;
      padding: 6px 10px;
      font-size: 12px;
    }
    .reminder-shell { gap: 8px; }
    .reminder-card {
      overflow: hidden;
      background-color: #182720;
      border-color: #8d7548;
      border-width: 1px;
      border-radius: 20px;
      padding: 20px;
      gap: 14px;
    }
    .reminder-kicker {
      color: #d5b576;
      font-size: 14px;
      font-weight: 600;
    }
    .crescent {
      position: absolute;
      right: 16px;
      top: 4px;
      color: #6f6246;
      font-family: serif;
      font-size: 64px;
    }
    .reminder-text {
      color: #f3ecdf;
      font-family: serif;
      font-size: 16px;
      line-height: 1.5;
      max-width: 92%;
    }
    .reminder-footer { color: #a99a78; font-size: 11px; }
    .share-button {
      align-self: flex-end;
      padding: 7px 4px;
      min-height: 36px;
    }
    .share-text { color: #d5b576; font-size: 13px; font-weight: 600; }
    .day-heading { gap: 4px; padding-top: 4px; }
    .quick-title { padding-top: 4px; }
    .tracker-card { gap: 14px; }
    .tracker-heading { flex-direction: row; align-items: center; gap: 12px; }
    .tracker-icon {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      background-color: #24332a;
      color: #d5b576;
      text-align: center;
      font-size: 20px;
      padding-top: 7px;
    }
    .tracker-copy { flex: 1; gap: 2px; }
    .progress-card { gap: 16px; }
    .progress-stat { flex: 1; gap: 4px; }
    .progress-value { color: #e3d3ae; font-size: 20px; font-family: serif; }
    .feedback-icon { color: #d5b576; font-size: 30px; }
  `,
})
export class TodayScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);
  private readonly shareCard = inject(ShareCard);
  private readonly reminderCard = viewChild(NativeRef);

  readonly openProgress = output<void>();
  readonly openFeedback = output<void>();

  protected readonly settings = computed(() => this.store.settings());
  protected readonly day = computed(() => this.store.currentDay() ?? 1);
  protected readonly record = computed(() => this.store.record(this.day()));
  protected readonly stats = computed(() => this.store.ramadanStats());
  protected readonly message = computed(() => getMessageForDay(this.day()));
  protected readonly sharing = signal(false);
  protected readonly shareError = signal(false);
  protected readonly taraweehOptions: { status: TaraweehStatus; labelKey: string }[] = [
    { status: 2, labelKey: 'ramadan.taraweehMosque' },
    { status: 1, labelKey: 'ramadan.taraweehHome' },
    { status: 0, labelKey: 'ramadan.taraweehMissed' },
  ];

  protected dayLabel(): string {
    const current = this.store.currentDay();
    return current
      ? this.i18n.t('today.dayOf', { day: current, total: this.settings().ramadanLength })
      : this.i18n.t('common.today');
  }

  protected daySubtitle(): string {
    if (this.store.currentDay()) return this.dayLabel();
    const start = this.settings().ramadanStart;
    if (!start) return this.i18n.t('ramadan.setStart');
    return dayOfRamadan(start) < 1
      ? this.i18n.t('today.notStarted')
      : this.i18n.t('today.finished');
  }

  protected setFasting(value: boolean): void {
    this.store.updateDay(this.day(), {
      fasting: this.record().fasting === value ? undefined : value,
    });
  }

  protected setQuran(value: boolean): void {
    this.store.updateDay(this.day(), { quran: this.record().quran === value ? undefined : value });
  }

  protected setTaraweeh(status: TaraweehStatus): void {
    this.store.updateDay(this.day(), {
      taraweeh: this.record().taraweeh === status ? undefined : status,
    });
  }

  protected async share(): Promise<void> {
    if (this.sharing()) return;
    this.sharing.set(true);
    this.shareError.set(false);
    try {
      const node = this.reminderCard()?.node as { tag?: number } | undefined;
      await this.shareCard.share(
        typeof node?.tag === 'number' ? node.tag : null,
        this.i18n.t('today.shareTitle'),
        this.message(),
      );
    } catch {
      this.shareError.set(true);
    } finally {
      this.sharing.set(false);
    }
  }

  protected optionStyle(active: boolean) {
    return active ? { backgroundColor: '#d5b576', borderColor: '#d5b576' } : {};
  }

  protected optionTextStyle(active: boolean) {
    return active ? { color: '#142019', fontWeight: '700' } : {};
  }
}
