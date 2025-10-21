import React, { useState, useEffect } from 'react';
import {
  fetchOverallStats,
  fetchCrashTrends,
  fetchTopPlayers,
  fetchCrashFrequency,
  fetchFixStats,
  fetchHourlyStats,
  fetchExceptionStats,
  fetchUserPatterns,
  fetchRecentActivity
} from '../api/crashApi';

// Компоненты для визуализации
import StatsCard from '../components/StatsCard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import TopPlayersTable from '../components/TopPlayersTable';
import RecentActivityList from '../components/RecentActivityList';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [timeRange, setTimeRange] = useState('7d');

  // В функции loadStats добавьте обработку ошибок для каждого запроса:
    const loadStats = async () => {
    setLoading(true);
    try {
        const [
        overall,
        trends,
        topPlayers,
        frequency,
        fixStats,
        hourly,
        exceptions,
        userPatterns,
        recentActivityResponse // переименовали
        ] = await Promise.all([
        fetchOverallStats().catch(() => ({})),
        fetchCrashTrends(timeRange).catch(() => ({ dailyTrends: [] })),
        fetchTopPlayers(10, timeRange).catch(() => []),
        fetchCrashFrequency().catch(() => ({ frequencyDistribution: [] })),
        fetchFixStats().catch(() => ({ distribution: [] })),
        fetchHourlyStats().catch(() => ({ hourlyDistribution: [] })),
        fetchExceptionStats(15).catch(() => ({ topExceptions: [] })),
        fetchUserPatterns().catch(() => ({})),
        fetchRecentActivity(24).catch(() => ({ recentActivity: [] })) // теперь ожидаем объект
        ]);

        setStats({
        overall: overall || {},
        trends: trends || { dailyTrends: [] },
        topPlayers: Array.isArray(topPlayers) ? topPlayers : [],
        frequency: frequency || { frequencyDistribution: [] },
        fixStats: fixStats || { distribution: [] },
        hourly: hourly || { hourlyDistribution: [] },
        exceptions: exceptions || { topExceptions: [] },
        userPatterns: userPatterns || {},
        // Извлекаем массив из объекта
        recentActivity: (recentActivityResponse?.recentActivity || [])
        });
    } catch (error) {
        console.error('Error loading statistics:', error);
        setStats({
        overall: {},
        trends: { dailyTrends: [] },
        topPlayers: [],
        frequency: { frequencyDistribution: [] },
        fixStats: { distribution: [] },
        hourly: { hourlyDistribution: [] },
        exceptions: { topExceptions: [] },
        userPatterns: {},
        recentActivity: []
        });
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accentTeal"></div>
      </div>
    );
  }

  const { 
    overall, 
    trends, 
    topPlayers, 
    frequency, 
    fixStats, 
    hourly, 
    exceptions, 
    userPatterns,
    recentActivity 
  } = stats;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-0">
          Crash Statistics Dashboard
        </h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-panel border border-gray-600 text-white px-3 py-2 rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={loadStats}
            className="bg-accentTeal text-black px-4 py-2 rounded-md hover:opacity-90 transition font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Crashes"
          value={overall?.totalCrashes}
          change={overall?.crashChange}
          icon="🚨"
        />
        <StatsCard
          title="Unique Users"
          value={overall?.uniqueUsers}
          change={overall?.userChange}
          icon="👥"
        />
        <StatsCard
          title="Fixed Crashes"
          value={overall?.fixedCrashes}
          percentage={overall?.fixRate}
          icon="✅"
        />
        <StatsCard
          title="Avg Crashes/User"
          value={overall?.avgCrashesPerUser?.toFixed(1)}
          change={overall?.avgChange}
          icon="📊"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Crash Trends Chart */}
        <div className="bg-panel rounded-xl p-4 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Crash Trends</h3>
          <LineChart
            data={trends?.dailyTrends || []}
            xKey="date"
            yKey="count"
            height={300}
          />
        </div>

        {/* Fix Status Distribution */}
        <div className="bg-panel rounded-xl p-4 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Fix Status Distribution</h3>
          <PieChart
            data={fixStats?.distribution || []}
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Top Players */}
        <div className="bg-panel rounded-xl p-4 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Top Players by Crashes</h3>
          <TopPlayersTable data={topPlayers || []} />
        </div>

        {/* Exception Types */}
        <div className="bg-panel rounded-xl p-4 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Top Exception Types</h3>
          <BarChart
            data={exceptions?.topExceptions || []}
            xKey="exception"
            yKey="count"
            height={300}
            horizontal
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Hourly Distribution */}
        <div className="bg-panel rounded-xl p-4 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Hourly Crash Distribution</h3>
          <BarChart
            data={hourly?.hourlyDistribution || []}
            xKey="hour"
            yKey="count"
            height={300}
          />
        </div>

        {/* Crash Frequency */}
        <div className="bg-panel rounded-xl p-4 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Crash Frequency Patterns</h3>
          <BarChart
            data={frequency?.frequencyDistribution || []}
            xKey="frequency"
            yKey="users"
            height={300}
            horizontal
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-panel rounded-xl p-4 border border-border mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <RecentActivityList data={recentActivity || []} />
      </div>

      {/* User Patterns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-panel rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-white mb-2">Most Active Time</h4>
          <p className="text-2xl text-accentTeal">{userPatterns?.mostActiveHour || 'N/A'}</p>
          <p className="text-textSecondary text-sm">Peak crash hour</p>
        </div>
        
        <div className="bg-panel rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-white mb-2">Top Crash Day</h4>
          <p className="text-2xl text-accentTeal">{userPatterns?.topCrashDay || 'N/A'}</p>
          <p className="text-textSecondary text-sm">Most crashes occurred</p>
        </div>
        
        <div className="bg-panel rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-white mb-2">Resolution Rate</h4>
          <p className="text-2xl text-green-400">{userPatterns?.resolutionRate || 0}%</p>
          <p className="text-textSecondary text-sm">Crashes marked as fixed</p>
        </div>
      </div>
    </div>
  );
}