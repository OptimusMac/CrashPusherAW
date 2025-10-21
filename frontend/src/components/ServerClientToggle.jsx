// components/ServerClientToggle.jsx
import React from 'react';

export default function ServerClientToggle({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-4 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <button
        type="button"
        onClick={() => onChange('SERVER')}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 font-medium ${
          value === 'SERVER'
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className={`w-2 h-2 rounded-full ${
          value === 'SERVER' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
        }`}></div>
        <span>🚀 Server</span>
      </button>
      
      <button
        type="button"
        onClick={() => onChange('CLIENT')}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 font-medium ${
          value === 'CLIENT'
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className={`w-2 h-2 rounded-full ${
          value === 'CLIENT' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
        }`}></div>
        <span>💻 Client</span>
      </button>
    </div>
  );
}