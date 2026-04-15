# AI Token Dashboard — 部署指南

## 方式一：Cloud Studio 一键部署（推荐，生成可分享链接）

### 步骤

1. **打开 Cloud Studio**  
   访问 [https://cloudstudio.net](https://cloudstudio.net) 并登录（腾讯云账号）

2. **创建工作空间**  
   - 点击 「新建工作空间」
   - 选择 「导入代码」 → Git 仓库或本地上传
   - 将本项目文件夹上传 / 推送到 Git 后填入仓库地址

3. **一键部署到云端沙箱**  
   在工作空间内，Cloud Studio 会自动识别 `.cloudstudio/app.yml` 配置文件，点击右上角 **「部署」** 按钮即可：
   - 自动 Docker 构建
   - 自动初始化数据库 + 种子数据
   - 分配公网访问链接（格式：`https://xxxx.cloudstudio.net`）

4. **分享链接**  
   部署完成后复制生成的公网链接，发给任何人即可访问。

### 演示账号

| 账号 | 密码 | 权限 |
|------|------|------|
| admin | admin123 | 管理员（可管理模型） |
| demo | demo123 | 普通用户（只读） |

---

## 方式二：Railway（免费，国际访问快）

1. 访问 [https://railway.app](https://railway.app)，用 GitHub 登录
2. 点击 「New Project」→ 「Deploy from GitHub repo」
3. 选择本仓库，Railway 会自动检测 Dockerfile
4. 在 「Variables」 中添加环境变量：
   ```
   PORT=4000
   JWT_SECRET=your-secret-here
   DB_PATH=/app/data/dashboard.db
   CORS_ORIGIN=*
   ```
5. 部署完成，获得 `https://xxx.up.railway.app` 链接

---

## 方式三：Render（免费额度，5分钟部署）

1. 访问 [https://render.com](https://render.com)
2. 「New」→「Web Service」→ 连接 GitHub 仓库
3. 配置：
   - **Environment**: Docker
   - **Port**: 4000
4. 添加环境变量（同上），点击 「Create Web Service」
5. 约 3-5 分钟后获得 `https://xxx.onrender.com` 链接

---

## 方式四：Docker 本地/服务器运行

```bash
# 一键启动（需要 Docker + Docker Compose）
docker compose up -d --build

# 访问
open http://localhost:4000
```

---

## 方式五：腾讯云容器服务（TKE/CVM）

1. 构建并推送镜像到腾讯云 TCR：
   ```bash
   docker build -t ccr.ccs.tencentyun.com/你的命名空间/ai-token-dashboard:latest .
   docker push ccr.ccs.tencentyun.com/你的命名空间/ai-token-dashboard:latest
   ```
2. 在 CVM 上 `docker run`，或在 TKE 创建工作负载

---

## 技术栈说明

- **前端**: React 19 + Vite + Tailwind CSS v4
- **后端**: Express + Node.js 22（使用内置 `node:sqlite`）
- **数据库**: SQLite（轻量，无需额外数据库服务）
- **认证**: JWT（bcrypt 加密密码）
- **容器**: Node 22-alpine（Docker 镜像）

## 注意事项

- 项目使用 Node.js 22 内置 SQLite，**不支持 Node 20 及以下版本**
- 生产环境请修改 `JWT_SECRET` 为随机字符串
- SQLite 数据库文件位于容器内 `/app/data/dashboard.db`，建议挂载持久卷
