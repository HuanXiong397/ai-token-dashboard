// API 类型定义

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardSummary {
  today: PeriodStat;
  week: PeriodStat;
  month: PeriodStat;
}

export interface PeriodStat {
  total_requests: number;
  total_tokens: number;
  actual_cost: number;
  standard_cost: number;
}

export interface TrendPoint {
  date: string;
  tokens: number;
  requests: number;
  cost: number;
}

export interface ModelUsage {
  model: string;
  requests: number;
  total_tokens: number;
  actual_cost: number;
  standard_cost: number;
}

export interface ModelPricing {
  title: string;
  provider: string;
  input_price: number;
  cached_price: number;
  output_price: number;
  desc?: string;
}
