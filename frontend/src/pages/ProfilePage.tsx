import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, type PrayerStats } from '../services/api';
import PageContainer, { PageHeader, LoadingState, ErrorState } from '../components/PageContainer';

export default function ProfilePage() {
  const [prayerStats, setPrayerStats] = useState<PrayerStats | null>(null);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      initTelegramApp();
      const userId = getTelegramUserId();

      if (!userId) {
        setError('Unable to get Telegram user ID');
        setLoading(false);
        return;
      }

      try {
        const [userInfo, stats] = await Promise.all([
          api.getUserInfo(userId),
          api.getPrayerStats(userId),
        ]);

        setUserName(userInfo.name || 'User');
        setPrayerStats(stats);
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalPrayersLogged = prayerStats?.total_prayers_logged ?? 0;
  const streak = prayerStats?.current_streak ?? 0;
  const nextMilestone = 1500;

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Profile" subtitle="Your statistics and journey" />
        <LoadingState />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Profile" subtitle="Your statistics and journey" />
        <ErrorState message={error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Profile" subtitle="Your statistics and journey" />

      {/* User Card */}
      <div className="bg-gradient-to-br from-secondary-900/30 to-secondary-800/20 rounded-2xl p-6 border border-secondary-700/40 animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center">
            <User size={32} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{userName}</h2>
            <p className="text-surface-400 text-sm">Telegram User</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-800/30 rounded-lg p-4 text-center border border-surface-700/30">
            <div className="text-3xl font-bold text-primary-400 mb-1">{totalPrayersLogged}</div>
            <p className="text-xs text-surface-400 uppercase font-semibold">Prayers Logged</p>
          </div>
          <div className="bg-surface-800/30 rounded-lg p-4 text-center border border-surface-700/30">
            <div className="text-3xl font-bold text-primary-400 mb-1">{streak}</div>
            <p className="text-xs text-surface-400 uppercase font-semibold">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="card p-6 animate-slide-up">
        <h3 className="text-lg font-semibold mb-4">Progress to Milestone</h3>
        <p className="text-surface-400 text-sm mb-4">{nextMilestone} prayers logged</p>
        <div className="w-full bg-surface-800/50 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min((totalPrayersLogged / nextMilestone) * 100, 100)}%` }}
          />
        </div>
        <p className="text-primary-400 text-xs font-semibold mt-2">
          {Math.max(nextMilestone - totalPrayersLogged, 0)} more to go
        </p>
      </div>

      {/* Quick Stats */}
      <div className="card p-6 space-y-4 animate-slide-up">
        <h3 className="text-lg font-semibold">Quick Stats</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-surface-700/30">
            <span className="text-surface-400">Daily Goal</span>
            <span className="text-primary-400 font-semibold">{prayerStats?.daily_goal ?? 0}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-surface-700/30">
            <span className="text-surface-400">Completed Today</span>
            <span className="text-primary-400 font-semibold">{prayerStats?.completed_today ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-surface-400">This Week</span>
            <span className="text-primary-400 font-semibold">{prayerStats?.cleared_this_week ?? 0}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
