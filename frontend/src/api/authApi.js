// api/authApi.js
import { api } from './crashApi';
import { getRolesFromToken } from '../utils/jwtUtils'; // ДОБАВЬТЕ ЭТОТ ИМПОРТ

export const login = (username, password) =>
  api.post("/auth/login", { username, password }).then(r => r.data);

export const registerUser = (username, password) =>
  api.post("/auth/register/user", { username, password }).then(r => r.data);

export const generateAdminToken = () =>
  api.post("/auth/generate-admin-token").then(r => r.data);

export const validateAdminToken = (token) =>
  api.post("/auth/validate-admin-token", null, { params: { token } }).then(r => r.data);

export const registerAdmin = (confirmationToken, username, password) =>
  api.post("/auth/register/admin", { confirmationToken, username, password }).then(r => r.data);

// Сохранение токена
export const saveToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getToken = () => {
  return localStorage.getItem('authToken');
};

export const removeToken = () => {
  localStorage.removeItem('authToken');
};

export const refreshToken = async () => {
  try {
    console.log('🔄 Attempting to refresh token...');
    
    const response = await api.post("/auth/refresh");
    
    if (response.data.token) {
      // Сохраняем новый токен
      saveToken(response.data.token);
      console.log('✅ Token refreshed successfully');
      return response.data;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    // Если refresh не удался - разлогиниваем пользователя
    if (error.response?.status === 401) {
      console.log('🔐 Refresh failed with 401, logging out...');
      removeToken();
      window.location.href = '/auth?message=session_expired';
    }
    
    throw error;
  }
};

// Умная функция для принудительного обновления токена
export const forceTokenRefresh = async (maxRetries = 3) => {
  const token = getToken();
  
  console.log('🔄 forceTokenRefresh started', { 
    hasToken: !!token,
    currentRoles: getRolesFromToken(token), // ТЕПЕРЬ ЭТА ФУНКЦИЯ БУДЕТ ДОСТУПНА
    tokenLength: token?.length
  });
  
  if (!token) {
    console.log('❌ No token found for refresh');
    return false;
  }

  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`🔄 Token refresh attempt ${attempts}/${maxRetries}`);
      
      // Добавляем небольшую задержку между попытками
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
      
      console.log('📡 Sending refresh request to /auth/refresh...');
      
      // Добавим заголовок вручную для отладки
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await api.post("/auth/refresh", null, config);
      console.log('📡 Refresh response received:', response.data);
      
      if (response.data && response.data.token) {
        console.log('✅ New token received:', {
          newTokenLength: response.data.token.length,
          newRoles: response.data.roles,
          username: response.data.username
        });
        
        // Сохраняем новый токен
        saveToken(response.data.token);
        
        // Проверим, что токен действительно изменился
        const newToken = getToken();
        const oldToken = token;
        
        console.log('🔍 Token comparison:', {
          tokensAreDifferent: newToken !== oldToken,
          oldTokenLength: oldToken?.length,
          newTokenLength: newToken?.length,
          oldRoles: getRolesFromToken(oldToken),
          newRoles: getRolesFromToken(newToken)
        });
        
        console.log('✅ Token successfully refreshed and saved to localStorage');
        return true;
      } else {
        console.log('❌ No token in response:', response.data);
        throw new Error('No token in response');
      }
    } catch (error) {
      console.error(`❌ Token refresh attempt ${attempts} failed:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      
      // Если это 401 - немедленно разлогиниваем
      if (error.response?.status === 401) {
        console.log('🔐 401 received during refresh, forcing logout');
        removeToken();
        window.location.href = '/auth?message=session_expired';
        return false;
      }
      
      // Если это последняя попытка
      if (attempts >= maxRetries) {
        console.log('🔐 All refresh attempts failed');
        return false;
      }
    }
  }
  
  return false;
};

// Функция для безопасного обновления (без разлогина при ошибке)
export const safeTokenRefresh = async () => {
  try {
    await refreshToken();
    return true;
  } catch (error) {
    console.warn('⚠️ Safe token refresh failed, but user remains logged in:', error);
    return false;
  }
};