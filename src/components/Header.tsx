import { Plane, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  onNewPlan: () => void;
  user?: User | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  userMenu?: React.ReactNode;
}

export default function Header({ onNewPlan, user, onSignIn, onSignUp, userMenu }: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-xl shadow-2xl border-b border-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div className="bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-4 rounded-3xl shadow-2xl floating group-hover:scale-110 transition-transform duration-300">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black gradient-text hover:scale-105 transition-transform duration-300 cursor-default">
                AI 旅行规划师
              </h1>
              <p className="text-base text-gray-600 flex items-center space-x-2 mt-1 font-medium">
                <span className="text-lg">✨</span>
                <span>智能规划，轻松旅行</span>
                <span className="text-lg">🌍</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onNewPlan}
              className="btn-secondary flex items-center space-x-2 group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-spin" />
              <span>新建计划</span>
            </button>

            {user ? (
              // 已登录用户显示用户菜单
              userMenu
            ) : (
              // 未登录用户显示登录/注册按钮
              <div className="flex items-center space-x-3">
                <button
                  onClick={onSignIn}
                  className="flex items-center space-x-2 px-6 py-3 font-bold text-gray-700 bg-white/80 border-2 border-gray-200 rounded-2xl hover:bg-white hover:border-primary-300 hover:text-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <LogIn className="w-5 h-5" />
                  <span>登录</span>
                </button>
                <button
                  onClick={onSignUp}
                  className="flex items-center space-x-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-2xl hover:from-primary-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 relative overflow-hidden group"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>注册</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

