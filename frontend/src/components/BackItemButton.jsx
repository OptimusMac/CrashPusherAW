// --------- BackItemButton Component ----------
const BackItemButton = memo(({ log, onRestore, restoring }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = useCallback(async () => {
    if (!log.id) {
      console.error('Log ID is missing');
      return;
    }
    
    try {
      await onRestore(log.id);
    } catch (error) {
      // Ошибка обрабатывается в родительском компоненте
      console.error('Failed to restore items:', error);
    }
  }, [log.id, onRestore]);

  // Показываем кнопку только если есть items и это DEATH событие
  const hasItems = log.items && (Array.isArray(log.items) ? log.items.length > 0 : Object.keys(log.items).length > 0);
  
  if (log.type !== 'DEATH' || !hasItems) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={restoring}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden px-4 py-2.5 rounded-lg font-semibold text-sm
        transition-all duration-300 ease-out transform hover:scale-105 active:scale-95
        border-2 backdrop-blur-sm
        ${restoring 
          ? 'bg-gray-600/50 border-gray-500/50 text-gray-300 cursor-not-allowed' 
          : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/40 hover:border-green-300/60 text-white shadow-lg hover:shadow-xl'
        }
      `}
      style={{
        background: restoring 
          ? undefined 
          : isHovered 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.25))'
            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))'
      }}
    >
      {/* Анимация загрузки */}
      {restoring && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Контент кнопки */}
      <div className={`flex items-center gap-2 ${restoring ? 'opacity-0' : 'opacity-100'}`}>
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        <span>Restore Items</span>
      </div>
      
      {/* Светящийся эффект при ховере */}
      {!restoring && (
        <div className={`
          absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
          bg-gradient-to-r from-green-400/10 to-emerald-400/10
        `} />
      )}
    </button>
  );
});
BackItemButton.displayName = 'BackItemButton';