// components/AdminAuth.jsx
import React, { useState } from 'react';

export default function AdminAuth({ onAuth }) {
  const [step, setStep] = useState('token'); // 'token', 'validate', 'register'
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerateToken = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await onAuth('generateToken');
      setSuccess(response.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token.trim()) {
      setError('Please enter the token');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await onAuth('validateToken', { token });
      setSuccess(response.message);
      setStep('register');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      await onAuth('register', { token, username, password });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Generate/Enter Token */}
      {step === 'token' && (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <h3 className="text-purple-400 font-semibold mb-2">Admin Registration Process</h3>
            <p className="text-gray-400 text-sm">
              1. Generate confirmation token (will be sent to Discord)<br/>
              2. Enter the token to validate<br/>
              3. Create admin account
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleGenerateToken}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 transition-all duration-300"
            >
              {loading ? 'Generating...' : 'Generate Token'}
            </button>
            
            <button
              onClick={() => setStep('validate')}
              className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/30 transition-all duration-300"
            >
              I Have Token
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Validate Token */}
      {step === 'validate' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmation Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter the token from Discord"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            />
          </div>

          <button
            onClick={handleValidateToken}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Validating...' : 'Validate Token'}
          </button>

          <button
            onClick={() => setStep('token')}
            className="w-full text-gray-400 hover:text-white transition-colors duration-300 text-sm"
          >
            ← Back to token generation
          </button>
        </div>
      )}

      {/* Step 3: Register Admin */}
      {step === 'register' && (
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Username
              </label>
              <input
                id="adminUsername"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose admin username"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                required
              />
            </div>

            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set secure password"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
          </button>
        </form>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        </div>
      )}
    </div>
  );
}