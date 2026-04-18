import { API_BASE_URL } from '../config/constants';
import type {
  ApiResponse,
  AuthResponse,
  User,
  Budget,
  BudgetWithStats,
  Dish,
  Expense,
  ExpenseSummary,
  DailyRecommendation,
  SignupRequest,
  LoginRequest,
  CreateDishRequest,
  UpdateDishRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '@shared/types/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers ?? {}) },
  });
  return res.json() as Promise<ApiResponse<T>>;
}

// Auth
export const apiSignup = (data: SignupRequest) =>
  request<AuthResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) });

export const apiLogin = (data: LoginRequest) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });

export const apiGetMe = () => request<User>('/api/auth/me');

export const apiUpdateProfile = (data: { name?: string; email?: string }) =>
  request<User>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) });

export const apiChangePassword = (data: { currentPassword: string; newPassword: string }) =>
  request<null>('/api/auth/password', { method: 'PUT', body: JSON.stringify(data) });

// Budgets
export const apiGetBudget = (month: string) =>
  request<BudgetWithStats>(`/api/budgets/${month}`);

export const apiSetBudget = (data: { month: string; totalBudget: number }) =>
  request<Budget>('/api/budgets', { method: 'POST', body: JSON.stringify(data) });

// Dishes
export const apiGetDishes = () => request<Dish[]>('/api/dishes');

export const apiCreateDish = (data: CreateDishRequest) =>
  request<Dish>('/api/dishes', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateDish = (id: string, data: UpdateDishRequest) =>
  request<Dish>(`/api/dishes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiDeleteDish = (id: string) =>
  request<null>(`/api/dishes/${id}`, { method: 'DELETE' });

// Expenses
export const apiGetExpenses = (month?: string) =>
  request<Expense[]>(`/api/expenses${month ? `?month=${month}` : ''}`);

export const apiGetExpenseSummary = (month: string) =>
  request<ExpenseSummary[]>(`/api/expenses/summary?month=${month}`);

export const apiCreateExpense = (data: CreateExpenseRequest) =>
  request<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateExpense = (id: string, data: UpdateExpenseRequest) =>
  request<Expense>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiDeleteExpense = (id: string) =>
  request<null>(`/api/expenses/${id}`, { method: 'DELETE' });

// Recommendations
export const apiGetRecommendation = (date: string) =>
  request<DailyRecommendation>(`/api/recommendations/${date}`);

export const apiRefreshMeal = (data: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: string }) =>
  request<DailyRecommendation>('/api/recommendations/refresh', { method: 'POST', body: JSON.stringify(data) });

export const apiConfirmMeal = (data: { mealType: 'breakfast' | 'lunch' | 'dinner'; date: string }) =>
  request<DailyRecommendation>('/api/recommendations/confirm', { method: 'POST', body: JSON.stringify(data) });
