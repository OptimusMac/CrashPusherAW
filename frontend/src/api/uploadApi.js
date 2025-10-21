// api/uploadApi.js - исправленная версия
import { api } from './crashApi';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

// Старт сессии загрузки
export const startUploadSession = (filename, fileType, totalSize) =>
  api.post("/upload/start", null, {
    params: { filename, fileType, totalSize }
  }).then(r => r.data);

// Загрузка части файла
export const uploadChunk = (sessionId, chunkIndex, totalChunks, chunk) => {
  const formData = new FormData();
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', totalChunks);
  formData.append('file', chunk);

  return api.post(`/upload/chunk/${sessionId}`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000 // 60 секунд на чанк
  }).then(r => r.data);
};

// Получение прогресса загрузки
export const getUploadProgress = (sessionId) =>
  api.get(`/upload/progress/${sessionId}`).then(r => r.data);

// Отмена загрузки
export const cancelUpload = (sessionId) =>
  api.delete(`/upload/${sessionId}`).then(r => r.data);

// Основная функция загрузки с прогрессом
export const uploadFileWithProgress = async (file, fileType, onProgress, onStageChange) => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  try {
    // Стадия 1: Начало сессии
    if (onStageChange) onStageChange('Подготовка к загрузке...');
    
    // Начинаем сессию
    const startResponse = await startUploadSession(file.name, fileType, file.size);
    
    if (startResponse.status !== 'READY') {
      throw new Error('Не удалось начать сессию загрузки: ' + startResponse.message);
    }

    const sessionId = startResponse.sessionId;
    let uploadedBytes = 0;

    // Стадия 2: Загрузка чанков
    if (onStageChange) onStageChange('Загрузка файла...');
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const chunkResponse = await uploadChunk(sessionId, chunkIndex, totalChunks, chunk);
      
      if (chunkResponse.status === 'ERROR') {
        throw new Error(`Ошибка загрузки части ${chunkIndex + 1}: ${chunkResponse.message}`);
      }

      uploadedBytes += chunk.size;
      const progress = Math.round((uploadedBytes / file.size) * 100);

      // Обновляем прогресс
      if (onProgress) {
        onProgress({
          sessionId,
          chunkIndex,
          totalChunks,
          progress,
          uploadedBytes,
          totalBytes: file.size
        });
      }

      // Обновляем стадию
      if (onStageChange) {
        const stage = getUploadStage(chunkIndex, totalChunks, fileType);
        onStageChange(stage);
      }
    }

    // Стадия 3: Ожидание обработки
    if (onStageChange) onStageChange('Финальная обработка на сервере...');
    
    // Периодически проверяем прогресс
    let finalResult = await waitForCompletion(sessionId, onProgress);
    
    return {
      success: true,
      sessionId,
      fileInfo: finalResult.fileInfo,
      message: `${fileType === 'SERVER' ? 'Серверный' : 'Клиентский'} билд успешно загружен и обработан!`
    };

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Функция ожидания завершения обработки
const waitForCompletion = async (sessionId, onProgress, maxAttempts = 60) => { // Увеличиваем до 60 попыток
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const progress = await getUploadProgress(sessionId);
      
      console.log('📊 Progress check:', {
        attempt: attempt + 1,
        status: progress.status,
        hasFileInfo: !!progress.fileInfo,
        progress: progress.progress
      });
      
      // УСПЕШНОЕ ЗАВЕРШЕНИЕ: статус COMPLETED и есть fileInfo
      if (progress.status === 'COMPLETED' && progress.fileInfo) {
        console.log('✅ Upload completed with fileInfo:', progress.fileInfo);
        return progress;
      }
      
      // ОШИБКА
      if (progress.status === 'ERROR') {
        throw new Error(progress.message || 'Ошибка обработки файла на сервере');
      }

      // Если статус COMPLETED но нет fileInfo, продолжаем ждать
      if (progress.status === 'COMPLETED' && !progress.fileInfo) {
        console.log('🔄 Status COMPLETED but no fileInfo, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Обновляем прогресс
      if (onProgress) {
        onProgress({
          progress: Math.min(95, 90 + (attempt / maxAttempts * 10)),
          uploadedBytes: progress.uploadedBytes,
          totalBytes: progress.totalBytes,
          status: progress.status
        });
      }

      // Ждем перед следующей проверкой (увеличиваем интервал)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error('❌ Progress check error:', error);
      if (attempt === maxAttempts - 1) {
        throw new Error('Превышено время ожидания обработки файла: ' + error.message);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Превышено время ожидания обработки файла');
};

// Получение текста стадии на основе прогресса
const getUploadStage = (chunkIndex, totalChunks, fileType) => {
  const progress = (chunkIndex / totalChunks) * 100;
  
  if (progress < 30) return 'Загрузка файла...';
  if (progress < 60) return 'Проверка целостности...';
  if (progress < 90) return 'Подготовка к обработке...';
  
  const typeText = fileType === 'SERVER' ? 'серверного' : 'клиентского';
  return `Обработка ${typeText} билда...`;
};