// pages/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Система предикатов для проверки доступности
const predicates = {
  // Проверка на админа
  isAdmin: (user) => user?.isAdmin || false,
  
  // Проверка на кодера
  isCoder: (user) => user?.isCoder || false,
  
  // Проверка на пользователя
  isUser: (user) => user?.isUser || false,
  
  // Проверка на наличие любой из ролей
  hasAnyRole: (user, roles) => roles.some(role => user?.roles?.includes(role)),
  
  // Проверка на наличие всех ролей
  hasAllRoles: (user, roles) => roles.every(role => user?.roles?.includes(role)),
  
  // Проверка на конкретную роль
  hasRole: (user, role) => user?.roles?.includes(role) || false,
  
  // Всегда true
  always: () => true,
  
  // Всегда false
  never: () => false,
  
  // Комбинированные предикаты
  and: (...predicates) => (user, ...args) => 
    predicates.every(predicate => predicate(user, ...args)),
  
  or: (...predicates) => (user, ...args) => 
    predicates.some(predicate => predicate(user, ...args)),
  
  not: (predicate) => (user, ...args) => 
    !predicate(user, ...args)
};

export default function DashboardPage() {
  const { user } = useAuth();

  const features = [
    {
      title: "Crash Analytics",
      description: "View and analyze application crashes with detailed stack traces and statistics",
      icon: "🐛",
      path: "/crashes",
      color: "from-purple-500 to-pink-500",
      predicate: predicates.or(predicates.isAdmin)
    },
    {
      title: "Upload Builds",
      description: "Upload server and client builds for crash analysis and deobfuscation",
      icon: "🚀",
      path: "/uploader",
      color: "from-amber-500 to-orange-500",
      predicate: predicates.or(predicates.isAdmin, predicates.isCoder) // ADMIN или CODER
    },
    {
      title: "User Management",
      description: "Manage user accounts, roles and permissions",
      icon: "👥",
      path: "/users",
      color: "from-blue-500 to-cyan-500",
      predicate: predicates.isAdmin
    },
    {
      title: "Statistics",
      description: "Detailed analytics and reports about crash patterns and trends",
      icon: "📊",
      path: "/stats",
      color: "from-green-500 to-emerald-500",
      predicate: predicates.or(predicates.isAdmin)
    },
    {
      title: "Code Analysis",
      description: "Advanced code analysis and debugging tools for developers",
      icon: "🔍",
      path: "/analysis",
      color: "from-indigo-500 to-purple-500",
      predicate: predicates.or(predicates.isAdmin, predicates.isCoder) // ADMIN или CODER
    },
    {
      title: "System Settings",
      description: "Configure system settings and preferences",
      icon: "⚙️",
      path: "/settings",
      color: "from-gray-500 to-slate-500",
      predicate: predicates.isAdmin // Только ADMIN
    },
    {
      title: "API Documentation",
      description: "Complete API documentation and integration guides",
      icon: "📚",
      path: "/docs",
      color: "from-teal-500 to-cyan-500",
      predicate: predicates.or(predicates.isAdmin, predicates.isCoder)
    },
    {
      title: "Monitoring",
      description: "Real-time system monitoring and health checks",
      icon: "📡",
      path: "/monitoring",
      color: "from-red-500 to-pink-500",
      predicate: predicates.isAdmin // Только ADMIN
    }
  ];

  const availableFeatures = features.filter(feature => 
    feature.predicate(user)
  );

  // Функция для получения текста роли
  const getRoleText = (user) => {
    if (user?.isAdmin) return 'Administrator';
    if (user?.isCoder) return 'Coder';
    return 'User';
  };

  // Функция для получения цвета роли
  const getRoleColor = (user) => {
    if (user?.isAdmin) return 'bg-purple-500';
    if (user?.isCoder) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  // Функция для получения градиента роли
  const getRoleGradient = (user) => {
    if (user?.isAdmin) return 'from-purple-400 to-pink-400';
    if (user?.isCoder) return 'from-amber-400 to-orange-400';
    return 'from-blue-400 to-cyan-400';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome back, <span className={`bg-gradient-to-r ${getRoleGradient(user)} bg-clip-text text-transparent`}>{user?.username}</span>!
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          CrashPusher helps you monitor, analyze and fix application crashes efficiently.
          {user?.isCoder && !user?.isAdmin && " As a coder, you have access to advanced development tools."}
          {user?.isUser && !user?.isCoder && !user?.isAdmin && " As a user, you can view crash reports and analytics."}
        </p>
        
        {/* Role Badge */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700/50">
          <div className={`w-2 h-2 rounded-full ${getRoleColor(user)}`}></div>
          <span className="text-sm text-gray-300">
            {getRoleText(user)} • {user?.roles?.join(', ')}
          </span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {availableFeatures.map((feature, index) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="group block bg-gray-800/30 rounded-xl p-6 border border-gray-700/30 hover:border-opacity-50 transition-all duration-300 hover:transform hover:scale-105"
            style={{ 
              borderColor: feature.color.split(' ')[1].replace('from-', '').split('-')[0] + '500',
              opacity: 1
            }}
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:opacity-90 transition-opacity">
              {feature.title}
            </h3>
            
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              {feature.description}
            </p>
            
            <div className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors">
              <span className="text-sm font-medium">Explore</span>
              <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Role-based Guides */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Guide for Coders */}
        {(user?.isCoder && !user?.isAdmin) && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-400">💻</span>
              Coder Guide
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">1</div>
                <div>
                  <div className="font-medium text-white">Upload Builds</div>
                  <div className="text-gray-400">Upload server/client builds for analysis</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">2</div>
                <div>
                  <div className="font-medium text-white">Code Analysis</div>
                  <div className="text-gray-400">Use advanced debugging tools</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">3</div>
                <div>
                  <div className="font-medium text-white">API Integration</div>
                  <div className="text-gray-400">Explore API documentation</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guide for Admins */}
        {user?.isAdmin && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-purple-400">👑</span>
              Admin Guide
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">1</div>
                <div>
                  <div className="font-medium text-white">User Management</div>
                  <div className="text-gray-400">Manage users and permissions</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">2</div>
                <div>
                  <div className="font-medium text-white">System Monitoring</div>
                  <div className="text-gray-400">Monitor system health</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">3</div>
                <div>
                  <div className="font-medium text-white">Settings</div>
                  <div className="text-gray-400">Configure system preferences</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Guide for Users */}
        {(user?.isUser && !user?.isCoder && !user?.isAdmin) && (
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">👤</span>
              User Guide
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">1</div>
                <div>
                  <div className="font-medium text-white">Crash Analytics</div>
                  <div className="text-gray-400">View detailed crash reports and stack traces</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">2</div>
                <div>
                  <div className="font-medium text-white">Statistics & Trends</div>
                  <div className="text-gray-400">Analyze crash patterns and frequency</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white mt-0.5 flex-shrink-0">3</div>
                <div>
                  <div className="font-medium text-white">Search & Filter</div>
                  <div className="text-gray-400">Find specific crashes using advanced filters</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State если нет доступных фич */}
      {availableFeatures.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Features Available</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            You don't have access to any features with your current role. 
            Please contact an administrator to request access.
          </p>
        </div>
      )}
    </div>
  );
}