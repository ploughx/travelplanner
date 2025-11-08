# AI大模型配置指南

## 推荐的AI模型替换方案

### 1. 阿里云通义千问（推荐）

**优势：**
- 中文处理能力强
- JSON输出格式稳定
- API调用稳定性高
- 价格合理

**配置步骤：**
1. 访问 [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. 创建应用并获取API Key
3. 在 `.env` 文件中添加：
   ```env
   VITE_QWEN_API_KEY=your_qwen_api_key_here
   ```

**API文档：** https://help.aliyun.com/zh/dashscope/

### 2. 百度文心一言（备选）

**优势：**
- 国产化程度高
- 中文理解能力强
- 支持多种模型规格

**配置步骤：**
1. 访问 [百度千帆控制台](https://console.bce.baidu.com/qianfan/)
2. 创建应用并获取Access Token
3. 在 `.env` 文件中添加：
   ```env
   VITE_ERNIE_API_KEY=your_ernie_access_token_here
   ```

**API文档：** https://cloud.baidu.com/doc/WENXINWORKSHOP/

### 3. 智谱AI（当前使用）

**问题：**
- JSON格式输出不稳定
- 经常出现语法错误
- 需要大量容错处理

## 使用说明

系统会按以下优先级自动选择AI服务：
1. 通义千问（如果配置了 `VITE_QWEN_API_KEY`）
2. 文心一言（如果配置了 `VITE_ERNIE_API_KEY`）
3. 智谱AI（如果配置了 `VITE_ZHIPU_API_KEY`）

## 快速切换

要切换到通义千问，只需：

1. **获取API Key**
   ```bash
   # 访问阿里云控制台获取API Key
   https://dashscope.console.aliyun.com/
   ```

2. **配置环境变量**
   ```bash
   # 创建或编辑 .env 文件
   echo "VITE_QWEN_API_KEY=sk-your-actual-api-key-here" >> .env
   ```

3. **重启应用**
   ```bash
   npm run dev
   ```

系统会自动检测并使用通义千问API，无需修改代码。

## 性能对比

| 模型 | 稳定性 | 中文能力 | JSON输出 | 价格 | 推荐度 |
|------|--------|----------|----------|------|--------|
| 通义千问 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 文心一言 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 智谱AI | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## 故障排除

如果遇到API调用问题：

1. **检查API Key是否正确**
2. **确认账户余额充足**
3. **查看控制台错误信息**
4. **检查网络连接**

控制台会显示当前使用的AI服务，方便调试。
