import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { localTodayIso } from '../../core/dates.ts';
import { TrackerStore } from '../../core/state.ts';

@Component({
  selector: 'app-quran',
  imports: [Pressable, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 16, gap: 16 }">
      <text class="title">{{ i18n.t('quran.title') }}</text>

      <view class="card">
        <text class="section-title">{{ i18n.t('quran.today') }}</text>
        @if (quranToday().read) {
          <text class="status ok">{{ i18n.t('quran.readDone') }}</text>
        } @else if (quranToday().read === false) {
          <text class="status off">{{ i18n.t('quran.readUndone') }}</text>
        }
        @if (quranToday().pages) {
          <text class="meta"
            >{{ quranToday().pages }} {{ i18n.count(quranToday().pages ?? 0, 'unit.page') }}</text
          >
        }
        @if (!showPages()) {
          <view class="row">
            <pressable class="option" accessibilityRole="button" (press)="markRead()">
              <text class="option-text">{{ i18n.t('quran.markRead') }}</text>
            </pressable>
            <pressable class="option" accessibilityRole="button" (press)="togglePages()">
              <text class="option-text">{{ i18n.t('quran.enterPages') }}</text>
            </pressable>
          </view>
          <pressable class="link" accessibilityRole="button" (press)="markUnread()">
            <text class="link-text">{{ i18n.t('quran.readUndone') }}</text>
          </pressable>
        } @else {
          <text class="field-label">{{ i18n.t('quran.pagesLabel') }}</text>
          <text-input
            class="input"
            [value]="pagesInput()"
            placeholder="30"
            placeholderTextColor="#9aa8a0"
            keyboardType="number-pad"
            [returnKeyType]="'done'"
            (changeText)="pagesInput.set($event)"
          />
          <view class="row">
            <pressable class="primary" accessibilityRole="button" (press)="savePages()">
              <text class="primary-text">{{ i18n.t('quran.save') }}</text>
            </pressable>
            <pressable class="ghost" accessibilityRole="button" (press)="togglePages()">
              <text class="ghost-text">{{ i18n.t('common.cancel') }}</text>
            </pressable>
          </view>
        }
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('quran.statsTitle') }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('quran.stat.daysRead') }}</text>
          <text class="stat-value"
            >{{ quranWeek().daysRead }} {{ i18n.count(quranWeek().daysRead, 'unit.day') }}</text
          >
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('quran.stat.pagesRead') }}</text>
          <text class="stat-value"
            >{{ quranWeek().pages }} {{ i18n.count(quranWeek().pages, 'unit.page') }}</text
          >
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">{{ i18n.t('mulk.title') }}</text>
          <pressable class="toggle" accessibilityRole="button" (press)="toggleMulk()">
            <text class="toggle-text">{{
              mulkEnabled() ? i18n.t('mulk.toggleOff') : i18n.t('mulk.toggleOn')
            }}</text>
          </pressable>
        </view>
        <text class="meta">{{
          mulkEnabled() ? i18n.t('mulk.enabledHint') : i18n.t('mulk.disabledHint')
        }}</text>

        @if (mulkToday()) {
          <text class="status ok">{{ i18n.t('mulk.readDone') }}</text>
        } @else {
          <text class="status off">{{ i18n.t('mulk.readUndone') }}</text>
        }
        <view class="row">
          <pressable class="option" accessibilityRole="button" (press)="markMulk(true)">
            <text class="option-text">{{ i18n.t('mulk.markRead') }}</text>
          </pressable>
          <pressable class="option" accessibilityRole="button" (press)="markMulk(false)">
            <text class="option-text">{{ i18n.t('mulk.markUnread') }}</text>
          </pressable>
        </view>

        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('mulk.statsTitle') }}</text>
          <text class="stat-value"
            >{{ mulkWeek().daysRead }} {{ i18n.count(mulkWeek().daysRead, 'unit.day') }}</text
          >
        </view>

        <text class="virtue">{{ i18n.t('mulk.virtue') }}</text>
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
    .status {
      font-size: 15px;
      font-weight: 600;
    }
    .status.ok {
      color: #1f8a5b;
    }
    .status.off {
      color: #b3564d;
    }
    .meta {
      font-size: 13px;
      color: #6b7a71;
    }
    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #6b7a71;
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
      font-size: 14px;
      color: #24312b;
    }
    .link {
      padding-top: 2px;
    }
    .link-text {
      font-size: 13px;
      color: #b3564d;
    }
    .input {
      background-color: #f1f5f2;
      border-radius: 12px;
      padding: 12px;
      font-size: 16px;
      color: #101a14;
    }
    .primary {
      flex: 1;
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
    .ghost {
      flex: 1;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      background-color: #eef2ef;
    }
    .ghost-text {
      color: #24312b;
      font-size: 15px;
    }
    .toggle {
      padding: 8px 12px;
      border-radius: 10px;
      background-color: #eef2ef;
    }
    .toggle-text {
      font-size: 13px;
      color: #24312b;
    }
    .stat-row {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
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
    .virtue {
      font-size: 13px;
      color: #5c4a26;
      line-height: 1.5;
      background-color: #fdf7ec;
      border-radius: 12px;
      padding: 12px;
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
      .meta,
      .field-label,
      .stat-label {
        color: #93a49a;
      }
      .card {
        background-color: #17211c;
        border-color: #22302a;
      }
      .option,
      .ghost,
      .toggle {
        background-color: #1e2a24;
      }
      .option-text,
      .ghost-text,
      .toggle-text {
        color: #d6e2da;
      }
      .input {
        background-color: #1e2a24;
        color: #eaf2ec;
      }
      .virtue {
        background-color: #241f14;
        color: #e0cfa6;
      }
    }
  `,
})
export class QuranScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);

  protected readonly today = localTodayIso();
  protected readonly pagesInput = signal('');
  protected readonly showPages = signal(false);

  protected readonly quranToday = computed(() => this.store.state().quran[this.today] ?? {});
  protected readonly quranWeek = computed(() => this.store.quranWeek());
  protected readonly mulkEnabled = computed(() => this.store.settings().mulkEnabled);
  protected readonly mulkToday = computed(() => this.store.state().mulk[this.today] === true);
  protected readonly mulkWeek = computed(() => this.store.mulkWeek());

  protected markRead(): void {
    this.store.updateQuran(this.today, { read: true });
  }

  protected markUnread(): void {
    this.store.updateQuran(this.today, { read: false, pages: undefined });
  }

  protected togglePages(): void {
    this.showPages.update((shown) => !shown);
  }

  protected savePages(): void {
    const pages = parseInt(this.pagesInput().trim(), 10);
    if (!Number.isNaN(pages) && pages > 0) {
      this.store.updateQuran(this.today, { read: true, pages });
    }
    this.pagesInput.set('');
    this.showPages.set(false);
  }

  protected markMulk(read: boolean): void {
    this.store.updateMulk(this.today, read);
  }

  protected toggleMulk(): void {
    this.store.patchSettings({ mulkEnabled: !this.mulkEnabled() });
  }
}
