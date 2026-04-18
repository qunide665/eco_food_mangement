import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { apiGetDishes, apiCreateDish, apiUpdateDish, apiDeleteDish } from '@/lib/api';
import type { Dish } from '@shared/types/api';

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '零食',
};
const CATEGORY_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-blue-100 text-blue-700',
  dinner: 'bg-slate-100 text-slate-700',
  snack: 'bg-green-100 text-green-700',
};

type DishForm = { name: string; price: string; category: 'breakfast' | 'lunch' | 'dinner' | 'snack'; imageUrl: string };

const DishesPage = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [form, setForm] = useState<DishForm>({ name: '', price: '', category: 'lunch', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetDishes();
      if (res.success) setDishes(res.data);
    } catch {
      toast.error('加载菜品失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await loadDishes();
    };
    run();
    return () => { cancelled = true; };
  }, [loadDishes]);

  const openCreate = () => {
    setEditingDish(null);
    setForm({ name: '', price: '', category: 'lunch', imageUrl: '' });
    setDialogOpen(true);
  };

  const openEdit = (dish: Dish) => {
    setEditingDish(dish);
    setForm({ name: dish.name, price: dish.price, category: dish.category, imageUrl: dish.imageUrl || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.name || !price || price <= 0) { toast.error('请填写完整信息'); return; }
    setSaving(true);
    try {
      if (editingDish) {
        const res = await apiUpdateDish(editingDish.id, { name: form.name, price, category: form.category, imageUrl: form.imageUrl || undefined });
        if (res.success) { toast.success('菜品更新成功'); setDialogOpen(false); loadDishes(); }
        else toast.error(res.message || '更新失败');
      } else {
        const res = await apiCreateDish({ name: form.name, price, category: form.category, imageUrl: form.imageUrl || undefined });
        if (res.success) { toast.success('菜品添加成功'); setDialogOpen(false); loadDishes(); }
        else toast.error(res.message || '添加失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await apiDeleteDish(id);
    if (res.success) { toast.success('菜品已删除'); setDeleteConfirmId(null); loadDishes(); }
    else toast.error(res.message || '删除失败');
  };

  const filtered = dishes.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || d.category === filterCategory;
    return matchSearch && matchCat;
  });

  const myDishes = filtered.filter(d => !d.isDefault);
  const defaultDishes = filtered.filter(d => d.isDefault);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">菜品库</h1>
          <p className="text-[#64748B] text-sm mt-1">管理你的自定义菜品，系统将优先推荐它们</p>
        </div>
        <Button onClick={openCreate} className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl">
          <Plus className="w-4 h-4 mr-1.5" />添加菜品
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <Input
            placeholder="搜索菜品名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-[#E2E8F0]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#0F172A]'
              }`}
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Dishes */}
          <section>
            <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-4">我的自定义菜品 ({myDishes.length})</h2>
            {myDishes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-10 text-center">
                <Utensils className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">还没有自定义菜品</p>
                <button onClick={openCreate} className="mt-3 text-sm text-[#3B82F6] hover:underline">点击添加</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myDishes.map(dish => (
                  <DishCard key={dish.id} dish={dish} onEdit={openEdit} onDelete={setDeleteConfirmId} />
                ))}
              </div>
            )}
          </section>

          {/* Default Dishes */}
          <section>
            <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-4">系统默认菜品 ({defaultDishes.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {defaultDishes.map(dish => (
                <DishCard key={dish.id} dish={dish} onEdit={undefined} onDelete={undefined} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingDish ? '编辑菜品' : '添加自定义菜品'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>菜品名称</Label>
              <Input placeholder="如：番茄牛腩面" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>价格 (元)</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} min="0.01" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-md border border-[#E2E8F0] text-sm bg-white"
                >
                  <option value="breakfast">早餐</option>
                  <option value="lunch">午餐</option>
                  <option value="dinner">晚餐</option>
                  <option value="snack">零食</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>图片 URL (可选)</Label>
              <Input placeholder="https://..." value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
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

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748B] py-2">确定要删除这个菜品吗？此操作不可撤销。</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1">取消</Button>
            <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white">确认删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DishCard({ dish, onEdit, onDelete }: { dish: Dish; onEdit?: (d: Dish) => void; onDelete?: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all group">
      <div className="h-32 overflow-hidden bg-slate-100">
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="w-8 h-8 text-slate-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-[#0F172A] truncate">{dish.name}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[dish.category]}`}>
                {CATEGORY_LABELS[dish.category]}
              </span>
              {dish.isDefault && <span className="text-xs text-[#64748B]">系统</span>}
            </div>
          </div>
          <span className="text-sm font-bold text-[#0F172A] whitespace-nowrap">¥{parseFloat(dish.price).toFixed(2)}</span>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 mt-3">
            {onEdit && (
              <button onClick={() => onEdit(dish)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] hover:border-[#0F172A] hover:text-[#0F172A] transition-colors">
                <Pencil className="w-3 h-3" />编辑
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(dish.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors">
                <Trash2 className="w-3 h-3" />删除
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DishesPage;
