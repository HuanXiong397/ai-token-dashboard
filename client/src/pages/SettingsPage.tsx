import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Shield, Key } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#262B3D] p-6 md:p-10 text-slate-200">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">设置</h1>

        {/* 账户信息 */}
        <div className="bg-[#1E2532] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">账户信息</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="用户名"  value={user?.username ?? '—'} />
            <InfoRow label="角色"    value={user?.role === 'admin' ? '管理员' : '普通用户'} />
            <InfoRow label="用户 ID" value={String(user?.id ?? '—')} />
          </div>
        </div>

        {/* 权限说明 */}
        <div className="bg-[#1E2532] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">权限说明</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-400">
            <p>• <span className="text-slate-200 font-medium">管理员</span>：可查看仪表盘、管理模型（增删改）、查看设置</p>
            <p>• <span className="text-slate-200 font-medium">普通用户</span>：可查看仪表盘和模型列表（只读）</p>
          </div>
        </div>

        {/* API 上报说明 */}
        <div className="bg-[#1E2532] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center space-x-3 mb-6">
            <Key className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">API 使用量上报</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            通过 HTTP POST 请求上报 AI 模型使用量，数据将实时体现在仪表盘中。
          </p>
          <div className="bg-black/30 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <div className="text-slate-500 mb-2"># 获取 Token</div>
            <div>POST /api/auth/login</div>
            <div className="text-slate-400">{'{"username": "admin", "password": "admin123"}'}</div>
            <div className="mt-3 text-slate-500"># 上报用量</div>
            <div>POST /api/models/usage</div>
            <div>Authorization: Bearer {'<token>'}</div>
            <div className="text-slate-400 mt-1">{`{
  "model_name": "gpt-5.4",
  "date": "2026-04-15",
  "requests": 10,
  "input_tokens": 50000,
  "cached_tokens": 5000,
  "output_tokens": 10000
}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/20 rounded-xl px-4 py-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-white font-medium">{value}</div>
    </div>
  );
}
