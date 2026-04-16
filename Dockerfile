# ── Stage 1: 构建前端 ──────────────────────────────────
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps
COPY client/ ./
RUN npm run build

# ── Stage 2: 生产镜像 ──────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# better-sqlite3 需要 native 编译工具
RUN apk add --no-cache python3 make g++

# 安装后端所有依赖（含 devDeps，因为需要 tsx 直接运行 TypeScript）
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --include=dev

WORKDIR /app

# 复制后端源码
COPY server/src ./server/src

# 复制前端构建产物到后端 static 服务目录
COPY --from=client-builder /app/client/dist ./client/dist

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/dashboard.db
ENV JWT_SECRET=change-me-in-production
ENV CORS_ORIGIN=*

# 启动：先 seed 数据库，再启动服务
CMD ["sh", "-c", "cd /app/server && node --import tsx/esm src/db/seed.ts 2>/dev/null; node --import tsx/esm src/index.ts"]
