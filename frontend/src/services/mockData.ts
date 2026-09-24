import type {
  QazaTotal,
  QazaBreakdown,
  PrayerStats,
  WeeklyActivity,
  CalendarData,
  UserInfo,
  Quote,
  ApiResponse,
} from './api';

const MOCK_USER_ID = 12345;

const mockQazaTotal: QazaTotal = { total_qazas: 47 };

const mockQazaBreakdown: QazaBreakdown = {
  fajr: 15,
  dhuhr: 8,
  asr: 10,
  maghrib: 5,
  isha: 9,
};

const mockPrayerStats: PrayerStats = {
  completed_today: 3,
  daily_goal: 5,
  cleared_this_week: 12,
  total_prayers_logged: 847,
  current_streak: 23,
};

const mockWeeklyActivity: WeeklyActivity[] = [
  { day: 'Mon', active: true },
  { day: 'Tue', active: true },
  { day: 'Wed', active: false },
  { day: 'Thu', active: true },
  { day: 'Fri', active: true },
  { day: 'Sat', active: true },
  { day: 'Sun', active: false },
];

const mockUserInfo: UserInfo = { name: 'Ahmed' };

const mockQuotes: Quote[] = [
  { quote: 'And whoever fears Allah — He will make for him ease in his affairs.' },
  { quote: 'The most beloved of deeds to Allah are those done consistently, even if they are small.' },
  { quote: 'Verily, with hardship comes ease.' },
  { quote: 'The one who is grateful to Allah is the one who benefits from His blessings.' },
];

function buildMockCalendarData(year: number, month: number): CalendarData {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyData: { [day: number]: { prayers: Array<{ name: string; prayed: boolean }> } } = {};

  const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) continue;

    const seed = (day * 7 + month * 13) % 5;
    const prayedCount = seed === 0 ? 5 : seed === 1 ? 2 : 4;

    dailyData[day] = {
      prayers: prayerNames.map((name, i) => ({
        name,
        prayed: i < prayedCount,
      })),
    };
  }

  return {
    year,
    month,
    userId: MOCK_USER_ID,
    dailyData,
    monthSummary: {
      adaPrayers: 87,
      missed: 18,
      qazaDone: 12,
      mostMissedPrayer: 'Fajr',
      mostCommonReason: 'Sleep',
    },
  };
}

export const mockApi = {
  getUserInfo: async (): Promise<UserInfo> => mockUserInfo,

  getTotalQaza: async (): Promise<QazaTotal> => mockQazaTotal,

  getQazaBreakdown: async (): Promise<QazaBreakdown> => mockQazaBreakdown,

  getPrayerStats: async (): Promise<PrayerStats> => mockPrayerStats,

  getWeeklyActivity: async (): Promise<WeeklyActivity[]> => mockWeeklyActivity,

  logAdaPrayer: async (): Promise<ApiResponse> => ({
    success: true,
    message: 'Ada prayers saved successfully!',
  }),

  logQazaPrayer: async (): Promise<ApiResponse> => ({
    success: true,
    message: 'Qaza prayers saved successfully!',
  }),

  markQazasPrayed: async (): Promise<ApiResponse> => ({
    success: true,
    message: 'Qaza prayers marked as prayed!',
  }),

  getQuote: async (): Promise<Quote> => {
    const index = Math.floor(Math.random() * mockQuotes.length);
    return mockQuotes[index];
  },

  getCalendarData: async (_userId: number, year: number, month: number): Promise<CalendarData> =>
    buildMockCalendarData(year, month),
};
