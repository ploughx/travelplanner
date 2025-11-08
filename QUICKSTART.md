# 快速启动指南

## 第一步：安装依赖

```bash
npm install
```

这将安装所有必要的依赖包，包括：
- React 和相关库
- TypeScript 类型定义
- Tailwind CSS
- Lucide React 图标库
- Axios HTTP 客户端

## 第二步：配置环境变量（可选）

如果你有 OpenAI API Key，可以创建 `.env` 文件：

```env
VITE_OPENAI_API_KEY=your_api_key_here
```

**注意**：如果没有配置 API Key，应用会使用模拟数据运行，仍然可以体验完整功能。

## 第三步：启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

## 使用流程

1. **填写旅行需求表单**
   - 输入目的地（如：日本东京）
   - 选择旅行天数
   - 设置预算范围
   - 选择旅行风格和兴趣

2. **与AI对话**
   - 在对话界面询问问题
   - 或直接点击"生成完整旅行计划"

3. **查看生成的计划**
   - 浏览每日详细行程
   - 查看预算分解
   - 查看推荐和建议
   - 可以下载或分享计划

## 常见问题

### Q: 如何获取 OpenAI API Key？
A: 访问 https://platform.openai.com/api-keys 注册并获取 API Key。

### Q: 不配置 API Key 可以使用吗？
A: 可以！应用会使用模拟数据，功能完全可用，只是AI回复是预设的。

### Q: 如何修改样式？
A: 编辑 `tailwind.config.js` 和 `src/index.css` 文件。

### Q: 如何添加新功能？
A: 在 `src/components/` 创建新组件，在 `src/services/` 添加服务逻辑。

## 下一步

- 查看 `README.md` 了解更多详情
- 查看 `src/` 目录了解代码结构
- 根据需要自定义样式和功能

