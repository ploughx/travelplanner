import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      travel_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          destination: string
          duration: number
          budget_type: string
          budget_total: number
          travel_style: string
          interests: string[]
          start_date: string | null
          travelers: number | null
          itinerary: any
          recommendations: any
          budget_breakdown: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          destination: string
          duration: number
          budget_type: string
          budget_total: number
          travel_style: string
          interests: string[]
          start_date?: string | null
          travelers?: number | null
          itinerary?: any
          recommendations?: any
          budget_breakdown?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          destination?: string
          duration?: number
          budget_type?: string
          budget_total?: number
          travel_style?: string
          interests?: string[]
          start_date?: string | null
          travelers?: number | null
          itinerary?: any
          recommendations?: any
          budget_breakdown?: any
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          travel_plan_id: string
          category: string
          amount: number
          description: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          travel_plan_id: string
          category: string
          amount: number
          description: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          travel_plan_id?: string
          category?: string
          amount?: number
          description?: string
          date?: string
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_destinations: string[]
          preferred_travel_styles: string[]
          preferred_interests: string[]
          default_budget_type: string | null
          default_travelers: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_destinations?: string[]
          preferred_travel_styles?: string[]
          preferred_interests?: string[]
          default_budget_type?: string | null
          default_travelers?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_destinations?: string[]
          preferred_travel_styles?: string[]
          preferred_interests?: string[]
          default_budget_type?: string | null
          default_travelers?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
