import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { fetchLogs, fetchEventTypes } from "../api/userManagementApi";
import { useAuth } from "../hooks/useAuth";
import ValueRenderer from "../components/ValueRenderer";

// --------- Константы и утилиты ----------
const STRING_TO_COLOR_CACHE = new Map();

const stringToColor = (str, alpha = 1) => {
  if (!str) str = "default";
  
  const cacheKey = `${str}-${alpha}`;
  if (STRING_TO_COLOR_CACHE.has(cacheKey)) {
    return STRING_TO_COLOR_CACHE.get(cacheKey);
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  const s = 65;
  const l = 50;
  const color = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
  
  STRING_TO_COLOR_CACHE.set(cacheKey, color);
  return color;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "No timestamp";
  const date = new Date(dateStr + 'Z');
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${date.toLocaleString()} (${diffDay}d ago)`;
  if (diffHr > 0) return `${date.toLocaleString()} (${diffHr}h ago)`;
  if (diffMin > 0) return `${date.toLocaleString()} (${diffMin}m ago)`;
  return `${date.toLocaleString()} (${diffSec}s ago)`;
};

// --------- Оптимизированные компоненты ----------
const LoadingSpinner = memo(({ text = "Loading..." }) => (
  <div className="text-center text-gray-400 py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2" />
    <div className="text-sm">{text}</div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

const EmptyState = memo(({ hasFilters }) => (
  <div className="text-center text-gray-400 py-12">
    <div className="text-4xl mb-3">📊</div>
    {hasFilters ? 'No logs found matching your filters' : 'No logs available'}
  </div>
));
EmptyState.displayName = 'EmptyState';

const TypeBadge = memo(({ type }) => (
  <span
    className="px-3 py-1.5 rounded-lg text-sm border text-white flex-shrink-0"
    style={{
      backgroundColor: stringToColor(type, 0.2),
      borderColor: stringToColor(type, 0.33),
    }}
  >
    {type || "ERROR"}
  </span>
));
TypeBadge.displayName = 'TypeBadge';

const CoordinateBadge = memo(({ coordinate, value }) => (
  <div className="bg-gray-700/30 rounded-lg p-2 border border-gray-600/30 text-center flex-1 min-w-[80px]">
    <div className="text-xs text-gray-400 uppercase">{coordinate}</div>
    <div className="text-white font-mono text-sm">{Number(value).toFixed(2)}</div>
  </div>
));
CoordinateBadge.displayName = 'CoordinateBadge';

const ExpandButton = memo(({ expanded, onClick, count }) => (
  <button
    onClick={onClick}
    className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
  >
    <svg
      className={`w-4 h-4 transform transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
    {expanded ? "Hide details" : `Show details (${count})`}
  </button>
));
ExpandButton.displayName = 'ExpandButton';

// ИСПРАВЛЕННЫЙ КОМПОНЕНТ - убрано использование 'key' как prop
const AdditionalDataItem = memo(({ dataKey, value }) => (
  <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/20 break-words">
    <div className="text-xs text-gray-400 mb-2 truncate">{dataKey}</div>
    <div className="text-white font-mono text-sm max-h-[200px] overflow-auto">
      <ValueRenderer value={value} />
    </div>
  </div>
));
AdditionalDataItem.displayName = 'AdditionalDataItem';

