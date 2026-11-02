# Ramadan tracker

An app version of the [Ramadan tracker Telegram bot](../ramadan-tracker), built with
[Angular Native](https://ng-native.com): Angular components rendering real native iOS and Android
views, inside an Expo app, with React never in the render path.

## What it does

Four tabs carry the bot's core trackers:

- **Рамадан / Ramadan** - the day-by-day tracker: fasting, Quran reading and taraweeh (mosque, home
  or missed) for any day of the month, with the bot's statistics and a daily reflection.
- **Азкары / Azkar** - the morning and evening azkar, read one at a time with the per-azkar counter,
  a completion mark and weekly stats.
- **Коран / Quran** - the daily Quran tracker (read / not read / a page count) and the Al-Mulk
  tracker, which can be switched on and marked read each night.
- **Настройки / Settings** - language (Russian or English), the Ramadan start date, and local
  reminders for the morning and evening azkar, the Quran and Al-Mulk.

## Commands

```sh
npm start           # Metro; press i or a for a simulator, or scan the QR code with Expo Go
npm run ios         # the iOS simulator
npm run android     # the Android emulator
npm test            # Vitest, in Node against a fake native layer: no simulator needed
npm run typecheck
```

## Reminders need a real build

The app schedules **local notifications** (`expo-notifications`), so run it from a development or
preview build rather than Expo Go. The quickest route builds in Expo's cloud — no Android SDK or
Xcode needed:

```sh
npm run build:android        # eas build -p android --profile preview  -> an installable APK
```

`eas build` prints a link; open it on the phone to install. The `preview` build has the JavaScript
bundled in, so it runs on its own with no Metro server. The first build asks EAS to create an
Android keystore, which it then keeps for you (this is why the project is linked to an EAS account
via `extra.eas.projectId` in `app.json`).

Other profiles in `eas.json`:

- `npm run build:android:dev` — a **development build** that connects to Metro, for fast reload.
  It needs `npx expo install expo-dev-client` once first.
- `eas build -p android --profile production` — an `.aab` for the Play Store.

For a fully local build instead, install the Android SDK and a **JDK 17**, connect a phone with USB
debugging on, then `npx expo run:android --device`.

## Where the data lives

Every record and setting is persisted through the `Storage` token from `@ng-native/expo/async-storage`
(AsyncStorage on device), under one key. The app depends on the token rather than on AsyncStorage
directly, so a Supabase-backed `Store` - to share data with the bot - can be provided in its place
without touching the trackers.

## Layout

```
src/
  main.ts                     mounts the root component
  app/
    app.ts                    the tab shell
    core/
      state.ts                the domain model, the store and the weekly stats
      i18n.ts                 runtime Russian/English dictionaries
      dates.ts                local dates, the day of Ramadan, pluralisation
      reminders.ts            the local notification schedule
    features/
      ramadan/                the day tracker and the daily messages
      azkar/                  the azkar reader and its content
      quran/                  the Quran and Al-Mulk trackers
      settings/               language, start date and reminder times
```

`AGENTS.md` explains how Angular Native differs from the web Angular a coding agent knows.
