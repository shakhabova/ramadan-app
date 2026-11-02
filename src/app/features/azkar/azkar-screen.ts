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
  template: `
    @if (mode() === 'menu') {
      <scroll-view class="screen" [contentContainerStyle]="{ padding: 16, gap: 16 }">
        <text class="title">{{ i18n.t('azkar.title') }}</text>

        @for (item of sections; track item.kind) {
          <view class="card">
            <view class="card-head">
              <text class="section-title">{{ i18n.t(item.labelKey) }}</text>
              @if (done(item.kind)) {
                <text class="badge">✅</text>
              }
            </view>
            <text class="meta">{{ i18n.t('azkar.total', { n: entriesFor(item.kind).length }) }}</text>
            <pressable class="primary" accessibilityRole="button" (press)="open(item.kind)">
              <text class="primary-text">{{ i18n.t('azkar.open') }}</text>
            </pressable>
          </view>
        }

        <view class="card">
          <text class="section-title">{{ i18n.t('azkar.statsTitle') }}</text>
          <view class="stat-row">
            <text class="stat-label">{{ i18n.t('azkar.stat.morning') }}</text>
            <text class="stat-value"
              >{{ stats().morning }} {{ i18n.count(stats().morning, 'unit.time') }}</text
            >
          </view>
          <view class="stat-row">
            <text class="stat-label">{{ i18n.t('azkar.stat.evening') }}</text>
            <text class="stat-value"
              >{{ stats().evening }} {{ i18n.count(stats().evening, 'unit.time') }}</text
            >
          </view>
        </view>
      </scroll-view>
    } @else {
      <view class="screen reader">
        <view class="reader-head">
          <pressable class="ghost" accessibilityRole="button" (press)="back()">
            <text class="ghost-text">{{ i18n.t('azkar.backToList') }}</text>
          </pressable>
          <text class="reader-progress">{{
            i18n.t('azkar.progress', { index: index() + 1, total: entries().length })
          }}</text>
        </view>

        <scroll-view class="body" [contentContainerStyle]="{ padding: 16 }">
          <text class="azkar-text">{{ current()?.text }}</text>
        </scroll-view>

        <view class="controls">
          @if ((current()?.count ?? 1) > 1) {
            <pressable
              class="counter"
              accessibilityRole="button"
              [style]="{ backgroundColor: reached() ? '#1f8a5b' : '#eef2ef' }"
              [accessibilityState]="{ disabled: reached() }"
              (press)="tapCounter()"
            >
              <text class="counter-text" [style]="{ color: reached() ? '#ffffff' : '#24312b' }">{{
                reached()
                  ? i18n.t('azkar.completed')
                  : i18n.t('azkar.counter', { count: currentCount(), total: current()?.count ?? 0 })
              }}</text>
            </pressable>
          }

          <view class="nav">
            @if (index() > 0) {
              <pressable class="nav-button" accessibilityRole="button" (press)="prev()">
                <text class="nav-text">{{ i18n.t('azkar.prev') }}</text>
              </pressable>
            }
            @if (index() < entries().length - 1) {
              <pressable class="nav-button" accessibilityRole="button" (press)="next()">
                <text class="nav-text">{{ i18n.t('azkar.next') }}</text>
              </pressable>
            } @else {
              <pressable class="nav-button primary-bg" accessibilityRole="button" (press)="finish()">
                <text class="nav-text light">{{ i18n.t('azkar.finish') }}</text>
              </pressable>
            }
          </view>
        </view>
      </view>
    }

    @if (finishedBanner(); as banner) {
      <view class="toast">
        <text class="toast-text">{{ banner }}</text>
      </view>
    }
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
    .badge {
      font-size: 16px;
    }
    .meta {
      font-size: 13px;
      color: #6b7a71;
    }
    .primary {
      background-color: #1f8a5b;
      border-radius: 12px;
      align-items: center;
      padding: 12px;
    }
    .primary-text {
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
    }
    .stat-row {
      flex-direction: row;
      justify-content: space-between;
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
    .reader {
      flex: 1;
    }
    .reader-head {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
    }
    .ghost {
      padding: 8px 12px;
      border-radius: 10px;
      background-color: #eef2ef;
    }
    .ghost-text {
      color: #24312b;
      font-size: 14px;
    }
    .reader-progress {
      font-size: 14px;
      color: #6b7a71;
    }
    .body {
      flex: 1;
    }
    .azkar-text {
      font-size: 16px;
      color: #101a14;
      line-height: 1.6;
    }
    .controls {
      padding: 12px 16px 20px;
      gap: 10px;
      background-color: #ffffff;
      border-top-width: 1px;
      border-top-color: #e6ece8;
    }
    .counter {
      align-items: center;
      padding: 14px;
      border-radius: 12px;
    }
    .counter-text {
      font-size: 15px;
      font-weight: 600;
    }
    .nav {
      flex-direction: row;
      gap: 8px;
    }
    .nav-button {
      flex: 1;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      background-color: #eef2ef;
    }
    .nav-button.primary-bg {
      background-color: #1f8a5b;
    }
    .nav-text {
      font-size: 15px;
      font-weight: 600;
      color: #24312b;
    }
    .nav-text.light {
      color: #ffffff;
    }
    .toast {
      position: absolute;
      bottom: 24px;
      left: 16px;
      right: 16px;
      background-color: #101a14;
      border-radius: 12px;
      padding: 14px;
      align-items: center;
    }
    .toast-text {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
    }
    @media (prefers-color-scheme: dark) {
      .screen {
        background-color: #0e1512;
      }
      .title,
      .section-title,
      .stat-value,
      .azkar-text {
        color: #eaf2ec;
      }
      .meta,
      .stat-label,
      .reader-progress {
        color: #93a49a;
      }
      .card {
        background-color: #17211c;
        border-color: #22302a;
      }
      .ghost,
      .nav-button {
        background-color: #1e2a24;
      }
      .ghost-text,
      .nav-text {
        color: #d6e2da;
      }
      .counter {
        background-color: #1e2a24;
      }
      .controls {
        background-color: #131c17;
        border-top-color: #22302a;
      }
    }
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
    this.showBanner(
      this.i18n.t(kind === 'morning' ? 'azkar.morningDone' : 'azkar.eveningDone'),
    );
  }

  private showBanner(text: string): void {
    this.finishedBanner.set(text);
    setTimeout(() => this.finishedBanner.set(null), 2500);
  }
}
