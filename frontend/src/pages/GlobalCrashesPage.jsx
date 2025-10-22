import React, { useEffect, useState, useMemo, useRef, useCallback, memo } from "react";
import { FixedSizeList } from "react-window";
import { fetchGlobalCrashes, fetchCrashById, updateCrashFixStatus } from "../api/crashApi";
import { fetchGlobalCrashesOptimized, fetchCrashByIdOptimized, clearCache } from "../api/optimizedCrashApi";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { 
  extractExceptionType, 
  getPlayerName, 
  getCrashReason, 
  getFilteredCrashContent, 
  getSystemInfoContent 
} from "../utils/crashUtils";
import SearchBar from "../components/SearchBar";
import CrashViewer from "../components/CrashViewer";

// Базовые компоненты UI
const LoadingSpinner = memo(({ text = "Loading..." }) => (
  <div className="p-8 text-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2" />
    <div className="text-gray-400 text-sm">{text}</div>
  </div>
));

const EmptyState = memo(({ hasFilters }) => (
  <div className="text-center text-gray-400 py-12">
    <div className="text-4xl mb-3">🐛</div>
    {hasFilters ? "No crashes match your filters" : "No crashes found"}
  </div>
));

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
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30 hover:border-green-500/50',
    warning: 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30 hover:border-orange-500/50',
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

