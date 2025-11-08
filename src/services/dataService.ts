import { supabase } from '../lib/supabase'
import { TravelPlan, TravelPreferences, Expense } from '../types'

export class DataService {
  // 保存旅行计划
  async saveTravelPlan(plan: TravelPlan, preferences: TravelPreferences, userId: string): Promise<string> {
    try {
      const planData = {
        user_id: userId,
        title: `${preferences.destination} ${preferences.duration}日游`,
        destination: preferences.destination,
        duration: preferences.duration,
        budget_type: preferences.budget,
        budget_total: this.parseBudget(preferences.budget),
        travel_style: preferences.travelStyle,
        interests: preferences.interests,
        start_date: preferences.startDate || null,
        travelers: preferences.travelers || null,
        itinerary: plan.itinerary,
        recommendations: plan.recommendations,
        budget_breakdown: plan.budget,
      }

      const { data, error } = await supabase
        .from('travel_plans')
        .insert(planData)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存旅行计划失败:', error)
      throw error
    }
  }

  // 更新旅行计划
  async updateTravelPlan(planId: string, updates: Partial<any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('travel_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', planId)

      if (error) throw error
    } catch (error) {
      console.error('更新旅行计划失败:', error)
      throw error
    }
  }

  // 获取用户的所有旅行计划
  async getUserTravelPlans(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取旅行计划失败:', error)
      throw error
    }
  }

  // 获取单个旅行计划
  async getTravelPlan(planId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('获取旅行计划失败:', error)
      return null
    }
  }

  // 删除旅行计划
  async deleteTravelPlan(planId: string): Promise<void> {
    try {
      // 先删除相关的费用记录
      await supabase
        .from('expenses')
        .delete()
        .eq('travel_plan_id', planId)

      // 再删除旅行计划
      const { error } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error
    } catch (error) {
      console.error('删除旅行计划失败:', error)
      throw error
    }
  }

  // 保存费用记录
  async saveExpense(expense: Omit<Expense, 'id'>, userId: string, planId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          travel_plan_id: planId,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          location: expense.location,
        })
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存费用记录失败:', error)
      throw error
    }
  }

  // 获取旅行计划的费用记录
  async getPlanExpenses(planId: string): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('travel_plan_id', planId)
        .order('date', { ascending: false })

      if (error) throw error
      
      return (data || []).map(item => ({
        id: item.id,
        category: item.category,
        amount: item.amount,
        description: item.description,
        date: item.date,
        location: item.location,
        createdAt: item.created_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error('获取费用记录失败:', error)
      return []
    }
  }

  // 删除费用记录
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) throw error
    } catch (error) {
      console.error('删除费用记录失败:', error)
      throw error
    }
  }

  // 保存用户偏好设置
  async saveUserPreferences(userId: string, preferences: {
    preferred_destinations?: string[]
    preferred_travel_styles?: string[]
    preferred_interests?: string[]
    default_budget_type?: string
    default_travelers?: number
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    } catch (error) {
      console.error('保存用户偏好失败:', error)
      throw error
    }
  }

  // 获取用户偏好设置
  async getUserPreferences(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // 忽略未找到记录的错误
      return data
    } catch (error) {
      console.error('获取用户偏好失败:', error)
      return null
    }
  }

  // 更新用户档案
  async updateUserProfile(userId: string, updates: {
    full_name?: string
    avatar_url?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('更新用户档案失败:', error)
      throw error
    }
  }

  // 获取用户档案
  async getUserProfile(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('获取用户档案失败:', error)
      return null
    }
  }

  // 解析预算字符串
  private parseBudget(budget: string): number {
    const ranges: Record<string, number> = {
      '经济型': 5000,
      '舒适型': 10000,
      '豪华型': 20000,
    }
    return ranges[budget] || 10000
  }

  // 实时订阅旅行计划变化
  subscribeToTravelPlans(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('travel_plans_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'travel_plans',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }

  // 实时订阅费用记录变化
  subscribeToExpenses(planId: string, callback: (payload: any) => void) {
    return supabase
      .channel('expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `travel_plan_id=eq.${planId}`,
        },
        callback
      )
      .subscribe()
  }
}

export const dataService = new DataService()
