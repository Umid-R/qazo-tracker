import { TrendingDown, AlertCircle, Target } from 'lucide-react';

export default function StatsPage() {
  const qazaBacklog = [
    { name: 'Fajr', count: 45 },
    { name: 'Dhuhr', count: 28 },
    { name: 'Asr', count: 32 },
    { name: 'Maghrib', count: 15 },
    { name: 'Isha', count: 38 },
  ];

  const totalQaza = qazaBacklog.reduce((sum, prayer) => sum + prayer.count, 0);
  const maxCount = Math.max(...qazaBacklog.map(p => p.count));
  const avgQaza = Math.round(totalQaza / qazaBacklog.length);
  const clearedThisWeek = 7;

  const trendData = [
    { week: 'Week 1', count: 180 },
    { week: 'Week 2', count: 172 },
    { week: 'Week 3', count: 165 },
    { week: 'Week 4', count: 158 },
  ];

  const maxTrend = Math.max(...trendData.map(d => d.count));
  const minTrend = Math.min(...trendData.map(d => d.count));
  const chartHeight = 200;
  const chartPadding = 20;

  const getY = (value: number) => {
    const range = maxTrend - minTrend;
    const normalized = (value - minTrend) / range;
    return chartHeight - chartPadding - normalized * (chartHeight - 2 * chartPadding);
  };

  const points = trendData.map((d, i) => {
    const x = (i / (trendData.length - 1)) * 100;
    const y = getY(d.count);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Statistics</h1>
          <p className="text-gray-400 text-base">Your prayer patterns and progress</p>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 rounded-xl p-4 border border-emerald-700/30">
            <div className="text-emerald-400 text-xs font-semibold uppercase mb-2">Cleared</div>
            <div className="text-2xl font-bold text-emerald-300">{clearedThisWeek}</div>
            <p className="text-xs text-gray-400">This week</p>
          </div>
          <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 rounded-xl p-4 border border-teal-700/30">
            <div className="text-teal-400 text-xs font-semibold uppercase mb-2">Average</div>
            <div className="text-2xl font-bold text-teal-300">{avgQaza}</div>
            <p className="text-xs text-gray-400">Per prayer</p>
          </div>
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl p-4 border border-gray-700/30">
            <div className="text-gray-400 text-xs font-semibold uppercase mb-2">Total</div>
            <div className="text-2xl font-bold text-gray-200">{totalQaza}</div>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} className="text-emerald-400" />
            <h2 className="text-lg font-semibold">Qaza Backlog</h2>
          </div>

          <div className="space-y-4">
            {qazaBacklog.map((prayer) => (
              <div key={prayer.name} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm font-medium w-16">{prayer.name}</span>
                <div className="flex-1 bg-gray-800/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all rounded-full"
                    style={{ width: `${(prayer.count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <span className="text-emerald-400 text-sm font-semibold w-12 text-right">{prayer.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown size={20} className="text-emerald-400" />
            <h2 className="text-lg font-semibold">Qaza Trend</h2>
          </div>

          <div className="relative" style={{ height: `${chartHeight}px` }}>
            <svg
              viewBox={`0 0 100 ${chartHeight}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              <polyline
                points={points}
                fill="none"
                stroke="#10b981"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              {trendData.map((d, i) => {
                const x = (i / (trendData.length - 1)) * 100;
                const y = getY(d.count);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="1"
                    fill="#10b981"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
              {trendData.map((d) => (
                <div key={d.week} className="text-center">
                  <div className="text-xs text-gray-400">{d.week}</div>
                </div>
              ))}
            </div>

            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400">
              <span>{maxTrend}</span>
              <span>{Math.round((maxTrend + minTrend) / 2)}</span>
              <span>{minTrend}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-teal-700/30">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle size={20} className="text-red-400" />
            <h2 className="text-lg font-semibold">Most Missed Prayers</h2>
          </div>

          <div className="h-48 flex items-end justify-around gap-4">
            {qazaBacklog
              .sort((a, b) => b.count - a.count)
              .slice(0, 3)
              .map((prayer) => (
                <div key={prayer.name} className="flex flex-col items-center flex-1">
                  <div className="text-sm font-bold text-red-400 mb-2">{prayer.count}</div>
                  <div
                    className="w-full bg-gradient-to-t from-red-600/40 to-red-500/60 rounded-lg border border-red-500/30 hover:border-red-500/60 transition-colors"
                    style={{ height: `${(prayer.count / maxCount) * 150}px` }}
                  ></div>
                  <div className="text-sm font-semibold text-gray-300 mt-3">{prayer.name}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
