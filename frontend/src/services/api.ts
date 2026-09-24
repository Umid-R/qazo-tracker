import { mockApi } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Use mock data when no backend URL is configured or when running in preview
const USE_MOCK = !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCK === 'true';

export interface QazaTotal {
  total_qazas: number;
}

export interface QazaBreakdown {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerStats {
  completed_today: number;
  daily_goal: number;
  cleared_this_week: number;
  total_prayers_logged: number;
  current_streak: number;
}

export interface WeeklyActivity {
  day: string;
  active: boolean;
}

export interface MonthSummary {
  ada_prayers: number;
  missed: number;
  qaza_done: number;
  most_missed_prayer: string;
  most_common_reason: string;
}

export interface UserInfo {
  name: string;
}

export interface Quote {
  quote: string;
}

export interface CalendarDayData {
  prayers: Array<{ name: string; prayed: boolean }>;
}

export interface CalendarMonthSummary {
  missed: number;
  qazaDone: number;
  adaPrayers: number;
  mostCommonReason: string;
  mostMissedPrayer: string;
  completionRate?: number;
}

export interface CalendarData {
  year: number;
  month: number;
  userId: number;
  dailyData: { [day: number]: CalendarDayData };
  monthSummary: CalendarMonthSummary;
}

export interface AdaPrayerLog {
  prayer: string;
  status: 'completed' | 'missed';
  reason?: string;
}

export interface LogAdaPayload {
  prayers: AdaPrayerLog[];
}

export interface LogQazaPayload {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

export const api = {
  async getUserInfo(userId: number): Promise<UserInfo> {
    if (USE_MOCK) return mockApi.getUserInfo();
    const response = await fetch(`${API_BASE_URL}/qaza/user_info/${userId}`);
    return handleResponse(response);
  },

  async getTotalQaza(userId: number): Promise<QazaTotal> {
    if (USE_MOCK) return mockApi.getTotalQaza();
    const response = await fetch(`${API_BASE_URL}/qaza/total/${userId}`);
    return handleResponse(response);
  },

  async getQazaBreakdown(userId: number): Promise<QazaBreakdown> {
    if (USE_MOCK) return mockApi.getQazaBreakdown();
    const response = await fetch(`${API_BASE_URL}/qaza/breakdown/${userId}`);
    return handleResponse(response);
  },

  async getPrayerStats(userId: number): Promise<PrayerStats> {
    if (USE_MOCK) return mockApi.getPrayerStats();
    const response = await fetch(`${API_BASE_URL}/qaza/stats/${userId}`);
    return handleResponse(response);
  },

  async getWeeklyActivity(userId: number): Promise<WeeklyActivity[]> {
    if (USE_MOCK) return mockApi.getWeeklyActivity();
    const response = await fetch(`${API_BASE_URL}/qaza/activity/weekly/${userId}`);
    return handleResponse(response);
  },

  async getMonthSummary(userId: number, year: number, month: number): Promise<MonthSummary> {
    if (USE_MOCK) return { ada_prayers: 87, missed: 18, qaza_done: 12, most_missed_prayer: 'Fajr', most_common_reason: 'Sleep' };
    const response = await fetch(`${API_BASE_URL}/qaza/calendar/summary/${userId}?year=${year}&month=${month}`);
    return handleResponse(response);
  },

  async logAdaPrayer(userId: number, payload: LogAdaPayload): Promise<ApiResponse> {
    if (USE_MOCK) return mockApi.logAdaPrayer();
    const response = await fetch(`${API_BASE_URL}/qaza/log/ada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    return handleResponse(response);
  },

  async logQazaPrayer(userId: number, payload: LogQazaPayload): Promise<ApiResponse> {
    if (USE_MOCK) return mockApi.logQazaPrayer();
    const response = await fetch(`${API_BASE_URL}/qaza/log/qaza`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    return handleResponse(response);
  },

  async markQazasPrayed(userId: number, payload: LogQazaPayload): Promise<ApiResponse> {
    if (USE_MOCK) return mockApi.markQazasPrayed();
    const response = await fetch(`${API_BASE_URL}/qaza/mark_prayed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...payload }),
    });
    return handleResponse(response);
  },

  async getQuote(): Promise<Quote> {
    if (USE_MOCK) return mockApi.getQuote();
    const response = await fetch(`${API_BASE_URL}/qaza/quotes`);
    return handleResponse(response);
  },

  async getCalendarData(userId: number, year: number, month: number): Promise<CalendarData> {
    if (USE_MOCK) return mockApi.getCalendarData(userId, year, month);
    const response = await fetch(`${API_BASE_URL}/qaza/calendar/${userId}?year=${year}&month=${month}`);
    return handleResponse(response);
  },
};