// --------- LogRow Component ----------
const LogRow = memo(({ log, onExpand, expanded }) => {
  const time = log.timestamp || log.createdAt;
  const coords = useMemo(() => 
    ["x", "y", "z"].filter(k => log[k] !== undefined),
    [log.x, log.y, log.z]
  );

  const additionalData = useMemo(() => 
    Object.entries(log)
      .filter(([key]) => !["type", "player", "timestamp", "createdAt", "x", "y", "z"].includes(key))
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {}),
    [log]
  );

  const logId = useMemo(() => `${log.player}-${log.timestamp}`, [log.player, log.timestamp]);

  const handleExpand = useCallback(() => {
    onExpand(logId);
  }, [onExpand, logId]);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-5 mb-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <TypeBadge type={log.type} />
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-semibold text-white truncate">
              {log.player || "Unknown"}
            </div>
            <div className="text-xs text-gray-400 sm:hidden mt-1">
              🕒 {formatDate(time)}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-400 hidden sm:block flex-shrink-0">
          🕒 {formatDate(time)}
        </div>
      </div>

      {/* Coordinates - горизонтально на мобильных, если места мало */}
      {coords.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {coords.map(k => (
            <CoordinateBadge 
              key={k} 
              coordinate={k} 
              value={log[k]} 
            />
          ))}
        </div>
      )}

      {/* Additional data */}
      {Object.keys(additionalData).length > 0 && (
        <div className="border-t border-gray-600/30 pt-3 mt-3">
          <ExpandButton 
            expanded={expanded}
            onClick={handleExpand}
            count={Object.keys(additionalData).length}
          />

          {expanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {/* ИСПРАВЛЕННЫЙ ВЫЗОВ - используем dataKey вместо key */}
              {Object.entries(additionalData).map(([dataKey, value]) => (
                <AdditionalDataItem 
                  key={dataKey} 
                  dataKey={dataKey} 
                  value={value} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
LogRow.displayName = 'LogRow';

// --------- LogFilters Component ----------
const LogFilters = memo(({ filters, onFiltersChange, eventTypes }) => {
  const handleTypeChange = useCallback((e) => {
    onFiltersChange(prev => ({ ...prev, type: e.target.value }));
  }, [onFiltersChange]);

  const handlePlayerChange = useCallback((e) => {
    onFiltersChange(prev => ({ ...prev, player: e.target.value }));
  }, [onFiltersChange]);

  const handleDateRangeChange = useCallback((e) => {
    onFiltersChange(prev => ({ ...prev, dateRange: e.target.value }));
  }, [onFiltersChange]);

  const handleSearchChange = useCallback((e) => {
    onFiltersChange(prev => ({ ...prev, search: e.target.value }));
  }, [onFiltersChange]);

  return (
    <div className="bg-gray-800/30 rounded-xl p-4 sm:p-5 mb-6 border border-gray-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
          <select
            value={filters.type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm"
          >
            <option value="">ALL</option>
            {(eventTypes || []).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Player</label>
          <input
            type="text"
            value={filters.player}
            onChange={handlePlayerChange}
            placeholder="Filter by player..."
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm"
          >
            <option value="">All time</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search in logs..."
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-sm"
          />
        </div>
      </div>
    </div>
  );
});
LogFilters.displayName = 'LogFilters';

// --------- LogStats Component ----------
const LogStats = memo(({ logs, eventTypes }) => {
  const stats = useMemo(() => {
    const total = logs?.length || 0;
    const uniquePlayers = new Set((logs || []).map(log => log.player)).size;

    const countsByType = (eventTypes || []).reduce((acc, type) => {
      acc[type] = (logs || []).filter(log => log.type === type).length;
      return acc;
    }, {});

    return [
      { label: "Total Events", value: total, color: "blue" },
      { label: "Unique Players", value: uniquePlayers, color: "purple" },
      ...(eventTypes || []).map(type => ({
        label: type,
        value: countsByType[type] || 0,
        color: stringToColor(type),
        isCustomColor: true
      }))
    ];
  }, [logs, eventTypes]);

  const gridCols = useMemo(() => {
    const count = stats.length;
    if (count <= 2) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
  }, [stats.length]);

  return (
    <div className={`grid ${gridCols} gap-3 sm:gap-4 mb-6`}>
      {stats.map(card => (
        <div
          key={card.label}
          className="rounded-xl p-3 sm:p-4 border min-w-0"
          style={{
            borderColor: card.isCustomColor ? stringToColor(card.label, 0.33) : undefined,
            backgroundColor: card.isCustomColor ? stringToColor(card.label, 0.13) : undefined
          }}
        >
          <div className={`text-xl sm:text-2xl font-bold ${
            card.isCustomColor ? "text-white" : `text-${card.color}-300`
          }`}>
            {card.value}
          </div>
          <div className={`text-xs sm:text-sm ${
            card.isCustomColor ? "text-white/80" : `text-${card.color}-400/80`
          } truncate`}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
});
LogStats.displayName = 'LogStats';

// --------- FilterInfo Component ----------
const FilterInfo = memo(({ filteredCount, totalCount, onClear }) => {
  if (filteredCount === totalCount) return null;

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600/30">
      <div className="text-sm text-gray-300">
        Showing {filteredCount} of {totalCount} logs
        <span className="text-gray-400 ml-2">(with filters applied)</span>
      </div>
      <button 
        onClick={onClear} 
        className="text-sm text-gray-400 hover:text-white transition-colors bg-gray-600/30 hover:bg-gray-600/50 px-3 py-1.5 rounded-lg border border-gray-500/30 hover:border-gray-400/30 whitespace-nowrap"
      >
        Clear All Filters
      </button>
    </div>
  );
});
FilterInfo.displayName = 'FilterInfo';

// --------- Хук для управления логами ----------
const useLogsManagement = () => {
  const [logs, setLogs] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    type: '', 
    player: '', 
    dateRange: '', 
    search: '' 
  });

  const loadEventTypes = useCallback(async () => {
    try {
      const types = await fetchEventTypes();
      setEventTypes(types || []);
    } catch (err) {
      console.error("Failed to load event types", err);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs();
      const logsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content.map(item => ({ ...item.value, createdAt: item.createdAt }))
          : [];
      setLogs(logsArray);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filters.search) {
      const lowerQuery = filters.search.toLowerCase();
      result = result.filter(log => 
        Object.values(log || {}).some(v => 
          String(v).toLowerCase().includes(lowerQuery)
        )
      );
    }

    if (filters.type) {
      result = result.filter(log => log.type === filters.type);
    }

    if (filters.player) {
      result = result.filter(log => 
        (log.player || '').toLowerCase().includes(filters.player.toLowerCase())
      );
    }

    if (filters.dateRange) {
      const now = new Date();
      const ranges = { 
        '1h': 3600000, 
        '24h': 86400000, 
        '7d': 604800000, 
        '30d': 2592000000 
      };
      const cutoff = now.getTime() - (ranges[filters.dateRange] || 0);
      result = result.filter(log => 
        log.timestamp && new Date(log.timestamp).getTime() > cutoff
      );
    }

    return result;
  }, [logs, filters]);

  const clearFilters = useCallback(() => {
    setFilters({ type: '', player: '', dateRange: '', search: '' });
  }, []);

  return {
    logs,
    filteredLogs,
    eventTypes,
    loading,
    filters,
    setFilters,
    loadEventTypes,
    loadLogs,
    clearFilters
  };
};

// --------- Главный компонент ----------
const LogsPage = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [expandedLogId, setExpandedLogId] = useState(null);
  
  const {
    logs,
    filteredLogs,
    eventTypes,
    loading,
    filters,
    setFilters,
    loadEventTypes,
    loadLogs,
    clearFilters
  } = useLogsManagement();

  useEffect(() => {
    loadEventTypes();
    loadLogs();
  }, [loadEventTypes, loadLogs]);

  const handleExpand = useCallback((logId) => {
    setExpandedLogId(prev => prev === logId ? null : logId);
  }, []);

  const hasActiveFilters = useMemo(() => 
    filters.search || filters.type || filters.player || filters.dateRange,
    [filters]
  );

  if (authLoading) {
    return <LoadingSpinner text="Loading user data..." />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Game Logs</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Monitor and analyze game events in real-time
        </p>
        {currentUser && (
          <div className="mt-3 text-xs sm:text-sm">
            <span className="text-gray-400">Viewing as: </span>
            <span className="text-blue-300 font-semibold">{currentUser.username}</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-purple-300">Roles: {currentUser.roles?.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {eventTypes.length > 0 && (
        <LogStats logs={filteredLogs} eventTypes={eventTypes} />
      )}

      {/* Filters */}
      <LogFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        eventTypes={eventTypes} 
      />

      {/* Filter info */}
      <FilterInfo 
        filteredCount={filteredLogs.length} 
        totalCount={logs.length} 
        onClear={clearFilters} 
      />

      {/* Logs list */}
      <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/30">
        {loading ? (
          <LoadingSpinner text="Loading logs..." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log, index) => {
              const logId = `${log.player}-${log.timestamp}`;
              return (
                <LogRow
                  key={`${logId}-${index}`}
                  log={log}
                  expanded={expandedLogId === logId}
                  onExpand={handleExpand}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(LogsPage);