const VirtualizedLine = memo(({ index, style, data }) => {
  const line = data.lines[index];
  return (
    <div style={style} className="flex">
      <div className="w-10 flex-shrink-0">
        <span className="text-gray-400 text-xs select-none block text-right pr-2">
          {index + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <pre className="font-mono text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed m-0 text-gray-300">
          {line}
        </pre>
      </div>
    </div>
  );
});

// Карточка краша
const GlobalCrashCard = memo(({
  crash,
  isExpanded,
  onToggle,
  selectedCrash,
  onFixStatusChange,
  listHeight
}) => {
  const displayed = isExpanded && selectedCrash?.id === crash.id ? selectedCrash : crash;

  const handleMarkFixed = useCallback(() => {
    onFixStatusChange(crash.exampleId || crash.id, true);
  }, [crash.exampleId, crash.id, onFixStatusChange]);

  const handleMarkRefix = useCallback(() => {
    onFixStatusChange(crash.exampleId || crash.id, false);
  }, [crash.exampleId, crash.id, onFixStatusChange]);

  const crashContent = useMemo(() => 
    getFilteredCrashContent(displayed?.content || ""),
    [displayed?.content]
  );
  
  const systemInfoCrash = useMemo(() => {
    if (!displayed?.content) return displayed;
    return {
      ...displayed,
      content: getSystemInfoContent(displayed.content)
    };
  }, [displayed]);

  const logLines = useMemo(() => 
    crashContent ? crashContent.split("\n") : [],
    [crashContent]
  );

  const listRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollTo(0);
  }, []);

  const playerName = useMemo(() => 
    getPlayerName(displayed || crash),
    [displayed, crash]
  );

  const crashReason = useMemo(() => 
    getCrashReason(displayed || crash),
    [displayed, crash]
  );

  return (
    <div className={`bg-gray-800/30 rounded-xl p-4 lg:p-6 border transition-all mb-4 ${
      isExpanded ? "border-purple-500/50 border-2" : "border-gray-700/30 hover:border-gray-600/50"
    } ${crash.isFix ? "opacity-80" : ""}`}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-white text-lg">
              Crash #{displayed?.id ?? crash?.id}
            </div>

            {crash.isFix ? (
              <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-green-500/30">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Fixed
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-red-500/30">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Not Fixed
              </div>
            )}

            {crash.count > 1 && (
              <div className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                {crash.count} occurrences
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <ActionButton onClick={onToggle} variant="primary">
              {isExpanded ? "Hide" : "View"}
            </ActionButton>
          </div>
        </div>

        {/* Player & Exception */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-medium min-w-[60px]">Player:</span>
            <span className="text-sm text-gray-300 break-all">{playerName}</span>
          </div>

          <div className="flex-1 flex items-start gap-2">
            <span className="text-sm text-white font-medium min-w-[80px] shrink-0">Exception:</span>
            <span className="text-sm text-gray-300 break-all">
              {String(crashReason).slice(0, 150)}
              {String(crashReason).length > 150 ? "..." : ""}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!crash.isFix ? (
            <ActionButton onClick={handleMarkFixed} variant="success" size="md">
              Mark as Fixed
            </ActionButton>
          ) : (
            <ActionButton onClick={handleMarkRefix} variant="warning" size="md">
              Mark for Re-fix
            </ActionButton>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 border-t border-gray-700/30 pt-4 space-y-4">
            {/* System Information */}
            <div>
              <h4 className="text-white font-medium mb-2">System Information:</h4>
              <div className="bg-gray-900/50 rounded text-sm font-mono text-gray-300 overflow-auto p-3"
                   style={{ maxHeight: Math.min(400, window.innerHeight * 0.4) }}>
                <CrashViewer crash={systemInfoCrash} />
              </div>
            </div>

            {/* Crash Log */}
            <div>
              <h4 className="text-white font-medium mb-2">Crash Log:</h4>
              <div className="relative bg-gray-900/50 rounded text-sm font-mono text-gray-300 overflow-hidden">
                <div style={{ height: listHeight, minWidth: 'min-content' }}>
                  <FixedSizeList
                    ref={listRef}
                    height={listHeight}
                    itemCount={logLines.length}
                    itemSize={24}
                    itemData={{ lines: logLines }}
                    overscanCount={10}
                    onScroll={({ scrollOffset }) => setShowScrollTop(scrollOffset > 200)}
                    width="100%"
                  >
                    {VirtualizedLine}
                  </FixedSizeList>
                </div>

                {showScrollTop && (
                  <button
                    onClick={scrollToTop}
                    className="absolute right-3 bottom-3 bg-purple-500 text-white rounded-full p-2 shadow-lg hover:bg-purple-600 transition z-10"
                    title="Scroll to top"
                  >
                    ↑
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const CrashCardSkeleton = memo(() => (
  <div className="bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 mb-4 animate-pulse">
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-700 rounded w-1/4"></div>
        <div className="h-8 bg-gray-700 rounded w-20"></div>
      </div>
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
));

// Главный компонент
const GlobalCrashesPage = () => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [dateFilter, setDateFilter] = useState("all");
  const [fixFilter, setFixFilter] = useState("all");
  const [selectedCrashId, setSelectedCrashId] = useState(null);
  const [selectedCrash, setSelectedCrash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listHeight, setListHeight] = useState(400);

  // Основная функция загрузки данных
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalCrashesOptimized({ 
        q: query, 
        sort: sort, 
        grouped: true
      });
      
      let filtered = data || [];

      // Применяем фильтры
      if (dateFilter !== "all") {
        const now = new Date();
        filtered = filtered.filter(item => {
          if (!item.createAt) return false;
          const itemDate = new Date(item.createAt);
          if (dateFilter === "today") return itemDate.toDateString() === now.toDateString();
          if (dateFilter === "week") return itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (dateFilter === "month") return itemDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return true;
        });
      }

      if (fixFilter !== "all") {
        filtered = filtered.filter(item => (fixFilter === "fixed" ? item.isFix : !item.isFix));
      }

      setItems(filtered);
    } catch (error) {
      console.error('Failed to load crashes:', error);
    } finally {
      setLoading(false);
    }
  }, [query, sort, dateFilter, fixFilter]);

  // Автообновление каждые 30 секунд
  useAutoRefresh(loadData, 30000);

  // Загрузка при монтировании и изменении фильтров
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Очистка кэша при размонтировании
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, []);

  const openCrash = useCallback(async (crash) => {
    const key = crash.exampleId ?? crash.id;
    
    if (selectedCrashId === key) {
      setSelectedCrashId(null);
      setSelectedCrash(null);
      return;
    }

    setSelectedCrashId(key);
    
    if (crash.fullData) {
      setSelectedCrash(crash.fullData);
      return;
    }

    setSelectedCrash(crash);

    try {
      const full = await fetchCrashByIdOptimized(key);
      const fullData = { ...crash, ...full, content: full?.content };
      
      setSelectedCrash(fullData);
      
      setItems(prev => prev.map(item => 
        (item.exampleId === key || item.id === key) 
          ? { ...item, fullData } 
          : item
      ));
    } catch (error) {
      console.error('Failed to load crash details:', error);
    }
  }, [selectedCrashId]);

  const handleFixStatusChange = useCallback(async (crashId, isFixed) => {
    try {
      await updateCrashFixStatus(crashId, isFixed);
      setItems(prev => prev.map(item => 
        (item.exampleId === crashId || item.id === crashId) 
          ? { ...item, isFix: isFixed } 
          : item
      ));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const topCrashes = useMemo(() => {
    return Object.values(items.reduce((acc, item) => {
      const type = extractExceptionType(item.signature);
      if (!acc[type]) acc[type] = { type, count: 0 };
      acc[type].count += item.count || 0;
      return acc;
    }, {})).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [items]);

  const filterByType = useCallback((type) => {
    setQuery(type);
  }, []);

  const clearAllFilters = useCallback(() => {
    setQuery("");
    setDateFilter("all");
    setFixFilter("all");
  }, []);

  const hasActiveFilters = query || dateFilter !== "all" || fixFilter !== "all";

  // Настройка высоты списка
  useEffect(() => {
    const onResize = () => {
      setListHeight(Math.min(600, Math.round(window.innerHeight * 0.4)));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Global Crashes
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Monitor and analyze system crashes across all users
        </p>
      </div>

      {/* Search and Controls */}
      <div className="bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 w-full">
            <SearchBar 
              onSearch={setQuery} 
              placeholder="Search crash signature or player..." 
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value)} 
              className="flex-1 sm:flex-none bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="count_desc">Most Frequent</option>
            </select>
            <ActionButton 
              onClick={loadData}
              variant="secondary"
              size="md"
              className="flex-1 sm:flex-none"
              disabled={loading}
            >
              {loading ? "..." : "Refresh"}
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Desktop filters */}
      <div className="hidden sm:flex flex-wrap gap-4 p-4 lg:p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 mb-6 items-center">
        <select 
          value={dateFilter} 
          onChange={e => setDateFilter(e.target.value)} 
          className="bg-gray-700/50 border border-gray-600/50 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-purple-500/50"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>

        <select 
          value={fixFilter} 
          onChange={e => setFixFilter(e.target.value)} 
          className="bg-gray-700/50 border border-gray-600/50 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-purple-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="fixed">Fixed Only</option>
          <option value="not_fixed">Not Fixed</option>
        </select>

        {hasActiveFilters && (
          <ActionButton onClick={clearAllFilters} variant="danger" size="md" className="ml-auto">
            Clear All
          </ActionButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main list */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CrashCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} />
            ) : (
              <div className="p-4 space-y-4">
                {items.map(crash => (
                  <GlobalCrashCard
                    key={crash.id || crash.exampleId}
                    crash={crash}
                    isExpanded={selectedCrashId === (crash.exampleId ?? crash.id)}
                    selectedCrash={selectedCrash}
                    onToggle={() => openCrash(crash)}
                    onFixStatusChange={handleFixStatusChange}
                    listHeight={listHeight}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 sticky top-6">
            <h3 className="font-semibold text-lg mb-4 pb-3 border-b border-gray-700/30 text-white">
              Top Exception Types
            </h3>

            {topCrashes.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-6">No data available</div>
            ) : (
              <div className="space-y-2">
                {topCrashes.map(t => (
                  <div
                    key={t.type}
                    onClick={() => filterByType(t.type)}
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition ${
                      query === t.type 
                        ? "bg-purple-500/20 border border-purple-500/30" 
                        : "hover:bg-gray-700/30 border border-transparent"
                    }`}
                  >
                    <div className="text-sm truncate flex-1 font-medium text-white" title={t.type}>
                      {t.type}
                    </div>
                    <div className={`text-sm font-bold ml-2 px-2 py-1 rounded ${
                      query === t.type 
                        ? "bg-purple-500 text-white" 
                        : "bg-gray-700/50 text-gray-300"
                    }`}>
                      {t.count}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-700/30 text-sm text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Total Crashes:</span>
                  <span className="font-medium text-white">{items.reduce((sum, item) => sum + (item.count || 1), 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Unique Types:</span>
                  <span className="font-medium text-white">{topCrashes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Fixed:</span>
                  <span className="font-medium text-green-400">{items.filter(item => item.isFix).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Not Fixed:</span>
                  <span className="font-medium text-red-400">{items.filter(item => !item.isFix).length}</span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default memo(GlobalCrashesPage);