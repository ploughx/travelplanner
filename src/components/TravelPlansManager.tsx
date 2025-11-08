import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trash2, 
  Eye,
  Loader2,
  Search,
  Filter
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dataService } from '../services/dataService'

interface TravelPlansManagerProps {
  onBack: () => void
  onSelectPlan: (plan: any) => void
  onCreateNew: () => void
}

export const TravelPlansManager: React.FC<TravelPlansManagerProps> = ({
  onBack,
  onSelectPlan,
  onCreateNew
}) => {
  const { user } = useAuth()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'destination'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPlans()
    }
  }, [user])

  const loadPlans = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const userPlans = await dataService.getUserTravelPlans(user.id)
      setPlans(userPlans)
    } catch (error) {
      console.error('加载旅行计划失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('确定要删除这个旅行计划吗？此操作不可恢复。')) {
      return
    }

    try {
      setDeleting(planId)
      await dataService.deleteTravelPlan(planId)
      setPlans(plans.filter(plan => plan.id !== planId))
    } catch (error) {
      console.error('删除旅行计划失败:', error)
      alert('删除失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  // 过滤和搜索逻辑
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.destination.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    switch (filterBy) {
      case 'recent': {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return new Date(plan.created_at) > oneWeekAgo
      }
      case 'destination':
        return true // 可以根据需要添加特定目的地过滤
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载旅行计划中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">我的旅行计划</h1>
              <span className="bg-primary-100 text-primary-800 text-sm px-2 py-1 rounded-full">
                {plans.length} 个计划
              </span>
            </div>
            
            <button
              onClick={onCreateNew}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>新建计划</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和过滤 */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索旅行计划..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">全部计划</option>
              <option value="recent">最近一周</option>
              <option value="destination">按目的地</option>
            </select>
          </div>
        </div>

        {/* 旅行计划列表 */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? '未找到匹配的计划' : '还没有旅行计划'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? '尝试使用不同的搜索词' : '创建您的第一个智能旅行计划'}
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateNew}
                className="btn-primary"
              >
                创建旅行计划
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-200 hover:border-primary-300"
              >
                {/* 卡片头部 */}
                <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">
                        {plan.title}
                      </h3>
                      <div className="flex items-center space-x-1 text-primary-100">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{plan.destination}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPlan(plan)
                        }}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeletePlan(plan.id, e)}
                        disabled={deleting === plan.id}
                        className="p-2 text-white/80 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="删除计划"
                      >
                        {deleting === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 卡片内容 */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{plan.duration} 天</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{plan.travelers || 1} 人</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">{plan.budget_type}</span>
                    </div>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(plan.budget_total)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>创建时间</span>
                      <span>{formatDate(plan.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* 悬停效果 */}
                <div className="h-1 bg-gradient-to-r from-primary-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
