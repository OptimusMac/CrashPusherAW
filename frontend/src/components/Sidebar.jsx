import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../api/authApi';
import { getRolesFromToken, isTokenExpired } from '../utils/jwtUtils';

// Оптимизированные компоненты
const HamburgerIcon = memo(({ isOpen }) => (
  <div className="w-6 h-6 flex flex-col justify-center">
    <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${
      isOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'
    }`} />
    <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${
      isOpen ? 'opacity-0' : 'opacity-100'
    }`} />
    <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${
      isOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'
    }`} />
  </div>
));
HamburgerIcon.displayName = 'HamburgerIcon';

const CloseIcon = memo(() => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
));
CloseIcon.displayName = 'CloseIcon';

const LogoutIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
));
LogoutIcon.displayName = 'LogoutIcon';

// Хук для определения мобильного устройства
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Хук для управления состоянием сайдбара
const useSidebarState = (isMobile) => {
  const [isOpen, setIsOpen] = useState(false);

  // Закрываем сайдбар при клике вне его на мобильных
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && !event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen]);

  // Закрываем сайдбар при переходе по ссылке на мобильных
  const location = useLocation();
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  return [isOpen, setIsOpen];
};

// Компонент пункта меню
const MenuItem = memo(({ item, isActive, onNavigate }) => (
  <Link
    to={item.path}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 group ${
      isActive
        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
        : 'text-gray-400 hover:text-white hover:bg-gray-800/50 hover:border-gray-600/50 border border-transparent'
    }`}
    onClick={onNavigate}
  >
    <span className="text-lg transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
    <span className="font-medium">{item.label}</span>
  </Link>
));
MenuItem.displayName = 'MenuItem';

// Компонент заголовка
const SidebarHeader = memo(({ isMobile, onClose, onLogout }) => (
  <div className="p-4 flex items-center justify-between border-b border-gray-700/50">
    <div className="flex-1 min-w-0">
      <h1 className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
        CrashPusher
      </h1>
      <p className="text-xs text-gray-400 truncate">Crash Analytics Platform</p>
    </div>
    
    {/* Кнопка выхода - компактная версия */}
    <div className="flex items-center gap-2 ml-3">
      <button
        onClick={onLogout}
        className="p-2 rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20 flex items-center justify-center"
        title="Logout"
      >
        <LogoutIcon />
      </button>
      
      {isMobile && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  </div>
));
SidebarHeader.displayName = 'SidebarHeader';

// Главный компонент Sidebar
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  const [isOpen, setIsOpen] = useSidebarState(isMobile);
  
  const token = getToken();
  const isAuthenticated = token && !isTokenExpired(token);
  const roles = isAuthenticated ? getRolesFromToken(token) : [];
  const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  const isCoder = roles.includes('CODER') || roles.includes('ROLE_CODER') || isAdmin;

  const menuItems = useCallback(() => [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '🏠'
    },
    ...(isAdmin ? [{
      path: '/users',
      label: 'Users',
      icon: '👥'
    },
    {
      path: '/crashes',
      label: 'Crashes', 
      icon: '🐛'
    },
    {
      path: '/stats',
      label: 'Stats',
      icon: '📊'
    },
    {
      path: '/admin/files',
      label: 'Files',
      icon: '📥'
    },
    {
      path: '/admin/logs',
      label: 'Logs',
      icon: '📜'
    }] : []),
    ...(isCoder ? [{
      path: '/uploader',
      label: 'Upload',
      icon: '📁'
    }] : [])
  ], [isAdmin, isCoder]);

  const handleLogout = useCallback(() => {
    removeToken();
    navigate('/auth');
  }, [navigate]);

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile, setIsOpen]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Кнопка toggle для мобильных */}
      {isMobile && (
        <button
          className={`sidebar-toggle fixed top-4 left-4 z-50 p-3 rounded-lg bg-gray-900/80 backdrop-blur-lg border transition-all duration-300 ${
            isOpen 
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
              : 'border-gray-700/50 text-white hover:bg-gray-800/50'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <HamburgerIcon isOpen={isOpen} />
        </button>
      )}

      {/* Overlay для мобильных */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Сайдбар */}
      <div className={`
        sidebar
        ${isMobile 
          ? `fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative w-64 min-h-screen'
        }
        bg-gray-900/80 backdrop-blur-lg border-r border-gray-700/50
        flex flex-col
      `}>
        {/* Заголовок с кнопкой выхода */}
        <SidebarHeader 
          isMobile={isMobile}
          onClose={() => setIsOpen(false)}
          onLogout={handleLogout}
        />

        {/* Навигация */}
        <nav className="flex-1 px-4 py-4">
          {menuItems().map(item => (
            <MenuItem
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        {/* Footer с информацией о пользователе */}
        <div className="px-4 py-3 border-t border-gray-700/50">
          <div className="text-xs text-gray-400 text-center">
            <div className="truncate">
              Role: {isAdmin ? 'Admin' : isCoder ? 'Coder' : 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент - сдвигается только на десктопе */}
      {!isMobile && (
        <div className="flex-1 ml-0 transition-all duration-300">
          {/* Контент будет здесь */}
        </div>
      )}
    </>
  );
};

export default memo(Sidebar);