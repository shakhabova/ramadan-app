# Ramadan tracker

An app version of the [Ramadan tracker Telegram bot](../ramadan-tracker), built with
[Angular Native](https://ng-native.com): Angular components rendering real native iOS and Android
views, inside an Expo app, with React never in the render path.

## What it does

A short onboarding leads into five tabs:

- **Сегодня / Today** - the daily reflection first, a shareable PNG reminder card, and quick fasting,
  Quran and taraweeh check-ins.
- **Азкары / Azkar** - the morning and evening azkar, read one at a time with the per-azkar counter,
  a completion mark and weekly stats.
- **Коран / Quran** - read / not read / unmarked, an optional page or juz count, and the switchable
  Al-Mulk tracker.
- **Прогресс / Progress** - a 29/30-day history calendar, editable daily records, and separate monthly
  totals for fasting, taraweeh and Quran, including unmarked days.
- **Настройки / Settings** - language, local Ramadan start date and length, individually configured
  local reminders, and feedback by email.

## Commands

```sh
npm start           # Metro; press i or a for a simulator, or scan the QR code with Expo Go
npm run ios         # the iOS simulator
npm run android     # the Android emulator
npm test            # Vitest, in Node against a fake native layer: no simulator needed
npm run typecheck
```

## Reminders and PNG sharing need a real build

The app schedules **local notifications** (`expo-notifications`) and captures reminder cards with
`react-native-view-shot`, sharing the PNG through `expo-sharing`. Run it from a development or
preview build rather than Expo Go; in Expo Go, sharing falls back to text. The quickest route builds in Expo's cloud — no Android SDK or
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
    app.ts                    onboarding and the five-tab shell
    shared/theme.css          the shared dark green/gold theme
    core/
      state.ts                the domain model, synced trackers and statistics
      i18n.ts                 runtime Russian/English dictionaries
      dates.ts                local dates, the day of Ramadan, pluralisation
      reminders.ts            the serialised local notification schedule
      share-card.ts           reminder view capture and PNG sharing
    features/
      onboarding/             introduction and initial preferences
      today/                  daily reflection and quick check-ins
      ramadan/                history calendar, day editor and daily messages
      azkar/                  the azkar reader and its content
      quran/                  the Quran and Al-Mulk trackers
      feedback/               categorized email feedback
      settings/               language, month and reminder settings
```

`AGENTS.md` explains how Angular Native differs from the web Angular a coding agent knows.
