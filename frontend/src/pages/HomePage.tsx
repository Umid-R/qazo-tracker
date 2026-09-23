import { BarChart3, Calendar, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, QazaBreakdown, PrayerStats, WeeklyActivity } from '../services/api';

export default function HomePage({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const [totalQazaRemaining, setTotalQazaRemaining] = useState<number | null>(null);
  const [qazaBreakdown, setQazaBreakdown] = useState<QazaBreakdown | null>(null);
  const [prayerStats, setPrayerStats] = useState<PrayerStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);


  useEffect(() => {
    async function fetchQuote() {
      try {
        const quoteData = await api.getQuote();
        setQuote(quoteData.quote);
      } catch (err) {
        console.error('Failed to fetch quote', err);
        setQuote('And whoever fears Allah — He will make for him ease in his affairs.');
      } finally {
        setQuoteLoading(false);
      }
    }

    async function fetchData() {
      initTelegramApp();
      const userId = getTelegramUserId();

      if (!userId) {
        setError('Unable to get Telegram user ID');
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.allSettled([
        api.getTotalQaza(userId),
        api.getQazaBreakdown(userId),
        api.getPrayerStats(userId),
        api.getWeeklyActivity(userId),
        ]);
        
        const [totalQaza, breakdown, stats, activity] = results.map(r =>
          r.status === 'fulfilled' ? r.value : null
        );

        setTotalQazaRemaining(totalQaza?.total_qazas ?? 0);
        setQazaBreakdown(breakdown);
        setPrayerStats(stats);
        setWeeklyActivity(activity ?? []);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    fetchQuote();
  }, []);

  const prayerBreakdown = qazaBreakdown
    ? [
        { name: 'Fajr', count: qazaBreakdown.fajr },
        { name: 'Dhuhr', count: qazaBreakdown.dhuhr },
        { name: 'Asr', count: qazaBreakdown.asr },
        { name: 'Maghrib', count: qazaBreakdown.maghrib },
        { name: 'Isha', count: qazaBreakdown.isha },
      ]
    : [];

  const maxCount =
    prayerBreakdown.length > 0
      ? Math.max(1, Math.max(...prayerBreakdown.map(p => p.count)))
      : 1;

  const completedToday = prayerStats?.completed_today ?? 0;
  const dailyGoal = prayerStats?.daily_goal ?? 4;
  const progressPercent = dailyGoal > 0 ? (completedToday / dailyGoal) * 100 : 0;
  const activeDaysCount = weeklyActivity?.filter(w => w.status).length ?? 0;


  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* HEADER */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Assalamu Alaikum</h1>
          <p className="text-gray-400 text-base">Let's make up what we missed</p>
        </header>

        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-2xl p-6 border border-emerald-700/30">
              {quoteLoading ? (
          <div className="text-center text-gray-400 italic">Loading inspiration...</div>
            ) : (
          <p className="text-center text-emerald-100 text-base leading-relaxed italic">
          {quote}
          </p>
          )}
        </div>

        {/* QAZA BACKLOG */}
        <div className="bg-gradient-to-br from-teal-900/40 to-teal-800/20 rounded-3xl p-8 border border-teal-700/40 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-center">
            <div className="inline-block bg-emerald-500/20 px-3 py-1 rounded-full mb-4">
              <p className="text-emerald-300 text-xs font-semibold">Total</p>
            </div>
            <h2 className="text-7xl font-bold mb-2">
              {totalQazaRemaining ?? '—'}
            </h2>
            <p className="text-gray-400 text-sm mb-8">qazas remaining</p>

            <div className="h-px bg-teal-700/40 mb-8"></div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 text-sm">Today's Progress</p>
                <p className="text-emerald-400 text-sm font-semibold">
                  {completedToday}/{dailyGoal}
                </p>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS — ONLY CHANGE HERE */}
        <div className="grid grid-cols-2 gap-4">
          <button
            className="group bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-1"
            onClick={() => onNavigate?.('stats')}
          >
            <div className="group-hover:scale-110 transition-transform">
              <BarChart3 size={32} strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg">View Stats</span>
          </button>

          <button
            className="group bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-1"
            onClick={() => onNavigate?.('calendar')}
          >
            <div className="group-hover:scale-110 transition-transform">
              <Calendar size={32} strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg">Calendar</span>
          </button>
        </div>

        {/* LOADING / ERROR */}
        {loading ? (
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
            <div className="text-center text-gray-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-red-700/30">
            <div className="text-center text-red-400">{error}</div>
          </div>
        ) : (
          <>
            {/* WEEKLY CONSISTENCY */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Weekly Consistency</h3>
                <div className="text-emerald-400 text-sm font-semibold">
                  {activeDaysCount}/7 days
                </div>
              </div>

              <div className="flex gap-2">
  {weeklyActivity?.map((item, index) => {
    const circleColor = item.status ? 'bg-emerald-400' : 'bg-red-500';

    return (
      <div key={index} className="flex-1 flex flex-col items-center gap-2">
        <div className={`w-6 h-6 rounded-full ${circleColor}`} />
        <span className="text-xs text-gray-400">{item.day}</span>
      </div>
    );
  })}
</div>

            </div>
          </>
        )}

        {/* JOURNEY */}
        {!loading && !error && prayerBreakdown.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-emerald-400" />
              <h3 className="text-lg font-semibold">Qazas Breakdown</h3>
            </div>

            <div className="space-y-3">
              {prayerBreakdown.map(prayer => (
                <div key={prayer.name} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-300">{prayer.name}</span>
                  <div className="flex-1 bg-gray-800/50 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                      style={{ width: `${(prayer.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-emerald-400 text-sm font-semibold">
                    {prayer.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
