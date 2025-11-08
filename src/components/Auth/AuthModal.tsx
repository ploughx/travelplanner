import React, { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signin' 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { signIn, signUp, resetPassword } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let result
      
      switch (mode) {
        case 'signin':
          result = await signIn(email, password)
          if (!result.error) {
            setMessage({ type: 'success', text: '登录成功！' })
            setTimeout(() => onClose(), 1000)
          }
          break
          
        case 'signup':
          result = await signUp(email, password, fullName)
          if (!result.error) {
            setMessage({ 
              type: 'success', 
              text: '注册成功！请检查邮箱验证链接。' 
            })
          }
          break
          
        case 'reset':
          result = await resetPassword(email)
          if (!result.error) {
            setMessage({ 
              type: 'success', 
              text: '密码重置邮件已发送，请检查邮箱。' 
            })
          }
          break
      }

      if (result?.error) {
        setMessage({ 
          type: 'error', 
          text: getErrorMessage(result.error.message) 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '操作失败，请重试。' 
      })
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    if (error.includes('Invalid login credentials')) {
      return '邮箱或密码错误'
    }
    if (error.includes('User already registered')) {
      return '该邮箱已注册，请直接登录'
    }
    if (error.includes('Password should be at least 6 characters')) {
      return '密码至少需要6个字符'
    }
    if (error.includes('Invalid email')) {
      return '邮箱格式不正确'
    }
    return error
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setMessage(null)
  }

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 背景装饰 */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-500 to-purple-600"></div>
        
        <div className="relative p-8 pt-20">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' && '欢迎回来'}
              {mode === 'signup' && '创建账户'}
              {mode === 'reset' && '重置密码'}
            </h2>
            <p className="text-white/80 text-sm">
              {mode === 'signin' && '登录您的旅行规划账户'}
              {mode === 'signup' && '开始您的智能旅行规划之旅'}
              {mode === 'reset' && '输入邮箱地址重置密码'}
            </p>
          </div>

          {/* 消息提示 */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 姓名输入（仅注册时显示） */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="姓名"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            {/* 邮箱输入 */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* 密码输入（重置密码时不显示） */}
            {mode !== 'reset' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>
                {mode === 'signin' && '登录'}
                {mode === 'signup' && '注册'}
                {mode === 'reset' && '发送重置邮件'}
              </span>
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => switchMode('reset')}
                  className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  忘记密码？
                </button>
                <div className="text-sm text-gray-600">
                  还没有账户？{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    立即注册
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-sm text-gray-600">
                已有账户？{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  立即登录
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                返回登录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
