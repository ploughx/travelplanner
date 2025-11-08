# 🌟 AI 旅行规划师 (AI Travel Planner)

一个功能丰富的智能旅行规划Web应用，集成AI大模型、用户认证、数据存储、地图导航等功能，为用户提供个性化的旅行规划体验。

## ✨ 核心功能

### 🤖 智能AI规划
- **多AI模型支持**：集成阿里云通义千问模型
- **智能对话**：与AI助手实时交流，了解旅行需求和目的地信息
- **个性化推荐**：基于用户偏好生成定制化旅行计划
- **预算分析**：AI智能分析预算使用情况，提供优化建议

### 🎤 语音交互
- **语音输入**：支持语音描述旅行需求，AI自动解析并填充表单
- **多种识别方式**：科大讯飞API
- **自然语言处理**：理解复杂的旅行描述，如"我想去北京，2天，预算1万元，喜欢美食和动漫，带孩子"

### 👤 用户系统
- **完整认证**：基于Supabase的用户注册、登录、密码重置
- **计划管理**：保存、查看、编辑个人旅行计划
- **费用记录**：记录和管理旅行开销，支持语音输入
- **数据同步**：云端存储，多设备同步

### 🗺️ 地图导航
- **百度地图集成**：百度地图显示和导航
- **智能标记**：自动标注景点、餐厅、住宿位置
- **国际支持**：支持国内外目的地，智能处理地理编码
- **交互导航**：点击地点即可导航，支持路线规划

### 🖼️ 视觉体验
- **渐变占位符**：美观的SVG渐变背景图片
- **响应式设计**：完美适配桌面和移动设备
- **现代UI**：基于Tailwind CSS的精美界面设计
- **流畅动画**：丰富的交互动画和过渡效果

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- 现代浏览器（支持ES2020+）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd TravelPlanner
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

复制 `env.example` 为 `.env` 并配置：

```env
# AI模型配置（选择其中一个，推荐通义千问）
VITE_QWEN_API_KEY=your_qwen_api_key_here          # 阿里云通义千问（推荐）

# 必需配置
VITE_BAIDU_MAP_API_KEY=your_baidu_map_ak_here     # 百度地图API
VITE_SUPABASE_URL=your_supabase_project_url       # Supabase项目URL
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key     # Supabase匿名密钥

# 可选配置
VITE_XUNFEI_API_KEY=your_xunfei_api_key_here      # 科大讯飞语音识别
VITE_XUNFEI_API_SECRET=your_xunfei_api_secret_here
VITE_XUNFEI_APP_ID=your_xunfei_app_id_here
```

4. **设置Supabase数据库**

参考 `SUPABASE_SETUP.md` 文档，在Supabase中执行SQL脚本创建必要的表结构。

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**

打开浏览器访问 `http://localhost:5173`（可根据具体运行情况来）

## 📦 构建和部署

### 🐳 Docker 快速运行（推荐）

```bash
# 拉取最新镜像（阿里云镜像仓库）
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest

# 运行容器
docker run -d --name ai-travel-planner -p 3000:80 \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest

# 访问应用
# 打开浏览器访问 http://localhost:3000
```

