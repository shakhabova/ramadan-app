import { Injectable, computed, inject } from '@angular/core';
import { getPlural } from './dates';
import { TrackerStore, type Language } from './state';

type Dictionary = Record<string, string>;

const ru: Dictionary = {
  'app.name': 'Рамадан',
  'tab.ramadan': 'Рамадан',
  'tab.azkar': 'Азкары',
  'tab.quran': 'Коран',
  'tab.settings': 'Настройки',

  'common.today': 'Сегодня',
  'common.back': 'Назад',
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.stats': 'Статистика',
  'common.week': 'за последние 7 дней',
  'common.statistics': 'Статистика',
  'unit.day.one': 'день',
  'unit.day.few': 'дня',
  'unit.day.many': 'дней',
  'unit.night.one': 'ночь',
  'unit.night.few': 'ночи',
  'unit.night.many': 'ночей',
  'unit.time.one': 'раз',
  'unit.time.few': 'раза',
  'unit.time.many': 'раз',
  'unit.page.one': 'страница',
  'unit.page.few': 'страницы',
  'unit.page.many': 'страниц',

  'ramadan.title': 'Трекер Рамадана',
  'ramadan.selectDay': 'Выберите день',
  'ramadan.dayTitle': 'День {n}',
  'ramadan.currentDay': 'Сегодня — день {n}',
  'ramadan.setStart': 'Укажите дату начала Рамадана в настройках, чтобы отслеживать текущий день.',
  'ramadan.fasting': 'Пост',
  'ramadan.fastingYes': '✅ Постился',
  'ramadan.fastingNo': '❌ Пропустил',
  'ramadan.quran': 'Коран',
  'ramadan.quranYes': '📖 Читал',
  'ramadan.quranNo': '⭕ Не читал',
  'ramadan.taraweeh': 'Таравих',
  'ramadan.taraweehMosque': '🕌 В мечети',
  'ramadan.taraweehHome': '🏠 Дома',
  'ramadan.taraweehMissed': '❌ Пропустил(а)',
  'ramadan.statsTitle': 'Моя статистика Рамадана',
  'ramadan.stat.fasting': 'Постился',
  'ramadan.stat.notFasting': 'Пропустил',
  'ramadan.stat.quran': 'Читал',
  'ramadan.stat.notQuran': 'Не читал',
  'ramadan.stat.taraweehTotal': 'Таравих совершён',
  'ramadan.stat.taraweehMosque': 'В мечети',
  'ramadan.stat.taraweehHome': 'Дома',

  'azkar.title': 'Азкары',
  'azkar.morning': 'Утренние',
  'azkar.evening': 'Вечерние',
  'azkar.open': 'Открыть',
  'azkar.counter': 'Счётчик: {count} / {total}',
  'azkar.completed': 'Счётчик: ✅ Выполнено',
  'azkar.prev': '⬅️ Назад',
  'azkar.next': 'Дальше ➡️',
  'azkar.finish': '✅ Завершить',
  'azkar.morningDone': 'Утренние азкары прочитаны ✅',
  'azkar.eveningDone': 'Вечерние азкары прочитаны ✅',
  'azkar.markDone': 'Завершить азкары',
  'azkar.statsTitle': 'Азкары за последние 7 дней',
  'azkar.stat.morning': 'Утренние',
  'azkar.stat.evening': 'Вечерние',
  'azkar.backToList': 'К списку',
  'azkar.progress': '{index} из {total}',
  'azkar.total': 'Всего: {n}',

  'quran.title': 'Коран',
  'quran.today': 'Сегодняшнее чтение',
  'quran.markRead': '✅ Читал(а)',
  'quran.enterPages': '🔢 Указать страницы',
  'quran.pagesLabel': 'Количество прочитанных страниц',
  'quran.save': 'Сохранить',
  'quran.readDone': '📖 Коран прочитан ✅',
  'quran.readUndone': '❌ Коран не прочитан',
  'quran.statsTitle': 'Коран за последние 7 дней',
  'quran.stat.daysRead': 'Читал(а)',
  'quran.stat.pagesRead': 'Прочитано',

  'mulk.title': 'Сура Аль-Мульк',
  'mulk.toggleOn': '✅ Включить',
  'mulk.toggleOff': '❌ Выключить',
  'mulk.markRead': '✅ Прочитал(а)',
  'mulk.markUnread': '❌ Не прочитал(а)',
  'mulk.readDone': '🌑 Сура Аль-Мульк прочитана ✅',
  'mulk.readUndone': '🌑 Сура Аль-Мульк не прочитана ❌',
  'mulk.statsTitle': 'Аль-Мульк за последние 7 дней',
  'mulk.stat.daysRead': 'Прочитана',
  'mulk.enabledHint': 'Трекер включён — напоминание каждый вечер.',
  'mulk.disabledHint': 'Включите трекер, чтобы отмечать чтение.',
  'mulk.virtue':
    'Посланник Аллаха ﷺ сообщил, что сура Аль-Мульк заступается за того, кто читает её, пока ему не будет прощено. Пусть её чтение станет вашей ежедневной привычкой.',

  'settings.title': 'Настройки',
  'settings.language': 'Язык',
  'settings.ramadanStart': 'Дата начала Рамадана',
  'settings.ramadanStartHint': 'Формат: ГГГГ-ММ-ДД',
  'settings.reminders': 'Напоминания',
  'settings.notifications': 'Уведомления',
  'settings.enableNotifications': 'Включить напоминания',
  'settings.disableNotifications': 'Выключить напоминания',
  'settings.permissionDenied': 'Нет разрешения на уведомления. Разрешите их в настройках системы.',
  'settings.morningAzkar': 'Утренние азкары',
  'settings.eveningAzkar': 'Вечерние азкары',
  'settings.quranReminder': 'Напоминание о Коране',
  'settings.mulkReminder': 'Напоминание об Аль-Мульк',
  'settings.at': '{hour}:00',
  'settings.about': 'О приложении',
  'settings.aboutText':
    'Приложение по мотивам бота «Рамадан-трекер». Все записи и настройки хранятся на устройстве.',

  'notif.channel': 'Напоминания',
  'notif.morningAzkar.title': 'Утренние азкары',
  'notif.morningAzkar.body': 'Время утренних азкаров 🌅',
  'notif.eveningAzkar.title': 'Вечерние азкары',
  'notif.eveningAzkar.body': 'Время вечерних азкаров 🌃',
  'notif.quran.title': 'Трекер Корана',
  'notif.quran.body': 'Отметьте свой прогресс в чтении Корана 📖',
  'notif.mulk.title': 'Сура Аль-Мульк',
  'notif.mulk.body': 'Удалось ли прочитать Аль-Мульк сегодня? 🌑',
};

