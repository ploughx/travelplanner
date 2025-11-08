# Docker 快速部署

## 🚀 一键运行

```bash
# 拉取并运行最新版本
docker run -d -p 3000:80 --name ai-travel-planner \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
```

访问 http://localhost:3000 即可使用应用。

## 📦 可用镜像标签

- `latest` - 最新稳定版本
- `v1.0.0` - 特定版本
- `main` - 开发版本

## 🔧 使用 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'
services:
  ai-travel-planner:
    image: registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

## ⚙️ 环境变量配置

如需配置 Supabase 等服务：

```bash
docker run -d -p 3000:80 \
  -e VITE_SUPABASE_URL=your_supabase_url \
  -e VITE_SUPABASE_ANON_KEY=your_supabase_key \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
```

## 📋 系统要求

- Docker 20.10+
- 2GB+ 可用内存
- 支持 AMD64/ARM64 架构

## 🔍 故障排除

如果无法拉取镜像，请检查：
1. 网络连接是否正常
2. 镜像名称是否正确
3. 是否需要登录阿里云镜像仓库

详细配置请参考 [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
