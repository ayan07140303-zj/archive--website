import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Database, LogOut, User as UserIcon, Menu, X, ChevronDown,
  Briefcase, Users, Lightbulb, Send, FileText, BookOpen, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import CaseManagementModal from './CaseManagementModal';
import { api } from '../api/client';

interface LayoutProps {
  user: { name: string; role: string; avatar?: string; } | null;
  onLogout: () => void;
  onLoginRequest: () => void;
  onRegisterRequest: () => void;
}

const CASE_DROPDOWN = [
  { label: '全部', href: '/cases' }, { label: '政治建设', href: '/cases?category=政治建设' },
  { label: '经济建设', href: '/cases?category=经济建设' }, { label: '社会建设', href: '/cases?category=社会建设' },
  { label: '文化建设', href: '/cases?category=文化建设' }, { label: '生态文明', href: '/cases?category=生态文明' },
  { label: '法治建设', href: '/cases?category=法治建设' }, { label: '科技创新', href: '/cases?category=科技创新' },
  { label: '应急管理', href: '/cases?category=应急管理' },
];

const PUBLIC_NAV = [
  { label: '首页', href: '/dashboard', icon: Database },
  { label: '案例库', href: '/cases', icon: Briefcase, hasDropdown: true, items: CASE_DROPDOWN },
  { label: '作者库', href: '/users', icon: Users },
  { label: '个性化服务', href: '/services', icon: Lightbulb },
  { label: '案例投稿', href: '/submit', icon: Send },
];
const GUEST_NAV = [
  { label: '首页', href: '/', icon: Database },
  { label: '案例库', href: '/cases', icon: Briefcase, hasDropdown: true, items: CASE_DROPDOWN },
  { label: '作者库', href: '/users', icon: Users },
  { label: '个性化服务', href: '/services', icon: Lightbulb },
  { label: '案例投稿', href: '/submit', icon: Send },
];

// Admin 后台导航
const ADMIN_NAV = [
  { label: '管理概览', href: '/admin/dashboard' },
  { label: '案例管理', href: '/admin/cases' },
  { label: '通知管理', href: '/admin/announcements' },
  { label: '作者管理', href: '/admin/experts' },
  { label: '用户管理', href: '/admin/users' },
  { label: '投稿审核', href: '/admin/submissions' },
];

