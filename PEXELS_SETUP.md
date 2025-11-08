# Pexels API 配置指南（推荐用于中国景点）

## 为什么选择Pexels？

相比Unsplash，Pexels对中国景点的覆盖更好，原因：
- 更多亚洲摄影师贡献
- 支持中文搜索关键词
- 对中国地标和景点的图片质量更高
- 免费API额度更大（每月5000次请求）

## 快速配置步骤

### 第一步：注册Pexels账号

1. 访问：https://www.pexels.com/
2. 点击右上角 "Join" 注册账号
3. 使用邮箱注册并验证

### 第二步：申请API Key

1. 访问：https://www.pexels.com/api/
2. 点击 "Get Started" 或 "Your API Key"
3. 阅读并同意服务条款
4. 系统会立即生成您的API Key
5. 复制API Key（格式类似：`abc123xyz...`）

### 第三步：配置到项目

在 `.env` 文件中添加：

```env
VITE_PEXELS_API_KEY=你的Pexels_API_Key
```

### 第四步：重启服务器

```bash
npm run dev
```

## 图片获取优先级

系统会按以下顺序尝试获取图片：

1. **AI直接提供的图片URL**（如果有）
2. **Pexels API**（优先，适合中国景点）
3. **Unsplash API**（备选，适合欧美景点）
4. **Picsum Photos**（兜底，随机高质量图片）

## 使用效果对比

### 中国景点示例

**北京故宫**
- Pexels：✅ 能找到故宫的真实照片
- Unsplash：⚠️ 可能返回其他宫殿建筑

**上海外滩**
- Pexels：✅ 准确的外滩夜景
- Unsplash：⚠️ 可能返回其他城市天际线

**西安兵马俑**
- Pexels：✅ 兵马俑的清晰照片
- Unsplash：⚠️ 很少有相关图片

## API限制

### 免费版
- **每月请求数**：5000次
- **每小时请求数**：200次
- **图片质量**：高清原图
- **商业使用**：允许

### 注意事项
1. 图片会被缓存，避免重复请求
2. 如果超出配额，系统会自动回退到其他图片源
3. 建议同时配置Pexels和Unsplash，互为备份

## 测试验证

配置完成后，在浏览器控制台查看日志：

```
🖼️ 获取图片: { destination: "北京", title: "故宫", category: "attraction" }
🔍 尝试从Pexels API获取图片...
🔍 Pexels搜索关键词: 北京 故宫
📊 Pexels API响应: { status: 200, total: 156, photos: 1 }
✅ 找到图片: https://images.pexels.com/photos/...
```

## 常见问题

### Q: 图片还是不够准确怎么办？
A: 可以同时配置Pexels和Unsplash，系统会尝试两个API，选择最佳结果。

### Q: 如何提高图片准确度？
A: 确保AI生成的景点名称准确且具体，避免使用"著名景点"等模糊描述。

### Q: 可以不配置API Key吗？
A: 可以，系统会使用Picsum Photos提供稳定的随机图片，但不够精准。

## 推荐配置

最佳实践是同时配置Pexels和Unsplash：

```env
# 优先使用Pexels（中国景点）
VITE_PEXELS_API_KEY=your_pexels_key

# 备选Unsplash（欧美景点）
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
```

这样可以获得最全面的图片覆盖！

