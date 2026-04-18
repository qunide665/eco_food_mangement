// Shared API types — single source of truth for frontend ↔ backend contracts.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Budget types
export interface Budget {
  id: string;
  userId: string;
  month: string;
  totalBudget: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithStats extends Budget {
  totalSpent: string;
  remaining: string;
  spentPercent: number;
}

export interface SetBudgetRequest {
  month: string;
  totalBudget: number;
}

// Dish types
export interface Dish {
  id: string;
  userId: string | null;
  name: string;
  price: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateDishRequest {
  name: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
}

export interface UpdateDishRequest {
  name?: string;
  price?: number;
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
}

// Expense types
export interface Expense {
  id: string;
  userId: string;
  dishId: string | null;
  name: string;
  amount: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'other';
  date: string;
  note: string | null;
  createdAt: string;
}

export interface CreateExpenseRequest {
  name: string;
  amount: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'other';
  date: string;
  dishId?: string;
  note?: string;
}

export interface UpdateExpenseRequest {
  name?: string;
  amount?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'other';
  date?: string;
  note?: string;
}

export interface ExpenseSummary {
  date: string;
  total: string;
  count: number;
}

// Recommendation types
export interface RecommendationDish {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string | null;
}

export interface DailyRecommendation {
  id: string;
  date: string;
  breakfast: RecommendationDish | null;
  lunch: RecommendationDish | null;
  dinner: RecommendationDish | null;
  breakfastConfirmed: boolean;
  lunchConfirmed: boolean;
  dinnerConfirmed: boolean;
}

export interface ConfirmMealRequest {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: string;
}

export interface RefreshMealRequest {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: string;
}
