import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // 代理阿里云通义千问API
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qwen/, '/api/v1/services/aigc/text-generation/generation'),
      },
      // 代理百度文心一言API
      '/api/ernie': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ernie/, '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k'),
      }
    }
  }
})

