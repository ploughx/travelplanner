import React, { useState, useRef, useEffect } from 'react'
import { User, LogOut, Settings, FileText, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface UserMenuProps {
  onShowPlans: () => void
  onShowSettings: () => void
}

export const UserMenu: React.FC<UserMenuProps> = ({ onShowPlans, onShowSettings }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return '用户'
  }

  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 用户头像/按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-2 text-white hover:bg-white/20 transition-all duration-200"
      >
        {getUserAvatar() ? (
          <img
            src={getUserAvatar()!}
            alt="用户头像"
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-sm font-medium hidden sm:block">
          {getUserDisplayName()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
          {/* 用户信息 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {getUserAvatar() ? (
                <img
                  src={getUserAvatar()!}
                  alt="用户头像"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            <button
              onClick={() => {
                onShowPlans()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <span>我的旅行计划</span>
            </button>

            <button
              onClick={() => {
                onShowSettings()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span>账户设置</span>
            </button>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* 登出 */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  )
}
