# ── Stage 1: 构建前端 ──────────────────────────────────
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json ./
RUN npm install --legacy-peer-deps
COPY client/ ./
RUN npm run build

# ── Stage 2: 生产镜像 ──────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# 安装后端依赖（tsx 在 dependencies 里，无需 devDeps）
COPY server/package.json ./server/
WORKDIR /app/server
RUN npm install

WORKDIR /app
# 复制后端源码
COPY server/src ./server/src

# 复制前端构建产物
COPY --from=client-builder /app/client/dist ./client/dist

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/dashboard.db
ENV JWT_SECRET=change-me-in-production
ENV CORS_ORIGIN=*

# 用 node:sqlite 内置模块直接运行 TypeScript
CMD ["sh", "-c", "cd /app/server && node --experimental-sqlite --import tsx/esm src/db/seed.ts 2>/dev/null; node --experimental-sqlite --import tsx/esm src/index.ts"]
