// pages/UploadPage.jsx
import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import ServerClientToggle from '../components/ServerClientToggle';
import { uploadFileWithProgress } from '../api/uploadApi';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('SERVER');
  const [uploadStage, setUploadStage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const acceptedFileTypes = {
    'application/java-archive': '.jar',
    'application/zip': '.zip', 
    'application/x-tar': '.tar',
    'application/gzip': '.tar.gz',
    'application/x-7z-compressed': '.7z',
    'application/x-rar-compressed': '.rar'
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const processFile = (file) => {
    const isValidType = Object.keys(acceptedFileTypes).some(type => 
      file.type === type || file.name.endsWith(acceptedFileTypes[type])
    );

    if (!isValidType) {
      setUploadResult({
        success: false,
        message: 'Неподдерживаемый формат файла. Разрешены: .jar, .zip, .tar, .tar.gz, .7z, .rar'
      });
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setUploadResult({
        success: false,
        message: 'Файл слишком большой. Максимальный размер: 500MB'
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(selectedFile.size);
    setUploadResult(null);
    setUploadStage('Подготовка к загрузке...');

    try {
      const result = await uploadFileWithProgress(
        selectedFile,
        fileType,
        // Callback прогресса
        (progressInfo) => {
          setUploadProgress(progressInfo.progress);
          setUploadedBytes(progressInfo.uploadedBytes || 0);
          setTotalBytes(progressInfo.totalBytes || selectedFile.size);
          
          if (progressInfo.sessionId) {
            setCurrentSessionId(progressInfo.sessionId);
          }
        },
        // Callback смены стадии
        (stage) => {
          setUploadStage(stage);
        }
      );

      setUploadResult({
        success: true,
        message: result.message,
        fileInfo: result.fileInfo
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Произошла ошибка при загрузке'
      });
    } finally {
      setUploading(false);
      setUploadStage('');
      setCurrentSessionId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      'jar': 'Java Archive',
      'zip': 'ZIP Archive', 
      'tar': 'TAR Archive',
      'gz': 'GZIP Archive',
      '7z': '7-Zip Archive',
      'rar': 'RAR Archive'
    };
    return types[ext] || 'Unknown';
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(0);
    setUploadStage('');
    setCurrentSessionId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatTimeRemaining = (uploaded, total, progress) => {
    if (progress === 0 || progress === 100) return '';
    
    const elapsedTime = Date.now() - (window.uploadStartTime || Date.now());
    const bytesPerMs = uploaded / elapsedTime;
    const remainingBytes = total - uploaded;
    const remainingMs = bytesPerMs > 0 ? remainingBytes / bytesPerMs : 0;
    
    const seconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `~${minutes} мин ${seconds % 60} сек`;
    }
    return `~${seconds} сек`;
  };

  // Запоминаем время начала загрузки
  React.useEffect(() => {
    if (uploading && uploadProgress === 0) {
      window.uploadStartTime = Date.now();
    }
  }, [uploading, uploadProgress]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Build Files</h1>
        <p className="text-gray-400">
          Загрузите серверные или клиентские билды для анализа крэшей и деобфускации
        </p>
        {user && (
          <div className="mt-2 text-sm">
            <span className="text-gray-400">User: </span>
            <span className="text-blue-300 font-semibold">{user.username}</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-purple-300">ID: {user.id}</span>
          </div>
        )}
      </div>

      {/* Server/Client Toggle */}
      <div className="mb-6">
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">🔧</span>
            Тип билда
          </h3>
          <ServerClientToggle 
            value={fileType}
            onChange={setFileType}
            disabled={uploading}
          />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <span className="text-purple-400 font-medium">🚀 Server Build:</span>
              <ul className="mt-2 space-y-1">
                <li>• Серверные JAR файлы</li>
                <li>• Plugins и моды</li>
                <li>• Бизнес-логика</li>
              </ul>
            </div>
            <div>
              <span className="text-blue-400 font-medium">💻 Client Build:</span>
              <ul className="mt-2 space-y-1">
                <li>• Клиентские приложения</li>
                <li>• UI и ресурсы</li>
                <li>• Конфигурации</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="mb-6">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-purple-400">📦</span>
            Поддерживаемые форматы
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(acceptedFileTypes).map(([mime, ext]) => (
              <div key={ext} className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-mono">{ext}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-gray-800/30 rounded-xl p-8 border-2 border-dashed border-gray-700/50 transition-all duration-300 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={Object.values(acceptedFileTypes).join(',')}
        />
        
        <div
          className={`relative flex flex-col items-center justify-center p-8 transition-all duration-300 ${
            dragActive 
              ? 'bg-purple-500/10 border-purple-500/50 scale-105' 
              : 'hover:bg-gray-700/20'
          } rounded-lg border-2 border-dashed ${
            dragActive ? 'border-purple-500/50' : 'border-gray-600/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg animate-pulse"></div>
          )}
          
          <div className={`text-6xl mb-4 transition-transform duration-300 ${
            dragActive ? 'scale-110' : ''
          }`}>
            {fileType === 'SERVER' ? '🚀' : '💻'}
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2 text-center">
            {selectedFile ? 'Файл выбран' : `Загрузите ${fileType === 'SERVER' ? 'серверный' : 'клиентский'} билд`}
          </h3>
          
          <p className="text-gray-400 text-center mb-6 max-w-md">
            {selectedFile 
              ? `Готов к загрузке: ${selectedFile.name}`
              : 'Перетащите файл сюда или нажмите для выбора. Максимальный размер: 500MB'
            }
          </p>
          
          <button
            onClick={handleButtonClick}
            disabled={uploading}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 px-6 py-3 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedFile ? 'Выбрать другой файл' : 'Выбрать файл'}
          </button>
        </div>

        {/* Выбранный файл */}
        {selectedFile && (
          <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  fileType === 'SERVER' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {fileType === 'SERVER' ? '🚀' : '💻'}
                </div>
                <div>
                  <div className="text-white font-medium">{selectedFile.name}</div>
                  <div className="text-gray-400 text-sm">
                    {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.name)} • {fileType}
                  </div>
                </div>
              </div>
              <button
                onClick={resetUpload}
                disabled={uploading}
                className="text-gray-400 hover:text-red-400 transition-colors p-2 disabled:opacity-50"
                title="Удалить файл"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Section */}
      {uploading && (
        <div className="mb-6 animate-fade-in">
          {/* Stage Info */}
          {uploadStage && (
            <div className="mb-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="text-white font-medium">{uploadStage}</div>
                  <div className="text-gray-400 text-sm">
                    {currentSessionId && `ID сессии: ${currentSessionId.substring(0, 8)}...`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>
                {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}
              </span>
              <span>
                {Math.round(uploadProgress)}% • {formatTimeRemaining(uploadedBytes, totalBytes, uploadProgress)}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                  fileType === 'SERVER' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploading && !uploadResult && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleUpload}
            className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 px-6 py-4 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 font-medium hover:scale-105 transform"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Начать загрузку {fileType === 'SERVER' ? 'серверного' : 'клиентского'} билда
            </div>
          </button>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className={`animate-fade-in-up ${
          uploadResult.success 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        } rounded-xl p-6 border mb-6`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
              uploadResult.success 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {uploadResult.success ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                uploadResult.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {uploadResult.success ? 'Успешно!' : 'Ошибка'}
              </h3>
              <p className="text-gray-300 mt-1">{uploadResult.message}</p>
              
              {uploadResult.success && uploadResult.fileInfo && (
                <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Файл:</span>
                      <div className="text-white font-mono">{uploadResult.fileInfo.filename}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Тип билда:</span>
                      <div className={`font-medium ${
                        uploadResult.fileInfo.fileType === 'SERVER' ? 'text-purple-300' : 'text-blue-300'
                      }`}>
                        {uploadResult.fileInfo.fileType}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Размер:</span>
                      <div className="text-white">{formatFileSize(uploadResult.fileInfo.fileSize)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Обработано файлов:</span>
                      <div className="text-white">{uploadResult.fileInfo.processedFiles || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Checksum:</span>
                      <div className="text-white font-mono text-xs">{uploadResult.fileInfo.checksum || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Время:</span>
                      <div className="text-white">
                        {uploadResult.fileInfo.processedAt ? 
                          new Date(uploadResult.fileInfo.processedAt).toLocaleTimeString() : 
                          new Date().toLocaleTimeString()
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {uploadResult.success && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={resetUpload}
                className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 px-4 py-2 rounded-lg transition-colors border border-gray-600/30 hover:border-gray-600/50"
              >
                Загрузить еще файл
              </button>
              <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg transition-colors border border-blue-500/30 hover:border-blue-500/50">
                Перейти к анализу
              </button>
            </div>
          )}
        </div>
      )}

      {/* Process Info */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">ℹ️</span>
          Что происходит после загрузки?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-300 flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-medium text-white mb-1">Загрузка частями</div>
              <div className="text-gray-400">Файл делится на части по 5MB для надежной передачи</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-300 flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-medium text-white mb-1">Сборка файла</div>
              <div className="text-gray-400">Части собираются в целый файл на сервере</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-300 flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-medium text-white mb-1">Обработка</div>
              <div className="text-gray-400">Анализ, деобфускация и индексация содержимого</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}