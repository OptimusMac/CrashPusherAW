// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import GlobalCrashesPage from "./pages/GlobalCrashesPage";
import StatsPage from "./pages/StatsPage";
import UploadPage from "./pages/UploadPage";
import ExceptionDetailPage from "./pages/ExceptionDetailPage";
import AuthPage from "./components/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminFilesPage from "./components/AdminFilesPage"

// Компонент лейаута
const Layout = ({ children }) => (
  <div className="min-h-screen flex">
    <Sidebar />
    <main className="flex-1 p-6 overflow-auto">
      {children}
    </main>
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* ЕДИНСТВЕННЫЙ публичный маршрут */}
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Защищенные маршруты */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Только для ADMINS */}
      <Route path="/users" element={
        <ProtectedRoute requiredRoles={['ADMIN']}>
          <Layout>
            <UsersPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/files" element={
        <ProtectedRoute requiredRoles={['ADMIN']}>
          <Layout>
            <AdminFilesPage  />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Для всех авторизованных пользователей (USER и ADMIN) */}
      <Route path="/crashes" element={
        <ProtectedRoute requiredRoles={['ADMIN']}>
          <Layout>
            <GlobalCrashesPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/stats" element={
        <ProtectedRoute requiredRoles={['ADMIN']}>
          <Layout>
            <StatsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/uploader" element={
        <ProtectedRoute requiredRoles={['CODER', 'ADMIN']}>
          <Layout>
            <UploadPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/crashes/:type" element={
        <ProtectedRoute requiredRoles={['ADMIN']}>
          <Layout>
            <ExceptionDetailPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Корневой путь - на dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />


      
      {/* 404 - на dashboard */}
      <Route path="*" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />
    </Routes>
  );
}