export interface TravelPreferences {
  destination: string;
  duration: number;
  budget: string;
  travelStyle: string;
  interests: string[];
  startDate?: string;
  travelers?: number;
}

export interface TravelPlan {
  id: string;
  destination: string;
  duration: number;
  itinerary: DayPlan[];
  recommendations: Recommendation[];
  budget: BudgetBreakdown;
  createdAt: string;
}

export interface DayPlan {
  day: number;
  date?: string;
  activities: Activity[];
  meals: Meal[];
  accommodation?: string;
  notes?: string;
}

export interface Activity {
  time: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  cost?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  location: string;
  cost?: string;
  recommendation?: string;
}

export interface Recommendation {
  category: 'attraction' | 'restaurant' | 'hotel' | 'activity' | 'tip';
  title: string;
  description: string;
  location?: string;
  rating?: number;
  imageUrl?: string; // 图片 URL
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BudgetBreakdown {
  total: number;
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  miscellaneous: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 开销记录
export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'accommodation' | 'food' | 'transportation' | 'activities' | 'shopping' | 'other';
  description: string;
  amount: number;
  location?: string;
  createdAt: string;
}

