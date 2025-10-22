// layouts/MainLayout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      
      {/* Основной контент */}
      <main className="flex-1 overflow-auto">
        <div className="">
          {children}
        </div>
      </main>
    </div>
  );
}