import React, { useEffect, useState, useCallback } from 'react';
import { Hexagon, MessageSquare, DollarSign, Calendar, ChevronDown, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../hooks/useApi';
import type { DashboardSummary, TrendPoint, ModelUsage, ModelPricing } from '../types/api';

// ── 工具函数 ──────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function fmtCost(n: number): string {
  if (!n) return '$0';
  if (n >= 1000) return '$' + (n / 1000).toFixed(2) + 'k';
  return '$' + n.toFixed(2);
}

// ── Pie Tooltip ───────────────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#1E293B]/95 backdrop-blur-sm border border-slate-600/50 p-4 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="text-slate-200 font-medium">{d.name}</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {fmt(d.total_tokens)} <span className="text-sm font-normal text-slate-400">Tokens</span>
        </div>
        <div className="text-sm text-slate-400 mt-1">{fmtCost(d.actual_cost)} 实际费用</div>
      </div>
    );
  }
  return null;
};

// ── MetricCard ────────────────────────────────────────────────────────
function MetricCard({ icon, title, titleColor, value, subtext1, subtextColor, subtext2 }: {
  icon: React.ReactNode; title: string; titleColor: string; value: string;
  subtext1: string; subtextColor: string; subtext2: string;
}) {
  return (
    <div className="bg-[#1E2532] rounded-3xl p-6 flex items-center space-x-6 shadow-lg border border-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
      <div className="p-4 bg-black/20 rounded-2xl group-hover:scale-110 group-hover:bg-black/30 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <div className={`text-sm font-medium mb-1 ${titleColor}`}>{title}</div>
        <div className="text-3xl font-bold text-white mb-1 group-hover:text-blue-50 transition-colors">{value}</div>
        <div className="text-sm text-slate-400">
          <span className={subtextColor}>{subtext1}</span> / {subtext2}
        </div>
      </div>
    </div>
  );
}

// ── 模型颜色 ──────────────────────────────────────────────────────────
const COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EC4899','#06B6D4','#F97316','#6366F1'];

// ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [range,    setRange]    = useState(30);
  const [dropdown, setDropdown] = useState(false);
  const [pricingMode, setPricingMode] = useState<'standard'|'batch'|'residency'>('standard');

  const [summary,  setSummary]  = useState<DashboardSummary | null>(null);
  const [trend,    setTrend]    = useState<TrendPoint[]>([]);
  const [models,   setModels]   = useState<ModelUsage[]>([]);
  const [pricing,  setPricing]  = useState<ModelPricing[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, t, m, p] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<TrendPoint[]>(`/dashboard/trend?range=${range}`),
        api.get<ModelUsage[]>(`/dashboard/models-usage?range=${range}`),
        api.get<ModelPricing[]>('/dashboard/models-pricing'),
      ]);
      setSummary(s);
      setTrend(t);
      setModels(m);
      setPricing(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  // 定价倍率
  const multiplier = pricingMode === 'batch' ? 0.5 : pricingMode === 'residency' ? 1.1 : 1;
  const fp = (v: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                    .format(v * multiplier);

  const stat = range === 1 ? summary?.today : range === 7 ? summary?.week : summary?.month;

  // 饼图数据
  const pieData = models.map((m, i) => ({
    ...m,
    name: m.model,
    value: m.total_tokens,
    color: COLORS[i % COLORS.length],
  }));

  // 趋势图格式化
  const trendFormatted = trend.map(t => ({
    ...t,
    label: t.date.slice(5), // MM-DD
    tokens_m: +(t.tokens / 1e6).toFixed(1),
    cost_val: +t.cost.toFixed(2),
  }));

  const rangeLabel = range === 1 ? '今日' : range === 7 ? '近7天' : '近30天';

  return (
    <div className="min-h-screen bg-[#262B3D] p-6 md:p-10 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── 顶部标题 + 刷新 ─── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">总览</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5
                       text-slate-400 hover:text-white transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {/* ── 指标卡片 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            icon={<Hexagon className="w-8 h-8 text-slate-400" strokeWidth={1.5} />}
            title={`${rangeLabel} Token`}
            titleColor="text-[#EAB308]"
            value={loading ? '—' : fmt(stat?.total_tokens ?? 0)}
            subtext1={loading ? '—' : fmtCost(stat?.actual_cost ?? 0)}
            subtextColor="text-[#EAB308]"
            subtext2={loading ? '—' : fmtCost(stat?.standard_cost ?? 0)}
          />
          <MetricCard
            icon={<MessageSquare className="w-8 h-8 text-slate-400" strokeWidth={1.5} />}
            title={`${rangeLabel}请求数`}
            titleColor="text-[#A855F7]"
            value={loading ? '—' : fmt(stat?.total_requests ?? 0)}
            subtext1={loading ? '—' : fmtCost(stat?.actual_cost ?? 0)}
            subtextColor="text-[#A855F7]"
            subtext2={loading ? '—' : fmtCost(stat?.standard_cost ?? 0)}
          />
          <MetricCard
            icon={<DollarSign className="w-8 h-8 text-slate-400" strokeWidth={1.5} />}
            title={`${rangeLabel}实际费用`}
            titleColor="text-[#EC4899]"
            value={loading ? '—' : fmtCost(stat?.actual_cost ?? 0)}
            subtext1={loading ? '—' : fmtCost(stat?.actual_cost ?? 0)}
            subtextColor="text-[#EC4899]"
            subtext2={loading ? '—' : fmtCost(stat?.standard_cost ?? 0)}
          />
        </div>

        {/* ── 时间范围选择 ─── */}
        <div className="bg-[#1E2532] rounded-3xl p-5 flex items-center shadow-lg border border-white/5">
          <span className="text-lg font-bold text-white mr-6 ml-2 tracking-wide">时间范围</span>
          <div className="relative">
            <button
              onClick={() => setDropdown(!dropdown)}
              className="flex items-center space-x-3 border border-slate-500/50 rounded-full px-5 py-2
                         hover:bg-white/10 hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/50"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">{rangeLabel}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdown ? 'rotate-180' : ''}`} />
            </button>
            {dropdown && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-[#2A3042] border border-slate-600
                              rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                {([['今日', 1],['近7天', 7],['近30天', 30]] as [string,number][]).map(([label, val]) => (
                  <button
                    key={val}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${range === val ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-blue-500/10 hover:text-blue-400'}`}
                    onClick={() => { setRange(val); setDropdown(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 趋势图 + 数据表 ─── */}
        <div className="bg-[#1E2532] rounded-3xl p-6 md:p-8 shadow-lg border border-white/5">
          <h2 className="text-xl font-bold text-white mb-8 tracking-wide flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>数据统计</span>
          </h2>
          <div className="flex flex-col xl:flex-row gap-10">
            {/* 面积图 */}
            <div className="flex-1 h-[350px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500">加载中...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendFormatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#60A5FA" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#34D399" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#E2E8F0' }}
                      formatter={(v: unknown, name: unknown) => {
                        const val = v as number
                        return name === 'tokens_m' ? [`${val}M`, 'Token用量'] : [`$${val}`, '费用']
                      }}
                    />
                    <Area type="monotone" dataKey="tokens_m" stroke="#60A5FA" strokeWidth={3}
                          fillOpacity={1} fill="url(#gradTokens)" name="tokens_m" />
                    <Area type="monotone" dataKey="cost_val" stroke="#34D399" strokeWidth={3}
                          fillOpacity={1} fill="url(#gradCost)" name="cost_val" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 模型数据表 */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-600/50">
                    <th className="pb-4 font-bold text-white text-base w-[35%]">模型</th>
                    <th className="pb-4 font-bold text-white text-base text-right">请求</th>
                    <th className="pb-4 font-bold text-white text-base text-right">Token</th>
                    <th className="pb-4 font-bold text-white text-base text-right">实际</th>
                    <th className="pb-4 font-bold text-white text-base text-right">标准</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading
                    ? Array.from({length: 5}).map((_, i) => (
                        <tr key={i} className="border-b border-slate-700/30">
                          {Array.from({length:5}).map((_, j) => (
                            <td key={j} className="py-4">
                              <div className="h-4 bg-slate-700/40 rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : models.map((row, index) => (
                        <tr key={index} className="border-b border-slate-700/30 hover:bg-white/5 transition-colors group cursor-pointer">
                          <td className="py-4 text-slate-300 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                            <span className="truncate max-w-[130px]">{row.model}</span>
                          </td>
                          <td className="py-4 text-slate-300 text-right">{fmt(row.requests)}</td>
                          <td className="py-4 text-slate-300 text-right">{fmt(row.total_tokens)}</td>
                          <td className="py-4 text-[#22C55E] text-right font-medium">{fmtCost(row.actual_cost)}</td>
                          <td className="py-4 text-slate-400 text-right">{fmtCost(row.standard_cost)}</td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 饼图 ─── */}
        <div className="bg-[#1E2532] rounded-3xl p-6 md:p-8 shadow-lg border border-white/5">
          <h2 className="text-xl font-bold text-white mb-6 tracking-wide">模型 Token 消耗占比</h2>
          <div className="h-[400px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500">加载中...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {pieData.map((entry, i) => (
                      <linearGradient key={i} id={`pg-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.3} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    cx="40%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={`url(#pg-${i})`}
                            className="hover:opacity-80 transition-all duration-300 outline-none cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'transparent' }} isAnimationActive={false} />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    iconSize={12}
                    wrapperStyle={{ color: '#e2e8f0', fontSize: '14px', paddingRight: '8%', lineHeight: '2.5', fontWeight: '500' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── 定价区 ─── */}
        <div className="mt-4 bg-[#1E2532] border border-white/5 rounded-3xl p-8 md:p-12 text-white shadow-xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">模型定价</h2>
            <p className="text-slate-400 text-lg">按 1M Token 计费，支持标准、批量和数据驻留定价模式</p>
          </div>

          <div className="flex flex-col lg:flex-row justify-center items-center mb-10 space-y-6 lg:space-y-0 lg:space-x-8">
            {/* 处理模式 */}
            <div className="flex items-center space-x-4">
              <span className="font-bold text-sm text-slate-300">处理模式</span>
              <div className="bg-black/30 p-1 rounded-full flex text-sm font-medium border border-white/5">
                {(['standard','batch','residency'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPricingMode(mode)}
                    className={`px-5 py-2 rounded-full transition-all duration-300
                      ${pricingMode === mode ? 'bg-[#2A3042] shadow-md text-white scale-105' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    {mode === 'standard' ? '标准' : mode === 'batch' ? '批量 -50%' : '数据驻留 +10%'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(pricing.length > 0 ? pricing.slice(0, 3) : [
              { title: 'GPT-5.4',      provider: 'OpenAI', input_price: 2.5,  cached_price: 0.25,  output_price: 15.0 },
              { title: 'Claude Opus',  provider: 'Anthropic', input_price: 15, cached_price: 1.5,   output_price: 75.0 },
              { title: 'GPT-5.2',     provider: 'OpenAI', input_price: 0.5,  cached_price: 0.05,  output_price: 1.5  },
            ]).map((plan, idx) => (
              <div key={idx}
                   className="border border-slate-600/50 rounded-2xl p-8 hover:bg-[#2A3042]/80 hover:border-blue-500/50
                              hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300
                              bg-[#2A3042]/30 flex flex-col group cursor-pointer">
                <h3 className="text-2xl font-semibold mb-1 group-hover:text-blue-400 transition-colors">{plan.title}</h3>
                <p className="text-slate-500 text-xs mb-4">{plan.provider}</p>
                <div className="font-bold mb-4 text-lg text-slate-200">价格</div>
                <div className="space-y-5 text-sm flex-1">
                  <div>
                    <div className="text-slate-500 mb-1">输入：</div>
                    <div className="font-medium text-slate-300">US${fp(plan.input_price)} / 1M 令牌</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">缓存输入：</div>
                    <div className="font-medium text-slate-300">US${fp(plan.cached_price ?? 0)} / 1M 令牌</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">输出：</div>
                    <div className="font-medium text-slate-300">US${fp(plan.output_price)} / 1M 令牌</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
