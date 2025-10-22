import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/crashApi';

// Константы для предотвращения пересоздания
const FILE_TYPES = {
  SERVER: { 
    bg: 'bg-purple-500/20', 
    text: 'text-purple-300', 
    border: 'border-purple-500/30',
    icon: '🚀',
    label: 'SERVER'
  },
  CLIENT: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-300', 
    border: 'border-blue-500/30',
    icon: '💻',
    label: 'CLIENT'
  }
};

const STATS_CARDS = [
  { key: 'totalFiles', label: 'Всего файлов', bg: 'bg-gray-800/30', border: 'border-gray-700/30' },
  { key: 'serverFiles', label: 'Серверных билдов', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'clientFiles', label: 'Клиентских билдов', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
];

// Оптимизированные утилиты
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

// Оптимизированные компоненты
const LoadingSpinner = memo(({ text = "Загрузка..." }) => (
  <div className="p-8 text-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2" />
    <div className="text-gray-400 text-sm">{text}</div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

const EmptyState = memo(({ searchQuery }) => (
  <div className="p-8 text-center">
    <div className="text-3xl mb-2">📁</div>
    <div className="text-gray-400">
      {searchQuery ? 'Файлы не найдены' : 'Файлы не загружены'}
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

const AccessDenied = memo(() => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
      <h2 className="text-xl font-bold text-red-300 mb-2">Доступ запрещен</h2>
      <p className="text-gray-300">У вас нет прав для просмотра этой страницы</p>
    </div>
  </div>
));
AccessDenied.displayName = 'AccessDenied';

const FileTypeBadge = memo(({ fileType }) => {
  const typeConfig = FILE_TYPES[fileType] || FILE_TYPES.CLIENT;
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
      {typeConfig.label}
    </span>
  );
});
FileTypeBadge.displayName = 'FileTypeBadge';

const ActionButton = memo(({ 
  onClick, 
  children, 
  variant = 'primary',
  disabled = false,
  className = '',
  size = 'sm'
}) => {
  const baseClasses = 'rounded transition-colors border flex items-center justify-center font-medium';
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm'
  };

  const variantClasses = {
    primary: 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30 hover:border-green-500/50',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50',
    secondary: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30 hover:border-purple-500/50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
});
ActionButton.displayName = 'ActionButton';

// Компонент карточки файла для мобильных
const FileCard = memo(({ file, onDownload, onDelete }) => {
  const typeConfig = FILE_TYPES[file.fileType] || FILE_TYPES.CLIENT;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30 hover:bg-gray-700/30 transition-colors">
      {/* Заголовок */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bg} ${typeConfig.text}`}>
          <span className="text-lg">{typeConfig.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate text-base mb-1">{file.filename}</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <FileTypeBadge fileType={file.fileType} />
            <span className="text-gray-400 text-xs">
              {file.processedFiles} файлов
            </span>
          </div>
        </div>
      </div>

      {/* Детали */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <div className="text-gray-400 text-xs mb-1">Размер</div>
          <div className="text-white">{formatFileSize(file.fileSize)}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Пользователь</div>
          <div className="text-white truncate">{file.uploadedBy}</div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-400 text-xs mb-1">Дата загрузки</div>
          <div className="text-white text-sm">{formatDate(file.uploadedAt)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-400 text-xs mb-1">Checksum</div>
          <div className="text-gray-300 text-xs font-mono truncate">{file.checksum}</div>
        </div>
      </div>

      {/* Действия */}
      <div className="flex gap-2">
        <ActionButton 
          onClick={() => onDownload(file.id, file.filename)}
          variant="primary"
          className="flex-1"
        >
          Скачать
        </ActionButton>
        <ActionButton 
          onClick={() => onDelete(file.id)}
          variant="danger"
          className="flex-1"
        >
          Удалить
        </ActionButton>
      </div>
    </div>
  );
});
FileCard.displayName = 'FileCard';

// Компонент строки таблицы для десктопа
const FileTableRow = memo(({ file, onDownload, onDelete }) => {
  const typeConfig = FILE_TYPES[file.fileType] || FILE_TYPES.CLIENT;

  return (
    <tr className="border-b border-gray-700/10 hover:bg-gray-700/20 transition-colors">
      <td className="p-3 lg:p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bg} ${typeConfig.text}`}>
            <span className="text-sm">{typeConfig.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium truncate text-sm lg:text-base">{file.filename}</div>
            <div className="text-gray-400 text-xs truncate">
              {file.checksum}
            </div>
          </div>
        </div>
      </td>
      <td className="p-3 lg:p-4">
        <FileTypeBadge fileType={file.fileType} />
      </td>
      <td className="p-3 lg:p-4 text-gray-300 text-sm whitespace-nowrap">
        {formatFileSize(file.fileSize)}
      </td>
      <td className="p-3 lg:p-4 text-gray-300 text-sm truncate max-w-[120px]">
        {file.uploadedBy}
      </td>
      <td className="p-3 lg:p-4 text-gray-300 text-sm whitespace-nowrap">
        {formatDate(file.uploadedAt)}
      </td>
      <td className="p-3 lg:p-4">
        <div className="flex gap-2 flex-wrap">
          <ActionButton 
            onClick={() => onDownload(file.id, file.filename)}
            variant="primary"
            size="sm"
          >
            Скачать
          </ActionButton>
          <ActionButton 
            onClick={() => onDelete(file.id)}
            variant="danger"
            size="sm"
          >
            Удалить
          </ActionButton>
        </div>
      </td>
    </tr>
  );
});
FileTableRow.displayName = 'FileTableRow';

// Компонент статистики
const StatsCards = memo(({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {STATS_CARDS.map(({ key, label, bg, border }) => (
        <div key={key} className={`rounded-xl p-4 lg:p-6 border ${bg} ${border}`}>
          <div className="text-xl lg:text-2xl font-bold text-white mb-2">
            {stats[key] || 0}
          </div>
          <div className="text-gray-400 text-sm lg:text-base">{label}</div>
        </div>
      ))}
    </div>
  );
});
StatsCards.displayName = 'StatsCards';

// Хук для управления файлами
const useFilesManagement = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/upload/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/upload/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const handleDownload = useCallback(async (fileId, filename) => {
    try {
      const response = await api.get(`/upload/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Ошибка при скачивании файла');
    }
  }, []);

  const handleDelete = useCallback(async (fileId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      await api.delete(`/upload/files/${fileId}`);
      await Promise.all([loadFiles(), loadStats()]);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Ошибка при удалении файла');
    }
  }, [loadFiles, loadStats]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    
    const query = searchQuery.toLowerCase();
    return files.filter(file => 
      file.filename.toLowerCase().includes(query) ||
      file.uploadedBy.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  return {
    files: filteredFiles,
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    loadFiles,
    loadStats,
    handleDownload,
    handleDelete
  };
};

// Главный компонент
const AdminFilesPage = () => {
  const { user } = useAuth();
  const {
    files,
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    loadFiles,
    loadStats,
    handleDownload,
    handleDelete
  } = useFilesManagement();

  // Загрузка данных при монтировании
  useEffect(() => {
    if (user?.isAdmin) {
      loadFiles();
      loadStats();
    }
  }, [user, loadFiles, loadStats]);

  if (!user?.isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Управление файлами
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Просмотр и управление загруженными серверными и клиентскими билдами
        </p>
      </div>

      {/* Statistics */}
      <StatsCards stats={stats} />

      {/* Search and Controls */}
      <div className="bg-gray-800/30 rounded-xl p-4 lg:p-6 border border-gray-700/30 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Поиск по имени файла или пользователю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 text-sm lg:text-base"
            />
          </div>
          <ActionButton 
            onClick={loadFiles}
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
          >
            Обновить
          </ActionButton>
        </div>
      </div>

      {/* Files List - адаптивный вывод */}
      <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Загрузка файлов..." />
        ) : files.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block lg:hidden">
              <div className="p-4 space-y-4">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/30">
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">Файл</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">Тип</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">Размер</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">Пользователь</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">Дата</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <FileTableRow
                        key={file.id}
                        file={file}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(AdminFilesPage);