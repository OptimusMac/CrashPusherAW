import { useState, useEffect, useCallback } from 'react';
import { fetchUsers } from '../api/userManagementApi';

// Глобальный кэш (сохраняется между переходами)
let globalUsersCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 секунд

export const useCachedUsers = () => {
  const [users, setUsers] = useState(globalUsersCache || []);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(!globalUsersCache); // Не показываем loading если есть кэш
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return () => clearTimeout(timer);
  }, []);

  const loadUsers = useCallback(async (searchQuery = "") => {
    const now = Date.now();
    
    // Используем кэш если он есть и не устарел
    if (globalUsersCache && now - cacheTimestamp < CACHE_DURATION && !searchQuery) {
      setUsers(globalUsersCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchUsers(searchQuery);
      
      if (!searchQuery) {
        globalUsersCache = data;
        cacheTimestamp = now;
      }
      
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Очистка кэша при размонтировании (опционально)
  useEffect(() => {
    return () => {
      // Можно очистить кэш через некоторое время
      // или оставить для мгновенной загрузки при возврате
    };
  }, []);

  // Дебаунс поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, loadUsers]);

  // Предзагрузка при монтировании
  useEffect(() => {
    if (!globalUsersCache) {
      loadUsers();
    }
  }, [loadUsers]);

  const invalidateCache = useCallback(() => {
    globalUsersCache = null;
    cacheTimestamp = 0;
  }, []);

  return {
    users,
    query,
    setQuery,
    loading,
    message,
    showMessage,
    loadUsers,
    invalidateCache
  };
};