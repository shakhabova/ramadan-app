import { Component, effect, inject, signal } from '@angular/core';
import { Pressable, SafeAreaProvider, SafeAreaView, Text, View } from '@ng-native/components';
import { StatusBar } from '@ng-native/device';
import { I18n } from './core/i18n.ts';
import { Reminders } from './core/reminders.ts';
import { TrackerStore } from './core/state.ts';
import { RamadanScreen } from './features/ramadan/ramadan-screen.ts';
import { AzkarScreen } from './features/azkar/azkar-screen.ts';
import { QuranScreen } from './features/quran/quran-screen.ts';
import { SettingsScreen } from './features/settings/settings-screen.ts';

type TabId = 'ramadan' | 'azkar' | 'quran' | 'settings';

interface Tab {
  id: TabId;
  labelKey: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'ramadan', labelKey: 'tab.ramadan', icon: '🌙' },
  { id: 'azkar', labelKey: 'tab.azkar', icon: '📿' },
  { id: 'quran', labelKey: 'tab.quran', icon: '📖' },
  { id: 'settings', labelKey: 'tab.settings', icon: '⚙️' },
];

@Component({
  imports: [
    Pressable,
    SafeAreaProvider,
    SafeAreaView,
    Text,
    View,
    RamadanScreen,
    AzkarScreen,
    QuranScreen,
    SettingsScreen,
  ],
  selector: 'app-root',
  template: `
    <safe-area-provider>
      <view class="shell">
        <safe-area-view [edges]="['top']" class="content">
          @switch (tab()) {
            @case ('ramadan') {
              <app-ramadan />
            }
            @case ('azkar') {
              <app-azkar />
            }
            @case ('quran') {
              <app-quran />
            }
            @case ('settings') {
              <app-settings />
            }
          }
        </safe-area-view>

        <safe-area-view [edges]="['bottom']" class="tabbar">
          @for (item of tabs; track item.id) {
            <pressable
              class="tab"
              accessibilityRole="button"
              [accessibilityLabel]="i18n.t(item.labelKey)"
              [accessibilityState]="{ selected: tab() === item.id }"
              [style]="tabStyle(item.id)"
              (press)="select(item.id)"
            >
              <text class="tab-icon">{{ item.icon }}</text>
              <text class="tab-label" [style]="labelStyle(item.id)">{{ i18n.t(item.labelKey) }}</text>
            </pressable>
          }
        </safe-area-view>
      </view>
    </safe-area-provider>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .shell {
      flex: 1;
      background-color: #f4f7f5;
    }
    .content {
      flex: 1;
    }
    .tabbar {
      flex-direction: row;
      justify-content: space-around;
      background-color: #ffffff;
      border-top-width: 1px;
      border-top-color: #e2e8e4;
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .tab {
      flex: 1;
      align-items: center;
      gap: 2px;
      padding-top: 6px;
      padding-bottom: 6px;
    }
    .tab-icon {
      font-size: 20px;
    }
    .tab-label {
      font-size: 11px;
    }
    @media (prefers-color-scheme: dark) {
      .shell {
        background-color: #0e1512;
      }
      .tabbar {
        background-color: #131c17;
        border-top-color: #22302a;
      }
    }
  `,
})
export class App {
  protected readonly tabs = TABS;
  protected readonly i18n = inject(I18n);
  private readonly reminders = inject(Reminders);
  private readonly store = inject(TrackerStore);
  protected readonly tab = signal<TabId>('ramadan');

  constructor() {
    inject(StatusBar).set({ style: 'auto' });
    this.reminders.configure();

    // Rebuild the daily schedule from the settings, wherever they came from. Reading the settings
    // signal makes this run again when the stored value loads (a beat after startup) and on every
    // later change, so a returning user's schedule is recreated rather than cancelled.
    effect(() => {
      this.store.settings();
      void this.reminders.reschedule();
    });
  }

  protected select(id: TabId): void {
    this.tab.set(id);
  }

  protected tabStyle(id: TabId) {
    return { opacity: this.tab() === id ? 1 : 0.55 };
  }

  protected labelStyle(id: TabId) {
    return {
      color: this.tab() === id ? '#1f8a5b' : '#6b7a71',
      fontWeight: this.tab() === id ? '600' : '400',
    };
  }
}
