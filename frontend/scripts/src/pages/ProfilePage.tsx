import { useState } from 'react';
import { User, Clock, Bell, LogOut, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);

  const profileData = {
    name: 'Abdullah Ahmed',
    email: 'abdullah.ahmed@example.com',
    joinDate: 'May 12, 2024',
    totalPrayersLogged: 1248,
    streak: 12,
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Profile</h1>
          <p className="text-gray-400 text-base">Your account and preferences</p>
        </header>

        <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 rounded-2xl p-6 border border-teal-700/40">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <User size={32} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-1">{profileData.name}</h2>
              <p className="text-gray-400 text-sm">{profileData.email}</p>
            </div>
          </div>

          <div className="h-px bg-teal-700/40 mb-6"></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {profileData.totalPrayersLogged}
              </div>
              <p className="text-xs text-gray-400">Prayers Logged</p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {profileData.streak}
              </div>
              <p className="text-xs text-gray-400">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
          <div className="p-6 border-b border-gray-700/30">
            <h3 className="text-lg font-semibold">Account</h3>
          </div>

          <div className="divide-y divide-gray-700/30">
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors cursor-pointer">
              <span className="text-gray-300">Member since</span>
              <span className="text-gray-400 text-sm">{profileData.joinDate}</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors cursor-pointer">
              <span className="text-gray-300">Email</span>
              <ChevronRight size={18} className="text-gray-500" />
            </div>
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors cursor-pointer">
              <span className="text-gray-300">Password</span>
              <ChevronRight size={18} className="text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
          <div className="p-6 border-b border-gray-700/30">
            <h3 className="text-lg font-semibold">Preferences</h3>
          </div>

          <div className="divide-y divide-gray-700/30">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-emerald-400" />
                <span className="text-gray-300">Prayer Reminders</span>
              </div>
              <button
                onClick={() => setPrayerReminders(!prayerReminders)}
                className={`w-12 h-6 rounded-full transition-all ${
                  prayerReminders ? 'bg-emerald-500' : 'bg-gray-700'
                } relative`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    prayerReminders ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>

            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-emerald-400" />
                <span className="text-gray-300">Notifications</span>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-all ${
                  notifications ? 'bg-emerald-500' : 'bg-gray-700'
                } relative`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>

            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors cursor-pointer">
              <span className="text-gray-300">Language</span>
              <span className="text-gray-400 text-sm">English</span>
            </div>

            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors cursor-pointer">
              <span className="text-gray-300">Theme</span>
              <span className="text-gray-400 text-sm">Dark</span>
            </div>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-red-900/40 to-red-800/30 hover:from-red-900/60 hover:to-red-800/50 border border-red-700/40 rounded-xl py-4 font-medium transition-all flex items-center justify-center gap-2 text-red-300">
          <LogOut size={18} />
          Sign Out
        </button>

        <div className="text-center py-4">
          <p className="text-xs text-gray-500">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
