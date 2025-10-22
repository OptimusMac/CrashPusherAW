import { api } from './crashApi';

// Простой кэш на 10 секунд
const cache = new Map();

const getCacheKey = (endpoint, params) => {
  return `${endpoint}_${JSON.stringify(params)}`;
};

const isCacheValid = (timestamp, ttl = 10000) => {
  return Date.now() - timestamp < ttl;
};

export const fetchGlobalCrashesOptimized = async (params = {}) => {
  const cacheKey = getCacheKey('global_crashes', params);
  
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const data = await api.get("/crashes", { params }).then(r => r.data);
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
};

export const fetchCrashByIdOptimized = async (id) => {
  const cacheKey = getCacheKey(`crash_${id}`);
  
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const data = await api.get(`/crashes/${id}`).then(r => r.data);
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
};

export const clearCache = () => {
  cache.clear();
};