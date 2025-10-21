// Файл: TokenHandler.jsx или главный компонент App.jsx
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function TokenHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token'); // Шаг 1: Извлекаем токен из URL

    if (token) {
      // Шаг 2: Сохраняем токен в localStorage
      localStorage.setItem('authToken', token);
      
      // Настраиваем axios для автоматической подстановки токена в заголовки
      axios.interceptors.request.use((config) => {
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
          config.headers.Authorization = `Bearer ${savedToken}`;
        }
        return config;
      });

      // Шаг 4: Перенаправляем пользователя и очищаем URL
      navigate('/users', { replace: true }); // Замените '/dashboard' на ваш путь
    }
  }, [searchParams, navigate]);

  return (
    <div>
      {/* Можно добавить индикатор загрузки */}
      Processing your access token...
    </div>
  );
}

export default TokenHandler;