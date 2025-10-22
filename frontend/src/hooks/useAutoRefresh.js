import { useCallback, useRef, useEffect } from 'react';

export const useAutoRefresh = (callback, interval = 30000) => {
  const callbackRef = useRef(callback);
  const intervalRef = useRef();
  const isTabVisibleRef = useRef(true);

  // Обновляем ref при изменении callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    stopAutoRefresh(); // Останавливаем предыдущий
    
    intervalRef.current = setInterval(() => {
      if (isTabVisibleRef.current) {
        callbackRef.current();
      }
    }, interval);
  }, [interval, stopAutoRefresh]);

  // Обработка видимости вкладки
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (isTabVisibleRef.current) {
        // При возвращении на вкладку сразу обновляем данные
        callbackRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Запуск/остановка при изменении интервала
  useEffect(() => {
    startAutoRefresh();
    return stopAutoRefresh;
  }, [startAutoRefresh, stopAutoRefresh]);

  return {
    stop: stopAutoRefresh,
    start: startAutoRefresh
  };
};