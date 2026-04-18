import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGetMe, apiUpdateProfile, apiChangePassword } from '@/lib/api';
import type { User as UserType } from '@shared/types/api';

const SettingsPage = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    const loadUser = async () => {
      const res = await apiGetMe();
      if (res.success) {
        setUser(res.data);
        setProfileForm({ name: res.data.name, email: res.data.email });
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async () => {
    if (!profileForm.name || !profileForm.email) { toast.error('请填写完整信息'); return; }
    setSavingProfile(true);
    try {
      const res = await apiUpdateProfile(profileForm);
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        toast.success('个人信息更新成功');
      } else {
        toast.error(res.message || '更新失败');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('请填写完整信息'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('两次输入的新密码不一致'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('新密码至少6位'); return; }
    setSavingPassword(true);
    try {
      const res = await apiChangePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      if (res.success) {
        toast.success('密码修改成功');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res.message || '修改失败');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">账户设置</h1>
        <p className="text-[#64748B] text-sm mt-1">管理你的个人信息和安全设置</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0F172A] flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
        </div>
        <div>
          <p className="font-semibold text-[#0F172A]">{user?.name || '加载中...'}</p>
          <p className="text-sm text-[#64748B]">{user?.email}</p>
          <p className="text-xs text-[#64748B] mt-0.5">注册于 {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F8FAFC] rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'profile' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <User className="w-4 h-4" />个人信息
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'password' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Lock className="w-4 h-4" />修改密码
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>姓名</Label>
            <Input
              value={profileForm.name}
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="请输入姓名"
              className="h-11 border-[#E2E8F0]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>邮箱</Label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
              placeholder="请输入邮箱"
              className="h-11 border-[#E2E8F0]"
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? '保存中...' : '保存修改'}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>当前密码</Label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="请输入当前密码"
              className="h-11 border-[#E2E8F0]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>新密码</Label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="请输入新密码（至少6位）"
              className="h-11 border-[#E2E8F0]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>确认新密码</Label>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="请再次输入新密码"
              className="h-11 border-[#E2E8F0]"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="w-full h-11 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl"
          >
            <Lock className="w-4 h-4 mr-2" />
            {savingPassword ? '修改中...' : '修改密码'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
