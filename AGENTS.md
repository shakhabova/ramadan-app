# AGENTS.md

This is an Angular app rendering real native iOS and Android views with
[Angular Native](https://ng-native.com): Angular components on React Native's Fabric renderer,
inside an Expo app. It is not a web app and not React: there is no DOM and no JSX.

The whole documentation, for reading before a change: https://ng-native.com/llms-full.txt. An
outline with a line per page: https://ng-native.com/llms.txt.

Angular's own rules apply as well: https://angular.dev/assets/context/best-practices.md. Its
browser-only parts do not: there is no `NgOptimizedImage` (use `<image>`), and no AXE
(accessibility is the props below). Where the two disagree, this file wins.

## Commands

```sh
npm start           # Metro; press i or a for a simulator, or scan the QR code with Expo Go
npm run ios         # the iOS simulator
npm run android     # the Android emulator
npm run build:android      # EAS cloud build -> installable APK (preview)
npm run build:android:dev  # EAS cloud build -> development build that connects to Metro
npm test            # Vitest, in Node against a fake native layer: no simulator needed
npm run typecheck
```

`src/main.ts` mounts the root component, `src/app/app.ts`. Run `npm test` and `npm run typecheck` after a
change; both are fast.

## Rules that are easy to get wrong

- **Element names are lowercase:** `<view>`, `<text>`, `<pressable>`, `<scroll-view>`,
  `<text-input>`, `<image>`, `<switch>`, `<safe-area-view>`, `<virtual-list>`, `<modal>`. Each is
  imported from `@ng-native/components` into the component's `imports`, like any Angular
  component: `imports: [View, Text]`. `<View>` compiles to an empty template, and an element used
  without its import renders as a plain view.
- **There is no DOM.** No `document`, no `window`, no `<button>`, `<a>`, `<input>` or `<img>`, no
  `@angular/platform-browser`, and no `@angular/animations`. Use the native elements above. HTML's
  text elements (`p`, `span`, `h1`, `strong`) draw as text and its layout elements (`div`,
  `section`, `ul`) as plain views, with none of a browser's default styles.
- **A component's host is a flex item.** `<app-case-list />` commits as a view of its own, with no
  `flex`, so a `flex: 1` scroll view inside it gets a height of zero and shows nothing. A component
  that fills the space it is given sets `host: { style: 'flex: 1' }` (or `:host { flex: 1; }`).
- **Text is drawn in a text element.** `<text>` is the one with inputs and outputs (`numberOfLines`,
  `(press)`). `p`, `span` and the other HTML text elements are text while they hold only text and
  other text elements; one that holds a view is a view. Text written straight into a view is given
  a paragraph of its own, one per run, and never flows inline with the elements beside it.
- **Events are native:** `(press)` on `<pressable>`, not `(click)`; `[(value)]` or `(changeText)` on
  `<text-input>`; `(scroll)`, `(layout)`. A pressable text is `<text pressable (press)="...">`.
- **Signals, zoneless, AOT.** State is signals and `computed()`; there is no zone.js, so nothing
  updates from a plain field changing outside a signal or an event.
- **No backticks inside an inline template**, even in an HTML comment: they end the template string
  and the build fails with a misleading parse error.
- **Accessibility is props:** `accessibilityRole="button"`, `accessibilityLabel`,
  `[accessibilityState]`. The web spellings work too, as aliases: `role`, and the `aria-*` names
  React Native maps (`aria-label`, `aria-checked`, `aria-hidden` and so on). Screen readers and
  the testing library's `getByRole` both read them.

## Styling

- `[style]` takes a React Native style object: camelCase keys, numbers in points
  (`{ padding: 16, backgroundColor: #fff }`).
- A component's `styles` is real CSS, compiled at build time: type, class, id and attribute
  selectors, combinators, `:host`, `@media`, custom properties, transitions and `@keyframes`.
  Grid, float, `::before`/`::after`, `:hover` and `:focus-visible` are dropped with a build
  warning naming the file, line and reason - lay out with flexbox, and drive a hover or focus look
  from a bound attribute. Everything is `display: flex`
  with `flex-direction: column` by default, as in React Native.
- Tailwind v4 works through `@ng-native/tailwind`, with `ios:`, `android:` and `dark:` variants.

## Lists, navigation, forms

- A long list is `<virtual-list>`: `@for (row of list.window(); track row.slot)` recycles rows as
  they scroll. `<scroll-view>` renders everything, so keep it for short content.
- Navigation is `@angular/router` on native stacks and tabs: `provideNativeRouter(routes)` from
  `@ng-native/router` in `mount`'s `providers`, and `<native-stack-outlet />` in a template. Add
  `withComponentInputBinding()` from `@angular/router` for route params to arrive as inputs, in
  tests too.
- Forms are Signal Forms (`@angular/forms/signals`), with `[formField]` on `<text-input>` and
  `<switch>`.
- HTTP needs `provideNativeHttpClient()` from `@ng-native/platform/http`, not `provideHttpClient()`.

## Tests

`app.test.ts` shows the shape: `render(Component)`, then query with `screen.getByRole`,
`getByText` or `getByTestId` (which matches `nativeID` and `testID`), and act with
`userEvent.setup().press(...)` or `.type(...)`, all from `@ng-native/testing`. Tests run in Node
with no simulator, so write one alongside a change.

---

# Project: Ramadan tracker app

## What this app is

This is the **mobile app version of the "Ramadan tracker" Telegram bot**. The original bot is a
grammy bot on Supabase, and its source lives in `~/ramadan-tracker`. That directory is the
reference for product behaviour and for all copy: **when in doubt, match the bot.**

The audience is Russian-speaking Muslims tracking worship through Ramadan: fasting, Quran
reading, taraweeh prayers, and morning/evening adhkar (azkar).

## How the app differs from the bot

| Bot (Telegram) | App |
|---|---|
| Identity is a Telegram user id | No account at all; data lives on the device |
| Supabase is the single store | Device storage, no network |
| Sends you scheduled messages | Local notifications you schedule |
| Inline keyboards | Native tabs, scrolls, pressables |
| Cron jobs on a server | `expo-notifications` daily triggers |

So the app drops everything tied to Telegram or to a server: admin broadcasts, the support
inbox that forwarded to a group, remote push, and FCM.

## What is in it (current scope)

A short onboarding explains the trackers and saves the language, local Ramadan start date, 29/30-day
month length and reminder time. The main shell then has five tabs:

1. **Сегодня / Today** — the daily reflection first, with a shareable PNG card; three quick trackers
   for fasting, Quran and taraweeh; progress and feedback shortcuts.
2. **Азкары / Azkar** — morning and evening sets. The reader steps one azkar at a time, keeps a
   per-azkar counter (some are said 3, 10 or 100 times), and finishing marks the set done for today.
   Weekly stats.
3. **Коран / Quran** — read / not read / unmarked, plus an optional page **or** juz count (one
   replaces the other). Weekly stats and the switchable **Al-Mulk** tracker.
4. **Прогресс / Progress** — the 29/30-day history calendar, an editor for one day at a time, and
   separate fasting, taraweeh and Quran totals including unmarked days.
5. **Настройки / Settings** — language, local Ramadan start and length, individually enabled reminder
   types and times, notification permission, and feedback.

There is no dua tracker and no account system. Feedback opens the user's email app; records remain
on the device.

Religious texts are shown exactly as the bot has them — Arabic, Russian translation and
transliteration together, in one block.

## Version matrix

Pinned in `package.json`; keep them in step.

| Package | Version |
|---|---|
| Expo | ~58.0.22 |
| `react-native` | 0.88.1 |
| `react` | 19.3.0 |
| `@ng-native/*` | 0.19.2 — **always one version across all @ng-native packages** |
| Angular (`core`, `common`, `compiler-cli`) | ^22 |

## Layout

```
src/
  main.ts                       registers the runnable; mount(...) + watchConditions(app.engine)
  app/
    app.ts                      onboarding, safe-area shell + five-tab bar
    shared/
      theme.css                  shared dark green/gold native styles
    core/
      state.ts                  AppState model, TrackerStore, synced trackers and stats
      i18n.ts                    ru/en dictionaries, t() and count()
      dates.ts                  local ISO dates, day of Ramadan, plurals
      reminders.ts               serialised daily local-notification schedule
      share-card.ts              native view capture + PNG system share
    features/
      onboarding/
        onboarding-screen.ts     introduction and initial preferences
      today/
        today-screen.ts          daily reflection + three quick trackers
      ramadan/
        ramadan-screen.ts        history calendar, day editor and monthly totals
        daily-messages.ts        the bot's day 1..30 reflections
      azkar/
        azkar-screen.ts         menu + reader with counter
        azkars.ts                morning/evening azkar texts
      quran/
        quran-screen.ts         Quran pages/juz + Al-Mulk tracker
      feedback/
        feedback-screen.ts      categorized email feedback form
      settings/
        settings-screen.ts      language, month, reminder types and times
        hour-field.ts            −/+ hour stepper
```

There is **no `app.routes.ts`**: navigation here is a `tab` signal in `app.ts` that swaps a
screen in and out, not `@angular/router`.

## Data model (`core/state.ts`)

```ts
interface AppState {
  settings: AppSettings;              // see below
  ramadan: Record<number, DayRecord>;  // keyed by day of Ramadan, 1..30
  azkar: Record<string, AzkarDay>;     // keyed by 'YYYY-MM-DD'
  quran: Record<string, QuranDay>;
  mulk: Record<string, boolean>;
}

interface AppSettings {
  language: 'ru' | 'en';
  onboardingCompleted: boolean;       // default false
  ramadanStart: string | null;        // local 'YYYY-MM-DD', null until set
  ramadanLength: 29 | 30;             // default 30
  morningAzkarHour: number;           // default 5
  eveningAzkarHour: number;           // default 17
  azkarRemindersEnabled: boolean;     // default true
  trackerReminderEnabled: boolean;    // default true
  trackerReminderHour: number;        // default 20
  quranReminderEnabled: boolean;      // default true
  quranReminderHour: number;          // default 21
  taraweehReminderEnabled: boolean;   // default false
  taraweehReminderHour: number;       // default 22
  mulkEnabled: boolean;               // default false
  mulkReminderHour: number;           // default 22
  notificationsEnabled: boolean;      // default false; master OS permission switch
}
```

`TaraweehStatus` is the bot's own encoding, kept so a future backend matches: `0` missed,
`1` at home, `2` at the mosque.

Quran marks are synced by `TrackerStore`: changing the Ramadan-day record updates the corresponding
local-date record and vice versa. `QuranDay` stores either `pages` or `juz`, never both, so progress
is not double-counted. `settings()` merges stored settings with `DEFAULT_SETTINGS` to migrate older
saved states without a storage-version change.

### The persistence seam (read this before touching storage)

`TrackerStore` injects the **`Storage` injection token** from
`@ng-native/expo/async-storage` — never AsyncStorage directly. `Storage` is a token
over the `Store` class, so:

- a device binds it to the key-value file,
- a test leaves it empty and every read resolves to `null`,
- a **Supabase-backed `Store`** can be provided in its place later without touching
  the tracker code.

To go to Supabase later: implement `NativeStore` (`get`/`set`/`remove`, optional `getSync`)
against the bot's tables — `users`, `daily_records`, `stats` (a view),
`azkar_records`, `quran_records`, `mulk_records` — with a device-generated user id in
place of the Telegram one. See `~/ramadan-tracker/db.ts` and `db_changes.sql`.

## Localization

UI text lives in `core/i18n.ts` — two dictionaries, `ru` (default) and `en`, selected by
`settings.language`. `t(key, params)` fills `{placeholders}`; `count(n, key)` picks the right
plural form (`key.one`/`key.few`/`key.many`; English uses `one`/`many`).

A missing key returns the key itself, so typos show up on screen rather than crashing. Add **both**
languages whenever you add a string.

Religious content (verses, adhkar, duas) is **deliberately not translated** — it keeps the Arabic
with the Russian rendering and transliteration from the bot.

## Reminders

`core/reminders.ts` cancels every scheduled notification and rebuilds it from the current
settings, once daily per enabled type. Rebuild requests are serialised inside `Reminders`, so a
settings burst cannot leave duplicate or empty schedules. Every notification's `data` includes its
`category`, `source` and current Ramadan `day`. Native daily repeats survive device restarts.

`App`'s constructor calls `configure()` and wires an `effect` on `settings()` and `AppState.active()`:
the schedule is rebuilt after stored settings load, after a settings change, and when returning from
the background (including after a timezone change). Do not schedule from a screen's own handler as
well; changing a setting and letting the effect run is enough.

`configure()` calls `setChannel` unconditionally. It resolves to `null` on iOS, which is why the
code does not branch on `Platform` — importing `react-native` pulls its Flow source into the test
runner and breaks `npm test`.

## Conventions

- **Signals only.** Screens inject `TrackerStore`; state changes go through its methods
  (`patchSettings`, `updateDay`, `updateAzkar`, `updateQuran`, `updateMulk`). No plain mutable fields.
- **Screens are standalone components** with `host: { style: 'flex: 1' }` and a `<scroll-view>` at
  the top of the template.
- **Queries need a role.** Every `<pressable>` sets `accessibilityRole="button"` and usually
  `accessibilityLabel`, because that is both the accessibility name and what `getByRole` matches.
- **Russian pluralisation** goes through `getPlural` / `i18n.count`, never a hand-built branch.

## Gotchas in this repo

1. **The config plugin needs its file path.** In `app.json` it is
   `"@ng-native/metro/app.plugin.cjs"`, not `"@ng-native/metro"`. Expo's resolver does not probe
   `app.plugin.cjs` through the package name, falls back to the package `main` (a Metro
   transformer), and rejects it. The symptom is a config error from `eas` tools and
   `expo config --type prebuild`.
2. **Never import `react-native` in app code.** It pulls Flow-typed sources into Vitest and the
   suite fails to parse.
3. **`eas-cli` must not be a project dependency.** It drags in a transitive package that wants
   TypeScript `^5` against this project's TypeScript 6; npm 10 (what EAS uses) rejects the tree and
   `eas build` dies in Install dependencies. Run it as `npx --yes eas-cli@latest` — that is what
   `npm run build:android` does.
4. **`android/` is generated and gitignored**, and the copy on disk is stale (old
   `com.anonymous.ramadanapp`). Run `npx expo prebuild --clean -p android` before a local native
   build. EAS builds ignore it.
5. **`extra.router` in `app.json` is vestigial** from `create-expo-app`'s Expo Router template.
   This app has no router. Harmless, but do not read it as intent.
6. **`expo-notifications` needs a real build.** Expo Go runs the app but reminders are unreliable
   there. For iOS, Expo Go also requires the same Expo account in the CLI and in Expo Go —
   there is no per-organization exception.
7. **PNG sharing needs `react-native-view-shot` and `expo-sharing` in the native build.** `ShareCard`
   loads both through `expoModule()` so Vitest never parses React Native's Flow source. In Expo Go or
   Node it falls back to sharing the reflection as text.

## Running it on a device

- **Fastest:** `npm start` (or `npx expo start --tunnel` if the phone is off the LAN) and scan
  the QR. Trackers work fully; reminders do not.
- **With reminders:** `npm run build:android` and install the APK. For a physical iPhone, an iOS build
  additionally needs the Apple Developer Program plus `eas device:register`.

Building locally needs the Android SDK and **JDK 17** (`/usr/lib/jvm/java-17-openjdk` is
installed here; the default `java` is newer). `adb` and `ANDROID_HOME` are not set up on this machine.

## Always do after a change

```sh
npm run typecheck
npm test
```

Both are quick, and both must be green. Add a test next to whatever you changed — `npm test`
expects one.
