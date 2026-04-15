import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Database, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { icon: LayoutDashboard, label: '仪表盘',    to: '/' },
  { icon: Database,        label: '模型管理',  to: '/models' },
  { icon: Settings,        label: '设置',      to: '/settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#1A1F2E] border-r border-white/5 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-white/5">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Hexagon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">AI Token</div>
          <div className="text-slate-400 text-xs mt-0.5">Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                 ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                 : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
               }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-black/20 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.username}</div>
            <div className="text-slate-400 text-xs capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium
                     text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
