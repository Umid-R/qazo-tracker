import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, type CalendarData, type CalendarMonthSummary } from '../services/api';
import PageContainer, { PageHeader, LoadingState, ErrorState } from '../components/PageContainer';

interface DayPrayers {
  [key: number]: {
    prayers: Array<{ name: string; prayed: boolean }>;
  };
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userId, setUserId] = useState<number | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initTelegramApp();
    const id = getTelegramUserId();
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    setLoading(true);
    setError(null);

    api.getCalendarData(userId, year, month)
      .then(data => {
        setCalendarData(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load calendar data');
        setLoading(false);
      });
  }, [userId, currentMonth]);

  const monthData: CalendarMonthSummary = calendarData?.monthSummary || {
    adaPrayers: 0,
    missed: 0,
    qazaDone: 0,
    mostMissedPrayer: '-',
    mostCommonReason: '-',
  };

  const daysWithPrayers: DayPrayers = calendarData?.dailyData || {};

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const previousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const isDateInPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate <= today;
  };

  const getDayBackground = (day: number) => {
    if (!isDateInPast(day)) return 'bg-surface-800/30';

    const dayData = daysWithPrayers[day];
    if (!dayData) return 'bg-surface-800/30';

    const prayedCount = dayData.prayers.filter(p => p.prayed).length;
    const missedCount = 5 - prayedCount;

    if (prayedCount === 5) return 'bg-primary-900/40';
    if (missedCount === 5) return 'bg-error-600/30';
    if (prayedCount > missedCount) return 'bg-accent-500/20';
    return 'bg-accent-600/20';
  };

  const getPrayerDots = (day: number) => {
    if (!isDateInPast(day)) return null;

    const dayData = daysWithPrayers[day];
    if (!dayData) return null;

    return (
      <div className="flex gap-1 justify-center mt-1.5">
        {dayData.prayers.map((prayer, index) => (
          <div
            key={index}
            className={`w-1 h-1 rounded-full ${
              prayer.prayed ? 'bg-primary-400' : 'bg-error-500'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Calendar" subtitle="Daily prayer history" />
        <LoadingState />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Calendar" subtitle="Daily prayer history" />
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Calendar" subtitle="Daily prayer history" />

      {/* Month Summary */}
      <div className="bg-gradient-to-br from-secondary-900/30 to-secondary-800/20 rounded-2xl p-6 border border-secondary-700/40 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{monthName} Summary</h2>
          <div className="flex gap-2">
            <button onClick={previousMonth} className="p-2 hover:bg-secondary-700/30 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-secondary-700/30 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-400 mb-1">{monthData.adaPrayers}</div>
            <p className="text-xs text-surface-400 uppercase font-semibold">Ada Prayers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-error-400 mb-1">{monthData.missed}</div>
            <p className="text-xs text-surface-400 uppercase font-semibold">Missed</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">{monthData.qazaDone}</div>
            <p className="text-xs text-surface-400 uppercase font-semibold">Qaza Done</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-secondary-700/30">
          <div className="flex justify-between items-center">
            <span className="text-surface-400">Most missed prayer</span>
            <span className="text-surface-100 font-semibold">{monthData.mostMissedPrayer}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-surface-400">Most common reason</span>
            <span className="text-surface-100 font-semibold">{monthData.mostCommonReason}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card p-6 animate-slide-up">
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="text-center text-xs font-semibold text-surface-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}
            {days.map(day => (
              <div
                key={day}
                className={`aspect-square ${getDayBackground(day)} rounded-full border border-surface-700/40 flex flex-col items-center justify-center p-2 hover:border-secondary-600/50 transition-colors cursor-pointer`}
              >
                <span className="text-sm font-semibold">{day}</span>
                {getPrayerDots(day)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-700/30">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Indicators:</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-400"></div>
              <span className="text-xs text-surface-400">Ada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-error-500"></div>
              <span className="text-xs text-surface-400">Missed</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
