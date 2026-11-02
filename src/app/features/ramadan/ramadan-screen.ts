import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { RAMADAN_DAYS } from '../../core/dates.ts';
import { TrackerStore, type TaraweehStatus } from '../../core/state.ts';
import { getMessageForDay } from './daily-messages.ts';

@Component({
  selector: 'app-ramadan',
  imports: [Pressable, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 16, gap: 16 }">
      <text class="title">{{ i18n.t('ramadan.title') }}</text>

      @if (store.currentDay(); as today) {
        <view class="current">
          <text class="current-text">{{ i18n.t('ramadan.currentDay', { n: today }) }}</text>
        </view>
      } @else {
        <text class="hint">{{ i18n.t('ramadan.setStart') }}</text>
      }

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.selectDay') }}</text>
        <scroll-view class="days" horizontal [showsHorizontalScrollIndicator]="false">
          <view class="days-row">
            @for (day of days; track day) {
              <pressable
                class="day-chip"
                [style]="chipStyle(day)"
                accessibilityRole="button"
                [accessibilityLabel]="i18n.t('ramadan.dayTitle', { n: day })"
                [accessibilityState]="{ selected: selected() === day }"
                (press)="select(day)"
              >
                <text class="day-chip-text" [style]="chipTextStyle(day)">{{ day }}</text>
              </pressable>
            }
          </view>
        </scroll-view>
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.dayTitle', { n: selected() }) }}</text>

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
              <text
                class="option-text"
                [style]="optionTextStyle(record().taraweeh === option.status)"
                >{{ i18n.t(option.labelKey) }}</text
              >
            </pressable>
          }
        </view>
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('ramadan.statsTitle') }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.fasting') }}</text>
          <text class="stat-value">{{ stats().fasting }} {{ unit(stats().fasting) }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.notFasting') }}</text>
          <text class="stat-value">{{ stats().notFasting }} {{ unit(stats().notFasting) }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.quran') }}</text>
          <text class="stat-value">{{ stats().quran }} {{ unit(stats().quran) }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.notQuran') }}</text>
          <text class="stat-value">{{ stats().notQuran }} {{ unit(stats().notQuran) }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehTotal') }}</text>
          <text class="stat-value"
            >{{ stats().taraweehTotal }} {{ unit(stats().taraweehTotal, 'unit.night') }}</text
          >
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehMosque') }}</text>
          <text class="stat-value">{{ stats().taraweehMosque }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('ramadan.stat.taraweehHome') }}</text>
          <text class="stat-value">{{ stats().taraweehHome }}</text>
        </view>
      </view>

      <view class="card message">
        <text class="message-text">{{ message() }}</text>
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
    .hint {
      font-size: 14px;
      color: #6b7a71;
    }
    .current {
      background-color: #e5f4ec;
      border-radius: 12px;
      padding: 12px 16px;
    }
    .current-text {
      color: #1f8a5b;
      font-size: 15px;
      font-weight: 600;
    }
    .card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 16px;
      gap: 10px;
      border-width: 1px;
      border-color: #e6ece8;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #101a14;
    }
    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #6b7a71;
      margin-top: 4px;
    }
    .row {
      flex-direction: row;
      gap: 8px;
    }
    .column {
      gap: 8px;
    }
    .days {
      margin-top: 4px;
    }
    .days-row {
      flex-direction: row;
      gap: 8px;
      padding-bottom: 4px;
    }
    .day-chip {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      align-items: center;
      justify-content: center;
      background-color: #eef2ef;
      border-width: 1px;
      border-color: transparent;
    }
    .day-chip-text {
      font-size: 15px;
      color: #24312b;
    }
    .option {
      flex: 1;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      background-color: #eef2ef;
      border-width: 1px;
      border-color: transparent;
    }
    .option.wide {
      align-items: flex-start;
    }
    .option-text {
      font-size: 14px;
      color: #24312b;
    }
    .stat-row {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding-top: 2px;
      padding-bottom: 2px;
    }
    .stat-label {
      font-size: 14px;
      color: #4a5a51;
    }
    .stat-value {
      font-size: 14px;
      font-weight: 600;
      color: #101a14;
    }
    .message {
      background-color: #fdf7ec;
      border-color: #f0e2c4;
    }
    .message-text {
      font-size: 14px;
      color: #5c4a26;
      line-height: 1.5;
    }
    @media (prefers-color-scheme: dark) {
      .screen {
        background-color: #0e1512;
      }
      .title,
      .section-title,
      .stat-value {
        color: #eaf2ec;
      }
      .hint,
      .field-label,
      .stat-label {
        color: #93a49a;
      }
      .current {
        background-color: #123222;
      }
      .current-text {
        color: #4ecf92;
      }
      .card {
        background-color: #17211c;
        border-color: #22302a;
      }
      .day-chip,
      .option {
        background-color: #1e2a24;
      }
      .day-chip-text,
      .option-text {
        color: #d6e2da;
      }
      .message {
        background-color: #241f14;
        border-color: #3a3019;
      }
      .message-text {
        color: #e0cfa6;
      }
    }
  `,
})
export class RamadanScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);

  protected readonly days = Array.from({ length: RAMADAN_DAYS }, (_, i) => i + 1);
  protected readonly taraweehOptions: { status: TaraweehStatus; labelKey: string }[] = [
    { status: 2, labelKey: 'ramadan.taraweehMosque' },
    { status: 1, labelKey: 'ramadan.taraweehHome' },
    { status: 0, labelKey: 'ramadan.taraweehMissed' },
  ];

  private readonly picked = signal<number | null>(null);
  /** What the user picked, or today's day once the start date is known, or day 1. */
  protected readonly selected = computed(() => this.picked() ?? this.store.currentDay() ?? 1);
  protected readonly record = computed(() => this.store.record(this.selected()));
  protected readonly stats = computed(() => this.store.ramadanStats());
  protected readonly message = computed(() => getMessageForDay(this.selected()));

  protected select(day: number): void {
    this.picked.set(day);
  }

  protected setFasting(value: boolean): void {
    this.store.updateDay(this.selected(), { fasting: value });
  }

  protected setQuran(value: boolean): void {
    this.store.updateDay(this.selected(), { quran: value });
  }

  protected setTaraweeh(status: TaraweehStatus): void {
    this.store.updateDay(this.selected(), { taraweeh: status });
  }

  protected unit(count: number, key = 'unit.day'): string {
    return this.i18n.count(count, key);
  }

  protected chipStyle(day: number) {
    const active = this.selected() === day;
    return {
      backgroundColor: active ? '#1f8a5b' : undefined,
      borderColor: active ? '#1f8a5b' : undefined,
    };
  }

  protected chipTextStyle(day: number) {
    return { color: this.selected() === day ? '#ffffff' : undefined, fontWeight: this.selected() === day ? '700' : '400' };
  }

  protected optionStyle(active: boolean) {
    return {
      backgroundColor: active ? '#1f8a5b' : undefined,
      borderColor: active ? '#1f8a5b' : undefined,
    };
  }

  protected optionTextStyle(active: boolean) {
    return { color: active ? '#ffffff' : undefined, fontWeight: active ? '600' : '400' };
  }
}
