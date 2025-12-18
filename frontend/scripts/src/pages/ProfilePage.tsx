import { User } from 'lucide-react';

export default function ProfilePage() {
  const profileData = {
    name: 'Abdullah Ahmed',
    joinDate: 'May 12, 2024',
    totalPrayersLogged: 1248,
    streak: 12,
    nextMilestone: 1500,
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Profile</h1>
          <p className="text-gray-400 text-base">Your statistics and journey</p>
        </header>

        <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 rounded-2xl p-6 border border-teal-700/40">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <User size={32} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{profileData.name}</h2>
              <p className="text-gray-400 text-sm">Member since {profileData.joinDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {profileData.totalPrayersLogged}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Prayers Logged</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/30">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {profileData.streak}
              </div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <h3 className="text-lg font-semibold mb-4">Progress to Milestone</h3>
          <p className="text-gray-400 text-sm mb-4">{profileData.nextMilestone} prayers logged</p>
          <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
              style={{ width: `${(profileData.totalPrayersLogged / profileData.nextMilestone) * 100}%` }}
            ></div>
          </div>
          <p className="text-emerald-400 text-xs font-semibold mt-2">{profileData.nextMilestone - profileData.totalPrayersLogged} more to go</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30 space-y-4">
          <h3 className="text-lg font-semibold">Quick Stats</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/30">
              <span className="text-gray-400">Average per day</span>
              <span className="text-emerald-400 font-semibold">3.2</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700/30">
              <span className="text-gray-400">This week</span>
              <span className="text-emerald-400 font-semibold">22</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">This month</span>
              <span className="text-emerald-400 font-semibold">89</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
