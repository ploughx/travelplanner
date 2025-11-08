import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ArrowLeft, Sparkles, Mic, MicOff, Check, X, Edit2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { voiceService } from '../services/voiceService';
import type { TravelPreferences, TravelPlan, ChatMessage } from '../types';

interface ChatAssistantProps {
  preferences: TravelPreferences;
  onPlanGenerated: (plan: TravelPlan) => void;
  onBack: () => void;
}

export default function ChatAssistant({ preferences, onPlanGenerated, onBack }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `你好！我已经了解了你的旅行需求：\n\n目的地：${preferences.destination}\n天数：${preferences.duration}天\n预算：${preferences.budget}\n风格：${preferences.travelStyle}\n\n我可以为你生成详细的旅行计划，或者回答你的任何问题。你想先了解什么？`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecognizedText, setVoiceRecognizedText] = useState('');
  const [showVoiceEditor, setShowVoiceEditor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiService.chatWithAI(input, conversationHistory);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('发送消息错误:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const plan = await aiService.generateTravelPlan(preferences);
      onPlanGenerated(plan);
    } catch (error) {
      console.error('生成计划错误:', error);
      alert('生成旅行计划时发生错误，请稍后再试。');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // 处理语音输入
  const handleVoiceInput = async () => {
    if (isRecording) {
      voiceService.stopRecognition();
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      setShowVoiceEditor(false);
      await voiceService.startRecognitionNative(
        (text) => {
          setVoiceRecognizedText(text);
          setShowVoiceEditor(true);
          setIsRecording(false);
        },
        (error) => {
          console.error('语音识别错误:', error);
          setIsRecording(false);
          alert('语音识别失败，请重试或使用文字输入');
        }
      );
    } catch (error) {
      console.error('启动语音识别错误:', error);
      setIsRecording(false);
      alert('无法启动语音识别，请检查浏览器权限或使用文字输入');
    }
  };

  // 使用语音输入
  const handleUseVoiceInput = () => {
    if (voiceRecognizedText.trim()) {
      setInput(voiceRecognizedText);
      setShowVoiceEditor(false);
      setVoiceRecognizedText('');
    }
  };

  // 取消语音输入
  const handleCancelVoiceInput = () => {
    setVoiceRecognizedText('');
    setShowVoiceEditor(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回修改</span>
        </button>
        <button
          onClick={handleGeneratePlan}
          disabled={isGeneratingPlan}
          className="btn-primary flex items-center space-x-2"
        >
          {isGeneratingPlan ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>生成完整旅行计划</span>
            </>
          )}
        </button>
      </div>

      <div className="card h-[650px] flex flex-col relative overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-100/30 to-blue-100/30 rounded-full blur-3xl"></div>
        
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white'
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200/50 p-4 bg-white/50 backdrop-blur-sm relative z-10">
          {/* 语音识别结果编辑区域 */}
          {showVoiceEditor && (
            <div className="mb-3 border-2 border-primary-200 rounded-xl p-4 bg-gradient-to-br from-primary-50 to-purple-50 shadow-md animate-slide-up">
              <div className="flex items-start space-x-2 mb-2">
                <Edit2 className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    识别结果（可编辑）：
                  </label>
                  <textarea
                    value={voiceRecognizedText}
                    onChange={(e) => setVoiceRecognizedText(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                    rows={2}
                    placeholder="识别结果将显示在这里，你可以编辑..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelVoiceInput}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>取消</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseVoiceInput}
                  disabled={!voiceRecognizedText.trim()}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-3 h-3" />
                  <span>使用此输入</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading || isRecording || showVoiceEditor}
              className={`flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse pulse-glow'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:from-primary-100 hover:to-primary-200 text-gray-700 hover:text-primary-700'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              title="语音输入"
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入你的问题或需求..."
              className="input-field flex-1"
              disabled={isLoading || isRecording || showVoiceEditor}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || isRecording || showVoiceEditor}
              className="btn-primary flex items-center space-x-2 w-14 h-14 rounded-xl"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            提示：你可以使用语音或文字输入，询问关于目的地、景点、美食、交通等问题，或直接点击"生成完整旅行计划"
          </p>
        </div>
      </div>
    </div>
  );
}

