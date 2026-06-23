import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Clock, CheckCircle2, XCircle, FileText, Trash2, Eye, MessageSquare, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { api } from '../api/client';

interface Submission {
  id: string;
  title: string;
  category: string;
  achievement_type: string | null;
  target_audience: string | null;
  consulting_form: string | null;
  description: string | null;
  author: string | null;
  organization: string | null;
  status: 'pending' | 'approved' | 'rejected';
  attachments: { name: string; url: string; size: number }[];
  reviewer_notes: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const statusMeta = {
  pending:   { label: '审核中',   icon: Clock,         color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  approved:  { label: '已通过',   icon: CheckCircle2,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  rejected:  { label: '已退回',   icon: XCircle,       color: 'text-red-600 bg-red-50 border-red-200', dot: 'bg-red-500' },
};

const MySubmissions: React.FC = () => {
  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get<any>('/submissions/me')
      .then(r => { if (r.success) setList(r.data || []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/submissions/${id}`);
      setList(prev => prev.filter(s => s.id !== id));
      setConfirmDelete(null);
    } catch (e: any) { alert(e.message); }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-2 mb-2">
        <h1 className="text-3xl font-bold text-slate-900">我的投稿</h1>
        <p className="text-slate-400 text-sm font-medium">
          查看案例投稿状态与管理员反馈信息
        </p>
      </div>

      {/* Stats summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-2">
          {[
            { label: '审核中', count: list.filter(s => s.status === 'pending').length, border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
            { label: '已通过', count: list.filter(s => s.status === 'approved').length, border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: '已退回', count: list.filter(s => s.status === 'rejected').length, border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' },
          ].map(item => (
            <div key={item.label} className={cn('border rounded-2xl p-5 text-center', item.border, item.bg)}>
              <p className={cn('text-3xl font-black', item.text)}>{item.count}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 space-y-3">
            <Send className="w-10 h-10 mx-auto opacity-20" />
            <p className="font-medium">暂无投稿</p>
            <Link to="/submit" className="inline-flex items-center gap-1.5 text-[#0052cc] text-sm font-bold hover:underline">
              前往投稿 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          list.map((item, i) => {
            const meta = statusMeta[item.status];
            const isExpanded = expandedId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Row */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                    {/* Status badge + category + time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border', meta.color)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                        {meta.label}
                      </span>
                      {item.category && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 ml-auto">
                        {item.created_at?.slice(0, 10)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-bold text-slate-800 leading-snug group-hover:text-[#0052cc] transition-colors">
                      {item.title}
                    </h3>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-[12px] text-slate-400 flex-wrap">
                      {item.achievement_type && <span>类型：{item.achievement_type}</span>}
                      {item.target_audience && <span>对象：{item.target_audience}</span>}
                      {item.consulting_form && <span>形式：{item.consulting_form}</span>}
                      {item.attachments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />{item.attachments.length} 个附件
                        </span>
                      )}
                    </div>

                    {/* Reviewer feedback — 反馈信息 */}
                    {item.status !== 'pending' && item.reviewed_at && (
                      <div className={cn(
                        'p-3 rounded-xl text-[13px] font-medium leading-relaxed',
                        item.status === 'approved' ? 'bg-emerald-50/60 text-emerald-700' : 'bg-red-50/60 text-red-700'
                      )}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            {item.status === 'approved' ? '审核通过' : '退回原因'}
                            {item.reviewer_name && ` · ${item.reviewer_name}`}
                          </span>
                        </div>
                        {item.reviewer_notes ? (
                          <p>{item.reviewer_notes}</p>
                        ) : (
                          <p>{item.status === 'approved' ? '该投稿已通过审核，案例已收录至案例库。' : '未填写具体原因。'}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'approved' && (
                      <button
                        onClick={() => window.open(`/cases?search=${encodeURIComponent(item.title)}`, '_self')}
                        className="p-2 text-slate-400 hover:text-[#0052cc] hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看案例"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {item.status !== 'approved' && (
                      confirmDelete === item.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">
                            确认
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除投稿"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-2 text-slate-300 hover:text-slate-500 rounded-lg transition-colors"
                    >
                      <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-50"
                    >
                      <div className="p-5 bg-slate-50/50 space-y-3">
                        {item.description && (
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">案例简介</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {item.author && <div><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">作者</span><span className="text-slate-700 font-medium">{item.author}</span></div>}
                          {item.organization && <div><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">机构</span><span className="text-slate-700 font-medium">{item.organization}</span></div>}
                        </div>
                        {item.attachments && item.attachments.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">附件</p>
                            <div className="flex flex-wrap gap-2">
                              {item.attachments.map((att, idx) => (
                                <a key={idx} href={att.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-[#0052cc] hover:bg-blue-50 transition-colors">
                                  <FileText className="w-3.5 h-3.5" />{att.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MySubmissions;
