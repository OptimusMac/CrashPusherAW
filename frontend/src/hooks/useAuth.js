// hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { getToken, removeToken } from '../api/authApi';
import { getRolesFromToken, getUsernameFromToken, getUserIdFromToken, isTokenExpired } from '../utils/jwtUtils';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    console.log('🔄 loadUserData called');
    
    setLoading(true);
    
    try {
      const token = getToken();
      console.log('🔑 Current token from localStorage:', token ? 'EXISTS' : 'MISSING');
      
      if (!token) {
        console.log('🔐 No token found');
        setUser(null);
        setLoading(false);
        return;
      }

      // Проверяем истек ли токен
      if (isTokenExpired(token)) {
        console.log('🔐 Token expired');
        removeToken();
        setUser(null);
        setLoading(false);
        return;
      }

      // Парсим данные из токена
      console.log('🔍 Parsing token data...');
      const roles = getRolesFromToken(token);
      const username = getUsernameFromToken(token);
      const userId = getUserIdFromToken(token);
      
      console.log('👤 Final user data:', { id: userId, username, roles, tokenLength: token?.length });
      
      const userData = {
        id: userId,
        username,
        roles,
        isAdmin: roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'),
        isCoder: roles.includes('CODER') || roles.includes('ROLE_CODER'),
        isUser: roles.includes('USER') || roles.includes('ROLE_USER')
      };
      
      console.log('👤 User object to set:', userData);
      setUser(userData);
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(() => {
    console.log('🔄 Manual refreshUser called');
    loadUserData();
  }, [loadUserData]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return user.roles.includes(role) || user.roles.includes(normalizedRole);
  }, [user]);

  const hasAnyRole = useCallback((requiredRoles) => {
    if (!user) return false;
    return requiredRoles.some(role => hasRole(role));
  }, [user, hasRole]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    hasRole,
    hasAnyRole,
    refreshUser,
  };
};