import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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

// Оптимизированные компоненты
const LoadingSpinner = memo(({ text = "Загрузка..." }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
      <div className="text-gray-400 text-sm">{text}</div>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

const ActionButton = memo(({ 
  onClick, 
  children, 
  variant = 'primary',
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const baseClasses = 'rounded transition-colors border flex items-center justify-center font-medium';
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm'
  };

  const variantClasses = {
    primary: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30 hover:border-purple-500/50',
    secondary: 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 hover:border-gray-500/50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
});
ActionButton.displayName = 'ActionButton';

// Компонент карточки статистики в едином стиле
const StatsCardEnhanced = memo(({ title, value, change, percentage, icon }) => (
  <div className="bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <div className="text-2xl">{icon}</div>
      {(change !== undefined || percentage !== undefined) && (
        <div className={`text-xs px-2 py-1 rounded ${
          change > 0 ? 'bg-red-500/20 text-red-300' : 
          change < 0 ? 'bg-green-500/20 text-green-300' : 
          'bg-blue-500/20 text-blue-300'
        }`}>
          {percentage !== undefined ? `${percentage}%` : 
           change > 0 ? `+${change}` : change}
        </div>
      )}
    </div>
    <div className="text-xl lg:text-2xl font-bold text-white mb-1">
      {value || '0'}
    </div>
    <div className="text-gray-400 text-sm">{title}</div>
  </div>
));
StatsCardEnhanced.displayName = 'StatsCardEnhanced';

// Хук для управления статистикой
const useStatsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [timeRange, setTimeRange] = useState('7d');

  const loadStats = useCallback(async () => {
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
        recentActivityResponse
      ] = await Promise.all([
        fetchOverallStats().catch(() => ({})),
        fetchCrashTrends(timeRange).catch(() => ({ dailyTrends: [] })),
        fetchTopPlayers(10, timeRange).catch(() => []),
        fetchCrashFrequency().catch(() => ({ frequencyDistribution: [] })),
        fetchFixStats().catch(() => ({ distribution: [] })),
        fetchHourlyStats().catch(() => ({ hourlyDistribution: [] })),
        fetchExceptionStats(15).catch(() => ({ topExceptions: [] })),
        fetchUserPatterns().catch(() => ({})),
        fetchRecentActivity(24).catch(() => ({ recentActivity: [] }))
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
        recentActivity: recentActivityResponse?.recentActivity || []
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
  }, [timeRange]);

  return {
    loading,
    stats,
    timeRange,
    setTimeRange,
    loadStats
  };
};

// Компонент выбора временного диапазона
const TimeRangeSelector = memo(({ timeRange, onTimeRangeChange, onRefresh }) => (
  <div className="bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 mb-6">
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Crash Statistics
        </h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Analytics and insights about system crashes and performance
        </p>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="flex-1 sm:flex-none bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
        <ActionButton 
          onClick={onRefresh}
          variant="primary"
          size="md"
          className="flex-1 sm:flex-none"
        >
          Refresh
        </ActionButton>
      </div>
    </div>
  </div>
));
TimeRangeSelector.displayName = 'TimeRangeSelector';

// Компонент контейнера для графиков
const ChartContainer = memo(({ title, children, className = '' }) => (
  <div className={`bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 ${className}`}>
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    {children}
  </div>
));
ChartContainer.displayName = 'ChartContainer';

// Главный компонент
const StatsPage = () => {
  const {
    loading,
    stats,
    timeRange,
    setTimeRange,
    loadStats
  } = useStatsManagement();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <LoadingSpinner text="Загрузка статистики..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header with Time Range Selector */}
      <TimeRangeSelector 
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={loadStats}
      />

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCardEnhanced
          title="Total Crashes"
          value={overall?.totalCrashes}
          change={overall?.crashChange}
          icon="🚨"
        />
        <StatsCardEnhanced
          title="Unique Users"
          value={overall?.uniqueUsers}
          change={overall?.userChange}
          icon="👥"
        />
        <StatsCardEnhanced
          title="Fixed Crashes"
          value={overall?.fixedCrashes}
          percentage={overall?.fixRate}
          icon="✅"
        />
        <StatsCardEnhanced
          title="Avg Crashes/User"
          value={overall?.avgCrashesPerUser?.toFixed(1)}
          change={overall?.avgChange}
          icon="📊"
        />
      </div>

      {/* First Row - Trends and Fix Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <ChartContainer title="Crash Trends">
          <LineChart
            data={trends?.dailyTrends || []}
            xKey="date"
            yKey="count"
            height={300}
          />
        </ChartContainer>

        <ChartContainer title="Fix Status Distribution">
          <PieChart
            data={fixStats?.distribution || []}
            height={300}
          />
        </ChartContainer>
      </div>

      {/* Second Row - Top Players and Exceptions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <ChartContainer title="Top Players by Crashes">
          <TopPlayersTable data={topPlayers || []} />
        </ChartContainer>

        <ChartContainer title="Top Exception Types">
          <BarChart
            data={exceptions?.topExceptions || []}
            xKey="exception"
            yKey="count"
            height={300}
            horizontal
          />
        </ChartContainer>
      </div>

      {/* Third Row - Hourly and Frequency */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <ChartContainer title="Hourly Crash Distribution">
          <BarChart
            data={hourly?.hourlyDistribution || []}
            xKey="hour"
            yKey="count"
            height={300}
          />
        </ChartContainer>

        <ChartContainer title="Crash Frequency Patterns">
          <BarChart
            data={frequency?.frequencyDistribution || []}
            xKey="frequency"
            yKey="users"
            height={300}
            horizontal
          />
        </ChartContainer>
      </div>

      {/* Recent Activity */}
      <ChartContainer title="Recent Activity" className="mb-4 lg:mb-6">
        <RecentActivityList data={recentActivity || []} />
      </ChartContainer>

      {/* User Patterns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
          <h4 className="font-semibold text-white mb-2 text-sm">Most Active Time</h4>
          <p className="text-xl lg:text-2xl text-purple-300 font-bold">{userPatterns?.mostActiveHour || 'N/A'}</p>
          <p className="text-gray-400 text-xs">Peak crash hour</p>
        </div>
        
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
          <h4 className="font-semibold text-white mb-2 text-sm">Top Crash Day</h4>
          <p className="text-xl lg:text-2xl text-purple-300 font-bold">{userPatterns?.topCrashDay || 'N/A'}</p>
          <p className="text-gray-400 text-xs">Most crashes occurred</p>
        </div>
        
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
          <h4 className="font-semibold text-white mb-2 text-sm">Resolution Rate</h4>
          <p className="text-xl lg:text-2xl text-green-400 font-bold">{userPatterns?.resolutionRate || 0}%</p>
          <p className="text-gray-400 text-xs">Crashes marked as fixed</p>
        </div>
      </div>
    </div>
  );
};

export default memo(StatsPage);