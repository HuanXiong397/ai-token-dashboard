import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#262B3D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4">
            <Hexagon className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Token Dashboard</h1>
          <p className="text-slate-400 mt-2">监控您的 AI 模型用量与成本</p>
        </div>

        {/* Card */}
        <div className="bg-[#1E2532] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">登录账户</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="输入用户名"
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="输入密码"
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed
                         text-white font-semibold rounded-xl px-4 py-3 transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/20"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* 演示账号提示 */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-xl">
            <p className="text-xs text-slate-400 text-center font-medium mb-2">演示账号</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 text-center">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-slate-300">管理员</div>
                <div>admin / admin123</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-slate-300">演示用户</div>
                <div>demo / demo123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
