import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { TrackerStore, type TaraweehStatus } from '../../core/state.ts';

@Component({
  selector: 'app-ramadan',
  imports: [Pressable, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 18, gap: 16, paddingBottom: 28 }">
      <view class="brand">
        <text class="title">{{ i18n.t('ramadan.title') }}</text>
        <text class="meta">{{ i18n.t('today.dayOf', { day: store.currentDay() ?? '—', total: settings().ramadanLength }) }}</text>
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.calendar') }}</text>
        <view class="calendar">
          @for (day of days(); track day) {
            <pressable
              class="day-cell"
              [style]="dayStyle(day)"
              accessibilityRole="button"
              [accessibilityLabel]="i18n.t('ramadan.dayTitle', { n: day })"
              [accessibilityState]="{ selected: selected() === day }"
              (press)="select(day)"
            >
              <text class="day-number" [style]="dayTextStyle(day)">{{ day }}</text>
              <text class="day-dot" [style]="dotStyle(day)">●</text>
            </pressable>
          }
        </view>
        <view class="calendar-legend">
          <text class="legend-dot">●</text>
          <text class="meta">{{ i18n.t('ramadan.unmarked') }} · {{ stats().fastingUnmarked }}</text>
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">{{ i18n.t('ramadan.dayTitle', { n: selected() }) }}</text>
          <pressable accessibilityRole="button" (press)="clearDay()">
            <text class="clear-text">{{ i18n.t('ramadan.clear') }}</text>
          </pressable>
        </view>

        <text class="field-label">{{ i18n.t('ramadan.fasting') }}</text>
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

        <text class="field-label">{{ i18n.t('ramadan.quran') }}</text>
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

        <text class="field-label">{{ i18n.t('ramadan.taraweeh') }}</text>
        <view class="column">
          @for (option of taraweehOptions; track option.status) {
            <pressable
              class="option wide"
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

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.stat.fasting') }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.fasting') }}</text>
          <text class="stat-value">{{ stats().fasting }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.notFasting') }}</text>
          <text class="stat-value">{{ stats().notFasting }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.unmarked') }}</text>
          <text class="stat-value">{{ stats().fastingUnmarked }}</text>
        </view>
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.taraweeh') }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehTotal') }}</text>
          <text class="stat-value">{{ stats().taraweehTotal }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehMosque') }}</text>
          <text class="stat-value">{{ stats().taraweehMosque }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehHome') }}</text>
          <text class="stat-value">{{ stats().taraweehHome }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehMissed') }}</text>
          <text class="stat-value">{{ stats().taraweehMissed }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.unmarked') }}</text>
          <text class="stat-value">{{ stats().taraweehUnmarked }}</text>
        </view>
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.quran') }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.quran') }}</text>
          <text class="stat-value">{{ stats().quran }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.notQuran') }}</text>
          <text class="stat-value">{{ stats().notQuran }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.unmarked') }}</text>
          <text class="stat-value">{{ stats().quranUnmarked }}</text>
        </view>
      </view>
    </scroll-view>
  `,
  styles: `
    .calendar { flex-direction: row; flex-wrap: wrap; padding-top: 4px; }
    .day-cell {
      width: 14.285%;
      height: 52px;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      border-width: 1px;
      border-color: transparent;
      gap: 2px;
    }
    .day-number { color: #e2e7df; font-size: 14px; }
    .day-dot { font-size: 7px; }
    .calendar-legend { flex-direction: row; align-items: center; gap: 5px; }
    .legend-dot { color: #526158; font-size: 8px; }
    .clear-text { color: #d5b576; font-size: 12px; padding: 6px 0 6px 8px; }
    .field-label { color: #9baaa2; font-size: 13px; font-weight: 600; padding-top: 4px; }
    .column { gap: 8px; }
    .option.wide { align-items: flex-start; flex: 0; }
  `,
})
export class RamadanScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);

  protected readonly settings = computed(() => this.store.settings());
  protected readonly days = computed(() =>
    Array.from({ length: this.settings().ramadanLength }, (_, index) => index + 1),
  );
  protected readonly taraweehOptions: { status: TaraweehStatus; labelKey: string }[] = [
    { status: 2, labelKey: 'ramadan.taraweehMosque' },
    { status: 1, labelKey: 'ramadan.taraweehHome' },
    { status: 0, labelKey: 'ramadan.taraweehMissed' },
  ];

  private readonly picked = signal<number | null>(null);
  protected readonly selected = computed(() => {
    const picked = this.picked();
    return picked && picked <= this.settings().ramadanLength
      ? picked
      : (this.store.currentDay() ?? 1);
  });
  protected readonly record = computed(() => this.store.record(this.selected()));
  protected readonly stats = computed(() => this.store.ramadanStats());

  protected select(day: number): void {
    this.picked.set(day);
  }

  protected setFasting(value: boolean): void {
    this.store.updateDay(this.selected(), {
      fasting: this.record().fasting === value ? undefined : value,
    });
  }

  protected setQuran(value: boolean): void {
    this.store.updateDay(this.selected(), {
      quran: this.record().quran === value ? undefined : value,
    });
  }

  protected setTaraweeh(status: TaraweehStatus): void {
    this.store.updateDay(this.selected(), {
      taraweeh: this.record().taraweeh === status ? undefined : status,
    });
  }

  protected clearDay(): void {
    this.store.updateDay(this.selected(), { fasting: undefined, quran: undefined, taraweeh: undefined });
  }

  protected dayStyle(day: number) {
    return this.selected() === day
      ? { backgroundColor: '#d5b576', borderColor: '#d5b576' }
      : { backgroundColor: '#182720' };
  }

  protected dayTextStyle(day: number) {
    return this.selected() === day ? { color: '#142019', fontWeight: '700' } : {};
  }

  protected dotStyle(day: number) {
    const record = this.store.record(day);
    const marked =
      record.fasting !== undefined || record.quran !== undefined || record.taraweeh !== undefined;
    return { color: this.selected() === day ? '#142019' : marked ? '#d5b576' : '#526158' };
  }

  protected optionStyle(active: boolean) {
    return active ? { backgroundColor: '#d5b576', borderColor: '#d5b576' } : {};
  }

  protected optionTextStyle(active: boolean) {
    return active ? { color: '#142019', fontWeight: '700' } : {};
  }
}
