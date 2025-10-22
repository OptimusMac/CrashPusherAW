// AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, registerUser, generateAdminToken, validateAdminToken, registerAdmin, saveToken } from '../api/authApi';
import UserAuth from '../components/UserAuth';
import AdminAuth from '../components/AdminAuth';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [animationStage, setAnimationStage] = useState(0);
  const [stars, setStars] = useState([]);
  const [shootingStars, setShootingStars] = useState([]);
  const navigate = useNavigate();

  // Генерация звездного неба
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 150; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.7 + 0.3,
          twinkleDelay: Math.random() * 5,
          twinkleDuration: Math.random() * 3 + 2
        });
      }
      setStars(newStars);
    };

    // Генерация падающих звезд
    const generateShootingStar = () => {
      const newShootingStar = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 30,
        duration: Math.random() * 2 + 1,
        delay: Math.random() * 2
      };
      setShootingStars(prev => [...prev.slice(-2), newShootingStar]);
    };

    generateStars();
    
    // Интервал для падающих звезд
    const shootingStarInterval = setInterval(generateShootingStar, 3000);
    
    return () => clearInterval(shootingStarInterval);
  }, []);

  // Анимация по стадиям
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animationStage < 3) {
        setAnimationStage(prev => prev + 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [animationStage]);

  const handleUserAuth = async (username, password, isLogin) => {
    console.log('🔄 Starting auth process:', { username, isLogin });
    
    try {
      const response = isLogin 
        ? await login(username, password)
        : await registerUser(username, password);
      
      console.log('✅ Auth success:', response);
      saveToken(response.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Auth failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  };

  const handleAdminAuth = async (step, data) => {
    try {
      if (step === 'generateToken') {
        return await generateAdminToken();
      } else if (step === 'validateToken') {
        return await validateAdminToken(data.token);
      } else if (step === 'register') {
        const response = await registerAdmin(data.token, data.username, data.password);
        saveToken(response.token);
        navigate('/dashboard');
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 relative overflow-hidden">
      {/* Космический фон с звездами */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-green-950/80 to-gray-950">
        {/* Статичные звезды */}
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-green-400 star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite alternate`
            }}
          />
        ))}
        
        {/* Падающие звезды */}
        {shootingStars.map(star => (
          <div
            key={star.id}
            className="absolute h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent shooting-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animation: `shoot ${star.duration}s ease-in ${star.delay}s forwards`
            }}
          />
        ))}
        
        {/* Туманности */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className={`bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8 shadow-2xl transition-all duration-1000 ${
            animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            
            {/* Логотип и заголовок */}
            <div className="text-center mb-8">
              <div className={`transition-all duration-1000 delay-300 ${
                animationStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}>
                <div className="relative inline-block mb-6">
                {/* SVG Логотип */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg 
                      viewBox="0 0 50 50" 
                      className="w-64 h-64 text-white transform hover:scale-110 transition-transform duration-300 mt-9"
                      fill="currentColor"
                    >
                      <defs>
                        <linearGradient id="logo_svg__a" x1="50%" x2="50%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
                        </linearGradient>
                      </defs>
                      <path 
                        fill="url(#logo_svg__a)" 
                        fillRule="evenodd" 
                        d="M21.245 20.002a67.4 67.4 0 0 0 10.888 3.862q.1.028.054.106-5.317 3.159-11.266 1.402-6.455-2.274-8.645-8.623a46.5 46.5 0 0 1-8.267-4.47 20.6 20.6 0 0 1-2.782-2.487A5.6 5.6 0 0 1 .038 7.57q-.242-1.58 1.054-2.54A7.3 7.3 0 0 1 3.36 4q2.231-.572 4.539-.635 1.515-.038 2.998-.027 2.42.168 4.836.397Q20.93-1.05 28 .295q1.294.3 2.486.847-4.967-.272-7.916 3.57-2.984 4.665.027 9.312 3.231 4.16 8.537 3.36 5.083-1.195 6.51-6.11.11-.75.27-1.482 1.923.954 3.864 1.878 2.684 1.46 5.133 3.28a12.6 12.6 0 0 1 2.27 2.301q2.235 3.452-1.621 5a17.5 17.5 0 0 1-5.133.9 58 58 0 0 1-5.512-.107 86 86 0 0 1-10.266-1.64zM12.438 3.761q1.287.022 2.648.105l.486.027q-3.575 3.658-3.81 8.756A20 20 0 0 1 7.279 9.42a6.2 6.2 0 0 1-1.243-1.798 6.4 6.4 0 0 1-.189-.847 5.6 5.6 0 0 1 .54-1.27 4.5 4.5 0 0 1 1.135-.82q.925-.354 1.891-.581a30 30 0 0 1 3.026-.344m25.557 6.295a27 27 0 0 1 4.863 3.148 7.2 7.2 0 0 1 1.864 2.513q.093.312.135.635-.142.635-.405 1.217a4.4 4.4 0 0 1-1.756 1.137q-1.729.555-3.485.609-.498.054-1 .105a5.8 5.8 0 0 0-1.378 0 .6.6 0 0 0-.189-.079q2.451-4.454 1.35-9.285" 
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {/* Свечение */}
                  <div className="absolute -inset-3 bg-green-500 rounded-2xl blur-lg opacity-20 animate-pulse" />
                  {/* Вращающееся кольцо */}
                  <div className="absolute -inset-4 border-2 border-green-400/30 rounded-full animate-spin-slow" />
                </div>
              </div>
                
                <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  AW Dashboard
                </h1>
              </div>
            </div>

            {/* Табы выбора */}
            <div className={`mb-8 transition-all duration-1000 delay-500 ${
              animationStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex bg-gray-700/30 rounded-xl p-1 border border-green-500/20">
                <button
                  onClick={() => setActiveTab('user')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'user'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'text-gray-400 hover:text-green-300 hover:bg-green-500/10'
                  }`}
                >
                  User Portal
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'text-gray-400 hover:text-green-300 hover:bg-green-500/10'
                  }`}
                >
                  Admin Portal
                </button>
              </div>
            </div>

            {/* Компоненты аутентификации */}
            <div className={`transition-all duration-1000 delay-700 ${
              animationStage >= 3 ? 'opacity-100' : 'opacity-0'
            }`}>
              {activeTab === 'user' ? (
                <UserAuth onAuth={handleUserAuth} />
              ) : (
                <AdminAuth onAuth={handleAdminAuth} />
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes shoot {
          0% { 
            transform: translateX(0) translateY(0) rotate(45deg);
            opacity: 0;
            width: 0;
          }
          10% { 
            opacity: 1;
          }
          100% { 
            transform: translateX(300px) translateY(150px) rotate(45deg);
            opacity: 0;
            width: 100px;
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .star {
          box-shadow: 0 0 10px 2px rgba(74, 222, 128, 0.5);
        }
        
        .shooting-star {
          box-shadow: 0 0 20px 2px rgba(74, 222, 128, 0.8);
        }
      `}</style>
    </div>
  );
}