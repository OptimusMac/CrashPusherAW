// AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, registerUser, generateAdminToken, validateAdminToken, registerAdmin, saveToken } from '../api/authApi';
import UserAuth from '../components/UserAuth';
import AdminAuth from '../components/AdminAuth';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('user');
  const [animationStage, setAnimationStage] = useState(0);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  // Генерация частиц для фона
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
      });
    }
    setParticles(newParticles);
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

  // components/AuthPage.jsx - в функции handleUserAuth
  const handleUserAuth = async (username, password, isLogin) => {
    console.log('🔄 Starting auth process:', { username, isLogin });
    
    try {
      const response = isLogin 
        ? await login(username, password)
        : await registerUser(username, password);
      
      console.log('✅ Auth success:', response);
      saveToken(response.token);
      navigate('/dashboard'); // ✅ Меняем на /dashboard
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Анимированные частицы фона */}
      <div className="absolute inset-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-purple-500 opacity-20 floating-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className={`bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8 shadow-2xl transition-all duration-1000 ${
            animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            
            {/* Логотип и заголовок */}
            <div className="text-center mb-8">
              <div className={`transition-all duration-1000 delay-300 ${
                animationStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}>
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <div className="w-10 h-10 bg-white rounded-lg animate-pulse" />
                  </div>
                  <div className="absolute -inset-3 bg-purple-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Secure Access
                </h1>
                <p className="text-gray-400 text-lg">Choose your authentication method</p>
              </div>
            </div>

            {/* Табы выбора */}
            <div className={`mb-8 transition-all duration-1000 delay-500 ${
              animationStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex bg-gray-700/50 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('user')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  User Access
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Admin Access
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
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .floating-particle {
          animation: float 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}