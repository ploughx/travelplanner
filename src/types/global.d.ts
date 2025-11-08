// 全局类型定义

// Web Speech API 类型扩展
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

// 百度地图全局类型
interface Window {
  BMap: any;
  initBaiduMap: () => void;
}

// 环境变量类型
interface ImportMetaEnv {
  // AI模型配置
  readonly VITE_QWEN_API_KEY?: string;
  readonly VITE_ERNIE_API_KEY?: string;
  readonly VITE_ZHIPU_API_KEY?: string;
  
  // 其他服务配置
  readonly VITE_BAIDU_MAP_API_KEY?: string;
  readonly VITE_XUNFEI_API_KEY?: string;
  readonly VITE_XUNFEI_API_SECRET?: string;
  readonly VITE_XUNFEI_APP_ID?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_UNSPLASH_ACCESS_KEY?: string;
  readonly VITE_PEXELS_API_KEY?: string;
  
  // Supabase配置
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

