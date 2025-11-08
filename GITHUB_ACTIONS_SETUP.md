# GitHub Actions 配置指南

## 🚀 自动化 Docker 构建和部署

本项目使用 GitHub Actions 自动构建 Docker 镜像并推送到阿里云容器镜像服务。

## 📋 配置步骤

### 1. 准备阿里云容器镜像服务

1. 登录 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 创建命名空间（例如：`travel-planner`）
3. 获取访问凭证：
   - 用户名：阿里云账号
   - 密码：Registry 登录密码

### 2. 配置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets：

| Secret 名称 | 描述 |
|------------|------|
| `ALIYUN_USERNAME` | 阿里云账号用户名 |
| `ALIYUN_PASSWORD` | 阿里云容器镜像服务密码 |

### 3. 修改工作流配置

编辑 `.github/workflows/docker-build-push.yml` 中的环境变量：

```yaml
env:
  REGISTRY: registry.cn-hangzhou.aliyuncs.com  # 选择合适的地域
  NAMESPACE: your-namespace                    # 替换为你的命名空间
  IMAGE_NAME: ai-travel-planner               # 镜像名称
```

### 4. 触发构建

工作流会在以下情况自动触发：
- 推送到 `main` 或 `master` 分支
- 创建以 `v` 开头的标签（如 `v1.0.0`）
- 创建 Pull Request

## 🏷️ 镜像标签策略

- `latest` - 最新的 main/master 分支构建
- `main` - main 分支构建
- `v1.0.0` - 版本标签构建
- `pr-123` - Pull Request 构建

## 🔧 工作流功能

### 多架构支持
- AMD64 (x86_64)
- ARM64 (Apple Silicon, ARM服务器)

### 构建优化
- GitHub Actions 缓存
- Docker 层缓存
- 并行构建

### 安全扫描
- Trivy 漏洞扫描
- 安全报告上传到 GitHub Security

## 📊 添加状态徽章

在 README.md 中添加构建状态徽章：

```markdown
![Docker Build](https://github.com/your-username/your-repo/actions/workflows/docker-build-push.yml/badge.svg)
```

## 🐛 故障排除

### 常见问题

1. **推送失败**
   - 检查 Secrets 配置是否正确
   - 确认命名空间是否存在
   - 验证阿里云账号权限

2. **构建超时**
   - 检查依赖安装是否正常
   - 确认网络连接稳定

3. **镜像拉取失败**
   - 确认镜像仓库是否公开
   - 检查镜像名称和标签

### 调试方法

1. 查看 GitHub Actions 日志
2. 本地测试 Docker 构建：
   ```bash
   docker build -t test-image .
   ```
3. 检查 Dockerfile 语法

## 🔄 版本发布流程

### 自动发布
1. 创建版本标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions 自动构建并推送镜像

### 手动发布
1. 在 GitHub Actions 页面手动触发工作流
2. 选择分支或标签进行构建

## 📈 监控和维护

### 构建监控
- 设置 GitHub Actions 通知
- 监控构建时间和成功率
- 定期检查安全扫描报告

### 镜像管理
- 定期清理旧版本镜像
- 监控存储使用量
- 更新基础镜像版本

## 🔐 安全最佳实践

1. **密钥管理**
   - 定期轮换访问密钥
   - 使用最小权限原则
   - 避免在代码中硬编码密钥

2. **镜像安全**
   - 启用漏洞扫描
   - 使用官方基础镜像
   - 定期更新依赖

3. **访问控制**
   - 设置仓库访问权限
   - 启用分支保护规则
   - 要求代码审查

## 📚 相关文档

- [Docker 部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- [Docker 快速开始](./DOCKER_QUICKSTART.md)
- [阿里云容器镜像服务文档](https://help.aliyun.com/product/60716.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
