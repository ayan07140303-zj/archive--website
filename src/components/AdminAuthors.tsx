import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, Edit3, Trash2, User as UserIcon, FileText,
  X, Check, Loader2, AlertCircle, Building2, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/client';

interface Author {
  id: string;
  email: string;
  name: string;
  department: string | null;
  institution: string | null;
  phone: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  case_count: number;
  created_at: string;
}

const ROLES = ['admin', 'contributor', 'auditor', 'manager'] as const;
const roleLabel: Record<string, string> = { admin: '管理员', contributor: '研究员', auditor: '审计员', manager: '经理' };
const roleColor: Record<string, string> = {
  admin: 'bg-purple-50 text-purple-600 border-purple-100',
  contributor: 'bg-blue-50 text-blue-600 border-blue-100',
  auditor: 'bg-amber-50 text-amber-600 border-amber-100',
  manager: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const AdminAuthors: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0 });
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    email: '', password: '', real_name: '', department: '', organization: '', phone: '', role: 'contributor',
  });

  const [apiError, setApiError] = useState('');

  const fetchAuthors = () => {
    setLoading(true);
    setApiError('');
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    api.get<any>(`/admin/authors?${p.toString()}`)
      .then(r => {
        if (r.success) {
          setAuthors(r.data || []);
          if ((r as any).stats) setStats((r as any).stats);
        } else {
          setApiError(r.error?.message || '请求失败');
        }
      })
      .catch((err: any) => {
        setApiError(err.message || '网络错误，请确认后端服务已启动');
        setAuthors([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAuthors(); }, []);

  const handleSearch = () => fetchAuthors();

  const resetForm = () => {
    setForm({ email: '', password: '', real_name: '', department: '', organization: '', phone: '', role: 'contributor' });
    setError('');
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.real_name) { setError('邮箱、密码、姓名为必填'); return; }
    setSaving(true);
    try {
      await api.post('/admin/users', form);
      resetForm(); setShowCreate(false); fetchAuthors();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editingAuthor) return;
    setSaving(true);
    try {
      const payload: any = {};
      if (form.email !== editingAuthor.email) payload.email = form.email;
      if (form.real_name !== editingAuthor.name) payload.real_name = form.real_name;
      if (form.department !== (editingAuthor.department || '')) payload.department = form.department;
      if (form.organization !== (editingAuthor.institution || '')) payload.organization = form.organization;
      if (form.phone !== (editingAuthor.phone || '')) payload.phone = form.phone;
      if (form.role !== editingAuthor.role) payload.role = form.role;
      if (form.password) payload.password = form.password;

      await api.put(`/admin/users/${editingAuthor.id}`, payload);
      setEditingAuthor(null); fetchAuthors();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setConfirmDelete(null); fetchAuthors();
    } catch (e: any) { alert(e.message); }
  };

  const openEdit = (author: Author) => {
    setEditingAuthor(author);
    setForm({
      email: author.email,
      password: '',
      real_name: author.name,
      department: author.department || '',
      organization: author.institution || '',
      phone: author.phone || '',
      role: author.role,
    });
    setError('');
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">作者管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            管理系统中的所有作者（用户），支持增删改查操作
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAuthors} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />新增作者
          </button>
        </div>
      </header>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">作者总数</p>
            <p className="text-2xl font-black text-slate-900">{stats.total} 位</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">累计案例</p>
            <p className="text-2xl font-black text-slate-900">
              {authors.reduce((s, a) => s + a.case_count, 0)} 篇
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="搜索姓名、邮箱或机构..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-[#0052cc]/5 focus:border-[#0052cc]/30 transition-all"
          />
        </div>
        <button onClick={handleSearch} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
          搜索
        </button>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">数据加载失败</p>
            <p className="text-red-500">{apiError}</p>
            <button onClick={fetchAuthors} className="mt-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors">重试</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1.5fr_1.2fr_auto_auto_auto] gap-4 px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <div className="w-9" />
          <div>作者信息</div>
          <div>机构</div>
          <div className="w-16 text-center">案例</div>
          <div className="w-16 text-center">角色</div>
          <div className="w-20 text-center">操作</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" /></div>
        ) : authors.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <UserIcon className="w-10 h-10 mx-auto opacity-20" />
            <p className="font-medium">暂无作者数据</p>
          </div>
        ) : (
          <div>
            {authors.map((author, i) => (
              <motion.div
                key={author.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'grid grid-cols-[auto_1.5fr_1.2fr_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-blue-50/30 transition-colors',
                  i < authors.length - 1 && 'border-b border-slate-50'
                )}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden shrink-0">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-[#0052cc]">{author.name?.charAt(0) || '?'}</span>
                  )}
                </div>

                {/* Name + email */}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{author.name}</p>
                  <p className="text-[12px] text-slate-400 truncate mt-0.5">{author.email}</p>
                </div>

                {/* Institution */}
                <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                  <Building2 className="w-3 h-3 shrink-0 text-slate-300" />
                  <span className="text-[12px] font-medium truncate">{author.institution || '—'}</span>
                </div>

                {/* Case count */}
                <div className="w-16 text-center">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold',
                    author.case_count > 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                  )}>
                    <FileText className="w-3 h-3" />{author.case_count}
                  </span>
                </div>

                {/* Role */}
                <div className="w-16 text-center">
                  <span className={cn('px-2.5 py-1 text-[10px] font-bold rounded-lg border', roleColor[author.role] || 'bg-slate-50 text-slate-500')}>
                    {roleLabel[author.role] || author.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="w-20 flex items-center justify-center gap-1">
                  <button
                    onClick={() => openEdit(author)}
                    className="p-1.5 text-slate-400 hover:text-[#0052cc] hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {confirmDelete === author.id ? (
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleDelete(author.id)} className="p-1.5 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors" title="确认删除">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="取消">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(author.id)}
                      className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ====== Create Modal ====== */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCreate(false); resetForm(); }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">新增作者</h2>
                  <button onClick={() => { setShowCreate(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold text-slate-400 uppercase">姓名 *</label><input type="text" value={form.real_name} onChange={e => setForm({ ...form, real_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="作者姓名" /></div>
                  <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold text-slate-400 uppercase">邮箱 *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="email@example.com" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">密码 *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="≥8位" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">角色</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">{ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">所属部门</label><input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">所属机构</label><input type="text" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">电话</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => { setShowCreate(false); resetForm(); }} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">取消</button>
                  <button onClick={handleCreate} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all disabled:opacity-50">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : <><Check className="w-4 h-4" />确认创建</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====== Edit Modal ====== */}
      <AnimatePresence>
        {editingAuthor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setEditingAuthor(null); resetForm(); }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">编辑作者</h2>
                    <p className="text-[12px] text-slate-400 mt-0.5">{editingAuthor.name} · {editingAuthor.case_count} 篇案例</p>
                  </div>
                  <button onClick={() => { setEditingAuthor(null); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold text-slate-400 uppercase">姓名</label><input type="text" value={form.real_name} onChange={e => setForm({ ...form, real_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold text-slate-400 uppercase">邮箱</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">新密码（留空不修改）</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="≥8位" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">角色</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">{ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">所属部门</label><input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">所属机构</label><input type="text" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-400 uppercase">电话</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => { setEditingAuthor(null); resetForm(); }} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">取消</button>
                  <button onClick={handleEdit} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all disabled:opacity-50">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : <><Check className="w-4 h-4" />保存修改</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAuthors;
