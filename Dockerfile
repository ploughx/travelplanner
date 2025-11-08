# 使用官方 Node.js 18 Alpine 镜像作为基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，因为构建需要）
RUN npm ci

# 复制源代码
COPY . .

# 设置构建时环境变量
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_QWEN_API_KEY
ARG VITE_BAIDU_MAP_API_KEY
ARG VITE_XUNFEI_API_KEY
ARG VITE_XUNFEI_API_SECRET
ARG VITE_XUNFEI_APP_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_QWEN_API_KEY=$VITE_QWEN_API_KEY
ENV VITE_BAIDU_MAP_API_KEY=$VITE_BAIDU_MAP_API_KEY
ENV VITE_XUNFEI_API_KEY=$VITE_XUNFEI_API_KEY
ENV VITE_XUNFEI_API_SECRET=$VITE_XUNFEI_API_SECRET
ENV VITE_XUNFEI_APP_ID=$VITE_XUNFEI_APP_ID

# 构建应用
RUN npm run build

# 使用 Nginx 作为生产环境服务器
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
