/**
 * Date helpers. Everything is a local `YYYY-MM-DD` string so it sorts, compares and stores the
 * same way the tracker records do. `Date.toISOString()` is deliberately not used: it answers in
 * UTC, so a user in Moscow marks off the wrong day for three hours every night.
 */

export function localTodayIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return localTodayIso(new Date(year, month - 1, day + days));
}

/** The last `count` dates, oldest first, ending at `endIso` (today by default). */
export function lastNDates(count: number, endIso: string = localTodayIso()): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(addDays(endIso, -i));
  }
  return dates;
}

/**
 * The 1-based day of Ramadan for `todayIso`, given the date Ramadan started. A negative or zero
 * answer means Ramadan has not begun; a value past the month means it is over.
 */
export function dayOfRamadan(startIso: string, todayIso: string = localTodayIso()): number {
  const [startYear, startMonth, startDay] = startIso.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayIso.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const today = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((today - start) / 86_400_000) + 1;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

/** Russian pluralisation: `getPlural(3, ['день', 'дня', 'дней'])` gives `'дня'`. */
export function getPlural(count: number, forms: [string, string, string]): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 > 1 && mod10 < 5) return forms[1];
  if (mod10 === 1) return forms[0];
  return forms[2];
}
