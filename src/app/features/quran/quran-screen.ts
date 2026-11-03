import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { localTodayIso } from '../../core/dates.ts';
import { TrackerStore } from '../../core/state.ts';

@Component({
  selector: 'app-quran',
  imports: [Pressable, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 18, gap: 16, paddingBottom: 28 }">
      <view class="brand">
        <text class="title">{{ i18n.t('quran.title') }}</text>
        <text class="meta">{{ i18n.t('quran.today') }}</text>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">{{ i18n.t('quran.today') }}</text>
          @if (quranToday().read !== undefined) {
            <pressable accessibilityRole="button" (press)="clearMark()">
              <text class="clear-text">{{ i18n.t('quran.clear') }}</text>
            </pressable>
          }
        </view>
        @if (quranToday().read === true) {
          <text class="status ok">✓ {{ i18n.t('quran.readDone') }}</text>
        } @else if (quranToday().read === false) {
          <text class="status off">{{ i18n.t('quran.readUndone') }}</text>
        }
        @if (quranToday().pages) {
          <text class="amount">{{ quranToday().pages }} {{ i18n.count(quranToday().pages ?? 0, 'unit.page') }}</text>
        } @else if (quranToday().juz) {
          <text class="amount">{{ quranToday().juz }} {{ i18n.count(quranToday().juz ?? 0, 'unit.juz') }}</text>
        }

        <view class="row">
          <pressable
            class="option"
            accessibilityRole="button"
            [style]="optionStyle(quranToday().read === true)"
            (press)="markRead()"
          >
            <text class="option-text" [style]="optionTextStyle(quranToday().read === true)">{{
              i18n.t('quran.markRead')
            }}</text>
          </pressable>
          <pressable
            class="option"
            accessibilityRole="button"
            [style]="optionStyle(quranToday().read === false)"
            (press)="markUnread()"
          >
            <text class="option-text" [style]="optionTextStyle(quranToday().read === false)">{{
              i18n.t('quran.markUnread')
            }}</text>
          </pressable>
        </view>

        @if (!showAmount()) {
          <pressable class="secondary" accessibilityRole="button" (press)="toggleAmount()">
            <text class="secondary-text">{{ i18n.t('quran.enterPages') }}</text>
          </pressable>
        } @else {
          <view class="divider"></view>
          <text class="meta">{{ i18n.t('quran.pagesLabel') }}</text>
          <view class="row">
            @for (item of amountUnits; track item) {
              <pressable
                class="option"
                accessibilityRole="button"
                [style]="optionStyle(amountUnit() === item)"
                (press)="amountUnit.set(item)"
              >
                <text class="option-text" [style]="optionTextStyle(amountUnit() === item)">{{
                  i18n.t(item === 'pages' ? 'quran.pages' : 'quran.juz')
                }}</text>
              </pressable>
            }
          </view>
          <text-input
            class="input"
            [value]="amountInput()"
            [placeholder]="i18n.t('quran.amountPlaceholder')"
            placeholderTextColor="#75847b"
            keyboardType="decimal-pad"
            [returnKeyType]="'done'"
            (changeText)="amountInput.set($event)"
          />
          <view class="row">
            <pressable class="primary save" accessibilityRole="button" (press)="saveAmount()">
              <text class="primary-text">{{ i18n.t('quran.save') }}</text>
            </pressable>
            <pressable class="secondary save" accessibilityRole="button" (press)="toggleAmount()">
              <text class="secondary-text">{{ i18n.t('common.cancel') }}</text>
            </pressable>
          </view>
        }
      </view>

      <view class="card">
        <text class="section-title">{{ i18n.t('quran.statsTitle') }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('quran.stat.daysRead') }}</text>
          <text class="stat-value">{{ quranWeek().daysRead }} {{ i18n.count(quranWeek().daysRead, 'unit.day') }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('quran.stat.pagesRead') }}</text>
          <text class="stat-value">{{ quranWeek().pages }} {{ i18n.count(quranWeek().pages, 'unit.page') }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ i18n.t('quran.stat.juzRead') }}</text>
          <text class="stat-value">{{ quranWeek().juz }} {{ i18n.count(quranWeek().juz, 'unit.juz') }}</text>
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">{{ i18n.t('mulk.title') }}</text>
          <pressable class="secondary" accessibilityRole="button" (press)="toggleMulk()">
            <text class="secondary-text">{{
              mulkEnabled() ? i18n.t('settings.enabled') : i18n.t('settings.disabled')
            }}</text>
          </pressable>
        </view>
        <text class="meta">{{ mulkEnabled() ? i18n.t('mulk.enabledHint') : i18n.t('mulk.disabledHint') }}</text>
        @if (mulkEnabled()) {
          @if (mulkToday()) {
            <text class="status ok">✓ {{ i18n.t('mulk.readDone') }}</text>
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
            <text class="stat-value">{{ mulkWeek().daysRead }} {{ i18n.count(mulkWeek().daysRead, 'unit.day') }}</text>
          </view>
        }
        <text class="virtue">{{ i18n.t('mulk.virtue') }}</text>
      </view>
    </scroll-view>
  `,
  styles: `
    .clear-text { color: #d5b576; font-size: 12px; padding: 6px 0 6px 8px; }
    .status { font-size: 14px; font-weight: 600; }
    .status.ok { color: #91c7a7; }
    .status.off { color: #ef9d8e; }
    .amount { color: #e3d3ae; font-family: serif; font-size: 22px; }
    .save { flex: 1; }
    .virtue {
      color: #d7c9aa;
      background-color: #1b261e;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      padding: 12px;
    }
  `,
})
export class QuranScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);

  protected readonly today = localTodayIso();
  protected readonly amountInput = signal('');
  protected readonly amountUnit = signal<'pages' | 'juz'>('pages');
  protected readonly amountUnits = ['pages', 'juz'] as const;
  protected readonly showAmount = signal(false);

  protected readonly quranToday = computed(() => this.store.state().quran[this.today] ?? {});
  protected readonly quranWeek = computed(() => this.store.quranWeek());
  protected readonly mulkEnabled = computed(() => this.store.settings().mulkEnabled);
  protected readonly mulkToday = computed(() => this.store.state().mulk[this.today] === true);
  protected readonly mulkWeek = computed(() => this.store.mulkWeek());

  protected markRead(): void {
    this.store.updateQuran(this.today, { read: true });
  }

  protected markUnread(): void {
    this.store.updateQuran(this.today, { read: false, pages: undefined, juz: undefined });
  }

  protected clearMark(): void {
    this.store.updateQuran(this.today, { read: undefined, pages: undefined, juz: undefined });
  }

  protected toggleAmount(): void {
    this.showAmount.update((shown) => !shown);
  }

  protected saveAmount(): void {
    const value = Number(this.amountInput().trim().replace(',', '.'));
    if (Number.isFinite(value) && value > 0) {
      if (this.amountUnit() === 'pages') {
        this.store.updateQuran(this.today, {
          read: true,
          pages: Math.max(1, Math.floor(value)),
          juz: undefined,
        });
      } else {
        this.store.updateQuran(this.today, { read: true, juz: value, pages: undefined });
      }
      this.amountInput.set('');
      this.showAmount.set(false);
    }
  }

  protected markMulk(read: boolean): void {
    this.store.updateMulk(this.today, read);
  }

  protected toggleMulk(): void {
    this.store.patchSettings({ mulkEnabled: !this.mulkEnabled() });
  }

  protected optionStyle(active: boolean) {
    return active ? { backgroundColor: '#d5b576', borderColor: '#d5b576' } : {};
  }

  protected optionTextStyle(active: boolean) {
    return active ? { color: '#142019', fontWeight: '700' } : {};
  }
}
