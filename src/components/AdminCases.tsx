import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Edit3, Trash2, Save, X, Loader2, RefreshCw, Check, CheckSquare, Square, ChevronDown, Eye, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/client';
import CaseManagementModal from './CaseManagementModal';

const TOPIC_FIELDS = ['政治建设','经济建设','社会建设','文化建设','生态文明','法治建设','科技创新','应急管理'];
const ACHIEVEMENTS = ['专题编研成果','定向报送材料','品牌化资政产品','资政服务案例','创新实践案例'];
const AUDIENCES = ['党政领导','决策部门','基层单位','社会公众'];
const CONSULT_FORMS = ['专报','内参','编研成果','展览展示','新媒体产品','数据库/平台'];
const STATUS_OPTIONS = ['open','pending','completed','archived','flagged'];
const STATUS_LABELS: Record<string,string> = { open:'已开放',pending:'审核中',completed:'已完结',archived:'已归档',flagged:'异常标记' };
const STATUS_COLORS: Record<string,string> = {
  open:'bg-blue-50 text-blue-600', pending:'bg-amber-50 text-amber-600',
  completed:'bg-emerald-50 text-emerald-600', archived:'bg-slate-100 text-slate-400', flagged:'bg-red-50 text-red-600'
};
const STATUS_MEANING: Record<string,string> = {
  open:'案例已发布，前台可见', pending:'提交审核中，仅管理员可见',
  completed:'案例已完成全部流程并归档，前台可见', archived:'从展示区移除，仅后台归档留存',
  flagged:'内容异常或需整改，暂不对外展示'
};

