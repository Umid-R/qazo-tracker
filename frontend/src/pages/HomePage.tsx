import { TrendingUp, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, type QazaBreakdown, type PrayerStats, type WeeklyActivity } from '../services/api';
import PageContainer, { PageHeader, LoadingState, ErrorState } from '../components/PageContainer';

export default function HomePage() {
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
      } catch {
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

        const [totalQazaResult, breakdownResult, statsResult, activityResult] = results;

        const totalQaza = totalQazaResult.status === 'fulfilled' ? totalQazaResult.value : null;
        const breakdown = breakdownResult.status === 'fulfilled' ? breakdownResult.value : null;
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
        const activity = activityResult.status === 'fulfilled' ? activityResult.value : null;

        setTotalQazaRemaining(totalQaza?.total_qazas ?? 0);
        setQazaBreakdown(breakdown);
        setPrayerStats(stats);
        setWeeklyActivity(activity ?? []);
      } catch {
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
  const dailyGoal = prayerStats?.daily_goal ?? 5;
  const progressPercent = dailyGoal > 0 ? (completedToday / dailyGoal) * 100 : 0;
  const activeDaysCount = weeklyActivity?.filter(w => w.active).length ?? 0;

  return (
    <PageContainer>
      <PageHeader title="Assalamu Alaikum" subtitle="Let's make up what we missed" />

      {/* Inspirational Quote */}
      <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/10 rounded-2xl p-6 border border-primary-700/30 animate-slide-up">
        {quoteLoading ? (
          <div className="text-center text-surface-400 italic">Loading inspiration...</div>
        ) : (
          <p className="text-center text-primary-100 text-base leading-relaxed italic">
            {quote}
          </p>
        )}
      </div>

      {/* Qaza Backlog */}
      <div className="bg-gradient-to-br from-secondary-900/40 to-secondary-800/20 rounded-3xl p-8 border border-secondary-700/40 shadow-lg hover:shadow-xl transition-shadow animate-scale-in">
        <div className="text-center">
          <div className="inline-block bg-primary-500/20 px-3 py-1 rounded-full mb-4">
            <p className="text-primary-300 text-xs font-semibold">Total</p>
          </div>
          <h2 className="text-7xl font-bold mb-2">
            {totalQazaRemaining ?? '—'}
          </h2>
          <p className="text-surface-400 text-sm mb-8">qazas remaining</p>

          <div className="h-px bg-secondary-700/40 mb-8"></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-surface-300 text-sm">Today's Progress</p>
              <p className="text-primary-400 text-sm font-semibold">
                {completedToday}/{dailyGoal}
              </p>
            </div>
            <div className="w-full bg-surface-800/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <div className="bg-gradient-to-br from-primary-900/30 to-primary-800/20 rounded-xl p-4 border border-primary-700/30">
            <div className="text-primary-400 text-xs font-semibold uppercase mb-2">Cleared</div>
            <div className="text-2xl font-bold text-primary-300">{prayerStats?.cleared_this_week ?? 0}</div>
            <p className="text-xs text-surface-400">This week</p>
          </div>
          <div className="bg-gradient-to-br from-secondary-900/30 to-secondary-800/20 rounded-xl p-4 border border-secondary-700/30">
            <div className="text-secondary-400 text-xs font-semibold uppercase mb-2">Average</div>
            <div className="text-2xl font-bold text-secondary-300">
              {prayerBreakdown.length > 0
                ? Math.round(prayerBreakdown.reduce((sum, p) => sum + p.count, 0) / prayerBreakdown.length)
                : 0}
            </div>
            <p className="text-xs text-surface-400">Per prayer</p>
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          {/* Weekly Consistency */}
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Weekly Consistency</h3>
              <div className="text-primary-400 text-sm font-semibold">
                {activeDaysCount}/7 days
              </div>
            </div>

            <div className="flex gap-2">
              {weeklyActivity?.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full transition-colors ${
                      item.active ? 'bg-primary-400' : 'bg-error-500'
                    }`}
                  />
                  <span className="text-xs text-surface-400">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Qazas Breakdown */}
          {prayerBreakdown.length > 0 && (
            <div className="card p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-primary-400" />
                <h3 className="text-lg font-semibold">Qazas Breakdown</h3>
              </div>

              <div className="space-y-3">
                {prayerBreakdown.map(prayer => (
                  <div key={prayer.name} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-surface-300">{prayer.name}</span>
                    <div className="flex-1 bg-surface-800/50 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(prayer.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-primary-400 text-sm font-semibold">
                      {prayer.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Missed Prayers */}
          {prayerBreakdown.length > 0 && (
            <div className="card p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={20} className="text-error-400" />
                <h3 className="text-lg font-semibold">Most Missed Prayers</h3>
              </div>
              <div className="h-40 flex items-end justify-around gap-4">
                {[...prayerBreakdown]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                  .map(prayer => (
                    <div key={prayer.name} className="flex flex-col items-center flex-1">
                      <div className="text-sm font-bold text-error-400 mb-2">{prayer.count}</div>
                      <div
                        className="w-full bg-gradient-to-t from-error-600/40 to-error-500/60 rounded-lg border border-error-500/30 transition-all duration-500"
                        style={{ height: `${(prayer.count / maxCount) * 120}px` }}
                      />
                      <div className="text-sm font-semibold text-surface-300 mt-3">{prayer.name}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
