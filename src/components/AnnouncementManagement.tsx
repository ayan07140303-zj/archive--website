import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Edit3, Trash2, Eye, FileText,
  Download, Loader2, AlertCircle, X, RefreshCw, CheckCircle2, Trash2Icon
} from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['通知公告', '政务发布', '技术成果', '标准规范', '国务院', '基础建设', '合规审计'];

const AnnouncementManagement: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const [form, setForm] = useState({ title: '', category: '通知公告', content: '', source: '', published_at: new Date().toISOString().slice(0, 10) });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchList = (p?: number) => {
    const targetPage = p ?? 1;
    setPage(targetPage);
    setLoading(true);
    const params = new URLSearchParams();
    if (catFilter) params.set('category', catFilter);
    if (search) params.set('search', search);
    params.set('page', String(targetPage));
    params.set('pageSize', String(PAGE_SIZE));
    api.get(`/admin/announcements?${params.toString()}`).then(r => {
      if (r.success) {
        setList(r.data || []);
        if (r.pagination) {
          const tp = r.pagination.totalPages || 1;
          setTotalPages(tp);
          setTotal(r.pagination.total);
          // 当前页超出最大页数时回退到最后一页
          if (targetPage > tp) setPage(tp);
        }
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(1); }, [catFilter]);

  const resetForm = () => {
    setForm({ title: '', category: '通知公告', content: '', source: '', published_at: new Date().toISOString().slice(0, 10) });
    setSelectedFiles([]); setError('');
  };

  const openCreate = () => { resetForm(); setEditing(null); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title: item.title || '', category: item.category || '通知公告', content: item.content || '',
      source: item.source || '', published_at: item.published_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    });
    setSelectedFiles([]); setError(''); setShowModal(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('category', form.category);
    fd.append('content', form.content);
    fd.append('source', form.source);
    fd.append('published_at', form.published_at);
    fd.append('is_active', 'true');
    selectedFiles.forEach(f => fd.append('attachments', f));
    return fd;
  };

  const handleSubmit = async () => {
    if (!form.title) { setError('标题为必填项'); return; }
    setSaving(true); setError('');
    try {
      const fd = buildFormData();
      if (editing) {
        await api.uploadForm(`/admin/announcements/${editing.id}`, fd, 'PUT');
        showToast('success', '修改成功');
      } else {
        await api.uploadForm('/admin/announcements', fd, 'POST');
        showToast('success', '发布成功');
      }
      setShowModal(false); fetchList();
    } catch (e: any) { setError(e.message || '操作失败'); showToast('error', '操作失败'); }
    finally { setSaving(false); }
  };

  const handleRemoveAllAttachments = async (id: string) => {
    if (!confirm('确定删除该公告的所有附件？')) return;
    try {
      await api.delete(`/admin/announcements/${id}/attachment`);
      showToast('success', '所有附件已移除');
      fetchList();
      if (editing?.id === id) setEditing({ ...editing, attachment_url: null, attachment_name: null, attachments: [] });
    } catch (e: any) { showToast('error', '移除失败'); }
  };

  const handleRemoveSingleAttachment = async (annId: string, index: number) => {
    try {
      await api.delete(`/admin/announcements/${annId}/attachment/${index}`);
      showToast('success', `已删除第 ${index + 1} 个附件`);
      fetchList();
      // 更新弹窗内 editing 状态
      if (editing?.id === annId) {
        const a = await api.get(`/portal/announcements/${annId}`);
        if (a.success) setEditing(a.data);
      }
    } catch (e: any) { showToast('error', '删除失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该公告？')) return;
    try { await api.delete(`/admin/announcements/${id}`); fetchList(); showToast('success', '公告已删除'); }
    catch (e: any) { alert(e.message); }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-bold"
            style={{ background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2', color: toast.type === 'success' ? '#065f46' : '#991b1b', border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
            <CheckCircle2 className="w-5 h-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">公告管理</h1>
          <p className="text-on-secondary-container mt-1">发布、编辑和管理平台通知公告及附件</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchList()} className="p-2.5 border border-outline-variant rounded-xl hover:bg-surface-container text-outline transition-colors"><RefreshCw className="w-5 h-5" /></button>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> 新建公告
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="搜索标题或正文..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchList(1)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
          <option value="">全部分类</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <button onClick={() => fetchList(1)} className="px-4 py-2 bg-[#0052cc] text-white rounded-xl text-sm font-bold">搜索</button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-on-secondary-container text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">标题</th><th className="px-6 py-4">分类</th><th className="px-6 py-4">日期</th><th className="px-6 py-4">附件</th><th className="px-6 py-4 text-right">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={5} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc] mx-auto" /></td></tr>}
              {!loading && list.length === 0 && <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">暂无公告</td></tr>}
              {!loading && list.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4"><p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{item.title}</p></td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">{item.category}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.published_at?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const atts = (Array.isArray(item.attachments) && item.attachments.length > 0) ? item.attachments : (item.attachment_url ? [{ name: item.attachment_name || '附件', url: item.attachment_url }] : []);
                      if (atts.length === 0) return <span className="text-slate-300">—</span>;
                      return (
                        <div className="space-y-1">
                          {atts.map((a: any, idx: number) => (
                            <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer" title={a.name}
                              className="flex items-center gap-1.5 text-xs text-[#0052cc] hover:underline">
                              <Download className="w-3 h-3" />{a.name}{a.size ? ` (${formatSize(a.size)})` : ''}
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/announcement/${item.id}`)} title="预览" className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(item)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-[#0052cc] rounded-lg"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination — 始终显示 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-white">
          <span className="text-xs text-slate-400">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => fetchList(1)} disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">首页</button>
            <button onClick={() => fetchList(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">上一页</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let start = Math.max(1, page - 3);
              let end = Math.min(totalPages, start + 6);
              if (end - start < 6) start = Math.max(1, end - 6);
              const pn = start + i;
              if (pn > end) return null;
              return (
                <button key={pn} onClick={() => fetchList(pn)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                    pn === page ? 'bg-[#0052cc] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                  }`}>{pn}</button>
              );
            })}
            <button onClick={() => fetchList(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">下一页</button>
            <button onClick={() => fetchList(totalPages)} disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">末页</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold">{editing ? '编辑公告' : '新建公告'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">标题 *</label>
                  <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">分类</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">发布日期</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.published_at} onChange={e => setForm({ ...form, published_at: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">来源</label>
                  <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="如：国家档案局" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">正文（支持 HTML）</label>
                  <textarea rows={10} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">附件 <span className="text-slate-300 font-normal">（可选，支持多文件）</span></label>
                  {editing && (() => {
                    const existing = (editing.attachments && Array.isArray(editing.attachments) && editing.attachments.length > 0) ? editing.attachments
                      : (editing.attachment_url ? [{ name: editing.attachment_name || '附件', url: editing.attachment_url }] : []);
                    if (existing.length === 0) return null;
                    return (
                      <div className="mb-2 space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">已有附件 ({existing.length})</p>
                        {existing.map((a: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between group/att">
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#0052cc] hover:underline min-w-0">
                              <FileText className="w-3 h-3 shrink-0" /><span className="truncate max-w-[300px]">{a.name}</span>
                            </a>
                            <button onClick={() => handleRemoveSingleAttachment(editing.id, idx)}
                              className="text-slate-300 hover:text-red-400 transition-colors shrink-0 ml-2 opacity-0 group-hover/att:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => handleRemoveAllAttachments(editing.id)}
                          className="text-[10px] font-bold text-red-400 hover:text-red-600 mt-2">移除所有附件</button>
                      </div>
                    );
                  })()}
                  <input type="file" multiple accept=".pdf,.doc,.docx"
                    onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#0052cc]/10 file:text-[#0052cc] hover:file:bg-[#0052cc]/20" />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <FileText className="w-3 h-3" />{f.name} ({(f.size / 1024).toFixed(0)}KB)
                          <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="ml-auto text-emerald-400 hover:text-red-400"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">可同时选择多个文件，不选则仅保存文字公告</p>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl">取消</button>
                <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</> : (editing ? '保存修改' : '发布公告')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementManagement;
