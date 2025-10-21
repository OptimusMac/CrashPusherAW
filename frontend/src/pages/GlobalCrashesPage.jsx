import React, { useEffect, useState } from "react";
import { fetchGlobalCrashes, fetchCrashById, updateCrashFixStatus} from "../api/crashApi";
import SearchBar from "../components/SearchBar";
import CrashViewer from "../components/CrashViewer";

function GlobalCrashCard({ crash, isExpanded, onToggle, selectedCrash, onFixStatusChange }) {
  // Используем selectedCrash если он соответствует текущему crash
  const displayed = isExpanded && selectedCrash?.id === crash.id 
    ? selectedCrash 
    : crash;

  const getPlayerName = (crashData) => {
    return crashData?.playerName ||
           crashData?.player?.username ||
           crashData?.username ||
           crashData?.user?.username ||
           crashData?.lastPlayer ||
           crashData?.example?.playerName ||
           crashData?.example?.username ||
           crashData?.examplePlayer ||
           "Unknown";
  };

  const getCrashReason = (crashData) => {
    return crashData?.signature ||
           crashData?.reason ||
           crashData?.summary ||
           crashData?.error ||
           crashData?.message ||
           "No reason provided";
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Функция для фильтрации контента - убираем системную информацию
  const getFilteredCrashContent = (content) => {
    if (!content) return "";
    
    const systemInfoStart = content.indexOf("==========================================================================================\n");
    if (systemInfoStart === -1) return content;
    
    return content.substring(0, systemInfoStart).trim();
  };

  // Функция для получения только системной информации (без вступлений)
  const getSystemInfoContent = (content) => {
    if (!content) return "";
    
    const systemInfoStart = content.indexOf("==========================================================================================\n");
    if (systemInfoStart === -1) return "";
    
    let systemContent = content.substring(systemInfoStart);
    const lines = systemContent.split('\n');
    const filteredLines = [];
    let skipMode = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith("??????????????????????????????????????????????")) {
        skipMode = !skipMode;
        continue;
      }
      
      if (skipMode) continue;
      
      if (!skipMode && !line.startsWith("??????????????????????????????????????????????")) {
        filteredLines.push(lines[i]);
      }
    }
    
    return filteredLines.join('\n').trim();
  };

  const handleMarkFixed = () => {
    onFixStatusChange(crash.exampleId || crash.id, true);
  };

  const handleMarkRefix = () => {
    onFixStatusChange(crash.exampleId || crash.id, false);
  };

  const playerName = getPlayerName(displayed);
  const crashReason = getCrashReason(displayed);
  const idDisplay = displayed?.id ?? crash?.id ?? "—";
  const crashContent = getFilteredCrashContent(displayed?.content);
  
  const systemInfoCrash = displayed?.content ? {
    ...displayed,
    content: getSystemInfoContent(displayed.content)
  } : displayed;

  return (
    <div className={`bg-panel border rounded-lg p-4 transition-all mb-3 ${
      isExpanded ? "border-accentTeal border-2" : "border-border hover:border-gray-500"
    } ${crash.isFix ? 'opacity-80' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex-1">
          {/* Header with ID, status and count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-white text-lg">Crash #{idDisplay}</div>
              {crash.isFix && (
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Fixed
                </div>
              )}
              {!crash.isFix && (
                <div className="bg-accentRed text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Not Fixed
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {crash.count > 1 && (
                <div className="bg-accentRed text-white text-xs px-3 py-1 rounded-full font-medium">
                  {crash.count} occurrences
                </div>
              )}
              {crash.signature && (
                <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {extractExceptionType(crash.signature)}
                </div>
              )}
            </div>
          </div>
          
          {/* Date information */}
          <div className="flex flex-wrap gap-4 text-sm text-textSecondary mb-3">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Created: {formatDate(crash.createAt)}</span>
            </div>
            {crash.lastCreateAt && crash.lastCreateAt !== crash.createAt && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Last: {formatDate(crash.lastCreateAt)}</span>
              </div>
            )}
          </div>

          {/* Player and Exception info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium min-w-[60px]">Player:</span>
              <span className="text-sm text-textSecondary">{playerName}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm text-white font-medium min-w-[80px] shrink-0">Exception:</span>
              <span className="text-sm text-textSecondary break-words flex-1">
                {String(crashReason).slice(0, 150) + (String(crashReason).length > 150 ? "..." : "")}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {!crash.isFix ? (
              <button
                onClick={handleMarkFixed}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 transition font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mark as Fixed
              </button>
            ) : (
              <button
                onClick={handleMarkRefix}
                className="bg-orange-600 text-white text-sm px-4 py-2 rounded-md hover:bg-orange-700 transition font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Mark for Re-fix
              </button>
            )}
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 border-t border-border pt-4">
              <CrashViewer crash={systemInfoCrash} />
              
              {crashContent && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">Crash Log:</h4>
                  <pre className="bg-black bg-opacity-50 p-3 rounded text-sm font-mono text-textSecondary whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                    {crashContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View/Hide button */}
        <div className="flex flex-col gap-2 self-start sm:self-auto">
          <button
            onClick={onToggle}
            className="bg-accentTeal text-black text-sm px-4 py-2 rounded-md hover:opacity-90 transition font-medium min-w-[80px]"
          >
            {isExpanded ? "Hide" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to extract exception type
function extractExceptionType(signature) {
  if (!signature) return "Unknown";
  const match = signature.match(/([A-Za-z0-9_.]+Exception)/);
  return match ? match[1] : "Other";
}

export default function GlobalCrashesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [activeFilter, setActiveFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [fixFilter, setFixFilter] = useState("all");
  const [selectedCrashId, setSelectedCrashId] = useState(null);
  const [selectedCrash, setSelectedCrash] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (q = "", s = sort) => {
    setLoading(true);
    try {
      const data = await fetchGlobalCrashes({ q, sort: s, grouped: true });
      
      let filteredData = data;
      
      if (dateFilter !== "all") {
        const now = new Date();
        filteredData = filteredData.filter(item => {
          if (!item.createAt) return false;
          const itemDate = new Date(item.createAt);
          
          switch (dateFilter) {
            case "today":
              return itemDate.toDateString() === now.toDateString();
            case "week":
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return itemDate >= weekAgo;
            case "month":
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return itemDate >= monthAgo;
            default:
              return true;
          }
        });
      }
      
      if (fixFilter !== "all") {
        filteredData = filteredData.filter(item => {
          switch (fixFilter) {
            case "fixed":
              return item.isFix === true;
            case "not_fixed":
              return item.isFix === false;
            default:
              return true;
          }
        });
      }
      
      setItems(filteredData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(query, sort);
  }, [query, sort, dateFilter, fixFilter]);

  useEffect(() => {
    const interval = setInterval(() => load(query, sort), 30000);
    return () => clearInterval(interval);
  }, [query, sort, dateFilter, fixFilter]);

  const openCrash = async (crash) => {
    if (selectedCrashId === crash.exampleId) {
      setSelectedCrashId(null);
      setSelectedCrash(null);
      return;
    }

    setSelectedCrashId(crash.exampleId);

    if (crash.fullData) {
      setSelectedCrash(crash.fullData);
      return;
    }

    setSelectedCrash(crash);

    try {
      const full = await fetchCrashById(crash.exampleId);
      
      const fullCrashWithData = {
        ...crash,
        ...full,
        content: full.content
      };
      
      setSelectedCrash(fullCrashWithData);
      setItems(prev => prev.map(item => 
        item.exampleId === crash.exampleId ? { ...item, fullData: fullCrashWithData } : item
      ));
    } catch (e) {
      console.error(e);
    }
  };

 // Функция для изменения статуса фикса
    const handleFixStatusChange = async (crashId, isFixed) => {
    try {
        // Вызываем API для изменения статуса фикса
        await updateCrashFixStatus(crashId, isFixed);
        
        // Обновляем локальное состояние после успешного запроса
        setItems(prev => prev.map(item => 
        (item.exampleId === crashId || item.id === crashId) 
            ? { ...item, isFix: isFixed }
            : item
        ));
        
        // Можно добавить toast-уведомление для пользователя
        // toast.success(`Crash ${crashId} marked as ${isFixed ? 'fixed' : 'needs re-fix'}`);
        
    } catch (error) {
        console.error('Error updating fix status:', error);
        
        // Показываем ошибку пользователю
        // toast.error('Failed to update crash status');
        
        // Откатываем изменения в случае ошибки
        setItems(prev => prev.map(item => 
        (item.exampleId === crashId || item.id === crashId) 
            ? { ...item, isFix: !isFixed } // возвращаем предыдущее состояние
            : item
        ));
    }
    };

  const refresh = () => {
    load(query, sort);
  };

  const clearAllFilters = () => {
    setActiveFilter(null);
    setQuery("");
    setDateFilter("all");
    setFixFilter("all");
  };

  const topCrashes = Object.values(
    items.reduce((acc, item) => {
      const type = extractExceptionType(item.signature);
      if (!acc[type]) acc[type] = { type, count: 0 };
      acc[type].count += item.count || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const filterByType = (type) => {
    if (activeFilter === type) {
      setActiveFilter(null);
      setQuery("");
    } else {
      setActiveFilter(type);
      setQuery(type);
    }
  };

  const hasActiveFilters = activeFilter || dateFilter !== "all" || fixFilter !== "all";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main content - crashes list */}
        <div className="xl:col-span-3">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">Global Crashes</h2>
            <div className="flex-1 w-full lg:w-auto">
              <SearchBar onSearch={setQuery} placeholder="Search crash signature or player..." />
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-panel border border-gray-600 text-white px-3 py-2 rounded-md flex-1 lg:flex-none"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="count_desc">Most Frequent</option>
              </select>
              <button 
                onClick={refresh} 
                className="bg-accentTeal text-black px-4 py-2 rounded-md hover:opacity-90 transition font-medium whitespace-nowrap"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-panel rounded-lg border border-border">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Date filter */}
              <div className="flex flex-col">
                <label className="text-sm text-textSecondary mb-1 font-medium">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-panel border border-gray-600 text-white px-3 py-2 rounded-md min-w-[140px]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Fix status filter */}
              <div className="flex flex-col">
                <label className="text-sm text-textSecondary mb-1 font-medium">Fix Status</label>
                <select
                  value={fixFilter}
                  onChange={(e) => setFixFilter(e.target.value)}
                  className="bg-panel border border-gray-600 text-white px-3 py-2 rounded-md min-w-[140px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="fixed">Fixed Only</option>
                  <option value="not_fixed">Not Fixed</option>
                </select>
              </div>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="bg-accentRed text-white px-4 py-2 rounded-md hover:bg-red-700 transition font-medium whitespace-nowrap h-fit"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Active filter indicator */}
          {activeFilter && (
            <div className="mb-4 p-3 bg-accentTeal bg-opacity-20 border border-accentTeal rounded-lg flex items-center justify-between">
              <span className="text-accentTeal font-medium">
                Filtered by exception: {activeFilter}
              </span>
              <button
                onClick={() => {
                  setActiveFilter(null);
                  setQuery("");
                }}
                className="text-accentTeal hover:text-white text-sm font-medium"
              >
                Clear
              </button>
            </div>
          )}

          {/* Crashes list */}
          <div>
            {loading && (
              <div className="text-textSecondary text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accentTeal mx-auto mb-2"></div>
                Loading crashes...
              </div>
            )}
            
            {!loading && items.length === 0 && (
              <div className="text-textSecondary text-center py-12 text-lg">
                {hasActiveFilters ? "No crashes match your filters" : "No crashes found"}
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="space-y-4">
                {items.map((crash) => (
                  <GlobalCrashCard
                    key={crash.id || crash.exampleId}
                    crash={crash}
                    isExpanded={selectedCrashId === crash.exampleId}
                    selectedCrash={selectedCrash}
                    onToggle={() => openCrash(crash)}
                    onFixStatusChange={handleFixStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - top crashes */}
        <div className="xl:col-span-1">
          <div className="bg-panel rounded-xl p-4 xl:sticky xl:top-6 border border-border">
            <h3 className="font-semibold text-lg mb-4 pb-3 border-b border-border text-white">
              Top Exception Types
            </h3>
            
            {topCrashes.length === 0 && (
              <div className="text-textSecondary text-sm text-center py-6">No data available</div>
            )}
            
            <div className="space-y-2">
              {topCrashes.map((t) => (
                <div
                  key={t.type}
                  onClick={() => filterByType(t.type)}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition ${
                    activeFilter === t.type
                      ? "bg-accentTeal bg-opacity-20 border border-accentTeal"
                      : "hover:bg-white hover:bg-opacity-5"
                  }`}
                >
                  <div className="text-sm truncate flex-1 font-medium text-white" title={t.type}>
                    {t.type}
                  </div>
                  <div className={`text-sm font-bold ml-2 px-2 py-1 rounded ${
                    activeFilter === t.type 
                      ? "bg-accentTeal text-black" 
                      : "bg-white bg-opacity-10 text-textSecondary"
                  }`}>
                    {t.count}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats summary */}
            {items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-sm text-textSecondary space-y-2">
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
                    <span className="font-medium text-green-400">
                      {items.filter(item => item.isFix).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accentRed">Not Fixed:</span>
                    <span className="font-medium text-accentRed">
                      {items.filter(item => !item.isFix).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}