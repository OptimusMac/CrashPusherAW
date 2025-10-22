import axios from "axios";
import { API_BASE } from "./config";
import { getToken, removeToken } from "./authApi"; // ✅ Добавьте этот импорт
import { isTokenExpired } from "../utils/jwtUtils"; // ✅ И этот


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};


export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000
});

console.log('API_BASE is set to:', API_BASE);

// users list: GET /users -> [{id, username, crashesCount}]
export const fetchUsers = (q = "") => api.get("/users", { params: { q } }).then(r => r.data);

// user crashes: GET /users/:id/crashes -> [{id, createdAt, summary}]
export const fetchUserCrashes = (userId, { page = 0, size = 50 } = {}) =>
  api.get(`/users/${userId}/crashes`, { params: { page, size } }).then(r => r.data);

// fetch single crash full content: GET /crashes/:id
export const fetchCrashById = (id) => api.get(`/crashes/${id}`).then(r => r.data);

// global crashes list: GET /crashes?grouped=true -> [{id, signature, count, lastSeen, example}]
export const fetchGlobalCrashes = (params) =>
  api.get("/crashes", { params }).then(r => r.data);

// top crashes (analytics)
export const fetchTopCrashes = (limit = 10) =>
  api.get("/crashes/top", { params: { limit } }).then(r => r.data);

// update crash fix status: PATCH /crashes/:id/fix
export const updateCrashFixStatus = (crashId, isFixed) =>
  api.patch(`/crashes/${crashId}/fix`, { isFix: isFixed }).then(r => r.data);

// ========== STATISTICS ENDPOINTS ==========

// Overall statistics
export const fetchOverallStats = () => api.get("/stats/overall").then(r => r.data);

// Crash trends over time
export const fetchCrashTrends = (period = "7d") => 
  api.get("/stats/trends", { params: { period } }).then(r => r.data);

// Top players by crashes
export const fetchTopPlayers = (limit = 10, period = "all") =>
  api.get("/stats/top-players", { params: { limit, period } }).then(r => r.data);

// Crash frequency distribution
export const fetchCrashFrequency = () => api.get("/stats/frequency").then(r => r.data);

// Fix status statistics
export const fetchFixStats = () => api.get("/stats/fix-status").then(r => r.data);

// Hourly distribution
export const fetchHourlyStats = () => api.get("/stats/hourly").then(r => r.data);

// Exception type statistics
export const fetchExceptionStats = (limit = 15) =>
  api.get("/stats/exceptions", { params: { limit } }).then(r => r.data);

// User crash patterns
export const fetchUserPatterns = () => api.get("/stats/user-patterns").then(r => r.data);

// Recent activity
export const fetchRecentActivity = (hours = 24) =>
  api.get("/stats/recent-activity", { params: { hours } }).then(r => r.data);

api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request to:', config.url);
    
    const token = getToken();
    
    if (token && isTokenExpired(token)) {
      console.log('❌ Token expired in interceptor, removing');
      removeToken();
      window.location.href = '/auth';
      return Promise.reject(new Error('Token expired'));
    }
    
    if (token) {
      console.log('✅ Adding Authorization header with token');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('ℹ️ No token found for request');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ Response error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message
    });
    
    // Обработка 401 Unauthorized (попытка refresh токена)
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        // Если уже в процессе refresh, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Пытаемся обновить токен
        const refreshResponse = await refreshToken();
        const newToken = refreshResponse.token;
        
        // Обновляем заголовок и повторяем оригинальный запрос
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        
        // Обрабатываем очередь запросов
        processQueue(null, newToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Если refresh не удался - очищаем очередь и разлогиниваем
        processQueue(refreshError, null);
        isRefreshing = false;
        
        console.log('🔐 Token refresh failed, logging out...');
        removeToken();
        window.location.href = '/auth?message=session_expired';
        
        return Promise.reject(refreshError);
      }
    }
    
    // Обработка 403 Forbidden
  //  if (error.response?.status === 403) {
  //   console.log('🔐 403 received, access denied');
    
  //   // Удаляем токен при 403
  //   removeToken();
    
  //   const currentPath = window.location.pathname;
  //   if (currentPath.includes('/users') || currentPath.includes('/admin')) {

  //     setTimeout(() => {
  //       window.location.href = '/auth?message=access_denied';
  //     }, 100);
  //   }
    
  //   return Promise.reject(error);
  // }
      
    return Promise.reject(error);
  }
);

export default api;