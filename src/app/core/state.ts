import { Injectable, computed, inject } from '@angular/core';
import { Storage } from '@ng-native/expo/async-storage';
import { dayOfRamadan, lastNDates, RAMADAN_DAYS } from './dates';

export type Language = 'ru' | 'en';
/** 0 = missed, 1 = at home, 2 = at the mosque - the bot's own encoding, kept so a future backend matches. */
export type TaraweehStatus = 0 | 1 | 2;

export interface DayRecord {
  fasting?: boolean;
  quran?: boolean;
  taraweeh?: TaraweehStatus;
}

export interface AzkarDay {
  morning?: boolean;
  evening?: boolean;
}

export interface QuranDay {
  read?: boolean;
  pages?: number;
}

export interface AppSettings {
  language: Language;
  /** `YYYY-MM-DD`, or null until the user sets it. */
  ramadanStart: string | null;
  morningAzkarHour: number;
  eveningAzkarHour: number;
  quranReminderHour: number;
  mulkEnabled: boolean;
  mulkReminderHour: number;
  notificationsEnabled: boolean;
}

export interface AppState {
  settings: AppSettings;
  /** Keyed by the day of Ramadan (1…30). */
  ramadan: Record<number, DayRecord>;
  /** Keyed by `YYYY-MM-DD`. */
  azkar: Record<string, AzkarDay>;
  quran: Record<string, QuranDay>;
  mulk: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ru',
  ramadanStart: null,
  morningAzkarHour: 5,
  eveningAzkarHour: 17,
  quranReminderHour: 21,
  mulkEnabled: false,
  mulkReminderHour: 22,
  notificationsEnabled: false,
};

export const DEFAULT_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  ramadan: {},
  azkar: {},
  quran: {},
  mulk: {},
};

export interface RamadanStats {
  fasting: number;
  notFasting: number;
  quran: number;
  notQuran: number;
  taraweehTotal: number;
  taraweehMosque: number;
  taraweehHome: number;
}

/**
 * Every tracker and setting, persisted under one key through the injected `Storage` token.
 *
 * `Storage` is an `InjectionToken<Store>`, not a concrete AsyncStorage call, so the persistence
 * seam is already here: a device build binds it to the key-value file, a test leaves it empty, and
 * a Supabase-backed `Store` could be provided in its place without touching this class.
 */
@Injectable({ providedIn: 'root' })
export class TrackerStore {
  private readonly storage = inject(Storage);

  readonly state = this.storage.signal<AppState>('ramadan-tracker/state/v1', DEFAULT_STATE);
  readonly settings = computed<AppSettings>(() => this.state().settings);

  /** The day of Ramadan today, or null while the start date is unset or out of range. */
  readonly currentDay = computed<number | null>(() => {
    const start = this.settings().ramadanStart;
    if (!start) return null;
    const day = dayOfRamadan(start);
    return day >= 1 && day <= RAMADAN_DAYS ? day : null;
  });

  setLanguage(language: Language): void {
    this.patchSettings({ language });
  }

  patchSettings(patch: Partial<AppSettings>): void {
    this.state.update((state) => ({
      ...state,
      settings: { ...state.settings, ...patch },
    }));
  }

  record(day: number): DayRecord {
    return this.state().ramadan[day] ?? {};
  }

  updateDay(day: number, patch: Partial<DayRecord>): void {
    this.state.update((state) => ({
      ...state,
      ramadan: { ...state.ramadan, [day]: { ...state.ramadan[day], ...patch } },
    }));
  }

  updateAzkar(date: string, patch: Partial<AzkarDay>): void {
    this.state.update((state) => ({
      ...state,
      azkar: { ...state.azkar, [date]: { ...state.azkar[date], ...patch } },
    }));
  }

  updateQuran(date: string, patch: Partial<QuranDay>): void {
    this.state.update((state) => ({
      ...state,
      quran: { ...state.quran, [date]: { ...state.quran[date], ...patch } },
    }));
  }

  updateMulk(date: string, read: boolean): void {
    this.state.update((state) => ({ ...state, mulk: { ...state.mulk, [date]: read } }));
  }

  readonly ramadanStats = computed<RamadanStats>(() => {
    const stats: RamadanStats = {
      fasting: 0,
      notFasting: 0,
      quran: 0,
      notQuran: 0,
      taraweehTotal: 0,
      taraweehMosque: 0,
      taraweehHome: 0,
    };
    for (const record of Object.values(this.state().ramadan)) {
      if (record.fasting === true) stats.fasting++;
      if (record.fasting === false) stats.notFasting++;
      if (record.quran === true) stats.quran++;
      if (record.quran === false) stats.notQuran++;
      if (record.taraweeh !== undefined) {
        stats.taraweehTotal++;
        if (record.taraweeh === 2) stats.taraweehMosque++;
        if (record.taraweeh === 1) stats.taraweehHome++;
      }
    }
    return stats;
  });

  readonly azkarWeek = computed(() => {
    const azkar = this.state().azkar;
    let morning = 0;
    let evening = 0;
    for (const date of lastNDates(7)) {
      if (azkar[date]?.morning) morning++;
      if (azkar[date]?.evening) evening++;
    }
    return { morning, evening, total: 7 };
  });

  readonly quranWeek = computed(() => {
    const quran = this.state().quran;
    let daysRead = 0;
    let pages = 0;
    for (const date of lastNDates(7)) {
      const day = quran[date];
      if (day?.read) daysRead++;
      if (day?.pages) pages += day.pages;
    }
    return { daysRead, pages, total: 7 };
  });

  readonly mulkWeek = computed(() => {
    const mulk = this.state().mulk;
    let daysRead = 0;
    for (const date of lastNDates(7)) {
      if (mulk[date]) daysRead++;
    }
    return { daysRead, total: 7 };
  });
}