const en: Dictionary = {
  'app.name': 'Ramadan',
  'tab.ramadan': 'Ramadan',
  'tab.azkar': 'Azkar',
  'tab.quran': 'Quran',
  'tab.settings': 'Settings',

  'common.today': 'Today',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.stats': 'Statistics',
  'common.week': 'in the last 7 days',
  'common.statistics': 'Statistics',
  'unit.day.one': 'day',
  'unit.day.few': 'days',
  'unit.day.many': 'days',
  'unit.night.one': 'night',
  'unit.night.few': 'nights',
  'unit.night.many': 'nights',
  'unit.time.one': 'time',
  'unit.time.few': 'times',
  'unit.time.many': 'times',
  'unit.page.one': 'page',
  'unit.page.few': 'pages',
  'unit.page.many': 'pages',

  'ramadan.title': 'Ramadan tracker',
  'ramadan.selectDay': 'Pick a day',
  'ramadan.dayTitle': 'Day {n}',
  'ramadan.currentDay': 'Today is day {n}',
  'ramadan.setStart': 'Set the Ramadan start date in Settings to track the current day.',
  'ramadan.fasting': 'Fasting',
  'ramadan.fastingYes': '✅ Fasted',
  'ramadan.fastingNo': '❌ Missed',
  'ramadan.quran': 'Quran',
  'ramadan.quranYes': '📖 Read',
  'ramadan.quranNo': '⭕ Did not read',
  'ramadan.taraweeh': 'Taraweeh',
  'ramadan.taraweehMosque': '🕌 At the mosque',
  'ramadan.taraweehHome': '🏠 At home',
  'ramadan.taraweehMissed': '❌ Missed',
  'ramadan.statsTitle': 'My Ramadan stats',
  'ramadan.stat.fasting': 'Fasted',
  'ramadan.stat.notFasting': 'Missed',
  'ramadan.stat.quran': 'Read',
  'ramadan.stat.notQuran': 'Did not read',
  'ramadan.stat.taraweehTotal': 'Taraweeh performed',
  'ramadan.stat.taraweehMosque': 'At the mosque',
  'ramadan.stat.taraweehHome': 'At home',

  'azkar.title': 'Azkar',
  'azkar.morning': 'Morning',
  'azkar.evening': 'Evening',
  'azkar.open': 'Open',
  'azkar.counter': 'Counter: {count} / {total}',
  'azkar.completed': 'Counter: ✅ Done',
  'azkar.prev': '⬅️ Back',
  'azkar.next': 'Next ➡️',
  'azkar.finish': '✅ Finish',
  'azkar.morningDone': 'Morning azkar completed ✅',
  'azkar.eveningDone': 'Evening azkar completed ✅',
  'azkar.markDone': 'Finish azkar',
  'azkar.statsTitle': 'Azkar in the last 7 days',
  'azkar.stat.morning': 'Morning',
  'azkar.stat.evening': 'Evening',
  'azkar.backToList': 'Back to list',
  'azkar.progress': '{index} of {total}',
  'azkar.total': 'Total: {n}',

  'quran.title': 'Quran',
  'quran.today': "Today's reading",
  'quran.markRead': '✅ I read',
  'quran.enterPages': '🔢 Enter pages',
  'quran.pagesLabel': 'Number of pages read',
  'quran.save': 'Save',
  'quran.readDone': '📖 Quran read ✅',
  'quran.readUndone': '❌ Quran not read',
  'quran.statsTitle': 'Quran in the last 7 days',
  'quran.stat.daysRead': 'Read',
  'quran.stat.pagesRead': 'Pages read',

  'mulk.title': 'Surah Al-Mulk',
  'mulk.toggleOn': '✅ Enable',
  'mulk.toggleOff': '❌ Disable',
  'mulk.markRead': '✅ I read it',
  'mulk.markUnread': '❌ I did not read it',
  'mulk.readDone': '🌑 Surah Al-Mulk read ✅',
  'mulk.readUndone': '🌑 Surah Al-Mulk not read ❌',
  'mulk.statsTitle': 'Al-Mulk in the last 7 days',
  'mulk.stat.daysRead': 'Read',
  'mulk.enabledHint': 'Tracker on — a reminder every evening.',
  'mulk.disabledHint': 'Enable the tracker to log your reading.',
  'mulk.virtue':
    "The Messenger of Allah ﷺ said that Surah Al-Mulk intercedes for the one who reads it until he is forgiven. Make its recitation a daily habit.",

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.ramadanStart': 'Ramadan start date',
  'settings.ramadanStartHint': 'Format: YYYY-MM-DD',
  'settings.reminders': 'Reminders',
  'settings.notifications': 'Notifications',
  'settings.enableNotifications': 'Enable reminders',
  'settings.disableNotifications': 'Disable reminders',
  'settings.permissionDenied': 'Notification permission was denied. Allow them in system settings.',
  'settings.morningAzkar': 'Morning azkar',
  'settings.eveningAzkar': 'Evening azkar',
  'settings.quranReminder': 'Quran reminder',
  'settings.mulkReminder': 'Al-Mulk reminder',
  'settings.at': '{hour}:00',
  'settings.about': 'About',
  'settings.aboutText':
    'An app inspired by the "Ramadan tracker" bot. All records and settings are stored on your device.',

  'notif.channel': 'Reminders',
  'notif.morningAzkar.title': 'Morning azkar',
  'notif.morningAzkar.body': 'Time for morning azkar 🌅',
  'notif.eveningAzkar.title': 'Evening azkar',
  'notif.eveningAzkar.body': 'Time for evening azkar 🌃',
  'notif.quran.title': 'Quran tracker',
  'notif.quran.body': 'Log your Quran reading progress 📖',
  'notif.mulk.title': 'Surah Al-Mulk',
  'notif.mulk.body': 'Did you read Al-Mulk today? 🌑',
};

const DICTIONARIES: Record<Language, Dictionary> = { ru, en };

/**
 * Runtime translation. Angular's own i18n compiles one locale into the bundle and switches by
 * restarting the JavaScript; a signal dictionary re-renders in place instead, which is what a
 * language toggle inside the app needs.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly store = inject(TrackerStore);

  readonly language = computed<Language>(() => this.store.settings().language);
  readonly languages: readonly Language[] = ['ru', 'en'];

  private dictionary(): Dictionary {
    return DICTIONARIES[this.language()];
  }

  /** `t('ramadan.dayTitle', { n: 3 })` fills `{n}` placeholders. */
  t(key: string, params?: Record<string, string | number>): string {
    const template = this.dictionary()[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      params[name] === undefined ? `{${name}}` : String(params[name]),
    );
  }

  /** A pluralised string: `count(3, 'unit.day')` gives `'дня'` / `'days'`. */
  count(value: number, key: string): string {
    if (this.language() === 'en') {
      return this.t(`${key}.${value === 1 ? 'one' : 'many'}`);
    }
    const form = getPlural(value, ['one', 'few', 'many']);
    return this.t(`${key}.${form}`);
  }
}
