// utils/jwtUtils.js
export const decodeJwt = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('❌ Error decoding JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  try {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) {
      console.log('❌ Token has no expiration date');
      return true;
    }
    
    const isExpired = payload.exp * 1000 < Date.now();
    console.log('⏰ Token expiration check:', { 
      exp: new Date(payload.exp * 1000), 
      now: new Date(), 
      isExpired 
    });
    
    return isExpired;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true;
  }
};

export const getRolesFromToken = (token) => {
  try {
    const payload = decodeJwt(token);
    const roles = payload?.roles || [];
    console.log('🔐 User roles from token:', roles);
    return roles;
  } catch (error) {
    console.error('❌ Error getting roles from token:', error);
    return [];
  }
};

// ДОБАВЬТЕ ЭТУ ФУНКЦИЮ
export const getUsernameFromToken = (token) => {
  try {
    const payload = decodeJwt(token);
    const username = payload?.sub || '';
    console.log('👤 Username from token:', username);
    return username;
  } catch (error) {
    console.error('❌ Error getting username from token:', error);
    return '';
  }
};

export const getUserIdFromToken = (token) => {
  try {
    const payload = decodeJwt(token);
    const userId = payload?.userId || payload?.id || '';
    console.log('🆔 User ID from token:', userId);
    return userId;
  } catch (error) {
    console.error('❌ Error getting user ID from token:', error);
    return '';
  }
};

// Вспомогательные функции для проверки ролей
export const hasRole = (token, role) => {
  const roles = getRolesFromToken(token);
  return roles.includes(role) || roles.includes(`ROLE_${role}`);
};

export const isAdmin = (token) => {
  return hasRole(token, 'ADMIN');
};

export const hasAnyRole = (token, requiredRoles) => {
  const userRoles = getRolesFromToken(token);
  return requiredRoles.some(role => 
    userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
  );
};