import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, Edit3, Trash2, Shield, User as UserIcon,
  X, Check, Loader2, AlertCircle, ShieldCheck, Building2, Phone, Mail, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/client';

const ROLES = ['admin', 'contributor', 'auditor', 'manager'] as const;
const STATUSES = ['active', 'pending', 'disabled'] as const;

const roleLabel: Record<string, string> = { admin: '管理员', contributor: '研究员', auditor: '审计员', manager: '经理' };
const statusLabel: Record<string, string> = { active: '启用', pending: '待审核', disabled: '禁用' };
const roleColor: Record<string, string> = { admin: 'bg-purple-50 text-purple-600 border-purple-100', contributor: 'bg-blue-50 text-blue-600 border-blue-100', auditor: 'bg-amber-50 text-amber-600 border-amber-100', manager: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
const statusColor: Record<string, string> = { active: 'bg-emerald-50 text-emerald-600', pending: 'bg-amber-50 text-amber-600', disabled: 'bg-slate-50 text-slate-400' };

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // 表单
  const [form, setForm] = useState({ email: '', password: '', real_name: '', department: '', organization: '', phone: '', role: 'contributor' });

  const fetchUsers = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (roleFilter) p.set('role', roleFilter);
    if (statusFilter) p.set('status', statusFilter);
    if (search) p.set('search', search);
    p.set('pageSize', '100');
    api.get(`/admin/users?${p.toString()}`).then(r => {
      if (r.success) setUsers(r.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, statusFilter]);

  const handleSearch = () => fetchUsers();

  const resetForm = () => {
    setForm({ email: '', password: '', real_name: '', department: '', organization: '', phone: '', role: 'contributor' });
    setError('');
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.real_name) { setError('邮箱、密码、姓名为必填'); return; }
    setSaving(true);
    try {
      await api.post('/admin/users', form);
      resetForm(); setShowCreate(false); fetchUsers();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleUpdate = async (userId: string) => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${userId}`, editingUser);
      setEditingUser(null); fetchUsers();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('确定删除该用户？')) return;
    try { await api.delete(`/admin/users/${userId}`); fetchUsers(); } catch (e: any) { alert(e.message); }
  };

  const quickToggleStatus = async (userId: string, current: string) => {
    const next = current === 'active' ? 'disabled' : 'active';
    try { await api.put(`/admin/users/${userId}`, { status: next }); fetchUsers(); } catch (e: any) { alert(e.message); }
  };

  const quickSetRole = async (userId: string, role: string) => {
    try { await api.put(`/admin/users/${userId}`, { role }); fetchUsers(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">用户权限管理</h1>
          <p className="text-on-secondary-container mt-1">管理系统用户账户、角色分配及访问状态</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchUsers} className="p-2.5 border border-outline-variant rounded-xl hover:bg-surface-container text-outline transition-colors"><RefreshCw className="w-5 h-5" /></button>
          <button onClick={() => { resetForm(); setShowCreate(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> 新建用户
          </button>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总用户数', value: users.length, icon: UserIcon, color: 'text-blue-600 bg-blue-50' },
          { label: '管理员', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-purple-600 bg-purple-50' },
          { label: '启用中', value: users.filter(u => u.status === 'active').length, icon: Check, color: 'text-emerald-600 bg-emerald-50' },
          { label: '待审核', value: users.filter(u => u.status === 'pending').length, icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}><stat.icon className="w-5 h-5" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p><p className="text-2xl font-black text-slate-900">{stat.value}</p></div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="搜索姓名或邮箱..." value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-3">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
            <option value="">全部角色</option>
            {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
            <option value="">全部状态</option>
            {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}</select>
          <button onClick={handleSearch} className="px-4 py-2 bg-[#0052cc] text-white rounded-xl text-sm font-bold">搜索</button>
        </div>
      </div>

      {/* 用户表格 */}
      <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-on-secondary-container text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">用户</th><th className="px-6 py-4">部门/机构</th><th className="px-6 py-4">角色</th><th className="px-6 py-4">状态</th><th className="px-6 py-4">注册时间</th><th className="px-6 py-4 text-right">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={6} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc] mx-auto" /></td></tr>}
              {!loading && users.length === 0 && <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400">暂无用户数据</td></tr>}
              {!loading && users.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border border-slate-100 shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.real_name}`} alt="" className="w-full h-full" /></div>
                      <div className="min-w-0"><p className="text-sm font-bold text-slate-800">{u.real_name}</p><p className="text-[11px] text-slate-400 truncate">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><p className="text-sm font-medium text-slate-600">{u.department}</p><p className="text-[11px] text-slate-400">{u.organization || '—'}</p></td>
                  <td className="px-6 py-4">
                    <div className="relative group/role">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border", roleColor[u.role] || 'bg-slate-50')}>{roleLabel[u.role] || u.role}</span>
                      <div className="absolute left-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl p-1.5 hidden group-hover/role:block z-20 whitespace-nowrap">
                        {ROLES.filter(r => r !== u.role).map(r => (
                          <button key={r} onClick={() => quickSetRole(u.id, r)} className="block px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg w-full text-left">{roleLabel[r]}</button>
                        ))}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => quickToggleStatus(u.id, u.status)}
                      className={cn("px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity", statusColor[u.status] || 'bg-slate-50')}>
                      {statusLabel[u.status] || u.status} {u.status === 'active' ? '✓' : '✗'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingUser({ ...u })}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-[#0052cc] rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 创建用户弹窗 */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 space-y-5">
              <div className="flex items-center justify-between"><h3 className="text-lg font-bold">新建用户</h3><button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">姓名 *</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.real_name} onChange={e => setForm({ ...form, real_name: e.target.value })} /></div>
                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">邮箱 *</label><input type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">密码 *</label><input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">角色</label><select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">部门</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">机构</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">手机</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl">取消</button>
                <button onClick={handleCreate} disabled={saving}
                  className="px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} 确认创建</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 编辑用户弹窗 */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 space-y-5">
              <div className="flex items-center justify-between"><h3 className="text-lg font-bold">编辑用户</h3><button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">姓名</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.real_name || ''} onChange={e => setEditingUser({ ...editingUser, real_name: e.target.value })} /></div>
                <div className="space-y-1.5 col-span-2"><label className="text-xs font-bold text-slate-400 uppercase">邮箱</label><input type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">角色</label><select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.role || 'contributor'} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>{ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">状态</label><select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.status || 'active'} onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">新密码（留空不修改）</label><input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">部门</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.department || ''} onChange={e => setEditingUser({ ...editingUser, department: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">机构</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.organization || ''} onChange={e => setEditingUser({ ...editingUser, organization: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">手机</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={editingUser.phone || ''} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl">取消</button>
                <button onClick={() => handleUpdate(editingUser.id)} disabled={saving}
                  className="px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />} 保存修改</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);

export default UserManagement;
