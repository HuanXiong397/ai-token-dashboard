# AI Token Dashboard

一个用于监控 AI 模型 Token 用量、请求数和成本的全栈仪表盘。

![dashboard](https://via.placeholder.com/1200x475/1E2532/60A5FA?text=AI+Token+Dashboard)

## 功能特性

- 📊 **实时仪表盘** — 今日 / 近7天 / 近30天 Token 用量、请求数、费用统计
- 📈 **趋势图表** — 面积折线图展示多日趋势，饼图展示模型占比
- 🤖 **模型管理** — 管理员可增删改 AI 模型及定价
- 💰 **定价计算** — 标准 / 批量(-50%) / 数据驻留(+10%) 三种模式
- 🔐 **JWT 认证** — 登录保护，区分管理员和普通用户
- 📡 **API 上报** — 通过 REST API 接入真实 AI 调用数据
- 🐳 **Docker 一键部署** — 开箱即用

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| 图表 | Recharts |
| 路由 | React Router v6 |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 部署 | Docker + docker-compose |

## 快速开始

### 方式一：本地开发

**前置要求**：Node.js 18+

```bash
# 1. 克隆项目
cd ai-token-dashboard

# 2. 安装依赖 + 初始化数据库
npm run setup

# 3. 同时启动前后端（需要两个终端）
npm run dev:server   # 后端 → http://localhost:4000
npm run dev:client   # 前端 → http://localhost:5173
```

打开浏览器访问 http://localhost:5173

**演示账号：**
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin  | admin123 | 管理员（可增删改模型） |
| demo   | demo123  | 普通用户（只读） |

---

### 方式二：Docker 部署（推荐上线）

```bash
# 构建并启动（首次会自动初始化数据库）
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

访问 http://你的服务器IP:4000

**修改密钥（生产必须）**：
```bash
# 在 docker-compose.yml 中修改：
JWT_SECRET=your-very-long-random-secret-here
```

---

## 项目结构

```
ai-token-dashboard/
├── client/                  # 前端 React 应用
│   ├── src/
│   │   ├── components/      # 可复用组件（Sidebar）
│   │   ├── hooks/           # 自定义 Hooks（useAuth, useApi）
│   │   ├── pages/           # 页面组件
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ModelsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── types/           # TypeScript 类型定义
│   └── vite.config.ts
│
├── server/                  # 后端 Express 应用
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts  # SQLite 初始化
│   │   │   └── seed.ts      # 演示数据
│   │   ├── middleware/
│   │   │   └── auth.ts      # JWT 认证中间件
│   │   ├── routes/
│   │   │   ├── auth.ts      # 登录/注册接口
│   │   │   ├── dashboard.ts # 统计数据接口
│   │   │   └── models.ts    # 模型管理 + 用量上报
│   │   └── index.ts         # 应用入口
│   └── .env                 # 环境变量
│
├── data/                    # SQLite 数据库文件（运行后生成）
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API 文档

### 认证

```http
POST /api/auth/login
Content-Type: application/json

{"username": "admin", "password": "admin123"}
```

响应：`{"token": "xxx", "user": {...}}`

后续所有请求需携带：`Authorization: Bearer <token>`

### 仪表盘数据

```http
GET /api/dashboard/summary          # 今日/周/月汇总
GET /api/dashboard/trend?range=30   # 趋势数据
GET /api/dashboard/models-usage     # 各模型用量
GET /api/dashboard/models-pricing   # 模型定价
```

### 上报使用量

```http
POST /api/models/usage
Authorization: Bearer <token>
Content-Type: application/json

{
  "model_name": "gpt-5.4",
  "date": "2026-04-15",
  "requests": 10,
  "input_tokens": 50000,
  "cached_tokens": 5000,
  "output_tokens": 10000
}
```

## 接入真实数据

将此 API 调用集成到你的 AI 代理或中间件中，每次调用 AI 后上报：

```javascript
// 示例：Node.js 中间件
async function reportUsage(modelName, usage) {
  await fetch('http://your-server:4000/api/models/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DASHBOARD_TOKEN}`
    },
    body: JSON.stringify({
      model_name: modelName,
      date: new Date().toISOString().slice(0, 10),
      requests: 1,
      input_tokens: usage.promptTokens,
      output_tokens: usage.completionTokens,
    })
  });
}
```
