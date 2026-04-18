import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiLogin, apiSignup } from '@/lib/api';

type AuthMode = 'login' | 'signup';

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await apiLogin({ email: form.email, password: form.password })
        : await apiSignup({ name: form.name, email: form.email, password: form.password });
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success(mode === 'login' ? '登录成功' : '注册成功！欢迎加入');
        navigate('/');
      } else {
        toast.error(res.message || '操作失败');
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-[#0F172A] tracking-tight">消费餐饮助手</span>
          </div>
          <p className="text-[#64748B] text-sm">智能管理餐饮预算，轻松安排每日三餐</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {/* Tabs */}
          <div className="flex bg-[#F8FAFC] rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-[#1E293B]">姓名</Label>
                <Input
                  id="name"
                  placeholder="请输入姓名"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="h-11 border-[#E2E8F0] focus:border-[#3B82F6]"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#1E293B]">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-11 border-[#E2E8F0] focus:border-[#3B82F6]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#1E293B]">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码（至少6位）"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="h-11 border-[#E2E8F0] focus:border-[#3B82F6]"
              />
            </div>
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1E293B]">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  className="h-11 border-[#E2E8F0] focus:border-[#3B82F6]"
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl mt-2"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '创建账户'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#64748B] mt-6">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