const Layout: React.FC<LayoutProps> = ({ user, onLogout, onLoginRequest, onRegisterRequest }) => {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [hoverDropdown, setHoverDropdown] = React.useState<string | null>(null);
  const [clickedDropdown, setClickedDropdown] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[] | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 搜索处理
  const doSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults(null); setSearchOpen(false); return; }
    setSearching(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      if (res.success) { setSearchResults(res.data || []); setSearchOpen(true); }
    } catch {} finally { setSearching(false); }
  };

  // 点击外部关闭
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAdmin = user?.role === 'admin';
  const activeNavItems = isAdmin ? ADMIN_NAV : (user ? PUBLIC_NAV : GUEST_NAV);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };
  const isDropdownOpen = (href: string) => hoverDropdown === href || clickedDropdown === href;

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col font-sans text-slate-900">
      {/* ====== 顶部信息栏 ====== */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 h-14 flex items-center justify-between gap-6">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-[#0052cc] rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-base">档案</span>
          </div>
          <span className="text-lg font-extrabold text-[#003B99] tracking-tight hidden sm:block">
            {isAdmin ? '后台管理系统' : '档案资政案例管理与展示平台'}
          </span>
          {isAdmin && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded hidden sm:block">管理员</span>}
        </Link>

        <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
              onFocus={() => { if (searchQuery.trim() && searchResults && searchResults.length > 0) setSearchOpen(true); }}
              placeholder="搜索案例、作者、专题、文献…"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20 focus:border-[#0052cc] transition-all" />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
            {/* 搜索结果下拉 */}
            <AnimatePresence>
              {searchOpen && searchResults && searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto py-2">
                  {searchResults.map((item: any, i: number) => {
                    const typeLabel = item.type === 'topic' ? '专题' : item.type === 'document' ? '文献' : item.type === 'case' ? '案例' : item.type === 'author' ? '作者' : '结果';
                    const typeColor = item.type === 'topic' ? 'bg-blue-50 text-blue-600' : item.type === 'document' ? 'bg-emerald-50 text-emerald-600' : item.type === 'case' ? 'bg-amber-50 text-amber-600' : item.type === 'author' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-500';
                    const href = item.type === 'topic' ? `/library/${item.id}`
                      : item.type === 'document' ? `/library/${item.topic_id || 't1'}/${item.id}`
                      : item.type === 'case' ? `/cases/${item.id}`
                      : item.type === 'author' ? `/experts/${item.id}`
                      : '#';
                    return (
                      <Link key={item.id || i} to={href}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults(null); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${typeColor}`}>{typeLabel}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0052cc] truncate block">
                            {item.name || item.title}
                          </span>
                          {item.type === 'author' && (
                            <span className="text-[11px] text-slate-400">
                              {item.organization || ''}{item.case_count > 0 ? ` · ${item.case_count} 篇案例` : ''}
                            </span>
                          )}
                          {item.type !== 'author' && item.description && (
                            <span className="text-[11px] text-slate-400 truncate block">{item.description}</span>
                          )}
                        </div>
                        <ChevronDown className="w-3 h-3 text-slate-300 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm"><span className="text-slate-400">欢迎您，</span><span className="font-bold text-slate-700">{user.name}</span></div>
              <div className="h-5 w-px bg-slate-200 hidden sm:block" />
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="" className="w-full h-full object-cover" /></div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" /></button>
                <AnimatePresence>
                  {profileOpen && (<>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileOpen(false)} className="fixed inset-0 z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-1.5">
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1"><p className="text-sm font-bold text-slate-900">{user.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</p></div>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"><UserIcon className="w-4 h-4" />账户中心</Link>
                      <button onClick={onLogout} className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors w-full mt-1"><LogOut className="w-4 h-4" />退出登录</button>
                    </motion.div></>)}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={onLoginRequest} className="text-sm font-bold text-slate-600 hover:text-[#0052cc]">登录</button>
              <span className="text-slate-300">|</span>
              <button onClick={onRegisterRequest} className="text-sm font-bold text-slate-600 hover:text-[#0052cc]">注册</button>
            </div>
          )}
        </div>
      </div>

      {/* ====== 导航栏 ====== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-8 flex items-center justify-between h-12">
          <nav className="hidden lg:flex items-center h-full gap-0">
            {activeNavItems.map((item: any) => {
              const active = isActive(item.href);
              const open = isDropdownOpen(item.href);
              return (
                <div key={item.href} className="relative h-full"
                  onMouseEnter={() => { if (item.hasDropdown) setHoverDropdown(item.href); }}
                  onMouseLeave={() => { if (item.hasDropdown) setHoverDropdown(null); }}>
                  <div className="h-full flex items-center">
                    <Link to={item.href}
                      className={cn("h-full flex items-center text-[14px] font-bold transition-all relative", active ? "text-[#0052cc]" : "text-slate-600 hover:text-[#0052cc]")}>
                      <span className="px-5">{item.label}</span>
                      {active && <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0052cc] rounded-full" />}
                    </Link>
                    {item.hasDropdown && (
                      <button onClick={() => setClickedDropdown(clickedDropdown === item.href ? null : item.href)} className="pr-3 -ml-2 h-full flex items-center">
                        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", open ? "rotate-180 text-[#0052cc]" : "")} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-0 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                        {(item.items || []).map((sub: any) => (
                          <Link key={sub.href} to={sub.href} onClick={() => { setClickedDropdown(null); setHoverDropdown(null); }}
                            className="block px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 hover:text-[#0052cc]">{sub.label}</Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5 text-slate-600" /></button>
          </div>
        </div>
      </header>

      {/* ====== 主内容区 ====== */}
      <main className="flex-grow flex flex-col p-6 sm:p-10">
        <div className="flex-grow"><Outlet context={{ user, setIsCaseModalOpen: () => setModalOpen(true), onLoginRequest, onRegisterRequest }} /></div>
        <footer className="mt-20 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 pb-4">
          <div className="space-y-1 text-center sm:text-left"><h4 className="text-sm font-bold text-[#003B99]">档案资政案例管理与展示平台</h4><p className="text-[11px] text-slate-400 font-medium">© 2026 档案资政案例管理与展示平台 版权所有</p></div>
          <div className="flex items-center gap-8">{['系统状态','联系支持','隐私政策','使用条款'].map(l=><button key={l} className="text-xs font-bold text-slate-500 hover:text-[#0052cc]">{l}</button>)}</div>
        </footer>
      </main>

      <CaseManagementModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[300px] bg-white z-[110] flex flex-col shadow-2xl">
            <div className="p-6 flex items-center justify-between border-b border-slate-100"><span className="font-bold text-[#0052cc]">功能导航</span><button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-6 h-6" /></button></div>
            <nav className="p-4 space-y-1">
              {activeNavItems.map((item: any) => (
                <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-4 px-4 py-3 rounded-xl transition-all", isActive(item.href) ? "bg-[#0052cc]/5 text-[#0052cc] font-bold" : "text-slate-600 hover:bg-slate-50")}>
                  {item.icon && <item.icon className="w-5 h-5 shrink-0" />}<span>{item.label}</span></Link>
              ))}
            </nav>
          </motion.aside></>)}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
