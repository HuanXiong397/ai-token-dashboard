import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// 确保从 server/ 目录加载 .env，无论从哪个目录启动
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import modelsRouter from './routes/models.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

const app = express();

// ── 中间件 ──────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API 路由 ────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/models',    modelsRouter);

// ── 健康检查 ────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── 生产环境：托管前端静态文件 ──────────────────
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── 启动 ────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  console.log(`   DB: ${process.env.DB_PATH || '(default)'}`);
});

export default app;
