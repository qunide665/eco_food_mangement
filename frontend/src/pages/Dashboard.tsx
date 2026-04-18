import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw, Check, Plus, TrendingUp, Utensils, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  apiGetBudget,
  apiSetBudget,
  apiGetRecommendation,
  apiRefreshMeal,
  apiConfirmMeal,
  apiGetExpenses,
  apiCreateExpense,
} from '@/lib/api';
import type { BudgetWithStats, DailyRecommendation, Expense } from '@shared/types/api';

const MEAL_LABELS: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const MEAL_COLORS: Record<string, string> = { breakfast: 'text-[#F59E0B]', lunch: 'text-[#3B82F6]', dinner: 'text-[#0F172A]' };
const MEAL_BG: Record<string, string> = { breakfast: 'bg-amber-50', lunch: 'bg-blue-50', dinner: 'bg-slate-50' };

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<BudgetWithStats | null>(null);
  const [recommendation, setRecommendation] = useState<DailyRecommendation | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [expenseForm, setExpenseForm] = useState({ name: '', amount: '', mealType: 'other' as const, date: todayStr(), note: '' });
  const [refreshingMeal, setRefreshingMeal] = useState<string | null>(null);
  const [confirmingMeal, setConfirmingMeal] = useState<string | null>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetRes, recRes, expRes] = await Promise.all([
        apiGetBudget(currentMonth()),
        apiGetRecommendation(todayStr()),
        apiGetExpenses(),
      ]);
      if (budgetRes.success) setBudget(budgetRes.data);
      if (recRes.success) setRecommendation(recRes.data);
      if (expRes.success) setRecentExpenses(expRes.data.slice(0, 5));
    } catch {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await loadData();
    };
    run();
    return () => { cancelled = true; };
  }, [loadData]);

  const handleSetBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!val || val <= 0) { toast.error('请输入有效预算金额'); return; }
    const res = await apiSetBudget({ month: currentMonth(), totalBudget: val });
    if (res.success) {
      toast.success('预算设置成功');
      setBudgetDialogOpen(false);
      setBudgetInput('');
      loadData();
    } else {
      toast.error(res.message || '设置失败');
    }
  };

  const handleRefreshMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setRefreshingMeal(mealType);
    try {
      const res = await apiRefreshMeal({ mealType, date: todayStr() });
      if (res.success) setRecommendation(res.data);
      else toast.error('换一批失败');
    } finally {
      setRefreshingMeal(null);
    }
  };

  const handleConfirmMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setConfirmingMeal(mealType);
    try {
      const res = await apiConfirmMeal({ mealType, date: todayStr() });
      if (res.success) {
        setRecommendation(res.data);
        toast.success(`已确认${MEAL_LABELS[mealType]}并记录消费`);
        loadData();
      } else {
        toast.error('确认失败');
      }
    } finally {
      setConfirmingMeal(null);
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.name || !amount || amount <= 0) { toast.error('请填写完整信息'); return; }
    const res = await apiCreateExpense({ ...expenseForm, amount });
    if (res.success) {
      toast.success('消费记录添加成功');
      setExpenseDialogOpen(false);
      setExpenseForm({ name: '', amount: '', mealType: 'other', date: todayStr(), note: '' });
      loadData();
    } else {
      toast.error(res.message || '添加失败');
    }
  };

  const spentPercent = budget?.spentPercent ?? 0;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (spentPercent / 100) * circumference;

  const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            你好，{user.name || '用户'}
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">
            {budget && parseFloat(budget.remaining) > 0
              ? `本月还剩 ¥${parseFloat(budget.remaining).toFixed(0)}，今天可以吃得稍微丰盛一点。`
              : '设置本月预算，开始智能餐饮规划。'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setExpenseDialogOpen(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-medium text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />记录消费
          </Button>
          <Button
            onClick={() => setBudgetDialogOpen(true)}
            variant="outline"
            className="h-10 px-4 border-[#E2E8F0] text-[#0F172A] rounded-xl font-medium text-sm"
          >
            设置预算
          </Button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Budget Overview */}
        <div className="md:col-span-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-6">本月预算概览</h3>
            {loading ? (
              <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="#3B82F6" strokeWidth="8"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${dashOffset}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
                    ¥{budget ? parseFloat(budget.remaining).toFixed(0) : '0'}
                  </span>
                  <span className="text-xs text-[#64748B]">剩余余额</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">总预算</span>
              <span className="font-medium">¥{budget ? parseFloat(budget.totalBudget).toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">已支出</span>
              <span className="font-medium text-[#EF4444]">¥{budget ? parseFloat(budget.totalSpent).toFixed(2) : '0.00'}</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <p className="text-xs text-[#64748B] text-right">{spentPercent}% 已使用</p>
          </div>
        </div>

        {/* Daily Recommendations */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">今日三餐推荐</h2>
            <button
              onClick={() => mealTypes.forEach(m => handleRefreshMeal(m))}
              className="text-sm font-medium text-[#3B82F6] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />换一批
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mealTypes.map((mealType) => {
              const dish = recommendation?.[mealType];
              const confirmed = recommendation?.[`${mealType}Confirmed` as keyof DailyRecommendation] as boolean;
              return (
                <div
                  key={mealType}
                  className="group bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-28 overflow-hidden bg-slate-100">
                    {dish?.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${MEAL_COLORS[mealType]}`}>
                      {MEAL_LABELS[mealType]}
                    </span>
                    <h4 className="font-bold mt-1 text-sm text-[#0F172A] leading-tight">
                      {dish?.name || '暂无推荐'}
                    </h4>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {dish ? `¥${parseFloat(dish.price).toFixed(2)}` : '-'}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRefreshMeal(mealType)}
                          disabled={refreshingMeal === mealType}
                          className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors"
                          title="换一个"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshingMeal === mealType ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => !confirmed && handleConfirmMeal(mealType)}
                          disabled={confirmed || confirmingMeal === mealType}
                          className={`p-1.5 rounded-full transition-colors ${
                            confirmed ? 'bg-[#10B981] text-white' : 'bg-slate-50 hover:bg-[#10B981] hover:text-white'
                          }`}
                          title={confirmed ? '已确认' : '确认并记录'}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="font-bold text-[#0F172A]">最近消费记录</h3>
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {recentExpenses.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#64748B] text-sm">暂无消费记录</div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${MEAL_BG[exp.mealType] || 'bg-slate-100'}`}>
                        <Utensils className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#0F172A]">{exp.name}</p>
                        <p className="text-xs text-[#64748B]">{exp.date} · {MEAL_LABELS[exp.mealType] || '其他'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-[#EF4444]">- ¥{parseFloat(exp.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Dish CTA */}
      <section className="mt-8">
        <div className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">想吃点不一样的？</h2>
            <p className="text-slate-300 text-sm max-w-md">你可以手动添加你喜欢的菜品到私有库，系统会在下次推荐时优先考虑它们。</p>
            <Button
              onClick={() => navigate('/dishes')}
              className="mt-5 px-5 py-2.5 bg-[#F59E0B] text-[#0F172A] rounded-xl font-bold hover:scale-105 transition-transform h-auto"
            >
              添加自定义菜品
            </Button>
          </div>
          <div className="hidden sm:flex -space-x-3 relative z-10">
            <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=150&q=80" className="w-20 h-20 rounded-2xl border-4 border-[#0F172A] object-cover rotate-3" alt="food" />
            <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&w=150&q=80" className="w-20 h-20 rounded-2xl border-4 border-[#0F172A] object-cover -rotate-6" alt="food" />
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=150&q=80" className="w-20 h-20 rounded-2xl border-4 border-[#0F172A] object-cover rotate-12" alt="food" />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>
      </section>

      {/* Budget Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>设置本月预算</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>月份</Label>
              <Input value={currentMonth()} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <Label>预算金额 (元)</Label>
              <Input
                type="number"
                placeholder="请输入预算金额"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                min="1"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setBudgetDialogOpen(false)} className="flex-1">取消</Button>
              <Button onClick={handleSetBudget} className="flex-1 bg-[#0F172A] text-white">确认设置</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>记录消费</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>消费名称</Label>
              <Input
                placeholder="如：午餐盖浇饭"
                value={expenseForm.name}
                onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>金额 (元)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label>餐次</Label>
                <select
                  value={expenseForm.mealType}
                  onChange={(e) => setExpenseForm({ ...expenseForm, mealType: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-md border border-[#E2E8F0] text-sm bg-white"
                >
                  <option value="breakfast">早餐</option>
                  <option value="lunch">午餐</option>
                  <option value="dinner">晚餐</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>备注 (可选)</Label>
              <Input
                placeholder="备注信息"
                value={expenseForm.note}
                onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)} className="flex-1">取消</Button>
              <Button onClick={handleAddExpense} className="flex-1 bg-[#0F172A] text-white">确认记录</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
