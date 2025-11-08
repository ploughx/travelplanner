import axios from 'axios';
import type { TravelPreferences, TravelPlan } from '../types';

// AI服务 - 支持多种AI模型
export class AIService {
  private apiKey: string;
  private aiProvider: 'qwen' | 'ernie' | 'zhipu';
  private baseURL: string;
  private model: string;

  constructor() {
    // 优先使用通义千问，其次文心一言，最后智谱AI
    if (import.meta.env.VITE_QWEN_API_KEY) {
      this.aiProvider = 'qwen';
      this.apiKey = import.meta.env.VITE_QWEN_API_KEY;
      // 生产环境直接调用 API，开发环境使用代理
      this.baseURL = import.meta.env.DEV
        ? '/api/qwen' 
        : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
      this.model = 'qwen-max';
    } else if (import.meta.env.VITE_ERNIE_API_KEY) {
      this.aiProvider = 'ernie';
      this.apiKey = import.meta.env.VITE_ERNIE_API_KEY;
      // 生产环境直接调用 API，开发环境使用代理
      this.baseURL = import.meta.env.DEV
        ? '/api/ernie' 
        : 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k';
      this.model = 'ernie-4.0-8k';
    } else {
      this.aiProvider = 'zhipu';
      this.apiKey = import.meta.env.VITE_ZHIPU_API_KEY || '';
      this.baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
      this.model = 'glm-4';
    }
    
    console.log(`使用AI服务: ${this.aiProvider}, 环境: ${import.meta.env.DEV ? '开发' : '生产'}`);
  }

