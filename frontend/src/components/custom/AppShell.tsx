import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, History, Settings, LogOut, Menu, X } from 'lucide-react';
import OmniflowBadge from '@/components/custom/OmniflowBadge';

const NAV_ITEMS = [
  { key: '/', label: '仓表盘', icon: LayoutDashboard },
  { key: '/dishes', label: '菜品库', icon: BookOpen },
  { key: '/history', label: '历史记录', icon: History },
  { key: '/settings', label: '设置', icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F172A]">消费餐饮助手</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath === item.key
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <span className="text-sm font-medium text-[#0F172A]">{user.name || '用户'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />退出
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => { navigate(item.key); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentPath === item.key
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#64748B] hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />退出登录
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#E2E8F0] bg-white py-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0F172A] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="font-bold text-[#0F172A] text-sm">消费餐饮助手</span>
          </div>
          <p className="text-xs text-[#64748B]">© 2026 消费餐饮助手. 保留所有权利。</p>
          <div className="flex gap-4">
            <span className="text-xs text-[#64748B] cursor-pointer hover:text-[#0F172A]">隐私政策</span>
            <span className="text-xs text-[#64748B] cursor-pointer hover:text-[#0F172A]">服务条款</span>
          </div>
        </div>
      </footer>

      <OmniflowBadge />
    </div>
  );
};

export default AppShell;
