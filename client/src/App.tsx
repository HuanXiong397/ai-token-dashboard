import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModelsPage from './pages/ModelsPage';
import SettingsPage from './pages/SettingsPage';

// ── 受保护路由布局 ───────────────────────────────────────────────────
function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#262B3D] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

// ── 根路由 ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/"         element={<DashboardPage />} />
            <Route path="/models"   element={<ModelsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
