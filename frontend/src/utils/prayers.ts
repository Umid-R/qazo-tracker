export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export type PrayerName = (typeof PRAYER_NAMES)[number];

export const REASONS = ['Sleep', 'Work/Study', 'Travel', 'Health', 'Forgot', 'Voice Message', 'Other'] as const;

export function createPrayerArray<T>(factory: (name: PrayerName) => T): T[] {
  return PRAYER_NAMES.map(factory);
}
