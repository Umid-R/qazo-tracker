import { BarChart3, Calendar, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const weeklyActivity = [
    { day: 'S', active: true },
    { day: 'M', active: true },
    { day: 'T', active: false },
    { day: 'W', active: true },
    { day: 'T', active: false },
    { day: 'F', active: true },
    { day: 'S', active: false },
  ];

  const prayerBreakdown = [
    { name: 'Fajr', count: 310 },
    { name: 'Dhuhr', count: 295 },
    { name: 'Asr', count: 260 },
    { name: 'Maghrib', count: 210 },
    { name: 'Isha', count: 173 },
  ];

  const maxCount = Math.max(...prayerBreakdown.map(p => p.count));
  const totalQazaRemaining = 124;
  const completedToday = 2;
  const dailyGoal = 4;
  const progressPercent = (completedToday / dailyGoal) * 100;

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Assalamu Alaikum</h1>
          <p className="text-gray-400 text-base">Let's make up what we missed</p>
        </header>

        <div className="bg-gradient-to-br from-teal-900/40 to-teal-800/20 rounded-3xl p-8 border border-teal-700/40 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-center">
            <div className="inline-block bg-emerald-500/20 px-3 py-1 rounded-full mb-4">
              <p className="text-emerald-300 text-xs font-semibold">Qaza Backlog</p>
            </div>
            <h2 className="text-7xl font-bold mb-2">{totalQazaRemaining}</h2>
            <p className="text-gray-400 text-sm mb-8">prayers remaining</p>

            <div className="h-px bg-teal-700/40 mb-8"></div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-300 text-sm">Today's Progress</p>
                  <p className="text-emerald-400 text-sm font-semibold">{completedToday}/{dailyGoal}</p>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="group bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-1">
            <div className="group-hover:scale-110 transition-transform">
              <BarChart3 size={32} strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg">View Stats</span>
          </button>
          <button className="group bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-1">
            <div className="group-hover:scale-110 transition-transform">
              <Calendar size={32} strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg">Calendar</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30 hover:border-emerald-600/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Today's Qaza Goal</h3>
            <Zap size={20} className="text-emerald-400" />
          </div>
          <p className="text-gray-400 text-sm mb-4">{dailyGoal - completedToday} prayers remaining</p>
          <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-emerald-400 text-sm font-medium">{completedToday} of {dailyGoal} completed</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30 hover:border-teal-600/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Weekly Consistency</h3>
            <div className="text-emerald-400 text-sm font-semibold">4/7 days</div>
          </div>
          <p className="text-gray-400 text-sm mb-5">Active last 7 days</p>
          <div className="flex gap-2">
            {weeklyActivity.map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className={`flex-1 w-full rounded-lg transition-all ${
                    item.active
                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30'
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                  style={{ height: '40px' }}
                ></div>
                <span className="text-xs text-gray-400 font-medium">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-emerald-400" />
            <h3 className="text-lg font-semibold">Your Journey</h3>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4 mb-6 space-y-3 border border-gray-700/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Started:</span>
              <span className="text-emerald-400 font-semibold">12 May</span>
            </div>
            <div className="h-px bg-gray-700/30"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Most missed:</span>
              <span className="text-red-400 font-semibold">Fajr</span>
            </div>
          </div>

          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4 font-semibold">Qaza Breakdown</p>

          <div className="space-y-3">
            {prayerBreakdown.map((prayer) => (
              <div key={prayer.name} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm w-16 font-medium">{prayer.name}</span>
                <div className="flex-1 bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                    style={{ width: `${(prayer.count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <span className="text-emerald-400 text-sm font-semibold w-10 text-right">{prayer.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
