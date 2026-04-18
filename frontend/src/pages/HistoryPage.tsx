import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiGetExpenses, apiGetExpenseSummary, apiCreateExpense, apiUpdateExpense, apiDeleteExpense } from '@/lib/api';
import type { Expense, ExpenseSummary } from '@shared/types/api';

const MEAL_LABELS: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', other: '其他' };
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-blue-100 text-blue-700',
  dinner: 'bg-slate-100 text-slate-700',
  other: 'bg-green-100 text-green-700',
};

function currentMonth() { return new Date().toISOString().slice(0, 7); }
function todayStr() { return new Date().toISOString().split('T')[0]; }

type ExpenseForm = { name: string; amount: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'other'; date: string; note: string };

const HistoryPage = () => {
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>({ name: '', amount: '', mealType: 'other', date: todayStr(), note: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        apiGetExpenses(month),
        apiGetExpenseSummary(month),
      ]);
      if (expRes.success) setExpenses(expRes.data);
      if (sumRes.success) setSummary(sumRes.data);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await loadData();
    };
    run();
    return () => { cancelled = true; };
  }, [loadData]);

  const openCreate = () => {
    setEditingExpense(null);
    setForm({ name: '', amount: '', mealType: 'other', date: todayStr(), note: '' });
    setDialogOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({ name: exp.name, amount: exp.amount, mealType: exp.mealType, date: exp.date, note: exp.note || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const amount = parseFloat(form.amount);
    if (!form.name || !amount || amount <= 0) { toast.error('请填写完整信息'); return; }
    setSaving(true);
    try {
      if (editingExpense) {
        const res = await apiUpdateExpense(editingExpense.id, { name: form.name, amount, mealType: form.mealType, date: form.date, note: form.note || undefined });
        if (res.success) { toast.success('记录更新成功'); setDialogOpen(false); loadData(); }
        else toast.error(res.message || '更新失败');
      } else {
        const res = await apiCreateExpense({ name: form.name, amount, mealType: form.mealType, date: form.date, note: form.note || undefined });
        if (res.success) { toast.success('记录添加成功'); setDialogOpen(false); loadData(); }
        else toast.error(res.message || '添加失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await apiDeleteExpense(id);
    if (res.success) { toast.success('记录已删除'); setDeleteConfirmId(null); loadData(); }
    else toast.error(res.message || '删除失败');
  };

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const maxDayTotal = summary.length > 0 ? Math.max(...summary.map(s => parseFloat(s.total))) : 0;

  // Group expenses by date
  const grouped: Record<string, Expense[]> = {};
  expenses.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">消费历史</h1>
          <p className="text-[#64748B] text-sm mt-1">查看和管理你的餐饮消费记录</p>
        </div>
        <div className="flex gap-3">
          <Input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="h-10 border-[#E2E8F0] w-40"
          />
          <Button onClick={openCreate} className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />添加
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs text-[#64748B] mb-1">本月总支出</p>
          <p className="text-xl font-bold text-[#EF4444]">¥{totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs text-[#64748B] mb-1">消费笔数</p>
          <p className="text-xl font-bold text-[#0F172A]">{expenses.length} 笔</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs text-[#64748B] mb-1">日均消费</p>
          <p className="text-xl font-bold text-[#0F172A]">
            ¥{summary.length > 0 ? (totalSpent / summary.length).toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <p className="text-xs text-[#64748B] mb-1">消费天数</p>
          <p className="text-xl font-bold text-[#0F172A]">{summary.length} 天</p>
        </div>
      </div>

      {/* Chart */}
      {summary.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="font-semibold text-[#0F172A]">本月消费趋势</h3>
          </div>
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
            {summary.map(s => {
              const height = maxDayTotal > 0 ? (parseFloat(s.total) / maxDayTotal) * 100 : 0;
              const day = s.date.split('-')[2];
              return (
                <div key={s.date} className="flex flex-col items-center gap-1 min-w-[28px] flex-1">
                  <div
                    className="w-full bg-[#3B82F6] rounded-t-sm transition-all duration-500 hover:bg-[#2563EB] cursor-pointer"
                    style={{ height: `${Math.max(4, height)}%` }}
                    title={`${s.date}: ¥${parseFloat(s.total).toFixed(2)}`}
                  />
                  <span className="text-[10px] text-[#64748B]">{day}日</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-[#64748B] text-sm">本月暂无消费记录</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#64748B]">{date}</h3>
                <span className="text-sm font-medium text-[#0F172A]">
                  ¥{grouped[date].reduce((s, e) => s + parseFloat(e.amount), 0).toFixed(2)}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                {grouped[date].map((exp, idx) => (
                  <div
                    key={exp.id}
                    className={`px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      idx > 0 ? 'border-t border-[#E2E8F0]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEAL_COLORS[exp.mealType]}`}>
                        {MEAL_LABELS[exp.mealType]}
                      </span>
                      <div>
                        <p className="font-medium text-sm text-[#0F172A]">{exp.name}</p>
                        {exp.note && <p className="text-xs text-[#64748B]">{exp.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-[#EF4444]">- ¥{parseFloat(exp.amount).toFixed(2)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(exp.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-[#64748B] hover:text-[#EF4444]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingExpense ? '编辑消费记录' : '添加消费记录'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>消费名称</Label>
              <Input placeholder="如：午餐盖浇饭" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>金额 (元)</Label>
                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0.01" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label>餐次</Label>
                <select
                  value={form.mealType}
                  onChange={e => setForm({ ...form, mealType: e.target.value as any })}
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
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>备注 (可选)</Label>
              <Input placeholder="备注信息" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">取消</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#0F172A] text-white">
                {saving ? '保存中...' : '确认保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-[#64748B] py-2">确定要删除这条消费记录吗？</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1">取消</Button>
            <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white">确认删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;