  async chatWithAI(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
    try {
      if (!this.apiKey) {
        return this.generateMockResponse(message);
      }

      const messages = [
        {
          role: 'system',
          content: '你是一个专业的旅行规划助手。你的任务是帮助用户规划完美的旅行。请用中文回答，提供详细、实用的建议。'
        },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      let response;
      
      switch (this.aiProvider) {
        case 'qwen':
          response = await this.callQwenAPI(messages);
          break;
        case 'ernie':
          response = await this.callErnieAPI(messages);
          break;
        case 'zhipu':
        default:
          response = await this.callZhipuAPI(messages);
          break;
      }

      return response;
    } catch (error) {
      console.error('AI服务错误:', error);
      return this.generateMockResponse(message);
    }
  }

  // 通义千问API调用
  private async callQwenAPI(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await axios.post(
      this.baseURL,
      {
        model: this.model,
        input: {
          messages: messages
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.output.choices[0].message.content;
  }

  // 文心一言API调用
  private async callErnieAPI(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await axios.post(
      `${this.baseURL}?access_token=${this.apiKey}`,
      {
        messages: messages,
        temperature: 0.7,
        max_output_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.result;
  }

  // 智谱AI调用（保持原有逻辑）
  private async callZhipuAPI(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await axios.post(
      this.baseURL,
      {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content;
  }

  // 通义千问预算分析API调用
  private async callQwenAPIForBudget(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await axios.post(
      this.baseURL,
      {
        model: this.model,
        input: {
          messages: messages
        },
        parameters: {
          temperature: 0.3, // 降低温度以获得更稳定的JSON输出
          max_tokens: 2000,
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.output.choices[0].message.content;
  }

  // 文心一言预算分析API调用
  private async callErnieAPIForBudget(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await axios.post(
      `${this.baseURL}?access_token=${this.apiKey}`,
      {
        messages: messages,
        temperature: 0.3, // 降低温度以获得更稳定的JSON输出
        max_output_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.result;
  }

  // 智谱AI预算分析调用
  private async callZhipuAPIForBudget(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await axios.post(
      this.baseURL,
      {
        model: this.model,
        messages: messages,
        temperature: 0.3, // 降低温度以获得更稳定的JSON输出
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content;
  }

  async generateTravelPlan(preferences: TravelPreferences): Promise<TravelPlan> {
    try {
      if (this.apiKey) {
        const prompt = this.buildTravelPlanPrompt(preferences);
        
        const messages = [
          {
            role: 'system',
            content: '你是一个专业的旅行规划专家。请根据用户的偏好生成一份详细的、格式化的旅行计划。严格按照指定的JSON格式返回，不要包含任何额外的解释或Markdown标记。'
          },
          { role: 'user', content: prompt }
        ];

        let content;
        switch (this.aiProvider) {
          case 'qwen':
            content = await this.callQwenAPI(messages);
            break;
          case 'ernie':
            content = await this.callErnieAPI(messages);
            break;
          case 'zhipu':
          default:
            content = await this.callZhipuAPI(messages);
            break;
        }
        
        // 使用健壮的JSON解析方法
        const result = this.parseAIJsonResponse(content);
        if (result) {
          // 解析成功后，格式化为标准旅行计划
          return this.formatTravelPlan(result, preferences);
        } else {
          // 如果解析失败，回退到模拟数据
          console.warn('AI旅行计划解析失败，回退到模拟数据。');
          return this.generateMockTravelPlan(preferences);
        }
      } else {
        // 如果没有API Key，也使用模拟数据
        return this.generateMockTravelPlan(preferences);
      }
    } catch (error) {
      console.error('生成旅行计划错误:', error);
      return this.generateMockTravelPlan(preferences);
    }
  }

  // AI预算分析（增强版，包含开销记录）
  async analyzeBudget(
    preferences: TravelPreferences, 
    currentSpending: number,
    expenses?: Array<{ category: string; amount: number; description: string; date: string }>,
    budgetBreakdown?: { total: number; accommodation: number; food: number; transportation: number; activities: number }
  ): Promise<{
    analysis: string;
    suggestions: string[];
    remaining: number;
    categoryBreakdown?: Record<string, { spent: number; budget: number; percentage: number }>;
  }> {
    try {
      if (this.apiKey) {
        const budgetTotal = this.parseBudget(preferences.budget);
        const expensesText = expenses && expenses.length > 0 
          ? expenses.map(e => `- ${e.category}: ${e.amount}元 (${e.description}) [${e.date}]`).join('\n')
          : '暂无记录的开销';
        
        const budgetText = budgetBreakdown 
          ? `预算分配：
- 住宿：${budgetBreakdown.accommodation}元
- 餐饮：${budgetBreakdown.food}元
- 交通：${budgetBreakdown.transportation}元
- 活动：${budgetBreakdown.activities}元`
          : '';

        const prompt = `请详细分析以下旅行预算情况：

目的地：${preferences.destination}
总预算：${budgetTotal}元（${preferences.budget}）
已花费：${currentSpending}元
旅行天数：${preferences.duration}天
旅行人数：${preferences.travelers || 1}人
${budgetText}

已记录的开销：
${expensesText}

请提供：
1. 详细的预算使用情况分析（包括各分类的支出情况）
2. 预算使用率分析（已花费/总预算）
3. 针对性的优化建议（至少3条）
4. 剩余预算的合理分配建议
5. 如果超支，提供节省建议

请以JSON格式返回：
{
  "analysis": "详细的分析内容（至少200字）",
  "suggestions": ["建议1", "建议2", "建议3"],
  "remaining": 剩余金额（数字）
}`;

        const messages = [
          {
            role: 'system',
            content: '你是一个专业的旅行预算管理专家。请提供详细、实用的预算分析和优化建议。分析要具体、有针对性，建议要可操作。\n\n重要：必须严格按照JSON格式返回，不要添加任何额外的文字说明或格式化。只返回纯JSON对象。'
          },
          { role: 'user', content: prompt }
        ];

        let response;
        switch (this.aiProvider) {
          case 'qwen':
            response = await this.callQwenAPIForBudget(messages);
            break;
          case 'ernie':
            response = await this.callErnieAPIForBudget(messages);
            break;
          case 'zhipu':
          default:
            response = await this.callZhipuAPIForBudget(messages);
            break;
        }

        const content = response;
        console.log('AI预算分析原始响应:', content);
        console.log('响应类型:', typeof content);
        
        // 使用健壮的JSON解析方法
        const result = this.parseAIJsonResponse(content);
        if (result) {
            
            // 计算分类支出
            const categoryBreakdown: Record<string, { spent: number; budget: number; percentage: number }> = {};
            if (expenses && expenses.length > 0 && budgetBreakdown) {
              const categoryMap: Record<string, keyof typeof budgetBreakdown> = {
                'accommodation': 'accommodation',
                '住宿': 'accommodation',
                'food': 'food',
                '餐饮': 'food',
                '美食': 'food',
                'transportation': 'transportation',
                '交通': 'transportation',
                'activities': 'activities',
                '活动': 'activities',
                'shopping': 'activities',
                '购物': 'activities',
              };
              
              Object.entries(categoryMap).forEach(([key, budgetKey]) => {
                const categoryExpenses = expenses.filter(e => 
                  e.category.toLowerCase().includes(key.toLowerCase())
                );
                if (categoryExpenses.length > 0) {
                  const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
                  const budget = budgetBreakdown[budgetKey];
                  categoryBreakdown[budgetKey] = {
                    spent,
                    budget,
                    percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
                  };
                }
              });
            }
            
          return {
            ...result,
            remaining: result.remaining || (budgetTotal - currentSpending),
            categoryBreakdown: Object.keys(categoryBreakdown).length > 0 ? categoryBreakdown : undefined,
          };
        }
      }
      
      // 默认返回
      const budgetTotal = this.parseBudget(preferences.budget);
      const usagePercentage = Math.round((currentSpending / budgetTotal) * 100);
      const remaining = budgetTotal - currentSpending;
      
      return {
        analysis: `预算使用情况分析：

总预算：¥${budgetTotal.toLocaleString()}
已花费：¥${currentSpending.toLocaleString()}（${usagePercentage}%）
剩余预算：¥${remaining.toLocaleString()}

根据当前的消费情况，您的预算使用${usagePercentage < 50 ? '较为合理' : usagePercentage < 80 ? '需要注意控制' : '已接近上限'}。建议合理分配剩余资金，优先安排必游景点和特色体验，同时预留一定的应急资金。`,
        suggestions: [
          '优先安排必游景点和特色美食体验',
          '提前预订住宿和交通工具可节省15-30%费用',
          '预留10-15%预算作为应急资金和意外支出',
        ],
        remaining: remaining,
      };
    } catch (error) {
      console.error('预算分析错误:', error);
      const budgetTotal = this.parseBudget(preferences.budget);
      const usagePercentage = Math.round((currentSpending / budgetTotal) * 100);
      const remaining = budgetTotal - currentSpending;
      
      // 即使AI服务不可用，也提供基本的预算分析
      return {
        analysis: `预算使用情况分析：

总预算：${this.formatCurrency(budgetTotal)}
已花费：${this.formatCurrency(currentSpending)}（${usagePercentage}%）
剩余预算：${this.formatCurrency(remaining)}

根据当前的消费情况，您的预算使用${usagePercentage < 50 ? '较为合理' : usagePercentage < 80 ? '需要注意控制' : '已接近上限'}。建议合理分配剩余资金，优先安排必要的住宿和交通费用。

注意：AI分析服务暂时不可用，以上为基础分析结果。`,
        suggestions: [
          '优先安排必游景点和特色美食体验',
          '提前预订住宿和交通工具可节省15-30%费用',
          '预留10-15%预算作为应急资金和意外支出'
        ],
        remaining: remaining,
      };
    }
  }

  private formatCurrency(amount: number): string {
    return `¥${amount.toLocaleString()}`;
  }

  private parseBudget(budget: string): number {
    const ranges: Record<string, number> = {
      '经济型': 5000,
      '舒适型': 10000,
      '豪华型': 20000,
    };
    return ranges[budget] || 10000;
  }

  // 格式化AI分析文本
  private formatAnalysisText(text: any): string {
    // 类型检查和转换
    if (!text) return '';
    
    // 如果是对象，需要特殊处理
    if (typeof text === 'object') {
      return this.formatStructuredAnalysis(text);
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
  }

  // 格式化结构化分析数据
  private formatStructuredAnalysis(data: any): string {
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
  }

  // 智能文本提取方法（当JSON解析失败时使用）
  private extractAnalysisFromText(content: string): any {
    try {
      console.log('开始智能文本提取...');
      
      // 尝试多种模式提取分析内容
      const patterns = [
        // 模式1: 寻找分析相关的文本块
        /(?:预算|分析|使用情况)[：:]?([\s\S]*?)(?:建议|剩余|$)/i,
        // 模式2: 寻找概览信息
        /(?:概览|总结|情况)[：:]?([\s\S]*?)(?:建议|详细|$)/i,
        // 模式3: 寻找任何描述性文本
        /([\s\S]*?)(?:建议|推荐|$)/i
      ];
      
      let analysisText = '';
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1] && match[1].trim().length > 20) {
          analysisText = match[1].trim();
          break;
        }
      }
      
      // 提取建议
      const suggestions: string[] = [];
      const suggestionPatterns = [
        /建议[：:]?([\s\S]*?)(?:剩余|$)/i,
        /推荐[：:]?([\s\S]*?)(?:剩余|$)/i,
        /优化[：:]?([\s\S]*?)(?:剩余|$)/i
      ];
      
      for (const pattern of suggestionPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const suggestionText = match[1].trim();
          // 按句号、分号等分割建议
          const splitSuggestions = suggestionText
            .split(/[。；;]/)
            .map(s => s.trim())
            .filter(s => s.length > 5 && s.length < 100)
            .slice(0, 3);
          
          if (splitSuggestions.length > 0) {
            suggestions.push(...splitSuggestions);
            break;
          }
        }
      }
      
      // 如果没有提取到有效内容，使用默认内容
      if (!analysisText || analysisText.length < 20) {
        analysisText = '根据当前预算情况，建议合理分配各项支出，优先安排必要的住宿和交通费用，同时预留一定的应急资金。';
      }
      
      if (suggestions.length === 0) {
        suggestions.push(
          '优先安排必游景点和特色美食体验',
          '提前预订住宿和交通工具可节省费用',
          '预留10-15%预算作为应急资金'
        );
      }
      
      const result = {
        analysis: this.formatAnalysisText(analysisText),
        suggestions: suggestions.slice(0, 3),
        remaining: 0
      };
      
      console.log('智能文本提取结果:', result);
      return result;
      
    } catch (error) {
      console.error('智能文本提取失败:', error);
      
      // 最终兜底方案
      return {
        analysis: '预算分析服务暂时不可用，请稍后重试。系统正在努力为您提供更好的服务。',
        suggestions: [
          '合理规划预算分配，优先安排重要项目',
          '提前预订可享受优惠价格',
          '预留应急资金应对意外支出'
        ],
        remaining: 0
      };
    }
  }

  // 健壮的JSON解析方法
  private parseAIJsonResponse(content: string): any {
    console.log('AI返回的原始内容:', content);
    
    // 尝试多种方式提取JSON
    const jsonPatterns = [
      /\{[\s\S]*\}/,  // 标准JSON
      /```json\s*(\{[\s\S]*?\})\s*```/,  // 代码块中的JSON
      /```\s*(\{[\s\S]*?\})\s*```/,  // 无语言标识的代码块
    ];

    for (let i = 0; i < jsonPatterns.length; i++) {
      const pattern = jsonPatterns[i];
      const match = content.match(pattern);
      if (match) {
        const jsonStr = match[1] || match[0];
        console.log(`使用模式${i + 1}提取的JSON:`, jsonStr);
        
        // 尝试多种清理策略
        const cleaningStrategies = [
          // 策略1: 基本清理
          (str: string) => str
            .replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, '') // 只保留可见字符和中文
            .replace(/,(\s*[}\\]])/g, '$1') // 移除尾随逗号
            .trim(),
          
          // 策略2: 修复常见JSON语法错误
          (str: string) => str
            .replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, '') // 只保留可见字符和中文
            .replace(/,(\s*[}\\]])/g, '$1') // 移除尾随逗号
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // 为属性名添加引号
            .replace(/:\s*([^",{[\]\\}]+?)(\s*[,}\\]])/g, ':"$1"$2') // 为值添加引号（如果缺失）
            .replace(/"\s*"([^"]*?)"\s*"/g, '"$1"') // 修复双引号问题
            .trim(),
          
          // 策略3: 更激进的清理
          (str: string) => str
            .replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, '') // 只保留可见字符和中文
            .replace(/,(\s*[}\\]])/g, '$1') // 移除尾随逗号
            .replace(/([{,]\s*"[^"]*":\s*")([^"]*?)"/g, (_match: string, prefix: string, value: string) => {
              // 清理字符串值中的特殊字符
              const cleanedValue = value
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/"/g, '\\"')
                .trim();
              return `${prefix}${cleanedValue}"`;
            })
            .trim(),
          
          // 策略4: 最激进的清理
          (str: string) => str
            .replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, ' ') // 将非可见字符替换为空格
            .replace(/,(\s*[}\\]])/g, '$1') // 移除尾随逗号
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/([{,]\s*"[^"]*":\s*")([^"]*?)"/g, (_match: string, prefix: string, value: string) => {
              const cleanedValue = value
                .replace(/[^\w\s\u4e00-\u9fa5.,!?()（），。！？]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              return `${prefix}${cleanedValue}"`;
            })
            .trim(),
            
          // 策略5: 尝试修复截断的JSON
          (str: string) => {
            let cleaned = str
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
              .replace(/,(\s*[}\\]])/g, '$1')
              .trim();
            
            // 如果JSON看起来被截断了，尝试补全
            if (cleaned.endsWith(',')) {
              cleaned = cleaned.slice(0, -1);
            }
            
            // 计算括号平衡
            let braceCount = 0;
            let inString = false;
            
            for (let i = 0; i < cleaned.length; i++) {
              const char = cleaned[i];
              if (char === '"' && (i === 0 || cleaned[i-1] !== '\\')) {
                inString = !inString;
              } else if (!inString) {
                if (char === '{') braceCount++;
                else if (char === '}') braceCount--;
              }
            }
            
            // 补全缺失的括号
            while (braceCount > 0) {
              cleaned += '}';
              braceCount--;
            }
            
            return cleaned;
          }
        ];

        for (let j = 0; j < cleaningStrategies.length; j++) {
          try {
            const cleanedJson = cleaningStrategies[j](jsonStr);
            console.log(`使用清理策略${j + 1}的结果:`, cleanedJson);
            const result = JSON.parse(cleanedJson);
            
            // 对解析后的结果进行文本格式化和类型检查
            if (result && typeof result === 'object') {
              if (result.analysis) {
                result.analysis = this.formatAnalysisText(result.analysis);
              }
              
              // 确保suggestions是数组
              if (!Array.isArray(result.suggestions)) {
                result.suggestions = [];
              }
              
              // 确保remaining是数字
              if (typeof result.remaining !== 'number') {
                result.remaining = 0;
              }
            }
            
            console.log('JSON解析成功:', result);
            return result;
          } catch (error) {
            console.warn(`清理策略${j + 1}失败:`, error);
            continue;
          }
        }
      }
    }

    console.warn('所有JSON解析策略都失败了，AI返回内容:', content);
    
    // 如果所有策略都失败，尝试智能文本提取
    console.log('尝试智能文本提取备用策略...');
    return this.extractAnalysisFromText(content);
  }

  private buildTravelPlanPrompt(preferences: TravelPreferences): string {
    return `请为以下旅行需求生成详细的旅行计划：

目的地：${preferences.destination}
旅行天数：${preferences.duration}天
预算：${preferences.budget}
旅行风格：${preferences.travelStyle}
兴趣：${preferences.interests.join('、')}
${preferences.startDate ? `出发日期：${preferences.startDate}` : ''}
${preferences.travelers ? `旅行人数：${preferences.travelers}人` : ''}

**重要要求：必须使用具体的地点名称，不能使用模糊描述！**

请生成包含以下内容的详细计划：

1. **每日详细行程**（必须包含具体地点名称）：
   - 每个活动必须使用具体的景点名称、餐厅名称、地点名称
   - 示例格式：
     {
       "day": 1,
       "activities": [
         {
           "time": "09:00",
           "name": "参观故宫博物院",
           "description": "游览明清两朝皇宫，欣赏古代建筑艺术",
           "location": "北京市东城区景山前街4号",
           "duration": "3小时",
           "cost": "60元"
         },
         {
           "time": "12:00",
           "name": "在全聚德烤鸭店用餐",
           "description": "品尝正宗的北京烤鸭",
           "location": "全聚德前门店",
           "duration": "1.5小时",
           "cost": "200-300元"
         }
       ],
       "meals": [
         {
           "type": "breakfast",
           "name": "酒店自助早餐",
           "location": "所住酒店",
           "cost": "包含"
         },
         {
           "type": "lunch",
           "name": "全聚德烤鸭店",
           "location": "全聚德前门店",
           "cost": "200-300元"
         }
       ],
       "accommodation": "推荐入住北京王府井希尔顿酒店，位于王府井商业街核心位置，步行可达故宫、天安门，交通便利，价格约600-800元/晚"
     }

2. **推荐景点和活动**（必须使用具体名称）：
   - 每个推荐必须包含具体的景点名称、餐厅名称等
   - 示例：
     {
       "category": "attraction",
       "title": "故宫博物院",
       "description": "明清两朝皇宫，世界文化遗产",
       "location": "北京市东城区景山前街4号",
       "rating": 4.8
     }

3. **餐厅推荐**（必须使用具体餐厅名称）：
   - 必须提供具体的餐厅名称，不能只说"当地特色餐厅"
   - 示例：
     {
       "category": "restaurant",
       "title": "全聚德烤鸭店",
       "description": "百年老字号，正宗北京烤鸭",
       "location": "全聚德前门店",
       "rating": 4.5
     }

4. **住宿建议**：
   - 提供具体的酒店名称或区域建议

5. **预算分解**：
   - 详细的预算分配

请以JSON格式返回，格式如下：
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00",
          "name": "具体景点名称（如：故宫博物院）",
          "description": "详细描述",
          "location": "具体地址或地点名称",
          "duration": "时长",
          "cost": "费用"
        }
      ],
      "meals": [
        {
          "type": "breakfast",
          "name": "具体餐厅名称（如：酒店自助早餐）",
          "location": "具体地点",
          "cost": "费用"
        }
      ],
      "accommodation": "推荐入住XX酒店（具体酒店名称），位于XX区域，交通便利，价格约XX元/晚"
    }
  ],
  "recommendations": [
    {
      "category": "attraction",
      "title": "具体景点名称",
      "description": "详细描述",
      "location": "具体地址",
      "rating": 4.5
    },
    {
      "category": "restaurant",
      "title": "具体餐厅名称",
      "description": "详细描述",
      "location": "具体地址",
      "rating": 4.3
    }
  ],
  "budget": {
    "total": 0,
    "accommodation": 0,
    "food": 0,
    "transportation": 0,
    "activities": 0
  }
}

**再次强调：**
所有地点、景点、餐厅必须使用具体名称，不能使用"著名景点"、"当地餐厅"等模糊描述！`;
  }

  private formatTravelPlan(plan: any, preferences: TravelPreferences): TravelPlan {
    return {
      id: Date.now().toString(),
      destination: preferences.destination,
      duration: preferences.duration,
      itinerary: plan.itinerary || [],
      recommendations: plan.recommendations || [],
      budget: plan.budget || this.generateDefaultBudget(preferences.budget),
      createdAt: new Date().toISOString(),
    };
  }

  private generateMockResponse(message: string): string {
    const responses: Record<string, string> = {
      '你好': '你好！我是你的AI旅行规划助手。我可以帮你规划完美的旅行。请告诉我你想去哪里旅行？',
      '推荐': '我可以根据你的兴趣和预算为你推荐合适的旅行目的地和行程。请告诉我你的旅行偏好。',
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key.toLowerCase())) {
        return value;
      }
    }

    return '我理解你的问题。作为AI旅行规划助手，我可以帮助你：\n1. 规划旅行路线\n2. 推荐景点和餐厅\n3. 提供预算建议\n4. 回答旅行相关问题\n\n请告诉我更多关于你的旅行需求，比如目的地、天数、预算等。';
  }

  private generateMockTravelPlan(preferences: TravelPreferences): TravelPlan {
    const days = preferences.duration;
    const itinerary = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      activities: [
        {
          time: '09:00',
          name: '早餐',
          description: '在当地特色餐厅享用早餐',
          location: '酒店附近',
          duration: '1小时',
          cost: '50-100元',
        },
        {
          time: '10:30',
          name: '参观主要景点',
          description: `探索${preferences.destination}的著名景点`,
          location: '市中心',
          duration: '3小时',
          cost: '100-200元',
        },
        {
          time: '14:00',
          name: '午餐',
          description: '品尝当地美食',
          location: '特色餐厅',
          duration: '1.5小时',
          cost: '80-150元',
        },
        {
          time: '16:00',
          name: '自由活动',
          description: '根据个人兴趣自由安排',
          location: '市区',
          duration: '2小时',
        },
      ],
      meals: [
        { type: 'breakfast' as const, name: '酒店早餐', location: '酒店', cost: '包含' },
        { type: 'lunch' as const, name: '当地特色餐厅', location: '市中心', cost: '80-150元' },
        { type: 'dinner' as const, name: '推荐餐厅', location: '美食街', cost: '100-200元' },
      ],
    }));

    const budget = this.generateDefaultBudget(preferences.budget);

    return {
      id: Date.now().toString(),
      destination: preferences.destination,
      duration: preferences.duration,
      itinerary,
      recommendations: [
        {
          category: 'attraction',
          title: '必游景点',
          description: `${preferences.destination}最值得参观的景点`,
          rating: 4.5,
        },
        {
          category: 'restaurant',
          title: '特色餐厅',
          description: '品尝当地美食的最佳选择',
          rating: 4.3,
        },
        {
          category: 'tip',
          title: '旅行小贴士',
          description: '建议提前预订热门景点门票，避开旅游高峰期',
        },
      ],
      budget,
      createdAt: new Date().toISOString(),
    };
  }

  private generateDefaultBudget(budgetRange: string): TravelPlan['budget'] {
    const ranges: Record<string, number> = {
      '经济型': 5000,
      '舒适型': 10000,
      '豪华型': 20000,
    };

    const total = ranges[budgetRange] || 10000;

    return {
      total,
      accommodation: Math.round(total * 0.4),
      food: Math.round(total * 0.3),
      transportation: Math.round(total * 0.2),
      activities: Math.round(total * 0.08),
      miscellaneous: Math.round(total * 0.02),
    };
  }
}

export const aiService = new AIService();

