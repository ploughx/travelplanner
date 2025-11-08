// 语音识别服务 - 支持科大讯飞和其他语音识别API
export class VoiceService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private apiKey: string;
  private apiSecret: string;
  private appId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_XUNFEI_API_KEY || '';
    this.apiSecret = import.meta.env.VITE_XUNFEI_API_SECRET || '';
    this.appId = import.meta.env.VITE_XUNFEI_APP_ID || '';
    
    // 检查浏览器是否支持Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'zh-CN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.isSupported = true;
    }
  }

  // 使用浏览器原生语音识别（免费，但需要HTTPS）
  async startRecognitionNative(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.isSupported) {
      onError?.('浏览器不支持语音识别，请使用科大讯飞API或升级浏览器');
      return;
    }

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        resolve();
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;
        onError?.(error);
        reject(new Error(error));
      };

      this.recognition.onend = () => {
        resolve();
      };

      this.recognition.start();
    });
  }

  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // 使用科大讯飞语音识别API
  async recognizeWithXunfei(audioBlob: Blob): Promise<string> {
    if (!this.apiKey || !this.apiSecret || !this.appId) {
      throw new Error('科大讯飞API密钥未配置');
    }

    try {
      // 注意：这里是科大讯飞API的简化实现
      // 实际使用时需要根据科大讯飞官方文档实现完整的认证流程
      
      // 简化版本：使用HTTP API（如果可用）
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('format', 'wav');
      formData.append('rate', '16000');
      formData.append('language', 'zh_cn');

      // 注意：这里需要根据科大讯飞的实际API端点进行调整
      const response = await fetch('https://iat-api.xfyun.cn/v2/iat', {
        method: 'POST',
        headers: {
          'X-Appid': this.appId,
          // 需要添加认证头
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('语音识别请求失败');
      }

      const result = await response.json();
      return result.data || '';
    } catch (error) {
      console.error('科大讯飞语音识别错误:', error);
      throw error;
    }
  }

  // 录音并转换为Blob
  async recordAudio(duration: number = 5000): Promise<Blob> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            stream.getTracks().forEach(track => track.stop());
            resolve(blob);
          };

          mediaRecorder.start();
          setTimeout(() => {
            mediaRecorder.stop();
          }, duration);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  // 检查是否支持语音识别
  isRecognitionSupported(): boolean {
    return this.isSupported || (!!this.apiKey && !!this.apiSecret && !!this.appId);
  }

  // 检查是否支持录音
  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

export const voiceService = new VoiceService();