const AdminCases: React.FC = () => {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [achievementFilter, setAchievementFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAchievement, setEditAchievement] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [editForm, setEditForm] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editTopicFilter, setEditTopicFilter] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const fetchData = (p?: number) => {
    const targetPage = p ?? 1; setPage(targetPage); setLoading(true);
    const params = new URLSearchParams();
    if (catFilter) params.set('category', catFilter);
    if (editTopicFilter) params.set('topic_id', editTopicFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (achievementFilter) params.set('achievement_type', achievementFilter);
    if (audienceFilter) params.set('target_audience', audienceFilter);
    if (formFilter) params.set('consulting_form', formFilter);
    if (search) params.set('search', search);
    params.set('page', String(targetPage)); params.set('pageSize', String(PAGE_SIZE));
    api.get(`/cases?${params.toString()}`).then(r => {
      if (r.success) { setCasesList(r.data || []); if (r.pagination) { setTotal(r.pagination.total); setTotalPages(r.pagination.totalPages); } }
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(1); }, [catFilter, statusFilter, achievementFilter, audienceFilter, formFilter, editTopicFilter]);
  useEffect(() => { api.get('/library/topics').then(r => { if (r.success) setTopics(r.data || []); }); fetchData(1); }, []);

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const startEdit = (c: any) => {
    setEditingId(c.id); setEditTitle(c.title); setEditCategory(c.category);
    setEditAchievement(c.achievement_type||''); setEditAudience(c.target_audience||'');
    setEditForm(c.consulting_form||''); setEditStatus(c.status);
    setEditDescription(c.description||''); setEditTopicId(c.topic_id||'');
  };
  const handleSave = async (id: string) => {
    try {
      const updates = { title: editTitle, category: editCategory, topic_id: editTopicId || null, achievement_type: editAchievement, target_audience: editAudience, consulting_form: editForm, status: editStatus, description: editDescription };
      const res = await api.put(`/cases/${id}`, updates);
      if (!res.success) { showMsg('保存失败'); return; }
      setCasesList(prev => prev.map(c => c.id === id ? (res.data as any) : c));
      setEditingId(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string) => { if (!confirm('确定删除？')) return; try { await api.delete(`/cases/${id}`); setCasesList(prev => prev.filter(c => c.id !== id)); showMsg('已删除'); } catch (e: any) { alert(e.message); } };
  const handleStatusChange = async (id: string, status: string) => {
    try { const res = await api.put(`/cases/${id}`, { status }); if (res.success) { setCasesList(prev => prev.map(c => c.id === id ? { ...c, status } : c)); showMsg(`状态已改为${STATUS_LABELS[status]}`); } } catch (e: any) { alert(e.message); }
  };
  const handleViewDetail = async (id: string) => { setDetailLoading(true); const r = await api.get(`/cases/${id}`); if (r.success) setDetail(r.data); else setDetail(null); setDetailLoading(false); };

  // 文件管理弹窗
  const [fileManageId, setFileManageId] = useState<string | null>(null);
  const [fileManageFiles, setFileManageFiles] = useState<any[]>([]);
  const [fileManagePending, setFileManagePending] = useState<File[]>([]);
  const [fileManageSubmitting, setFileManageSubmitting] = useState(false);

  const openFileManager = async (caseId: string) => {
    setFileManageId(caseId); setFileManagePending([]);
    const r = await api.get(`/cases/${caseId}`);
    if (r.success) setFileManageFiles((r.data as any).files || []);
  };
  const handleFileUpload = async () => {
    if (!fileManageId || fileManagePending.length === 0) return;
    setFileManageSubmitting(true);
    try {
      await api.upload(`/cases/${fileManageId}/files`, fileManagePending);
      setFileManagePending([]);
      const r = await api.get(`/cases/${fileManageId}`);
      if (r.success) setFileManageFiles((r.data as any).files || []);
    } catch (e: any) { alert(e.message); } finally { setFileManageSubmitting(false); }
  };
  const handleFileDelete = async (fileId: string) => {
    if (!fileManageId) return;
    try {
      await api.delete(`/cases/${fileManageId}/files/${fileId}`);
      setFileManageFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (e: any) { alert(e.message); }
  };

  const toggleSelect = (id: string) => { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next); };
  const toggleAll = () => { if (selectAll) { setSelected(new Set()); setSelectAll(false); } else { setSelected(new Set(casesList.map(c=>c.id))); setSelectAll(true); } };
  const batchDelete = async () => {
    if (selected.size===0) return; if (!confirm(`确定删除选中的 ${selected.size} 个案例？`)) return;
    let done = 0; for (const id of selected) { try { await api.delete(`/cases/${id}`); done++; } catch {} }
    setCasesList(prev => prev.filter(c => !selected.has(c.id))); setSelected(new Set()); setSelectAll(false); showMsg(`已删除 ${done} 个案例`);
  };
  const batchSetStatus = async (status: string) => {
    if (selected.size===0) return; if (!confirm(`将选中的 ${selected.size} 个案例状态改为"${STATUS_LABELS[status]}"？`)) return;
    let done = 0; for (const id of selected) { try { await api.put(`/cases/${id}`, { status }); done++; } catch {} }
    setCasesList(prev => prev.map(c => selected.has(c.id) ? { ...c, status } : c)); setSelected(new Set()); setSelectAll(false); showMsg(`已更新 ${done} 个案例`);
  };

  const tagStyle = "px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap";

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto relative">
      {toast && <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="fixed top-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-4 h-4 inline mr-2"/>{toast}</motion.div>}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold text-on-surface">案例管理</h1><p className="text-on-secondary-container mt-1 text-sm">管理全部案例及四维分类 | 状态标签含义见下方筛选栏</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchData(page)} className="p-2.5 border rounded-xl hover:bg-slate-50"><RefreshCw className="w-5 h-5" /></button>
          <button onClick={()=>setModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"><Plus className="w-4 h-4"/>新建案例</button>
        </div>
      </header>

      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-blue-700">已选 {selected.size} 项</span>
          <div className="flex items-center gap-3">
            <div className="relative group/status"><button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-100 transition-colors">批量改状态 <ChevronDown className="w-3 h-3"/></button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 hidden group-hover/status:block z-30 whitespace-nowrap">{STATUS_OPTIONS.map(s=><button key={s} onClick={()=>batchSetStatus(s)} className="block w-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg text-left">{STATUS_LABELS[s]}</button>)}</div></div>
            <button onClick={batchDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"><Trash2 className="w-3 h-3"/>批量删除</button>
            <button onClick={()=>{setSelected(new Set());setSelectAll(false);}} className="text-xs text-slate-400 hover:text-slate-600">取消选择</button>
          </div>
        </div>
      )}

      {/* 四维筛选栏 */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type="text" placeholder="搜索编号/标题…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchData(1)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"/></div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"><option value="">全部状态</option>{STATUS_OPTIONS.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
          <button onClick={()=>fetchData(1)} className="px-4 py-2 bg-[#0052cc] text-white rounded-xl text-sm font-bold">搜索</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase">主题领域:</span>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"><option value="">全部</option>{TOPIC_FIELDS.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <span className="text-[10px] font-bold text-slate-400 uppercase">专题案例库:</span>
          <select value={editTopicFilter} onChange={e=>setEditTopicFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"><option value="">全部</option>{topics.map((t:any)=><option key={t.id} value={t.id}>{t.title}</option>)}</select>
          <span className="text-[10px] font-bold text-slate-400 uppercase">成果类型:</span>
          <select value={achievementFilter} onChange={e=>setAchievementFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"><option value="">全部</option>{ACHIEVEMENTS.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <span className="text-[10px] font-bold text-slate-400 uppercase">服务对象:</span>
          <select value={audienceFilter} onChange={e=>setAudienceFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"><option value="">全部</option>{AUDIENCES.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <span className="text-[10px] font-bold text-slate-400 uppercase">资政形式:</span>
          <select value={formFilter} onChange={e=>setFormFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"><option value="">全部</option>{CONSULT_FORMS.map(c=><option key={c} value={c}>{c}</option>)}</select>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
          <th className="px-4 py-4 w-10"><button onClick={toggleAll} className="p-1">{selectAll ? <CheckSquare className="w-4 h-4 text-[#0052cc]"/> : <Square className="w-4 h-4 text-slate-300"/>}</button></th>
          <th className="px-4 py-4">编号</th><th className="px-4 py-4 min-w-[160px]">标题</th>
          <th className="px-4 py-4 whitespace-nowrap">四维分类</th><th className="px-4 py-4">状态</th><th className="px-4 py-4">日期</th><th className="px-4 py-4 text-right">操作</th>
        </tr></thead><tbody className="divide-y divide-slate-50">
          {loading && <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc] mx-auto"/></td></tr>}
          {!loading && casesList.length===0 && <tr><td colSpan={7} className="py-20 text-center text-slate-400">暂无案例</td></tr>}
          {!loading && casesList.map((c,i)=>(
            <motion.tr key={c.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
              className={cn("hover:bg-slate-50/50 group", selected.has(c.id) && "bg-blue-50/50")}>
              <td className="px-4 py-4"><button onClick={()=>toggleSelect(c.id)} className="p-1">{selected.has(c.id) ? <CheckSquare className="w-4 h-4 text-[#0052cc]"/> : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400"/>}</button></td>
              <td className="px-4 py-4"><span className="text-[11px] font-mono font-bold text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded">{c.case_number}</span></td>
              <td className="px-4 py-4">
                {editingId===c.id
                  ? <input autoFocus className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm outline-none" value={editTitle} onChange={e=>setEditTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSave(c.id);if(e.key==='Escape')setEditingId(null);}} />
                  : <p className="text-sm font-bold text-slate-800 line-clamp-1">{c.title}</p>}
              </td>
              <td className="px-4 py-4">
                {editingId===c.id ? (
                  <div className="space-y-1.5 max-w-[340px]">
                    <select className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs w-full" value={editCategory} onChange={e=>setEditCategory(e.target.value)}>{TOPIC_FIELDS.map(t=><option key={t} value={t}>{t}</option>)}</select>
                    <select className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs w-full" value={editAchievement} onChange={e=>setEditAchievement(e.target.value)}><option value="">成果类型</option>{ACHIEVEMENTS.map(t=><option key={t} value={t}>{t}</option>)}</select>
                    <select className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs w-full" value={editAudience} onChange={e=>setEditAudience(e.target.value)}><option value="">服务对象</option>{AUDIENCES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                    <select className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs w-full" value={editForm} onChange={e=>setEditForm(e.target.value)}><option value="">资政形式</option>{CONSULT_FORMS.map(t=><option key={t} value={t}>{t}</option>)}</select>
                    {<select className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs w-full" value={editTopicId} onChange={e=>setEditTopicId(e.target.value)}><option value="">关联专题（可选）</option>{topics.map((t:any)=><option key={t.id} value={t.id}>{t.title}</option>)}</select>}
                    <textarea className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs w-full h-14 resize-y outline-none focus:ring-2 focus:ring-blue-500/10"
                      value={editDescription} onChange={e=>setEditDescription(e.target.value)}
                      placeholder="案例摘要（可选）…" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {c.category && <span className={cn(tagStyle, "bg-blue-50 text-blue-600")}>{c.category}</span>}
                    {c.achievement_type && <span className={cn(tagStyle, "bg-emerald-50 text-emerald-600")}>{c.achievement_type}</span>}
                    {c.target_audience && <span className={cn(tagStyle, "bg-purple-50 text-purple-600")}>{c.target_audience}</span>}
                    {c.consulting_form && <span className={cn(tagStyle, "bg-amber-50 text-amber-600")}>{c.consulting_form}</span>}
                    {c.topic_id && (topics.find(t=>t.id===c.topic_id)?.title) && <span className={cn(tagStyle, "bg-sky-50 text-sky-600")} title={topics.find(t=>t.id===c.topic_id)?.title}>专题: {topics.find(t=>t.id===c.topic_id)?.title.slice(0, 8)}</span>}
                    {!c.category && !c.achievement_type && !c.target_audience && !c.consulting_form && <span className="text-slate-300 text-xs">未分类</span>}
                  </div>
                )}
              </td>
              <td className="px-4 py-4">
                {editingId===c.id ? (
                  <select className="bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs" value={editStatus} onChange={e=>setEditStatus(e.target.value)}>{STATUS_OPTIONS.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
                ) : (
                  <div className="relative group/status">
                    <button className={cn("text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer", STATUS_COLORS[c.status] || 'bg-slate-50 text-slate-500')} title={STATUS_MEANING[c.status]||''}>{STATUS_LABELS[c.status] || c.status}</button>
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 hidden group-hover/status:block z-20 whitespace-nowrap">
                      {STATUS_OPTIONS.filter(s=>s!==c.status).map(s=><button key={s} onClick={()=>handleStatusChange(c.id,s)} className="block w-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg text-left">{STATUS_LABELS[s]}</button>)}</div>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-xs text-slate-500">{c.created_at?.slice(0,10)}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                  {editingId===c.id ? <><button onClick={()=>handleSave(c.id)} className="p-2 bg-emerald-500 text-white rounded-lg"><Save className="w-3.5 h-3.5"/></button><button onClick={()=>setEditingId(null)} className="p-2 bg-slate-200 rounded-lg"><X className="w-3.5 h-3.5"/></button></> : <><button onClick={()=>handleViewDetail(c.id)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"><Eye className="w-4 h-4"/></button><button onClick={()=>startEdit(c)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-[#0052cc] rounded-lg"><Edit3 className="w-4 h-4"/></button><button onClick={()=>openFileManager(c.id)} className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg" title="管理文件"><FileText className="w-4 h-4"/></button><button onClick={()=>handleDelete(c.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4"/></button></>}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody></table></div>
        {totalPages>0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50"><span className="text-xs text-slate-400">共 {total} 条，第 {page}/{totalPages} 页</span>
            <div className="flex items-center gap-1.5"><button onClick={()=>fetchData(1)} disabled={page<=1} className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-30">首页</button><button onClick={()=>fetchData(page-1)} disabled={page<=1} className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-30">上一页</button>{Array.from({length:Math.min(totalPages,7)},(_,i)=>{let s=Math.max(1,page-3);let e=Math.min(totalPages,s+6);if(e-s<6)s=Math.max(1,e-6);const pn=s+i;if(pn>e)return null;return <button key={pn} onClick={()=>fetchData(pn)} className={`w-8 h-8 text-xs font-bold rounded-lg ${pn===page?'bg-[#0052cc] text-white':'text-slate-500 hover:bg-slate-100'}`}>{pn}</button>;})}<button onClick={()=>fetchData(page+1)} disabled={page>=totalPages} className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-30">下一页</button><button onClick={()=>fetchData(totalPages)} disabled={page>=totalPages} className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-30">末页</button></div></div>)}
      </div>

      {/* 详情弹窗 */}
      {detailLoading && <div className="fixed inset-0 z-[120] bg-black/20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc]"/></div>}
      {detail && !detailLoading && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={()=>setDetail(null)}/>
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h3 className="text-lg font-bold">案例详情</h3><button onClick={()=>setDetail(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5"/></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase">案件编号</p><p className="text-sm font-mono font-bold text-[#0052cc]">{detail.case_number}</p></div>
              <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase">标题</p><p className="text-base font-extrabold text-slate-900">{detail.title}</p></div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['主题领域', detail.category],
                  ['成果类型', detail.achievement_type],
                  ['服务对象', detail.target_audience],
                  ['资政形式', detail.consulting_form],
                  ['关联专题', topics.find(t=>t.id===detail.topic_id)?.title || '未关联'],
                  ['状态', STATUS_LABELS[detail.status]],
                  ['优先级', detail.priority==='high'?'高':detail.priority==='medium'?'中':'低'],
                  ['创建日期', detail.created_at?.slice(0,10)],
                  ['更新日期', detail.updated_at?.slice(0,10) || detail.created_at?.slice(0,10)],
                ].map(([label,value]) => (
                  <div key={label as string} className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p><p className="text-sm font-bold text-slate-700">{value||'—'}</p></div>
                ))}
              </div>
              {detail.description && <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase">案例摘要</p><p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3">{detail.description}</p></div>}
              {(detail.files||[]).length>0 && <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase">附件 ({(detail.files||[]).length}个)</p><div className="space-y-1.5">{(detail.files||[]).map((f:any)=><a key={f.id} href={f.storage_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0052cc] hover:underline"><FileText className="w-4 h-4"/>{f.file_name} <span className="text-slate-400 text-xs">{f.file_size>0?Math.round(f.file_size/1024)+'KB':''}</span></a>)}</div></div>}
              <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase">状态说明</p><p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">{STATUS_MEANING[detail.status]||''}</p></div>
            </div>
          </motion.div>
        </div>
      )}
      {/* 文件管理弹窗 */}
      {fileManageId && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={()=>setFileManageId(null)}/>
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h3 className="text-lg font-bold">文件管理</h3><button onClick={()=>setFileManageId(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5"/></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-3">
                <input type="file" multiple onChange={e => { if (e.target.files) setFileManagePending(prev => [...prev, ...Array.from(e.target.files!)]); (e.target as any).value = ''; }}
                  className="text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0052cc]/10 file:text-[#0052cc] hover:file:bg-[#0052cc]/20" />
                {fileManagePending.length > 0 && (
                  <button onClick={handleFileUpload} disabled={fileManageSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0052cc] text-white rounded-lg text-xs font-bold hover:bg-[#0747a6] transition-colors disabled:opacity-50">
                    <Plus className="w-3.5 h-3.5"/>{fileManageSubmitting?'上传中...':`上传 (${fileManagePending.length})`}</button>
                )}
              </div>
              {fileManagePending.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fileManagePending.map((f,i)=>(
                    <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-amber-700 text-xs font-bold">
                      <FileText className="w-3 h-3"/>{f.name}
                      <button onClick={()=>setFileManagePending(prev=>prev.filter((_,idx)=>idx!==i))}><X className="w-3 h-3 text-amber-400 hover:text-amber-600"/></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-50 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">现有文件 ({fileManageFiles.length})</p>
                {fileManageFiles.length===0 ? <p className="text-sm text-slate-300">暂无文件</p> : (
                  <div className="space-y-2">
                    {fileManageFiles.map(f=>(
                      <div key={f.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                        <a href={f.storage_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0052cc] hover:underline min-w-0">
                          <FileText className="w-4 h-4 shrink-0"/><span className="truncate max-w-[250px]">{f.file_name}</span>
                          <span className="text-slate-400 text-xs shrink-0">{f.file_size>0?Math.round(f.file_size/1024)+'KB':''}</span>
                        </a>
                        <button onClick={()=>handleFileDelete(f.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <CaseManagementModal isOpen={modalOpen} onClose={() => { setModalOpen(false); fetchData(page); }} />
    </div>
  );
};

export default AdminCases;
