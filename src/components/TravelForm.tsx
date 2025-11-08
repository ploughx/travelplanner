import { useState } from 'react';
import { MapPin, Calendar, DollarSign, Users, Heart, Mic, MicOff, Loader2, Check, X, Edit2, Sparkles } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { aiService } from '../services/aiService';
import type { TravelPreferences } from '../types';

interface TravelFormProps {
  onSubmit: (preferences: TravelPreferences) => void;
}

const TRAVEL_STYLES = ['休闲度假', '文化探索', '冒险体验', '美食之旅', '购物娱乐', '自然风光'];
const INTERESTS = ['历史古迹', '自然景观', '美食', '购物', '夜生活', '艺术文化', '户外运动', '摄影'];

export default function TravelForm({ onSubmit }: TravelFormProps) {
  const [formData, setFormData] = useState<Partial<TravelPreferences>>({
    destination: '',
    duration: 1,
    budget: '经济型',
    travelStyle: '',
    interests: [],
    startDate: new Date().toISOString().split('T')[0], // 当天日期
    travelers: 2,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [editableVoiceInput, setEditableVoiceInput] = useState('');
  const [showVoiceEditor, setShowVoiceEditor] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.destination && formData.travelStyle && formData.interests && formData.interests.length > 0) {
      onSubmit(formData as TravelPreferences);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = formData.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    setFormData({ ...formData, interests: updated });
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
      setVoiceInput('');
      setShowVoiceEditor(false);

      // 使用浏览器原生语音识别
      await voiceService.startRecognitionNative(
        (text) => {
          setVoiceInput(text);
          setEditableVoiceInput(text);
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

  // 使用语音输入（解析并填充表单）
  const handleUseVoiceInput = async () => {
    const textToProcess = editableVoiceInput || voiceInput;
    if (!textToProcess.trim()) return;

    setIsProcessingVoice(true);
    setShowVoiceEditor(false);

    try {
      const prompt = `请从以下语音输入中提取旅行信息，并以JSON格式返回（只返回JSON，不要其他文字说明）：
语音内容：${textToProcess}

请提取以下信息（如果存在）：
- destination: 目的地（字符串）
- duration: 旅行天数（数字）
- budget: 预算（必须是"经济型"、"舒适型"或"豪华型"之一）
- travelers: 旅行人数（数字）
- travelStyle: 旅行风格（必须是以下之一：休闲度假、文化探索、冒险体验、美食之旅、购物娱乐、自然风光）
- interests: 兴趣标签数组（从以下选项中选择：历史古迹、自然景观、美食、购物、夜生活、艺术文化、户外运动、摄影）
- startDate: 出发日期（YYYY-MM-DD格式，如果提到日期）

请只返回JSON对象，格式如下（只包含存在的字段）：
{
  "destination": "目的地",
  "duration": 天数,
  "budget": "预算类型",
  "travelers": 人数,
  "travelStyle": "旅行风格",
  "interests": ["兴趣1", "兴趣2"],
  "startDate": "YYYY-MM-DD"
}`;

      const response = await aiService.chatWithAI(prompt);
      
      // 尝试解析AI返回的JSON - 使用更健壮的解析方法
      let extracted: any = null;
      
      // 方法1: 尝试直接找到JSON对象（支持多行）
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          // 清理JSON字符串，移除可能的代码块标记
          const jsonStr = jsonMatch[0]
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          
          extracted = JSON.parse(jsonStr);
        } catch (parseError) {
          console.warn('JSON解析失败，尝试其他方法:', parseError);
        }
      }
      
      // 方法2: 如果方法1失败，尝试从代码块中提取
      if (!extracted) {
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            extracted = JSON.parse(codeBlockMatch[1]);
          } catch (parseError) {
            console.warn('从代码块解析JSON失败:', parseError);
          }
        }
      }
      
      // 方法3: 如果还是失败，尝试简单的文本解析
      if (!extracted) {
        extracted = {};
        const text = textToProcess.toLowerCase();
        
        // 提取目的地（简单匹配）
        const destinationMatch = text.match(/(?:去|到|前往)(.{1,20}?)(?:，|,|$|旅行|天|日)/);
        if (destinationMatch) {
          extracted.destination = destinationMatch[1].trim();
        }
        
        // 提取天数
        const durationMatch = text.match(/(\d+)\s*天/);
        if (durationMatch) {
          extracted.duration = parseInt(durationMatch[1]);
        }
        
        // 提取人数
        const travelersMatch = text.match(/(\d+)\s*人/);
        if (travelersMatch) {
          extracted.travelers = parseInt(travelersMatch[1]);
        }
        
        // 提取预算
        if (text.includes('经济') || text.includes('便宜')) {
          extracted.budget = '经济型';
        } else if (text.includes('豪华') || text.includes('奢侈')) {
          extracted.budget = '豪华型';
        } else if (text.includes('舒适') || text.includes('中等')) {
          extracted.budget = '舒适型';
        }
        
        // 提取兴趣
        const interests: string[] = [];
        const interestKeywords: Record<string, string> = {
          '历史': '历史古迹',
          '古迹': '历史古迹',
          '自然': '自然景观',
          '风景': '自然景观',
          '美食': '美食',
          '吃': '美食',
          '购物': '购物',
          '买': '购物',
          '夜生活': '夜生活',
          '艺术': '艺术文化',
          '文化': '艺术文化',
          '运动': '户外运动',
          '摄影': '摄影',
        };
        
        for (const [keyword, interest] of Object.entries(interestKeywords)) {
          if (text.includes(keyword)) {
            interests.push(interest);
          }
        }
        if (interests.length > 0) {
          extracted.interests = [...new Set(interests)]; // 去重
        }
      }
      
      // 如果成功提取到数据，更新表单
      if (extracted && Object.keys(extracted).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...extracted,
          interests: extracted.interests || prev.interests || [],
        }));
        // 清空语音输入
        setVoiceInput('');
        setEditableVoiceInput('');
        // 静默处理，不显示弹窗
      } else {
        // 如果无法解析，提示用户手动填写
        alert('无法自动解析语音内容，请手动填写表单或重新识别');
        setShowVoiceEditor(true);
      }
    } catch (error) {
      console.error('处理语音输入错误:', error);
      alert('处理语音输入时发生错误，请重试或手动填写表单');
      setShowVoiceEditor(true);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // 取消语音输入
  const handleCancelVoiceInput = () => {
    setVoiceInput('');
    setEditableVoiceInput('');
    setShowVoiceEditor(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* 欢迎区域 */}
      <div className="text-center py-16 animate-fade-in">
        <h1 className="hero-title">
          开启你的
          <span className="relative">
            <span className="relative z-10">梦想之旅</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-purple-400 blur-2xl opacity-30 animate-pulse"></div>
          </span>
        </h1>
        <p className="hero-subtitle">
          只需几步简单设置，AI 将为你量身定制完美的旅行计划
        </p>
        <div className="flex justify-center space-x-8 mt-8">
          <div className="feature-card group w-48 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">AI 智能规划</h3>
            <p className="text-sm text-gray-600">基于大数据分析，为你推荐最佳路线</p>
          </div>
          <div className="feature-card group w-48 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">个性化定制</h3>
            <p className="text-sm text-gray-600">根据你的喜好和预算，量身定制</p>
          </div>
          <div className="feature-card group w-48 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">快速生成</h3>
            <p className="text-sm text-gray-600">几秒钟内生成详细的旅行计划</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto animate-scale-in">
      <div className="text-center mb-10">
        <div className="inline-block mb-4">
          <div className="bg-gradient-to-r from-primary-100 via-purple-100 to-pink-100 rounded-full px-6 py-2">
            <span className="text-sm font-semibold gradient-text">🚀 开启你的旅行之旅</span>
          </div>
        </div>
        <h2 className="text-5xl font-bold gradient-text mb-4 animate-slide-up">
          开始规划你的完美旅行
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          告诉我们你的旅行偏好，AI将为你生成个性化旅行计划
        </p>
      </div>

      {/* 语音输入区域 */}
      <div className="card bg-gradient-to-br from-primary-50 via-white to-purple-50 border-primary-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-200/40 to-purple-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-200/30 to-blue-200/30 rounded-full blur-2xl"></div>
        
        <div className="relative text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span>智能语音输入</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            用自然语言描述你的旅行需求，AI 将自动为你填写表单 ✨
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isProcessingVoice || showVoiceEditor}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl text-lg ${
                isRecording
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse pulse-glow'
                  : 'bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 hover:from-primary-700 hover:via-primary-800 hover:to-purple-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 active:scale-95`}
            >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>停止录音</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>语音输入</span>
              </>
            )}
          </button>
          {isProcessingVoice && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">正在处理...</span>
            </div>
          )}
        </div>

        {/* 语音识别结果编辑区域 */}
        {showVoiceEditor && (
          <div className="border-2 border-primary-200 rounded-xl p-5 bg-gradient-to-br from-primary-50 to-purple-50 shadow-inner animate-slide-up">
            <div className="flex items-start space-x-2 mb-3">
              <Edit2 className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  识别结果（可编辑）：
                </label>
                <textarea
                  value={editableVoiceInput}
                  onChange={(e) => setEditableVoiceInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="识别结果将显示在这里，你可以编辑..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelVoiceInput}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
              <button
                type="button"
                onClick={handleUseVoiceInput}
                disabled={!editableVoiceInput.trim() || isProcessingVoice}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>使用此输入</span>
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          点击"语音输入"按钮，说出你的旅行需求，例如："我想去北京，2天，预算1万元，喜欢美食和动漫，带孩子"
        </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8 animate-slide-up">
        {/* 目的地 */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <span>目的地</span>
          </label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="例如：北京、上海、杭州、日本东京、法国巴黎..."
            className="input-field"
            required
          />
        </div>

        {/* 旅行天数和人数 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <span>旅行天数</span>
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span>旅行人数</span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>

        {/* 出发日期 */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <span>出发日期（可选）</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="input-field"
          />
        </div>

        {/* 预算 */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <span>预算范围</span>
          </label>
          <select
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="input-field"
            required
          >
            <option value="经济型">经济型（人均 5000 元以下）</option>
            <option value="舒适型">舒适型（人均 5000-15000 元）</option>
            <option value="豪华型">豪华型（人均 15000 元以上）</option>
          </select>
        </div>

        {/* 旅行风格 */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-4">
            <Heart className="w-5 h-5 text-primary-600" />
            <span>旅行风格</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TRAVEL_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setFormData({ ...formData, travelStyle: style })}
                className={`py-4 px-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  formData.travelStyle === style
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50 text-primary-700 font-semibold shadow-md shadow-primary-200'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-700 hover:shadow-md'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* 兴趣标签 */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-4">
            <Heart className="w-5 h-5 text-primary-600" />
            <span>旅行兴趣（可多选）</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`py-2.5 px-5 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  formData.interests?.includes(interest)
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-300'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={!formData.destination || !formData.travelStyle || !formData.interests || formData.interests.length === 0}
          className="btn-primary w-full text-xl py-6 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative z-10 flex items-center justify-center space-x-3">
            <Sparkles className="w-6 h-6 group-hover:animate-spin" />
            <span className="font-black">开始我的梦想之旅</span>
            <span className="group-hover:translate-x-2 transition-transform duration-300 text-2xl">✈️</span>
          </span>
        </button>
      </form>
      </div>
    </div>
  );
}