> 📋 **Docker 部署说明**：
> - 详细配置请参考 [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
> - 快速开始请参考 [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)
> - 镜像自动通过 GitHub Actions 构建并推送到阿里云镜像仓库

### 开发环境
```bash
npm run dev          # 启动开发服务器
npm run lint         # 代码检查
```

### 生产构建
```bash
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

构建产物将输出到 `dist` 目录，可直接部署到任何静态文件服务器。

## 🛠️ 技术栈

### 前端技术
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **Lucide React** - 精美的图标库

### 后端服务
- **Supabase** - 开源Firebase替代方案
  - 用户认证和授权
  - PostgreSQL数据库
  - 实时数据同步
  - 行级安全策略

### AI和API服务
- **阿里云通义千问** - 主要AI模型（推荐）
- **百度地图API** - 地图和地理编码服务
- **科大讯飞** - 语音识别服务
    Supabase - 数据服务

### 开发工具
- **ESLint** - 代码质量检查
- **PostCSS** - CSS后处理器
- **Autoprefixer** - CSS兼容性处理

## 📁 项目结构

```
TravelPlanner/
├── src/
│   ├── components/              # React组件
│   │   ├── Auth/               # 认证相关组件
│   │   │   ├── AuthModal.tsx   # 登录/注册模态框
│   │   │   └── UserMenu.tsx    # 用户菜单
│   │   ├── Header.tsx          # 应用头部
│   │   ├── TravelForm.tsx      # 旅行需求表单
│   │   ├── ChatAssistant.tsx   # AI对话助手
│   │   ├── TravelPlanView.tsx  # 旅行计划展示
│   │   ├── TravelPlansManager.tsx # 计划管理
│   │   └── MapView.tsx         # 地图组件
│   ├── contexts/               # React上下文
│   │   └── AuthContext.tsx     # 认证上下文
│   ├── services/               # 服务层
│   │   ├── aiService.ts        # AI模型集成
│   │   ├── voiceService.ts     # 语音识别服务
│   │   ├── mapService.ts       # 地图服务
│   │   ├── imageService.ts     # 图片服务
│   │   └── dataService.ts      # 数据服务
│   ├── lib/                    # 工具库
│   │   └── supabase.ts         # Supabase客户端
│   ├── types/                  # TypeScript类型
│   │   ├── index.ts            # 主要类型定义
│   │   └── global.d.ts         # 全局类型声明
│   ├── App.tsx                 # 主应用组件
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── public/                     # 静态资源
├── docs/                       # 文档文件
│   ├── AI_MODEL_SETUP.md       # AI模型配置指南
│   ├── SUPABASE_SETUP.md       # Supabase设置指南
│   ├── USER_MANAGEMENT_GUIDE.md # 用户管理指南
│   └── IMAGE_SERVICE_GUIDE.md  # 图片服务指南
├── .vscode/                    # VSCode配置
│   └── settings.json           # 编辑器设置
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript配置
├── vite.config.ts              # Vite配置
├── tailwind.config.js          # Tailwind配置
├── env.example                 # 环境变量示例
└── README.md                   # 项目说明
```

## 🎯 使用流程

### 1. 用户注册/登录
- 使用邮箱注册新账户或登录现有账户
- 支持密码重置和邮箱验证
- 安全的用户会话管理

### 2. 创建旅行计划
- **语音输入**：说出旅行需求，AI自动解析
- **表单填写**：手动输入目的地、天数、预算等
- **智能推荐**：AI根据偏好推荐旅行风格和兴趣点

### 3. AI对话优化
- 与AI助手深入交流旅行需求
- 获取目的地详细信息和建议
- 实时调整和优化旅行计划

### 4. 查看详细计划
- **每日行程**：详细的时间安排和活动
- **预算分析**：AI智能分析预算使用
- **地图导航**：可视化地点分布和导航
- **推荐内容**：景点、餐厅、住宿推荐

### 5. 计划管理
- **保存计划**：将满意的计划保存到个人账户
- **编辑修改**：随时调整和更新计划内容
- **费用记录**：记录实际旅行开销
- **历史查看**：查看所有历史旅行计划

## 🔧 配置指南

### AI模型配置

应用支持三种AI模型，按优先级自动选择：

1. **阿里云通义千问**（推荐）
   - 访问：https://dashscope.console.aliyun.com/
   - 优势：中文处理能力强，JSON输出稳定
   - 配置：`VITE_QWEN_API_KEY`
### Supabase配置

1. 创建Supabase项目：https://supabase.com/
2. 获取项目URL和匿名密钥
3. 执行 `SUPABASE_SETUP.md` 中的SQL脚本
4. 配置环境变量

### 百度地图配置

1. 注册百度开发者账号：https://lbsyun.baidu.com/
2. 创建应用并获取AK
3. 配置域名白名单
4. 启用相关服务（地图显示、地理编码等）

## 📱 功能特色

### 🎨 现代化UI设计
- 渐变背景和毛玻璃效果
- 流畅的动画和过渡
- 响应式布局适配各种设备
- 深色模式友好的配色方案

### 🔒 安全性保障
- 基于JWT的安全认证
- 行级安全策略保护用户数据
- API密钥安全存储
- HTTPS强制加密传输

### ⚡ 性能优化
- Vite构建工具提供快速开发体验
- 代码分割和懒加载
- 图片懒加载和缓存机制
- 地理编码结果缓存

### 🌐 国际化支持
- 支持国内外目的地规划
- 智能识别国际地址
- 多语言地名处理
- 时区和货币自适应

## 🤝 贡献指南

### 开发流程
1. Fork项目到个人仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -m 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 组件采用函数式编程
- 使用React Hooks最佳实践
- 保持组件单一职责原则

### 测试要求
- 确保所有功能正常工作
- 测试不同AI模型的兼容性
- 验证响应式设计
- 检查无障碍访问性

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

### 技术支持
- **阿里云** - 提供稳定的通义千问AI服务
- **百度** - 提供地图API服务
- **科大讯飞** - 提供语音识别技术
- **Supabase** - 提供后端即服务解决方案

### 开源项目
- **React** - 优秀的前端框架
- **TypeScript** - 类型安全的JavaScript超集
- **Tailwind CSS** - 实用优先的CSS框架
- **Vite** - 现代化的构建工具
- **Lucide** - 精美的图标库

## ⚠️ 重要提醒

### 使用须知
1. **API配额**：注意各AI服务的使用配额和计费规则
2. **数据隐私**：语音和文本数据会发送到AI服务商，请注意隐私保护
3. **网络要求**：部分功能需要稳定的网络连接
4. **浏览器兼容**：推荐使用Chrome、Firefox、Safari等现代浏览器

### 生产部署
1. **HTTPS必需**：语音识别功能需要HTTPS环境
2. **域名配置**：百度地图API需要配置正确的域名白名单
3. **环境变量**：生产环境请使用独立的API密钥
4. **数据备份**：定期备份Supabase数据库

### 故障排除
- 查看浏览器控制台错误信息
- 检查网络连接和API配置
- 参考各服务商的官方文档
- 提交Issue获取社区帮助

---

**🌟 开始你的智能旅行规划之旅吧！**

如有问题或建议，欢迎提交Issue或联系开发团队。