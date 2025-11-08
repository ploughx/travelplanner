import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/Auth/AuthModal';
import { UserMenu } from './components/Auth/UserMenu';
import { TravelPlansManager } from './components/TravelPlansManager';
import Header from './components/Header';
import TravelForm from './components/TravelForm';
import ChatAssistant from './components/ChatAssistant';
import TravelPlanView from './components/TravelPlanView';
import type { TravelPreferences, TravelPlan } from './types';

// 主应用内容组件
function AppContent() {
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<'form' | 'chat' | 'plan' | 'plans' | 'settings'>('form');
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const handleFormSubmit = (prefs: TravelPreferences) => {
    setPreferences(prefs);
    setCurrentStep('chat');
  };

  const handlePlanGenerated = (plan: TravelPlan) => {
    setTravelPlan(plan);
    setCurrentStep('plan');
    setCurrentPlanId(null); // 新生成的计划尚未保存，ID为空
  };

  const handleBack = () => {
    if (currentStep === 'plan') {
      setCurrentStep('chat');
    } else if (currentStep === 'chat') {
      setCurrentStep('form');
    } else if (currentStep === 'plans' || currentStep === 'settings') {
      setCurrentStep('form');
    }
  };

  const handleNewPlan = () => {
    setTravelPlan(null);
    setPreferences(null);
    setCurrentPlanId(null);
    setCurrentStep('form');
  };

  const handleSelectPlan = (plan: any) => {
    // 转换数据库格式到应用格式
    const convertedPlan: TravelPlan = {
      id: plan.id,
      destination: plan.destination,
      duration: plan.duration,
      itinerary: plan.itinerary,
      recommendations: plan.recommendations,
      budget: plan.budget_breakdown,
      createdAt: plan.created_at || new Date().toISOString(),
    };
    
    const convertedPreferences: TravelPreferences = {
      destination: plan.destination,
      duration: plan.duration,
      budget: plan.budget_type,
      travelStyle: plan.travel_style,
      interests: plan.interests,
      startDate: plan.start_date,
      travelers: plan.travelers,
    };

    setTravelPlan(convertedPlan);
    setPreferences(convertedPreferences);
    setCurrentPlanId(plan.id);
    setCurrentStep('plan');
  };

  const showSignIn = () => {
    setAuthModalMode('signin');
    setShowAuthModal(true);
  };

  const showSignUp = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        onNewPlan={handleNewPlan}
        user={user}
        onSignIn={showSignIn}
        onSignUp={showSignUp}
        userMenu={user ? (
          <UserMenu 
            onShowPlans={() => setCurrentStep('plans')}
            onShowSettings={() => setCurrentStep('settings')}
          />
        ) : undefined}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {currentStep === 'form' && (
          <TravelForm onSubmit={handleFormSubmit} />
        )}
        
        {currentStep === 'chat' && preferences && (
          <ChatAssistant
            preferences={preferences}
            onPlanGenerated={handlePlanGenerated}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 'plan' && travelPlan && preferences && (
          <TravelPlanView
            plan={travelPlan}
            preferences={preferences}
            onBack={handleBack}
            onNewPlan={handleNewPlan}
            onPlanSaved={(planId) => setCurrentPlanId(planId)} // 处理保存事件
            planId={currentPlanId}
            userId={user?.id}
          />
        )}

        {currentStep === 'plans' && user && (
          <TravelPlansManager
            onBack={handleBack}
            onSelectPlan={handleSelectPlan}
            onCreateNew={handleNewPlan}
          />
        )}

        {currentStep === 'settings' && user && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">账户设置</h2>
            <p className="text-gray-600">设置功能正在开发中...</p>
            <button
              onClick={handleBack}
              className="mt-4 btn-secondary"
            >
              返回
            </button>
          </div>
        )}
      </main>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

// 主应用组件（包装AuthProvider）
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

