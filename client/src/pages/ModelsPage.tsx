import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { api } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

interface Model {
  id: number;
  name: string;
  display_name: string;
  provider: string;
  input_price: number;
  cached_price: number;
  output_price: number;
  is_active: number;
}

const EMPTY: Omit<Model, 'id'> = {
  name: '', display_name: '', provider: '',
  input_price: 0, cached_price: 0, output_price: 0, is_active: 1,
};

export default function ModelsPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [models,   setModels]   = useState<Model[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [editId,   setEditId]   = useState<number | null>(null);
  const [editData, setEditData] = useState<Omit<Model,'id'>>(EMPTY);
  const [showAdd,  setShowAdd]  = useState(false);
  const [newData,  setNewData]  = useState<Omit<Model,'id'>>(EMPTY);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Model[]>('/models');
      setModels(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('确认删除该模型？')) return;
    try {
      await api.del(`/models/${id}`);
      setModels(prev => prev.filter(m => m.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '删除失败');
    }
  }

  async function handleSaveEdit() {
    if (!editId) return;
    try {
      await api.put(`/models/${editId}`, editData);
      setModels(prev => prev.map(m => m.id === editId ? { ...m, ...editData } : m));
      setEditId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '保存失败');
    }
  }

  async function handleAdd() {
    try {
      const res = await api.post<{ id: number }>('/models', newData);
      setModels(prev => [...prev, { id: res.id, ...newData }]);
      setShowAdd(false);
      setNewData(EMPTY);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '添加失败');
    }
  }

  return (
    <div className="min-h-screen bg-[#262B3D] p-6 md:p-10 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">模型管理</h1>
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white
                         rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>添加模型</span>
            </button>
          )}
        </div>

        {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

        {/* 添加模型表单 */}
        {showAdd && (
          <ModelForm
            data={newData}
            onChange={setNewData}
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setNewData(EMPTY); }}
            title="添加新模型"
          />
        )}

        {/* 模型表格 */}
        <div className="bg-[#1E2532] rounded-3xl shadow-lg border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['模型名称','显示名称','提供商','输入价格','缓存价格','输出价格','状态','操作'].map(h => (
                    <th key={h} className="px-6 py-4 text-sm font-semibold text-slate-300 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({length:4}).map((_,i) => (
                      <tr key={i} className="border-b border-slate-700/30">
                        {Array.from({length:8}).map((_,j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-slate-700/40 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : models.map(model => (
                    editId === model.id
                      ? (
                        <tr key={model.id} className="border-b border-slate-700/30 bg-blue-500/5">
                          <td className="px-6 py-3 text-slate-400 text-sm">{model.name}</td>
                          {(['display_name','provider'] as const).map(f => (
                            <td key={f} className="px-6 py-3">
                              <input
                                value={editData[f]}
                                onChange={e => setEditData(prev => ({ ...prev, [f]: e.target.value }))}
                                className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white
                                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32"
                              />
                            </td>
                          ))}
                          {(['input_price','cached_price','output_price'] as const).map(f => (
                            <td key={f} className="px-6 py-3">
                              <input
                                type="number"
                                step="0.001"
                                value={editData[f]}
                                onChange={e => setEditData(prev => ({ ...prev, [f]: parseFloat(e.target.value) || 0 }))}
                                className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white
                                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-24"
                              />
                            </td>
                          ))}
                          <td className="px-6 py-3" />
                          <td className="px-6 py-3">
                            <div className="flex items-center space-x-2">
                              <button onClick={handleSaveEdit} className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditId(null)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                      : (
                        <tr key={model.id} className="border-b border-slate-700/30 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-300 font-mono">{model.name}</td>
                          <td className="px-6 py-4 text-sm text-white font-medium">{model.display_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">{model.provider}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">${model.input_price}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">${model.cached_price}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">${model.output_price}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                              ${model.is_active ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'}`}>
                              {model.is_active ? '启用' : '禁用'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isAdmin && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => { setEditId(model.id); setEditData({ ...model }); }}
                                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(model.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 模型表单子组件 ────────────────────────────────────────────────────
function ModelForm({ data, onChange, onSave, onCancel, title }: {
  data: Omit<Model,'id'>;
  onChange: (v: Omit<Model,'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div className="bg-[#1E2532] rounded-2xl border border-blue-500/30 p-6">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { key: 'name',         label: '模型 ID',   type: 'text' },
          { key: 'display_name', label: '显示名称',  type: 'text' },
          { key: 'provider',     label: '提供商',    type: 'text' },
          { key: 'input_price',  label: '输入价格',  type: 'number' },
          { key: 'cached_price', label: '缓存价格',  type: 'number' },
          { key: 'output_price', label: '输出价格',  type: 'number' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs text-slate-400 mb-1">{label}</label>
            <input
              type={type}
              step={type === 'number' ? '0.001' : undefined}
              value={(data as any)[key]}
              onChange={e => onChange({ ...data, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
            />
          </div>
        ))}
      </div>
      <div className="flex space-x-3">
        <button onClick={onSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition">
          保存
        </button>
        <button onClick={onCancel} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition">
          取消
        </button>
      </div>
    </div>
  );
}
