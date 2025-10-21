import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/crashApi';

export default function AdminFilesPage() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.isAdmin) {
      loadFiles();
      loadStats();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/upload/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/upload/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await api.get(`/upload/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      // Создаем ссылку для скачивания
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
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      await api.delete(`/upload/files/${fileId}`);
      loadFiles(); // Перезагружаем список
      loadStats(); // Обновляем статистику
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Ошибка при удалении файла');
    }
  };

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

  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-300 mb-2">Доступ запрещен</h2>
          <p className="text-gray-300">У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Управление файлами</h1>
        <p className="text-gray-400">
          Просмотр и управление загруженными серверными и клиентскими билдами
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
            <div className="text-2xl font-bold text-white mb-2">{stats.totalFiles}</div>
            <div className="text-gray-400">Всего файлов</div>
          </div>
          <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
            <div className="text-2xl font-bold text-purple-300 mb-2">{stats.serverFiles}</div>
            <div className="text-gray-400">Серверных билдов</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-300 mb-2">{stats.clientFiles}</div>
            <div className="text-gray-400">Клиентских билдов</div>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Поиск по имени файла или пользователю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            onClick={loadFiles}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg transition-colors border border-purple-500/30 hover:border-purple-500/50"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">Загрузка файлов...</div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">Файлы не найдены</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/30">
                  <th className="text-left p-4 text-gray-400 font-medium">Файл</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Тип</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Размер</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Пользователь</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Дата</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-gray-700/10 hover:bg-gray-700/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          file.fileType === 'SERVER' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {file.fileType === 'SERVER' ? '🚀' : '💻'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{file.filename}</div>
                          <div className="text-gray-400 text-xs">
                            {file.processedFiles} файлов • {file.checksum}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        file.fileType === 'SERVER' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {file.fileType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{formatFileSize(file.fileSize)}</td>
                    <td className="p-4 text-gray-300">{file.uploadedBy}</td>
                    <td className="p-4 text-gray-300">{formatDate(file.uploadedAt)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(file.id, file.filename)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded text-sm transition-colors border border-green-500/30 hover:border-green-500/50"
                        >
                          Скачать
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded text-sm transition-colors border border-red-500/30 hover:border-red-500/50"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}