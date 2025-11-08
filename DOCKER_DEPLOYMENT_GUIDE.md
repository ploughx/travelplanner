# Docker 部署指南

本指南将帮助你配置 GitHub Actions 自动构建 Docker 镜像并推送到阿里云容器镜像服务。

## 1. 阿里云容器镜像服务配置

### 1.1 创建命名空间
1. 登录 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 选择个人实例或企业实例
3. 创建命名空间（例如：`your-namespace`）
4. 记录命名空间名称，后续配置需要使用

### 1.2 获取访问凭证
1. 在容器镜像服务控制台，点击右上角头像 → 访问凭证
2. 设置 Registry 登录密码（如果还没有设置）
3. 记录以下信息：
   - 用户名：通常是你的阿里云账号
   - 密码：Registry 登录密码
   - 仓库地址：例如 `registry.cn-hangzhou.aliyuncs.com`

## 2. GitHub Secrets 配置

在你的 GitHub 仓库中配置以下 Secrets：

1. 进入 GitHub 仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret` 添加以下密钥：

### 必需的 Secrets：

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `ALIYUN_USERNAME` | 阿里云账号用户名 | `your-aliyun-account@example.com` |
| `ALIYUN_PASSWORD` | 阿里云容器镜像服务密码 | `your-registry-password` |

## 3. 修改工作流配置

编辑 `.github/workflows/docker-build-push.yml` 文件中的以下配置：

```yaml
env:
  REGISTRY: registry.cn-hangzhou.aliyuncs.com  # 根据你的地域修改
  NAMESPACE: your-namespace                    # 替换为你的命名空间
  IMAGE_NAME: ai-travel-planner               # 可以自定义镜像名称
```

### 地域选择：
- 华东1（杭州）：`registry.cn-hangzhou.aliyuncs.com`
- 华北2（北京）：`registry.cn-beijing.aliyuncs.com`
- 华东2（上海）：`registry.cn-shanghai.aliyuncs.com`
- 华南1（深圳）：`registry.cn-shenzhen.aliyuncs.com`

## 4. 触发构建

### 自动触发：
- 推送到 `main` 或 `master` 分支
- 创建以 `v` 开头的标签（如 `v1.0.0`）
- 创建 Pull Request

### 手动触发：
可以在 GitHub Actions 页面手动运行工作流

## 5. 使用发布的镜像

### 5.1 拉取镜像
```bash
# 拉取最新版本
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest

# 拉取特定版本
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:v1.0.0
```

### 5.2 运行容器
```bash
# 基本运行
docker run -d -p 3000:80 registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest

# 使用 docker-compose
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

### 5.3 环境变量配置
如果你的应用需要环境变量，可以通过以下方式配置：

```bash
docker run -d \
  -p 3000:80 \
  -e VITE_SUPABASE_URL=your_supabase_url \
  -e VITE_SUPABASE_ANON_KEY=your_supabase_key \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
```

## 6. 镜像标签说明

- `latest`：最新的 main/master 分支构建
- `main`：main 分支的最新构建
- `v1.0.0`：特定版本标签
- `pr-123`：Pull Request 构建（仅用于测试）

## 7. 故障排除

### 7.1 构建失败
- 检查 GitHub Secrets 是否正确配置
- 确认阿里云账号权限是否足够
- 查看 GitHub Actions 日志获取详细错误信息

### 7.2 推送失败
- 确认命名空间是否存在
- 检查网络连接
- 验证阿里云容器镜像服务状态

### 7.3 镜像拉取失败
- 确认镜像名称和标签是否正确
- 检查阿里云镜像仓库是否设置为公开
- 如果是私有仓库，需要先登录：
  ```bash
  docker login registry.cn-hangzhou.aliyuncs.com
  ```

## 8. 安全建议

1. **定期更新密钥**：定期更换阿里云 Registry 密码
2. **最小权限原则**：只给 GitHub Actions 必要的权限
3. **镜像扫描**：工作流已包含 Trivy 安全扫描
4. **私有仓库**：对于生产环境，建议使用私有镜像仓库

## 9. 成本优化

1. **多架构构建**：工作流支持 AMD64 和 ARM64 架构
2. **构建缓存**：使用 GitHub Actions 缓存加速构建
3. **镜像清理**：定期清理旧版本镜像以节省存储成本

## 10. 监控和日志

- 在阿里云控制台查看镜像下载统计
- 使用 GitHub Actions 查看构建历史和日志
- 设置构建失败通知
