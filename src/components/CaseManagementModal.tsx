import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Search, Trash2, Edit2, Save,
  FileText, AlertCircle, FileCheck, Loader2, Download, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/client';
import FileUploadZone from './FileUploadZone';

interface CaseFile {
  id: string;
  file_name: string;
  original_name?: string;
  file_size: number;
  file_type: string;
  storage_url: string;
}
interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  files?: CaseFile[];
}
interface CaseManagementModalProps { isOpen: boolean; onClose: () => void; }

const CATEGORIES = ['全部领域', '机构', '法律', '运营', '人员'];
const STATUSES = ['open', 'pending', 'completed', 'archived', 'flagged'];
const PRIORITIES = ['low', 'medium', 'high'];

const CaseManagementModal: React.FC<CaseManagementModalProps> = ({ isOpen, onClose }) => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [newCase, setNewCase] = useState({ title: '', category: '政治建设', achievement_type: '资政服务案例', target_audience: '党政领导', consulting_form: '专报', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [casePendingFiles, setCasePendingFiles] = useState<Map<string, File[]>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [editAchievement, setEditAchievement] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [editForm, setEditForm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([api.get('/cases'), api.get('/library/topics')])
        .then(([cr, tr]) => {
          if (cr.success) setCases(cr.data || []);
          if (tr.success) setTopics(tr.data || []);
        }).finally(() => setLoading(false));
    }
  }, [isOpen]);

  const refreshList = () => {
    api.get('/cases').then(r => { if (r.success) setCases(r.data || []); });
  };

  const onFilesSelected = (files: File[]) => setPendingFiles(prev => [...prev, ...files]);

  const handleCreate = async () => {
    if (!newCase.title) { setError('请输入案卷标题'); return; }
    setError(''); setSubmitting(true);
    try {
      const res = await api.post('/cases', { title: newCase.title, category: newCase.category, topic_id: topicId || undefined, achievement_type: newCase.achievement_type, target_audience: newCase.target_audience, consulting_form: newCase.consulting_form, description: newCase.description });
      if (!res.success) throw new Error('创建失败');
      const created = (res.data as any) as CaseItem;
      if (pendingFiles.length > 0) {
        await api.upload(`/cases/${created.id}/files`, pendingFiles, topicId ? { topic_id: topicId } : undefined);
      }
      refreshList(); setNewCase({ title: '', category: '政治建设', achievement_type: '资政服务案例', target_audience: '党政领导', consulting_form: '专报', description: '' }); setPendingFiles([]); setTopicId(''); setIsCreating(false);
    } catch (e: any) { setError(e.message || '创建失败'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该案卷及其所有文件？')) return;
    try { await api.delete(`/cases/${id}`); refreshList(); } catch (e: any) { alert(e.message); }
  };

  const startEdit = (item: CaseItem) => {
    setEditingId(item.id); setEditTitle(item.title); setEditCategory(item.category);
    setEditStatus(item.status); setEditPriority(item.priority);
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/cases/${id}`, { title: editTitle, category: editCategory, status: editStatus, priority: editPriority });
      setEditingId(null); refreshList();
    } catch (e: any) { alert(e.message); }
  };

  const handleFileUploadForCase = async (caseId: string) => {
    const files = casePendingFiles.get(caseId) || [];
    if (files.length === 0) return;
    setSubmitting(true);
    try {
      await api.upload(`/cases/${caseId}/files`, files);
      const next = new Map(casePendingFiles); next.delete(caseId); setCasePendingFiles(next);
      refreshList();
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  const handleFileDeleteForCase = async (caseId: string, fileId: string) => {
    try { await api.delete(`/cases/${caseId}/files/${fileId}`); refreshList(); } catch (e: any) { alert(e.message); }
  };

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const statusLabel = (s: string) => ({ open: '开放', pending: '进行中', completed: '已完成', flagged: '异常', archived: '已归档' } as any)[s] || s;
  const priorityLabel = (p: string) => ({ low: '低', medium: '中', high: '高' } as any)[p] || p;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0052cc] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><FileText className="w-5 h-5" /></div>
                <div><h2 className="text-xl font-bold text-slate-900">案卷中心管理</h2><p className="text-xs text-slate-500">档案资政 · 案例文件增删改查</p></div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-6 bg-white border-b border-slate-50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="搜索案卷名称或编号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-[#0052cc] transition-all text-sm" />
                  </div>
                  <button onClick={() => { setIsCreating(!isCreating); setEditingId(null); }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all shadow-lg active:scale-95">
                    <Plus className={cn("w-4 h-4 transition-transform", isCreating && "rotate-45")} />
                    {isCreating ? '取消创建' : '新建报送案卷'}
                  </button>
                </div>

                <AnimatePresence>
                  {isCreating && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="p-6 bg-slate-50 rounded-2xl border border-blue-100 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">案卷标题</label>
                          <input type="text" placeholder="输入案卷正式名称..." value={newCase.title} onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm" /></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">主题领域</label>
                          <select value={newCase.category} onChange={e => setNewCase({ ...newCase, category: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm appearance-none">
                            {['政治建设','经济建设','社会建设','文化建设','生态文明','法治建设','科技创新','应急管理'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">成果类型</label>
                          <select value={newCase.achievement_type} onChange={e => setNewCase({ ...newCase, achievement_type: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm appearance-none">
                            {['专题编研成果','定向报送材料','品牌化资政产品','资政服务案例','创新实践案例'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">服务对象</label>
                          <select value={newCase.target_audience} onChange={e => setNewCase({ ...newCase, target_audience: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm appearance-none">
                            {['党政领导','决策部门','基层单位','社会公众'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">资政形式</label>
                          <select value={newCase.consulting_form} onChange={e => setNewCase({ ...newCase, consulting_form: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm appearance-none">
                            {['专报','内参','编研成果','展览展示','新媒体产品','数据库/平台'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">案例摘要<span className="text-slate-300">（可选）</span></label>
                          <textarea
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm resize-y h-12"
                            placeholder="简述案例背景、主要内容与研究价值…"
                            onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                          /></div>
                      </div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">关联专题（上传后同步到专题案例库）</label>
                        <select value={topicId} onChange={e => setTopicId(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#0052cc] outline-none shadow-sm appearance-none">
                          <option value="">不关联（仅案卷）</option>
                          {topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">档案文件上传</label>
                        <FileUploadZone onFilesSelected={onFilesSelected} />
                        {pendingFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {pendingFiles.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-bold">
                                <FileCheck className="w-3.5 h-3.5" />{f.name}
                                <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3.5 h-3.5 text-emerald-400 hover:text-emerald-600" /></button>
                              </div>))}
                          </div>)}</div>
                      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => { setIsCreating(false); setError(''); }} className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-all">取消</button>
                        <button onClick={handleCreate} disabled={submitting}
                          className="px-8 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">
                          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 提交中...</> : '确认并提交报送'}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 space-y-4">
                {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" /></div>}
                {!loading && filteredCases.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4"><AlertCircle className="w-12 h-12 opacity-20" /><p>未找到相关案卷记录</p></div>)}
                {!loading && filteredCases.map(item => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="group bg-slate-50/50 hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#0052cc] group-hover:border-blue-100 transition-all shrink-0"><FileText className="w-6 h-6" /></div>
                      <div className="flex-1 min-w-0">
                        {editingId === item.id ? (
                          <div className="space-y-3">
                            <input className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                            <div className="grid grid-cols-3 gap-2">
                              <select className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={editCategory} onChange={e => setEditCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                              <select className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={editStatus} onChange={e => setEditStatus(e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select>
                              <select className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={editPriority} onChange={e => setEditPriority(e.target.value)}>{PRIORITIES.map(p=><option key={p} value={p}>{priorityLabel(p)}</option>)}</select>
                            </div>
                            <div className="flex gap-2"><button onClick={() => handleUpdate(item.id)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold"><Save className="w-3.5 h-3.5 inline mr-1" />保存</button><button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">取消</button></div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded">{item.case_number}</span>
                              <span className="text-[10px] font-bold text-slate-400">{item.category}</span>
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", item.status === 'open' ? 'bg-blue-50 text-blue-600' : item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>{statusLabel(item.status)}</span>
                              <span className="text-[10px] text-slate-400">{priorityLabel(item.priority)}优先级</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(item.created_at).toLocaleDateString('zh-CN')}</div>

                            {/* 文件管理区域 */}
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">文件 ({item.files?.length || 0})</span>
                                <div className="flex items-center gap-2">
                                  <input type="file" multiple onChange={e => {
                                    if (!e.target.files || e.target.files.length === 0) return;
                                    const newFiles = Array.from(e.target.files);
                                    setCasePendingFiles(prev => { const next = new Map(prev); next.set(item.id, [...(next.get(item.id)||[]), ...newFiles]); return next; });
                                    (e.target as any).value = '';
                                  }} className="hidden" id={`file-upload-${item.id}`} />
                                  <label htmlFor={`file-upload-${item.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0052cc]/10 text-[#0052cc] hover:bg-[#0052cc]/20 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                                    <Plus className="w-3 h-3" />添加文件
                                  </label>
                                  {(casePendingFiles.get(item.id) || []).length > 0 && (
                                    <button onClick={() => handleFileUploadForCase(item.id)} disabled={submitting}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0052cc] text-white rounded-lg text-[11px] font-bold hover:bg-[#0747a6] transition-colors disabled:opacity-50">
                                      {submitting ? '上传中...' : `上传 (${(casePendingFiles.get(item.id) || []).length})`}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {item.files && item.files.length > 0 ? item.files.map(f => (
                                <div key={f.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 border border-slate-100">
                                  <a href={f.storage_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#0052cc] hover:underline min-w-0">
                                    <FileCheck className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[250px]">{f.file_name}</span>
                                    <span className="text-slate-400 shrink-0">{formatSize(f.file_size)}</span>
                                  </a>
                                  <button onClick={() => handleFileDeleteForCase(item.id, f.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-2" title="删除此文件">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )) : <p className="text-[11px] text-slate-300">暂无文件</p>}
                              {(casePendingFiles.get(item.id) || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {(casePendingFiles.get(item.id) || []).map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg text-amber-700 text-xs font-bold">
                                      <FileText className="w-3 h-3" />{f.name}
                                      <button onClick={() => { setCasePendingFiles(prev => { const next = new Map(prev); const arr = next.get(item.id)||[]; arr.splice(i,1); next.set(item.id, arr); return next; }); }}><X className="w-3 h-3 text-amber-400 hover:text-amber-600" /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {editingId !== item.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEdit(item)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-[#0052cc] rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400">
              <div className="flex gap-6"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>就绪</div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div>案卷总数：{cases.length}</div></div>
              <p>© 2024 档案资政管理系统</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CaseManagementModal;
