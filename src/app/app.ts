import { Component, computed, effect, inject, signal } from '@angular/core';
import { Pressable, SafeAreaProvider, SafeAreaView, Text, View } from '@ng-native/components';
import { AppState, StatusBar } from '@ng-native/device';
import { I18n } from './core/i18n.ts';
import { Reminders } from './core/reminders.ts';
import { TrackerStore } from './core/state.ts';
import { AzkarScreen } from './features/azkar/azkar-screen.ts';
import { FeedbackScreen } from './features/feedback/feedback-screen.ts';
import { OnboardingScreen } from './features/onboarding/onboarding-screen.ts';
import { QuranScreen } from './features/quran/quran-screen.ts';
import { RamadanScreen } from './features/ramadan/ramadan-screen.ts';
import { SettingsScreen } from './features/settings/settings-screen.ts';
import { TodayScreen } from './features/today/today-screen.ts';

type TabId = 'today' | 'azkar' | 'quran' | 'progress' | 'settings';

interface Tab {
  id: TabId;
  labelKey: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'today', labelKey: 'tab.today', icon: '⌂' },
  { id: 'azkar', labelKey: 'tab.azkar', icon: '☀' },
  { id: 'quran', labelKey: 'tab.quran', icon: '▤' },
  { id: 'progress', labelKey: 'tab.progress', icon: '▥' },
  { id: 'settings', labelKey: 'tab.settings', icon: '⚙' },
];

@Component({
  imports: [
    Pressable,
    SafeAreaProvider,
    SafeAreaView,
    Text,
    View,
    TodayScreen,
    RamadanScreen,
    AzkarScreen,
    QuranScreen,
    SettingsScreen,
    OnboardingScreen,
    FeedbackScreen,
  ],
  selector: 'app-root',
  template: `
    <safe-area-provider>
      <view class="shell">
        @if (!settings().onboardingCompleted) {
          <safe-area-view [edges]="['top', 'bottom']" class="content">
            <app-onboarding />
          </safe-area-view>
        } @else {
          <safe-area-view [edges]="['top']" class="content">
            @if (feedbackOpen()) {
              <app-feedback (closed)="feedbackOpen.set(false)" />
            } @else {
              @switch (tab()) {
                @case ('today') {
                  <app-today (openProgress)="select('progress')" (openFeedback)="feedbackOpen.set(true)" />
                }
                @case ('azkar') {
                  <app-azkar />
                }
                @case ('quran') {
                  <app-quran />
                }
                @case ('progress') {
                  <app-ramadan />
                }
                @case ('settings') {
                  <app-settings (openFeedback)="feedbackOpen.set(true)" />
                }
              }
            }
          </safe-area-view>

          @if (!feedbackOpen()) {
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
                  <text class="tab-icon" [style]="labelStyle(item.id)">{{ item.icon }}</text>
                  <text class="tab-label" [style]="labelStyle(item.id)">{{ i18n.t(item.labelKey) }}</text>
                </pressable>
              }
            </safe-area-view>
          }
        }
      </view>
    </safe-area-provider>
  `,
  styles: `
    :host { flex: 1; }
    .shell { flex: 1; background-color: #091311; }
    .content { flex: 1; }
    .tabbar {
      flex-direction: row;
      justify-content: space-around;
      background-color: #0e1a16;
      border-top-width: 1px;
      border-top-color: #29372f;
      padding-top: 7px;
      padding-bottom: 7px;
    }
    .tab { flex: 1; align-items: center; gap: 3px; padding: 5px 1px; min-height: 50px; }
    .tab-icon { font-size: 20px; }
    .tab-label { font-size: 10px; font-weight: 500; }
  `,
})
export class App {
  protected readonly tabs = TABS;
  protected readonly i18n = inject(I18n);
  private readonly reminders = inject(Reminders);
  private readonly store = inject(TrackerStore);
  private readonly appState = inject(AppState);
  protected readonly settings = computed(() => this.store.settings());
  protected readonly tab = signal<TabId>('today');
  protected readonly feedbackOpen = signal(false);

  constructor() {
    inject(StatusBar).set({ style: 'light' });
    this.reminders.configure();

    // Recreate repeats after stored settings load, a setting change, or return from the background
    // (including a device timezone change). Reminders itself serialises overlapping requests.
    effect(() => {
      this.store.settings();
      if (this.appState.active()) void this.reminders.reschedule();
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
      color: this.tab() === id ? '#d5b576' : '#9baaa2',
      fontWeight: this.tab() === id ? '700' : '500',
    };
  }
}
