// components/Sidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../api/authApi';
import { getRolesFromToken, isTokenExpired } from '../utils/jwtUtils';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const token = getToken();
  const isAuthenticated = token && !isTokenExpired(token);
  const roles = isAuthenticated ? getRolesFromToken(token) : [];
  const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  const isCoder = roles.includes('CODER') || roles.includes('ROLE_CODER') || isAdmin;

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '🏠'
    },
    ...(isAdmin ? [{
      path: '/users',
      label: 'User Management',
      icon: '👥'
    },
    {
      path: '/crashes',
      label: 'Crashes', 
      icon: '🐛'
    },
    {
      path: '/stats',
      label: 'Statistics',
      icon: '📊'
    },
    {
      path: '/admin/files',
      label: 'Downloader',
      icon: '📥'
    }
  ] : []),
    ...(isCoder ? [{
      path: '/uploader',
      label: 'File Uploader',
      icon: '📁'
    }] : [])
  ];

  const handleLogout = () => {
    removeToken();
    navigate('/auth');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-64 bg-gray-900/80 backdrop-blur-lg border-r border-gray-700/50 min-h-screen p-4 flex flex-col">
      {/* Логотип */}
      <div className="p-4 mb-8">
        <h1 className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          CrashPusher
        </h1>
        <p className="text-sm text-gray-400">Crash Analytics Platform</p>
      </div>

      {/* Навигация */}
      <nav className="flex-1">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Выход */}
      <div className="pt-4 border-t border-gray-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 w-full transition-all duration-200"
        >
          <span className="text-lg">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}