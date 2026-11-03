import { Injectable, computed, inject } from '@angular/core';
import { Storage } from '@ng-native/expo/async-storage';
import { addDays, dayOfRamadan, lastNDates } from './dates';

export type Language = 'ru' | 'en';
export type RamadanLength = 29 | 30;
/** 0 = missed, 1 = at home, 2 = at the mosque - the bot's own encoding. */
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
  /** Pages and juz are alternatives: saving one clears the other. */
  pages?: number;
  juz?: number;
}

export interface AppSettings {
  language: Language;
  onboardingCompleted: boolean;
  /** Local `YYYY-MM-DD`; never a fixed, server-wide Ramadan date. */
  ramadanStart: string | null;
  ramadanLength: RamadanLength;
  morningAzkarHour: number;
  eveningAzkarHour: number;
  azkarRemindersEnabled: boolean;
  trackerReminderEnabled: boolean;
  trackerReminderHour: number;
  quranReminderEnabled: boolean;
  quranReminderHour: number;
  taraweehReminderEnabled: boolean;
  taraweehReminderHour: number;
  mulkEnabled: boolean;
  mulkReminderHour: number;
  notificationsEnabled: boolean;
}

export interface AppState {
  settings: AppSettings;
  /** Keyed by the day of Ramadan (1…30), one record per day. */
  ramadan: Record<number, DayRecord>;
  /** Keyed by local `YYYY-MM-DD`. */
  azkar: Record<string, AzkarDay>;
  quran: Record<string, QuranDay>;
  mulk: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ru',
  onboardingCompleted: false,
  ramadanStart: null,
  ramadanLength: 30,
  morningAzkarHour: 5,
  eveningAzkarHour: 17,
  azkarRemindersEnabled: true,
  trackerReminderEnabled: true,
  trackerReminderHour: 20,
  quranReminderEnabled: true,
  quranReminderHour: 21,
  taraweehReminderEnabled: false,
  taraweehReminderHour: 22,
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
  fastingUnmarked: number;
  quran: number;
  notQuran: number;
  quranUnmarked: number;
  taraweehTotal: number;
  taraweehMosque: number;
  taraweehHome: number;
  taraweehMissed: number;
  taraweehUnmarked: number;
}

/** Every tracker and setting, persisted through the injectable Storage seam. */
@Injectable({ providedIn: 'root' })
export class TrackerStore {
  private readonly storage = inject(Storage);

  readonly state = this.storage.signal<AppState>('ramadan-tracker/state/v1', DEFAULT_STATE);
  /** The merge also migrates settings saved by an older version of the app. */
  readonly settings = computed<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...this.state().settings,
  }));

  readonly currentDay = computed<number | null>(() => {
    const settings = this.settings();
    if (!settings.ramadanStart) return null;
    const day = dayOfRamadan(settings.ramadanStart);
    return day >= 1 && day <= settings.ramadanLength ? day : null;
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
    this.state.update((state) => {
      const next: AppState = {
        ...state,
        ramadan: { ...state.ramadan, [day]: { ...state.ramadan[day], ...patch } },
      };
      if (!Object.prototype.hasOwnProperty.call(patch, 'quran')) return next;

      const start = this.settings().ramadanStart;
      if (!start) return next;
      const date = addDays(start, day - 1);
      const read = patch.quran;
      return {
        ...next,
        quran: {
          ...next.quran,
          [date]: {
            ...next.quran[date],
            read,
            ...(read === true ? {} : { pages: undefined, juz: undefined }),
          },
        },
      };
    });
  }

  updateAzkar(date: string, patch: Partial<AzkarDay>): void {
    this.state.update((state) => ({
      ...state,
      azkar: { ...state.azkar, [date]: { ...state.azkar[date], ...patch } },
    }));
  }

  updateQuran(date: string, patch: Partial<QuranDay>): void {
    this.state.update((state) => {
      const next: AppState = {
        ...state,
        quran: { ...state.quran, [date]: { ...state.quran[date], ...patch } },
      };
      if (!Object.prototype.hasOwnProperty.call(patch, 'read')) return next;

      const start = this.settings().ramadanStart;
      if (!start) return next;
      const day = dayOfRamadan(start, date);
      if (day < 1 || day > this.settings().ramadanLength) return next;
      return {
        ...next,
        ramadan: {
          ...next.ramadan,
          [day]: { ...next.ramadan[day], quran: patch.read },
        },
      };
    });
  }

  updateMulk(date: string, read: boolean): void {
    this.state.update((state) => ({ ...state, mulk: { ...state.mulk, [date]: read } }));
  }

  readonly ramadanStats = computed<RamadanStats>(() => {
    const stats: RamadanStats = {
      fasting: 0,
      notFasting: 0,
      fastingUnmarked: 0,
      quran: 0,
      notQuran: 0,
      quranUnmarked: 0,
      taraweehTotal: 0,
      taraweehMosque: 0,
      taraweehHome: 0,
      taraweehMissed: 0,
      taraweehUnmarked: 0,
    };
    for (let day = 1; day <= this.settings().ramadanLength; day++) {
      const record = this.state().ramadan[day] ?? {};
      if (record.fasting === true) stats.fasting++;
      else if (record.fasting === false) stats.notFasting++;
      else stats.fastingUnmarked++;

      if (record.quran === true) stats.quran++;
      else if (record.quran === false) stats.notQuran++;
      else stats.quranUnmarked++;

      if (record.taraweeh === 2) {
        stats.taraweehTotal++;
        stats.taraweehMosque++;
      } else if (record.taraweeh === 1) {
        stats.taraweehTotal++;
        stats.taraweehHome++;
      } else if (record.taraweeh === 0) stats.taraweehMissed++;
      else stats.taraweehUnmarked++;
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
    let juz = 0;
    for (const date of lastNDates(7)) {
      const day = quran[date];
      if (day?.read) daysRead++;
      if (day?.pages) pages += day.pages;
      if (day?.juz) juz += day.juz;
    }
    return { daysRead, pages, juz, total: 7 };
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
