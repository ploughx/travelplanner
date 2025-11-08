import { useState, useEffect } from 'react';
import { ArrowLeft, Share2, MapPin, Clock, DollarSign, Calendar, TrendingUp, Map, Plus, Mic, MicOff, Loader2, Check, X, Edit2, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import MapView from './MapView';
import { aiService } from '../services/aiService';
import { voiceService } from '../services/voiceService';
import { imageService } from '../services/imageService';
import { dataService } from '../services/dataService';
import type { TravelPlan, TravelPreferences, Expense } from '../types';

interface TravelPlanViewProps {
  plan: TravelPlan;
  preferences: TravelPreferences;
  onBack: () => void;
  onNewPlan: () => void;
  onPlanSaved: (planId: string) => void; // 新增属性
  planId?: string | null;
  userId?: string;
}

// 推荐卡片组件（用于管理图片加载状态）
function RecommendationCard({ recommendation: rec, destination }: { recommendation: any; destination: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // 异步获取图片URL
  useEffect(() => {
    const loadImage = async () => {
      try {
        setImageLoading(true);
        setImageError(false);
        
        console.log('🎨 [TravelPlanView] 生成渐变背景图片:', { 
          title: rec.title, 
          category: rec.category
        });
        
        // 统一使用渐变背景图片
        const url = await imageService.getRecommendationImage(rec, destination);
        console.log('✅ [TravelPlanView] 渐变背景图片生成完成:', {
          url: url,
          urlLength: url?.length,
          urlPrefix: url?.substring(0, 50)
        });
        setImageUrl(url);
      } catch (error) {
        console.error('❌ [TravelPlanView] 加载图片失败:', error);
        // 使用默认图片
        const fallbackUrl = imageService.getCategoryImage(rec.category, destination);
        console.log('🔄 [TravelPlanView] 使用兜底图片:', fallbackUrl);
        setImageUrl(fallbackUrl);
      } finally {
        setImageLoading(false);
      }
    };
    
    loadImage();
  }, [rec, destination]);
  
  return (
    <div 
      className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-xl hover:border-primary-300 transition-all duration-300 transform hover:scale-105 group"
    >
      {/* 图片区域 */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary-100 to-purple-100">
        {!imageError && imageUrl ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-purple-100">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <span className="text-xs text-gray-500">加载图片中...</span>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={rec.title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                console.log('✅ [TravelPlanView] 图片加载成功:', imageUrl);
                setImageLoading(false);
              }}
              onError={(e) => {
                console.error('❌ [TravelPlanView] 图片加载失败:', imageUrl, e);
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100">
            <div className="flex flex-col items-center space-y-2 text-gray-400">
              <ImageIcon className="w-12 h-12" />
              <span className="text-xs">图片加载失败</span>
            </div>
          </div>
        )}
        
        {/* 类别标签 */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm text-primary-700 shadow-md">
            {rec.category === 'attraction' ? '景点' : 
             rec.category === 'restaurant' ? '餐厅' : 
             rec.category === 'hotel' ? '酒店' : 
             rec.category === 'activity' ? '活动' : '贴士'}
          </span>
        </div>
        
        {/* 评分标签 */}
        {rec.rating && (
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-400/90 backdrop-blur-sm text-yellow-900 shadow-md flex items-center space-x-1">
              <span>⭐</span>
              <span>{rec.rating}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-2">{rec.title}</h3>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">{rec.description}</p>
        {rec.location && (
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{rec.location}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function TravelPlanView({ plan, preferences, onBack, onNewPlan, onPlanSaved, planId, userId }: TravelPlanViewProps) {
  const [showMap, setShowMap] = useState(true); // 默认显示地图
  const [budgetAnalysis, setBudgetAnalysis] = useState<{
    analysis: string;
    suggestions: string[];
    remaining: number;
    categoryBreakdown?: Record<string, { spent: number; budget: number; percentage: number }>;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // 开销记录相关状态
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    description: '',
    amount: 0,
    location: '',
  });
  
  // 语音输入开销相关状态
  const [isRecordingExpense, setIsRecordingExpense] = useState(false);
  const [isProcessingExpenseVoice, setIsProcessingExpenseVoice] = useState(false);
  const [expenseVoiceInput, setExpenseVoiceInput] = useState('');
  const [editableExpenseVoiceInput, setEditableExpenseVoiceInput] = useState('');
  const [showExpenseVoiceEditor, setShowExpenseVoiceEditor] = useState(false);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  // 格式化AI分析文本
  const formatAnalysisText = (text: any) => {
    // 类型检查和转换
    if (!text) return '';
    
    // 如果是对象，需要特殊处理
    if (typeof text === 'object') {
      return formatStructuredAnalysis(text);
    }
    
    // 如果不是字符串，转换为字符串
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    return text
      .replace(/\n\s*\n/g, '\n\n') // 规范化段落间距
      .replace(/^\s+|\s+$/g, '') // 去除首尾空白
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/([。！？])\s*([^\s])/g, '$1\n\n$2') // 在句号后添加换行
      .replace(/(\d+\.)\s*/g, '\n$1 ') // 格式化编号列表
      .replace(/([：:])\s*/g, '$1 ') // 规范化冒号后的空格
      .replace(/\n{3,}/g, '\n\n') // 限制最多两个连续换行
      .trim();
  };

  // 格式化结构化分析数据
  const formatStructuredAnalysis = (data: any): string => {
    if (!data || typeof data !== 'object') return '';
    
    let result = '';
    
    // 处理概览信息
    if (data.overview) {
      result += data.overview.trim() + '\n\n';
    }
    
    // 处理分类详情
    if (data.breakdown && typeof data.breakdown === 'object') {
      const categories = {
        accommodation: '住宿分析',
        food: '餐饮分析', 
        transportation: '交通分析',
        activities: '活动分析'
      };
      
      Object.entries(data.breakdown).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const categoryName = categories[key as keyof typeof categories] || key;
          result += `${categoryName}：\n${value.trim()}\n\n`;
        }
      });
    }
    
    return result.trim();
  };

  // 计算当前已花费（只计算手动添加的开销记录，不包括计划中的预设费用）
  const calculateCurrentSpending = (): number => {
    // 只计算用户手动添加的开销记录
    const recordedTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return recordedTotal;
  };
  
  // 加载费用记录（优先从云端，备选localStorage）
  useEffect(() => {
    const loadExpenses = async () => {
      if (expensesLoaded) return;
      
      let loadedExpenses: Expense[] = [];
      
      // 如果有用户ID和计划ID，从云端加载
      if (userId && planId) {
        try {
          loadedExpenses = await dataService.getPlanExpenses(planId);
        } catch (error) {
          console.error('从云端加载费用记录失败:', error);
        }
      }
      
      // 如果云端没有数据，尝试从localStorage加载
      if (loadedExpenses.length === 0) {
        const saved = localStorage.getItem(`expenses-${plan.id}`);
        if (saved) {
          try {
            loadedExpenses = JSON.parse(saved);
          } catch (error) {
            console.error('从localStorage加载费用记录失败:', error);
          }
        }
      }
      
      setExpenses(loadedExpenses);
      setExpensesLoaded(true);
    };
    
    loadExpenses();
  }, [userId, planId, plan.id, expensesLoaded]);

  // 保存开销记录（同时保存到云端和localStorage）
  useEffect(() => {
    if (!expensesLoaded || expenses.length === 0) return;
    
    // 保存到localStorage作为备份
    localStorage.setItem(`expenses-${plan.id}`, JSON.stringify(expenses));
  }, [expenses, plan.id, expensesLoaded]);

  // AI预算分析（增强版）
  const handleAnalyzeBudget = async () => {
    if (isAnalyzing) return; // 防止重复调用
    
    setIsAnalyzing(true);
    try {
      const currentSpending = calculateCurrentSpending();
      
      // 准备开销数据
      const expenseData = expenses.map(e => ({
        category: e.category,
        amount: e.amount,
        description: e.description,
        date: e.date,
      }));
      
      const analysis = await aiService.analyzeBudget(
        preferences, 
        currentSpending,
        expenseData,
        plan.budget
      );
      // 确保 analysis 字段是字符串，如果是对象则转换
      const processedAnalysis = {
        ...analysis,
        analysis: typeof analysis.analysis === 'string' 
          ? analysis.analysis 
          : typeof analysis.analysis === 'object' 
            ? JSON.stringify(analysis.analysis, null, 2)
            : '预算分析数据格式异常',
        suggestions: Array.isArray(analysis.suggestions) 
          ? analysis.suggestions 
          : ['预算建议数据格式异常'],
        remaining: typeof analysis.remaining === 'number' 
          ? analysis.remaining 
          : 0
      };
      setBudgetAnalysis(processedAnalysis);
    } catch (error) {
      console.error('预算分析错误:', error);
      // 即使失败也设置一个默认值，避免页面空白
      setBudgetAnalysis({
        analysis: '预算分析服务暂时不可用，请稍后重试。',
        suggestions: [],
        remaining: plan.budget.total - calculateCurrentSpending(),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 处理语音输入开销
  const handleExpenseVoiceInput = async () => {
    if (isRecordingExpense) {
      voiceService.stopRecognition();
      setIsRecordingExpense(false);
      return;
    }

    try {
      setIsRecordingExpense(true);
      setExpenseVoiceInput('');
      setShowExpenseVoiceEditor(false);

      await voiceService.startRecognitionNative(
        (text) => {
          setExpenseVoiceInput(text);
          setEditableExpenseVoiceInput(text);
          setShowExpenseVoiceEditor(true);
          setIsRecordingExpense(false);
        },
        (error) => {
          console.error('语音识别错误:', error);
          setIsRecordingExpense(false);
          alert('语音识别失败，请重试或使用文字输入');
        }
      );
    } catch (error) {
      console.error('启动语音识别错误:', error);
      setIsRecordingExpense(false);
      alert('无法启动语音识别，请检查浏览器权限或使用文字输入');
    }
  };
  
  // 使用语音输入的开销信息
  const handleUseExpenseVoiceInput = async () => {
    const textToProcess = editableExpenseVoiceInput || expenseVoiceInput;
    if (!textToProcess.trim()) return;

    setIsProcessingExpenseVoice(true);
    setShowExpenseVoiceEditor(false);

    try {
      const prompt = `请从以下语音输入中提取开销信息，并以JSON格式返回（只返回JSON，不要其他文字说明）：
语音内容：${textToProcess}

请提取以下信息：
- category: 开销类别（必须是以下之一：accommodation-住宿、food-餐饮、transportation-交通、activities-活动、shopping-购物、other-其他）
- amount: 金额（数字）
- description: 描述（字符串）
- date: 日期（YYYY-MM-DD格式，如果提到日期，否则使用今天）
- location: 地点（可选，字符串）

请只返回JSON对象，格式如下：
{
  "category": "开销类别",
  "amount": 金额,
  "description": "描述",
  "date": "YYYY-MM-DD",
  "location": "地点（可选）"
}`;

      const response = await aiService.chatWithAI(prompt);
      
      // 解析JSON
      let extracted: any = null;
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0]
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          extracted = JSON.parse(jsonStr);
        } catch (parseError) {
          console.warn('JSON解析失败:', parseError);
        }
      }
      
      // 如果解析成功，填充表单
      if (extracted && extracted.amount) {
        setExpenseForm({
          date: extracted.date || new Date().toISOString().split('T')[0],
          category: extracted.category || 'other',
          description: extracted.description || textToProcess,
          amount: extracted.amount,
          location: extracted.location || '',
        });
        setShowExpenseForm(true);
        setExpenseVoiceInput('');
        setEditableExpenseVoiceInput('');
      } else {
        // 简单文本解析
        const text = textToProcess.toLowerCase();
        const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*元/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        
        if (amount > 0) {
          let category = 'other';
          if (text.includes('住宿') || text.includes('酒店')) category = 'accommodation';
          else if (text.includes('吃') || text.includes('餐') || text.includes('美食')) category = 'food';
          else if (text.includes('交通') || text.includes('车') || text.includes('机票')) category = 'transportation';
          else if (text.includes('活动') || text.includes('门票') || text.includes('景点')) category = 'activities';
          else if (text.includes('购物') || text.includes('买')) category = 'shopping';
          
          setExpenseForm({
            date: new Date().toISOString().split('T')[0],
            category: category as any,
            description: textToProcess,
            amount,
            location: '',
          });
          setShowExpenseForm(true);
          setExpenseVoiceInput('');
          setEditableExpenseVoiceInput('');
        } else {
          alert('无法从语音中提取金额，请手动填写');
          setShowExpenseVoiceEditor(true);
        }
      }
    } catch (error) {
      console.error('处理语音输入错误:', error);
      alert('处理语音输入时发生错误，请重试');
      setShowExpenseVoiceEditor(true);
    } finally {
      setIsProcessingExpenseVoice(false);
    }
  };
  
  // 取消语音输入
  const handleCancelExpenseVoiceInput = () => {
    setExpenseVoiceInput('');
    setEditableExpenseVoiceInput('');
    setShowExpenseVoiceEditor(false);
  };
  
  // 添加开销记录
  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0) {
      alert('请填写完整的开销信息');
      return;
    }
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      date: expenseForm.date || new Date().toISOString().split('T')[0],
      category: expenseForm.category || 'other',
      description: expenseForm.description,
      amount: expenseForm.amount,
      location: expenseForm.location,
      createdAt: new Date().toISOString(),
    };
    
    // 先更新本地状态
    setExpenses(prev => [...prev, newExpense]);
    
    // 如果用户已登录且有计划ID，保存到云端
    if (userId && planId) {
      try {
        const savedId = await dataService.saveExpense(newExpense, userId, planId);
        // 更新本地记录的ID为云端ID
        setExpenses(prev => prev.map(expense => 
          expense.id === newExpense.id 
            ? { ...expense, id: savedId }
            : expense
        ));
      } catch (error) {
        console.error('保存费用记录到云端失败:', error);
        // 可以显示一个提示，但不影响本地使用
      }
    }
    
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      category: 'other',
      description: '',
      amount: 0,
      location: '',
    });
    setShowExpenseForm(false);
    
    // 自动重新分析预算
    setTimeout(() => {
      handleAnalyzeBudget();
    }, 500);
  };
  
  // 删除开销记录
  const handleDeleteExpense = async (id: string) => {
    if (confirm('确定要删除这条开销记录吗？')) {
      // 先更新本地状态
      setExpenses(prev => prev.filter(e => e.id !== id));
      
      // 如果用户已登录，从云端删除
      if (userId) {
        try {
          await dataService.deleteExpense(id);
        } catch (error) {
          console.error('从云端删除费用记录失败:', error);
          // 可以显示一个提示，但不影响本地使用
        }
      }
      
      // 自动重新分析预算
      setTimeout(() => {
        handleAnalyzeBudget();
      }, 500);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // 自动进行预算分析
    const analyze = async () => {
      if (isAnalyzing) return;
      
      setIsAnalyzing(true);
      try {
        const currentSpending = calculateCurrentSpending();
        const expenseData = expenses.map(e => ({
          category: e.category,
          amount: e.amount,
          description: e.description,
          date: e.date,
        }));
        
        const analysis = await aiService.analyzeBudget(
          preferences, 
          currentSpending,
          expenseData,
          plan.budget
        );
        if (isMounted) {
          // 确保 analysis 字段是字符串，如果是对象则转换
          const processedAnalysis = {
            ...analysis,
            analysis: typeof analysis.analysis === 'string' 
              ? analysis.analysis 
              : typeof analysis.analysis === 'object' 
                ? JSON.stringify(analysis.analysis, null, 2)
                : '预算分析数据格式异常',
            suggestions: Array.isArray(analysis.suggestions) 
              ? analysis.suggestions 
              : ['预算建议数据格式异常'],
            remaining: typeof analysis.remaining === 'number' 
              ? analysis.remaining 
              : 0
          };
          setBudgetAnalysis(processedAnalysis);
        }
      } catch (error) {
        console.error('预算分析错误:', error);
        if (isMounted) {
          // 即使失败也设置一个默认值，避免页面空白
          setBudgetAnalysis({
            analysis: '预算分析服务暂时不可用，请稍后重试。',
            suggestions: [],
            remaining: plan.budget.total - calculateCurrentSpending(),
          });
        }
      } finally {
        if (isMounted) {
          setIsAnalyzing(false);
        }
      }
    };

    analyze();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]); // 只在计划ID变化时重新分析

  // 分享计划（示例）
  const handleShare = () => {
    // 这里可以实现将计划分享到社交媒体或通过链接分享的逻辑
    alert('分享功能正在开发中！');
  };

  // 防护：检查必要数据是否存在
  if (!plan || !plan.itinerary || plan.itinerary.length === 0) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="card p-6 text-center">
          <p className="text-red-600 mb-4">旅行计划数据不完整</p>
          <button onClick={onNewPlan} className="btn-primary">
            重新创建计划
          </button>
        </div>
      </div>
    );
  }

  // 保存计划
  const handleSavePlan = async () => {
    if (!userId) {
      alert('请先登录以保存您的旅行计划。');
      return;
    }

    setIsSaving(true);
    try {
      const newPlanId = await dataService.saveTravelPlan(plan, preferences, userId);
      console.log('计划已保存，ID:', newPlanId);
      setIsSaved(true);
      onPlanSaved(newPlanId); // 调用回调函数
      // 可选：显示一个短暂的成功提示
      setTimeout(() => {
        // 可以在这里处理保存成功后的其他逻辑，例如跳转
      }, 2000);
    } catch (error) {
      console.error('保存计划失败:', error);
      alert('保存计划失败，请稍后再试。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={onBack}
          className="flex items-center space-x-3 px-6 py-3 text-gray-600 hover:text-primary-700 transition-all duration-300 bg-white/80 hover:bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200 hover:border-primary-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">返回修改</span>
        </button>
        <div className="flex space-x-3">
          <button 
            onClick={handleSavePlan} 
            className="btn-secondary flex items-center space-x-2"
            disabled={isSaving || isSaved || !userId}
            title={!userId ? "请先登录以保存计划" : isSaved ? "计划已保存" : "保存计划"}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSaved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{isSaving ? '保存中...' : isSaved ? '已保存' : '保存计划'}</span>
          </button>
          <button onClick={handleShare} className="btn-secondary flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>分享</span>
          </button>
          <button onClick={onNewPlan} className="btn-primary">
            新建计划
          </button>
        </div>
      </div>

      {/* 计划概览 */}
      <div className="card mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center space-x-5 mb-6">
            <div className="bg-gradient-to-br from-primary-500 to-purple-500 p-4 rounded-2xl shadow-lg floating">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black gradient-text mb-3 hover:scale-105 transition-transform duration-300 cursor-default">
                {preferences.destination}
              </h1>
              <div className="flex flex-col space-y-2">
                <p className="text-xl text-gray-600 flex items-center space-x-3 font-medium">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span>{preferences.duration} 天精彩之旅</span>
                  <span className="text-2xl">✨</span>
                </p>
                <p className="text-lg text-gray-500 flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span>{preferences.travelStyle} · {preferences.budget}</span>
                  <span className="text-lg">👥</span>
                  <span>{preferences.travelers} 人出行</span>
                </p>
              </div>
            </div>
          </div>

          {/* 预算概览 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-sm text-gray-600 mb-2 font-medium">总预算</div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(plan.budget.total)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-sm text-gray-600 mb-2 font-medium">住宿</div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(plan.budget.accommodation)}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border-2 border-yellow-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-sm text-gray-600 mb-2 font-medium">餐饮</div>
              <div className="text-2xl font-bold text-yellow-700">{formatCurrency(plan.budget.food)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-sm text-gray-600 mb-2 font-medium">交通</div>
              <div className="text-2xl font-bold text-purple-700">{formatCurrency(plan.budget.transportation)}</div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-xl border-2 border-pink-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <div className="text-sm text-gray-600 mb-2 font-medium">活动</div>
              <div className="text-2xl font-bold text-pink-700">{formatCurrency(plan.budget.activities)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 每日行程 */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-1 w-12 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"></div>
          <h2 className="text-3xl font-bold gradient-text">每日行程</h2>
        </div>
        {plan.itinerary && plan.itinerary.length > 0 ? plan.itinerary.map((day, index) => (
          <div key={day.day} className="card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center space-x-4 mb-6 pb-4 border-b-2 border-primary-200">
              <div className="bg-gradient-to-br from-primary-600 to-purple-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center font-bold text-lg shadow-lg">
                {day.day}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">第 {day.day} 天</h3>
                {day.date && (
                  <p className="text-sm text-gray-500 flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{day.date}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 活动列表 */}
            <div className="space-y-4">
              {day.activities.map((activity, idx) => (
                <div key={idx} className="flex space-x-4">
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="text-sm font-semibold text-primary-600">{activity.time}</div>
                    {activity.duration && (
                      <div className="text-xs text-gray-500 flex items-center justify-end space-x-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{activity.duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 border-l-4 border-primary-300 pl-5 pb-5 last:border-l-0 last:pb-0 relative">
                    <div className="absolute left-0 top-2 w-3 h-3 bg-primary-500 rounded-full -translate-x-1.5"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 mb-2">{activity.name}</h4>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{activity.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{activity.location}</span>
                          </span>
                          {activity.cost && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{activity.cost}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 餐饮推荐 */}
            {day.meals && day.meals.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                  <span>🍽️</span>
                  <span>餐饮推荐</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {day.meals.map((meal, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {meal.type === 'breakfast' ? '早餐' : meal.type === 'lunch' ? '午餐' : meal.type === 'dinner' ? '晚餐' : '小食'}
                        </span>
                        {meal.cost && (
                          <span className="text-xs text-gray-500">{meal.cost}</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{meal.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{meal.location}</div>
                      {meal.recommendation && (
                        <div className="text-xs text-gray-500 mt-1">{meal.recommendation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 住宿推荐 */}
            {day.accommodation && (
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                  <span>🏨</span>
                  <span>住宿推荐</span>
                </h4>
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🏨</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                        {day.accommodation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="card p-6 text-center text-gray-500">
            <p>暂无行程安排</p>
          </div>
        )}
      </div>

      {/* 预算分析和管理 */}
      <div className="card mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-blue-500 p-2 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span>预算分析与管理</span>
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="btn-secondary text-sm flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>记录开销</span>
              </button>
              <button
                onClick={handleAnalyzeBudget}
                disabled={isAnalyzing}
                className="btn-secondary text-sm"
              >
                {isAnalyzing ? '分析中...' : '重新分析'}
              </button>
            </div>
          </div>
          
          {/* 开销记录表单 */}
          {showExpenseForm && (
            <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <span>记录新开销</span>
                </h3>
                <button
                  onClick={() => {
                    setShowExpenseForm(false);
                    setExpenseForm({
                      date: new Date().toISOString().split('T')[0],
                      category: 'other',
                      description: '',
                      amount: 0,
                      location: '',
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* 语音输入开销 */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    type="button"
                    onClick={handleExpenseVoiceInput}
                    disabled={isProcessingExpenseVoice || showExpenseVoiceEditor}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      isRecordingExpense
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-primary-100 hover:bg-primary-200 text-primary-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRecordingExpense ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>停止录音</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>语音输入</span>
                      </>
                    )}
                  </button>
                  {isProcessingExpenseVoice && (
                    <div className="flex items-center space-x-2 text-gray-600 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在处理...</span>
                    </div>
                  )}
                </div>
                
                {/* 语音识别结果编辑区域 */}
                {showExpenseVoiceEditor && (
                  <div className="border-2 border-primary-200 rounded-lg p-3 bg-white mb-3">
                    <div className="flex items-start space-x-2 mb-2">
                      <Edit2 className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          识别结果（可编辑）：
                        </label>
                        <textarea
                          value={editableExpenseVoiceInput}
                          onChange={(e) => setEditableExpenseVoiceInput(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                          rows={2}
                          placeholder="识别结果将显示在这里，你可以编辑..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={handleCancelExpenseVoiceInput}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        <span>取消</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleUseExpenseVoiceInput}
                        disabled={!editableExpenseVoiceInput.trim() || isProcessingExpenseVoice}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3 h-3" />
                        <span>使用此输入</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">日期</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">类别</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="accommodation">住宿</option>
                    <option value="food">餐饮</option>
                    <option value="transportation">交通</option>
                    <option value="activities">活动</option>
                    <option value="shopping">购物</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="例如：酒店住宿、午餐、门票等"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">金额（元）</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">地点（可选）</label>
                  <input
                    type="text"
                    value={expenseForm.location || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, location: e.target.value })}
                    placeholder="例如：东京银座、酒店名称等"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowExpenseForm(false);
                    setExpenseForm({
                      date: new Date().toISOString().split('T')[0],
                      category: 'other',
                      description: '',
                      amount: 0,
                      location: '',
                    });
                  }}
                  className="btn-secondary text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={!expenseForm.description || !expenseForm.amount || expenseForm.amount <= 0}
                  className="btn-primary text-sm"
                >
                  添加开销
                </button>
              </div>
            </div>
          )}
          
          {/* 开销记录列表 */}
          {expenses.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span>已记录的开销</span>
                <span className="text-sm font-normal text-gray-500">（共 {expenses.length} 条）</span>
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {expenses.map((expense) => {
                  const categoryNames: Record<string, string> = {
                    accommodation: '住宿',
                    food: '餐饮',
                    transportation: '交通',
                    activities: '活动',
                    shopping: '购物',
                    other: '其他',
                  };
                  
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                            {categoryNames[expense.category] || expense.category}
                          </span>
                          <span className="text-sm text-gray-500">{expense.date}</span>
                        </div>
                        <div className="font-semibold text-gray-900">{expense.description}</div>
                        {expense.location && (
                          <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{expense.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-primary-600">
                          ¥{expense.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">已记录开销总计：</span>
                  <span className="text-xl font-bold text-primary-600">
                    ¥{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

        {budgetAnalysis && (
          <div className="space-y-5">
            {/* 预算使用情况概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                <div className="text-xs text-gray-600 mb-1">总预算</div>
                <div className="text-xl font-bold text-blue-700">{formatCurrency(plan.budget.total)}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200">
                <div className="text-xs text-gray-600 mb-1">已花费</div>
                <div className="text-xl font-bold text-orange-700">{formatCurrency(calculateCurrentSpending())}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
                <div className="text-xs text-gray-600 mb-1">剩余预算</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(budgetAnalysis.remaining)}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
                <div className="text-xs text-gray-600 mb-1">使用率</div>
                <div className="text-xl font-bold text-purple-700">
                  {Math.round((calculateCurrentSpending() / plan.budget.total) * 100)}%
                </div>
              </div>
            </div>
            
            {/* 分类预算使用情况 */}
            {budgetAnalysis.categoryBreakdown && Object.keys(budgetAnalysis.categoryBreakdown).length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200 shadow-md">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                  <span>📈</span>
                  <span>分类预算使用情况</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(budgetAnalysis.categoryBreakdown).map(([category, data]) => {
                    const categoryNames: Record<string, string> = {
                      accommodation: '住宿',
                      food: '餐饮',
                      transportation: '交通',
                      activities: '活动',
                    };
                    const isOverBudget = data.percentage > 100;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-700">{categoryNames[category] || category}</span>
                          <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
                            {formatCurrency(data.spent)} / {formatCurrency(data.budget)} ({data.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              isOverBudget
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : data.percentage > 80
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}
                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-md">
              <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                <span>📊</span>
                <span>AI 预算分析</span>
              </h3>
              <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                {formatAnalysisText(budgetAnalysis.analysis).split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {budgetAnalysis.suggestions.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-gray-200 shadow-md">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                  <span>💡</span>
                  <span>优化建议</span>
                </h3>
                <ul className="space-y-3">
                  {budgetAnalysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700 bg-gradient-to-r from-primary-50/50 to-transparent p-3 rounded-lg">
                      <span className="text-primary-600 mt-0.5 font-bold">✓</span>
                      <span className="flex-1">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-700">剩余预算</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(budgetAnalysis.remaining)}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 地图视图 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold gradient-text flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary-500 to-blue-500 p-2 rounded-xl shadow-lg">
              <Map className="w-6 h-6 text-white" />
            </div>
            <span>地图导航</span>
          </h2>
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Map className="w-4 h-4" />
            <span>{showMap ? '隐藏地图' : '显示地图'}</span>
          </button>
        </div>
        {showMap && (
          <MapView
            destination={plan.destination || '北京'}
            activities={plan.itinerary.flatMap(day => day.activities)}
            recommendations={plan.recommendations}
          />
        )}
      </div>

      {/* 推荐和建议 */}
      {plan.recommendations && plan.recommendations.length > 0 && (
        <div className="card relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <h2 className="text-3xl font-bold gradient-text">推荐和建议</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {plan.recommendations.map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} destination={plan.destination} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
