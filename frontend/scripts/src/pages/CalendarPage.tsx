import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 11)); // December

  const monthData = {
    adaPrayers: 40,
    missed: 8,
    qazaDone: 2,
    mostMissedPrayer: 'Fajr',
    mostCommonReason: 'Sleep',
  };

  const daysWithActivity = {
    1: { ada: true, missed: false, qaza: false },
    2: { ada: true, missed: false, qaza: false },
    3: { ada: true, missed: false, qaza: false },
    4: { ada: false, missed: true, qaza: false },
    5: { ada: true, missed: false, qaza: false },
    6: { ada: true, missed: false, qaza: false },
    7: { ada: true, missed: false, qaza: false },
    8: { ada: true, missed: false, qaza: false },
    9: { ada: true, missed: false, qaza: false },
    10: { ada: true, missed: false, qaza: false },
    3: { ada: true, missed: false, qaza: false },
    4: { ada: false, missed: true, qaza: true },
    5: { ada: true, missed: false, qaza: false },
    6: { ada: true, missed: false, qaza: false },
    7: { ada: true, missed: false, qaza: false },
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const getActivityDots = (day: number) => {
    const activity = daysWithActivity[day as keyof typeof daysWithActivity];
    if (!activity) return null;

    return (
      <div className="flex gap-0.5 justify-center">
        {activity.ada && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
        {activity.missed && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
        {activity.qaza && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Calendar</h1>
          <p className="text-gray-400 text-base">Daily prayer history</p>
        </header>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{monthName}</h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-4 mb-6 border border-gray-700/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {monthData.adaPrayers}
                </div>
                <p className="text-sm text-gray-400">Ada Prayers</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {monthData.missed}
                </div>
                <p className="text-sm text-gray-400">Missed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500 mb-1">
                  {monthData.qazaDone}
                </div>
                <p className="text-sm text-gray-400">Qaza Done</p>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Most missed prayer</span>
              <span className="text-white font-medium">{monthData.mostMissedPrayer}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Most common reason</span>
              <span className="text-white font-medium">{monthData.mostCommonReason}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square"></div>
              ))}
              {days.map((day) => (
                <div
                  key={day}
                  className="aspect-square bg-gray-800/40 rounded-lg border border-gray-700/30 flex flex-col items-center justify-between p-1.5 hover:bg-gray-800/60 transition-colors"
                >
                  <span className="text-sm font-medium">{day}</span>
                  {getActivityDots(day)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700/30">
            <p className="text-sm font-medium text-gray-300 mb-3">Indicators:</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-400">Ada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-400">Missed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-gray-400">Qaza</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
