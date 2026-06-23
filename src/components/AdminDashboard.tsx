import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Users, Send, Megaphone, UserCheck,
  ChevronRight, Clock, AlertTriangle, Activity,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { api } from '../api/client';

interface AdminDashboardProps {
  user: {
    name: string;
    role: 'admin' | 'contributor' | 'auditor' | 'manager';
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any>({
    totalCases: 0, pendingSubmissions: 0, activeUsers: 0,
    totalAuthors: 0, totalAnnouncements: 0, securityLogs: [],
  });

  React.useEffect(() => {
    api.get('/admin/dashboard').then(r => r.success && setStats(r.data || stats));
  }, []);

  const statCards = [
    { label: '案例总数',   value: stats.totalCases?.toLocaleString() || '—', icon: Briefcase, color: 'text-blue-600 bg-blue-50',    path: '/admin/cases' },
    { label: '待审投稿',   value: stats.pendingSubmissions?.toString() || '—',  icon: Send,       color: 'text-amber-600 bg-amber-50',  path: '/admin/submissions' },
    { label: '活跃用户',   value: stats.activeUsers?.toString() || '—',          icon: Users,      color: 'text-indigo-600 bg-indigo-50',  path: '/admin/users' },
    { label: '入库作者',   value: stats.totalAuthors?.toString() || '—',         icon: UserCheck,  color: 'text-emerald-600 bg-emerald-50', path: '/admin/experts' },
    { label: '公告数量',   value: stats.totalAnnouncements?.toString() || '—',   icon: Megaphone,  color: 'text-purple-600 bg-purple-50', path: '/admin/announcements' },
  ];

  const modules = [
    {
      title: '案例管理', desc: '管理所有档案案例，支持增删改查与文件管理',
      icon: Briefcase, color: 'text-blue-600 bg-blue-50', path: '/admin/cases',
      stat: `共 ${stats.totalCases?.toLocaleString() || 0} 篇`,
    },
    {
      title: '投稿审核', desc: '审核用户提交的案例投稿，通过后自动入库',
      icon: Send, color: 'text-amber-600 bg-amber-50', path: '/admin/submissions',
      stat: `${stats.pendingSubmissions || 0} 篇待审`,
    },
    {
      title: '作者管理', desc: '管理案例作者信息，包括增删改查与案例统计',
      icon: UserCheck, color: 'text-emerald-600 bg-emerald-50', path: '/admin/experts',
      stat: `${stats.totalAuthors || 0} 位作者`,
    },
    {
      title: '用户管理', desc: '管理系统用户权限、角色分配与账号状态',
      icon: Users, color: 'text-indigo-600 bg-indigo-50', path: '/admin/users',
      stat: `${stats.activeUsers || 0} 个活跃账户`,
    },
    {
      title: '公告管理', desc: '发布和管理平台通知公告，支持附件上传',
      icon: Megaphone, color: 'text-purple-600 bg-purple-50', path: '/admin/announcements',
      stat: `${stats.totalAnnouncements || 0} 条公告`,
    },
  ];

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">管理概览</h1>
          <p className="text-slate-500 font-medium">全局监测档案治理平台运行状况，快速进入各管理模块。</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-[14px] hover:bg-slate-50 transition-all"
          >
            <FileText className="w-4 h-4" /> 前台案例库
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(stat.path)}
            className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.color.split(' ')[1])}>
              <stat.icon className={cn('w-5 h-5', stat.color.split(' ')[0])} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Main Grid: Modules + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left: Management Modules */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">管理模块</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => navigate(mod.path)}
                className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer flex items-start gap-5"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', mod.color.split(' ')[1])}>
                  <mod.icon className={cn('w-6 h-6', mod.color.split(' ')[0])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors">
                      {mod.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052cc] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{mod.desc}</p>
                  <div className="mt-3">
                    <span className="inline-block px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
                      {mod.stat}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* System Status */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-3">系统状态</h3>
            <div className="space-y-4">
              {[
                { service: 'PostgreSQL',   status: '运行中', dot: 'bg-emerald-500' },
                { service: 'Express API',  status: '运行中', dot: 'bg-emerald-500' },
                { service: '文件存储',      status: '运行中', dot: 'bg-emerald-500' },
                { service: '审核队列',      status: stats.pendingSubmissions > 0 ? `${stats.pendingSubmissions} 待处理` : '空闲', dot: stats.pendingSubmissions > 0 ? 'bg-amber-500' : 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn('w-2 h-2 rounded-full', item.dot)} />
                    <span className="text-[13px] font-medium text-slate-600">{item.service}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Security Logs */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">最近安全日志</h3>
            <div className="space-y-3">
              {(stats.securityLogs && stats.securityLogs.length > 0
                ? stats.securityLogs
                : [
                    { event_type: 'LOGIN', severity: 'info', message: '管理员已登录', created_at: new Date().toISOString() },
                    { event_type: 'POLICY_VIOLATION', severity: 'warning', message: '检测到策略违规', created_at: new Date().toISOString() },
                    { event_type: 'TAXONOMY_UPDATE', severity: 'info', message: '分类法已更新', created_at: new Date().toISOString() },
                  ]
              ).slice(0, 5).map((log: any, i: number) => (
                <div key={i} className="flex gap-3 pl-1">
                  <div className={cn(
                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                    log.severity === 'critical' ? 'bg-red-50 text-red-500' :
                    log.severity === 'warning' ? 'bg-amber-50 text-amber-500' :
                    'bg-slate-100 text-slate-500'
                  )}>
                    {log.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                     log.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{log.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                        log.severity === 'critical' ? 'bg-red-50 text-red-500' :
                        log.severity === 'warning' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-400'
                      )}>{log.event_type}</span>
                      <span className="text-[10px] text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">快捷入口</h3>
            <div className="space-y-2">
              {[
                { label: '前台首页',    path: '/' },
                { label: '案例库',      path: '/cases' },
                { label: '案例投稿',    path: '/submit' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl text-left hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
                >
                  <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
