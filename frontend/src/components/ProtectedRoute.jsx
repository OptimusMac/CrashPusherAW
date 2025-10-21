// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, removeToken } from '../api/authApi';
import { isTokenExpired, getRolesFromToken } from '../utils/jwtUtils';

export default function ProtectedRoute({ children, requiredRoles }) {
  const location = useLocation();
  const token = getToken();

  // Если нет токена - на авторизацию
  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Если токен просрочен
  if (isTokenExpired(token)) {
    console.log('🔐 Token expired, redirecting to auth');
    removeToken();
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Если требуются определенные роли - проверяем
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = getRolesFromToken(token);
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
    );

    if (!hasRequiredRole) {
      console.log('🚫 Access denied: user roles', userRoles, 'required', requiredRoles);
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
          <div className="text-center bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-red-500/30 p-8 max-w-md mx-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You don't have permission to access this page.
            </p>
            <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-300">
                Your roles: <span className="font-semibold text-blue-300">{userRoles.join(', ')}</span>
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Required: <span className="font-semibold text-red-300">{requiredRoles.join(', ')}</span>
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 px-6 rounded-lg transition-colors border border-blue-500/30 hover:border-blue-500/50"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
}