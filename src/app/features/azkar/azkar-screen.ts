import { Component, computed, inject, signal } from '@angular/core';
import { Pressable, ScrollView, Text, View } from '@ng-native/components';
import { I18n } from '../../core/i18n.ts';
import { localTodayIso } from '../../core/dates.ts';
import { TrackerStore } from '../../core/state.ts';
import { eveningAzkars, morningAzkars, type AzkarEntry } from './azkars.ts';

type Kind = 'morning' | 'evening';

@Component({
  selector: 'app-azkar',
  imports: [Pressable, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    @if (mode() === 'menu') {
      <scroll-view class="screen" [contentContainerStyle]="{ padding: 18, gap: 16, paddingBottom: 28 }">
        <view class="azkar-hero">
          <text class="hero-moon">☾</text>
          <text class="title">{{ i18n.t('azkar.title') }}</text>
          <text class="meta hero-meta">{{ i18n.t('azkar.subtitle') }}</text>
        </view>

        @for (item of sections; track item.kind) {
          <view class="card azkar-card">
            <view class="card-head">
              <view class="azkar-heading">
                <text class="azkar-icon">{{ item.kind === 'morning' ? '☀' : '☾' }}</text>
                <view class="azkar-heading-copy">
                  <text class="section-title">{{ i18n.t(item.labelKey) }}</text>
                  <text class="meta">{{ i18n.t('azkar.total', { n: entriesFor(item.kind).length }) }}</text>
                </view>
              </view>
              @if (done(item.kind)) {
                <text class="done-badge">✓</text>
              }
            </view>
            <view class="progress-track">
              <view class="progress-fill" [style]="{ width: done(item.kind) ? '100%' : '0%' }"></view>
            </view>
            <pressable class="secondary" accessibilityRole="button" (press)="open(item.kind)">
              <text class="secondary-text">{{ i18n.t('azkar.open') }} ›</text>
            </pressable>
          </view>
        }

        <view class="card">
          <text class="section-title">{{ i18n.t('azkar.statsTitle') }}</text>
          <view class="stat-row">
            <text class="stat-label">{{ i18n.t('azkar.stat.morning') }}</text>
            <text class="stat-value">{{ stats().morning }} {{ i18n.count(stats().morning, 'unit.time') }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">{{ i18n.t('azkar.stat.evening') }}</text>
            <text class="stat-value">{{ stats().evening }} {{ i18n.count(stats().evening, 'unit.time') }}</text>
          </view>
        </view>
      </scroll-view>
    } @else {
      <view class="screen reader">
        <view class="reader-head">
          <pressable class="secondary" accessibilityRole="button" (press)="back()">
            <text class="secondary-text">‹ {{ i18n.t('azkar.backToList') }}</text>
          </pressable>
          <text class="reader-progress">{{ i18n.t('azkar.progress', { index: index() + 1, total: entries().length }) }}</text>
        </view>

        <scroll-view class="body" [contentContainerStyle]="{ padding: 20 }">
          <text class="azkar-text">{{ current()?.text }}</text>
        </scroll-view>

        <view class="controls">
          @if ((current()?.count ?? 1) > 1) {
            <pressable
              class="counter"
              accessibilityRole="button"
              [style]="{ backgroundColor: reached() ? '#d5b576' : '#1a2a25' }"
              [accessibilityState]="{ disabled: reached() }"
              (press)="tapCounter()"
            >
              <text class="counter-text" [style]="{ color: reached() ? '#142019' : '#d8dfd8' }">{{
                reached()
                  ? i18n.t('azkar.completed')
                  : i18n.t('azkar.counter', { count: currentCount(), total: current()?.count ?? 0 })
              }}</text>
            </pressable>
          }

          <view class="nav">
            @if (index() > 0) {
              <pressable class="secondary nav-button" accessibilityRole="button" (press)="prev()">
                <text class="secondary-text">{{ i18n.t('azkar.prev') }}</text>
              </pressable>
            }
            @if (index() < entries().length - 1) {
              <pressable class="secondary nav-button" accessibilityRole="button" (press)="next()">
                <text class="secondary-text">{{ i18n.t('azkar.next') }}</text>
              </pressable>
            } @else {
              <pressable class="primary nav-button" accessibilityRole="button" (press)="finish()">
                <text class="primary-text">{{ i18n.t('azkar.finish') }}</text>
              </pressable>
            }
          </view>
        </view>
      </view>
    }

    @if (finishedBanner(); as banner) {
      <view class="toast"><text class="toast-text">{{ banner }}</text></view>
    }
  `,
  styles: `
    .azkar-hero { align-items: center; gap: 5px; padding: 8px 12px 14px; }
    .hero-moon { color: #d5b576; font-family: serif; font-size: 52px; }
    .hero-meta { text-align: center; }
    .azkar-card { gap: 16px; }
    .azkar-heading { flex: 1; flex-direction: row; align-items: center; gap: 12px; }
    .azkar-heading-copy { flex: 1; gap: 4px; }
    .azkar-icon {
      width: 42px;
      height: 42px;
      border-radius: 21px;
      background-color: #24332a;
      color: #d5b576;
      text-align: center;
      font-size: 22px;
      padding-top: 8px;
    }
    .done-badge { color: #91c7a7; font-size: 20px; }
    .progress-track { height: 5px; border-radius: 3px; background-color: #29372f; overflow: hidden; }
    .progress-fill { height: 5px; border-radius: 3px; background-color: #d5b576; }
    .reader { flex: 1; }
    .reader-head { flex-direction: row; justify-content: space-between; align-items: center; padding: 12px 18px; gap: 10px; }
    .reader-progress { font-size: 13px; color: #9baaa2; }
    .body { flex: 1; }
    .azkar-text { font-size: 17px; color: #f3ecdf; line-height: 1.65; }
    .controls { padding: 14px 18px 20px; gap: 10px; background-color: #0e1a16; border-top-width: 1px; border-top-color: #29372f; }
    .counter { align-items: center; padding: 14px; border-radius: 12px; }
    .counter-text { font-size: 15px; font-weight: 600; }
    .nav { flex-direction: row; gap: 8px; }
    .nav-button { flex: 1; }
    .toast { position: absolute; bottom: 24px; left: 18px; right: 18px; background-color: #d5b576; border-radius: 12px; padding: 14px; align-items: center; }
    .toast-text { color: #142019; font-size: 14px; font-weight: 600; }
  `,
})
export class AzkarScreen {
  protected readonly store = inject(TrackerStore);
  protected readonly i18n = inject(I18n);

  protected readonly sections: { kind: Kind; labelKey: string }[] = [
    { kind: 'morning', labelKey: 'azkar.morning' },
    { kind: 'evening', labelKey: 'azkar.evening' },
  ];

  protected readonly mode = signal<'menu' | 'reader'>('menu');
  protected readonly kind = signal<Kind>('morning');
  protected readonly index = signal(0);
  protected readonly counts = signal<number[]>([]);
  protected readonly finishedBanner = signal<string | null>(null);

  protected readonly today = localTodayIso();
  protected readonly stats = computed(() => this.store.azkarWeek());
  protected readonly entries = computed<AzkarEntry[]>(() => this.entriesFor(this.kind()));
  protected readonly current = computed<AzkarEntry | undefined>(() => this.entries()[this.index()]);
  protected readonly currentCount = computed(() => this.counts()[this.index()] ?? 0);
  protected readonly reached = computed(() => this.currentCount() >= (this.current()?.count ?? 1));

  protected entriesFor(kind: Kind): AzkarEntry[] {
    return kind === 'morning' ? morningAzkars : eveningAzkars;
  }

  protected done(kind: Kind): boolean {
    const day = this.store.state().azkar[this.today];
    return kind === 'morning' ? day?.morning === true : day?.evening === true;
  }

  protected open(kind: Kind): void {
    this.kind.set(kind);
    this.index.set(0);
    this.counts.set(this.entriesFor(kind).map(() => 0));
    this.mode.set('reader');
  }

  protected back(): void {
    this.mode.set('menu');
  }

  protected tapCounter(): void {
    if (this.reached()) return;
    this.counts.update((counts) => {
      const next = [...counts];
      next[this.index()] = (next[this.index()] ?? 0) + 1;
      return next;
    });
  }

  protected next(): void {
    if (this.index() < this.entries().length - 1) this.index.update((i) => i + 1);
  }

  protected prev(): void {
    if (this.index() > 0) this.index.update((i) => i - 1);
  }

  protected finish(): void {
    const kind = this.kind();
    this.store.updateAzkar(this.today, { [kind]: true });
    this.mode.set('menu');
    this.showBanner(this.i18n.t(kind === 'morning' ? 'azkar.morningDone' : 'azkar.eveningDone'));
  }

  private showBanner(text: string): void {
    this.finishedBanner.set(text);
    setTimeout(() => this.finishedBanner.set(null), 2500);
  }
}
