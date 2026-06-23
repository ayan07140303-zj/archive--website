import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Check, X, Loader2, Eye, RefreshCw, FileText, Calendar, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/client';

const SubmissionReview: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [detail, setDetail] = useState<any | null>(null);
  const [notes, setNotes] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get(`/admin/submissions?status=${tab}`).then(r => {
      if (r.success) setList(r.data || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [tab]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/admin/submissions/${id}`, { status, reviewer_notes: notes });
      setDetail(null); setNotes(''); fetchData();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold text-on-surface">投稿审核</h1><p className="text-on-secondary-container mt-1 text-sm">审核用户提交的案例投稿</p></div>
        <button onClick={fetchData} className="p-2.5 border rounded-xl hover:bg-slate-50"><RefreshCw className="w-5 h-5" /></button>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-fit">
        {[{ key:'pending', label:'待审核', color:'text-amber-600 bg-amber-50' },{ key:'approved', label:'已通过', color:'text-emerald-600 bg-emerald-50' },{ key:'rejected', label:'已拒绝', color:'text-slate-500 bg-slate-50' }]
          .map(t => (
            <button key={t.key} onClick={()=>setTab(t.key as any)}
              className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all", tab===t.key?"bg-[#0052cc] text-white shadow-md":"text-slate-500 hover:text-slate-700")}>
              {t.label}
            </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" /></div>}
        {!loading && list.length===0 && <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">暂无{tab==='pending'?'待审核':'已处理'}投稿</div>}
        {!loading && list.map((item, i) => (
          <motion.div key={item.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
            className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{item.category}</span>
                {item.achievement_type && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{item.achievement_type}</span>}
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", item.status==='pending'?"bg-amber-50 text-amber-600":item.status==='approved'?"bg-emerald-50 text-emerald-600":"bg-slate-50 text-slate-500")}>
                  {item.status==='pending'?'待审核':item.status==='approved'?'已通过':'已拒绝'}</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">{item.title}</h3>
              {item.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{item.description}</p>}
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                {item.author && <span>作者：{item.author}</span>}
                {item.organization && <span>机构：{item.organization}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.created_at?.slice(0,10)}</span>
              </div>
              {/* 投稿附件 */}
              {(() => {
                const atts = (item.attachments && Array.isArray(item.attachments)) ? item.attachments : [];
                if (atts.length === 0) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-slate-50 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">附件 ({atts.length})</p>
                    {atts.map((a: any, idx: number) => (
                      <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-[#0052cc] hover:underline">
                        <Download className="w-3 h-3" />{a.name}{a.size ? ` (${a.size > 1048576 ? (a.size/1048576).toFixed(1)+'MB' : (a.size/1024).toFixed(0)+'KB'})` : ''}
                      </a>
                    ))}
                  </div>
                );
              })()}
              {tab === 'pending' && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                  <button onClick={()=>setDetail(item)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"><Eye className="w-4 h-4" />审核</button>
                </div>
              )}
              {item.status !== 'pending' && item.reviewer_notes && (
                <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500">{item.reviewer_notes}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 审核弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={()=>setDetail(null)} />
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 space-y-5">
            <h3 className="text-lg font-bold">审核投稿</h3>
            <div className="space-y-3 text-sm">
              <p><span className="font-bold">标题：</span>{detail.title}</p>
              <p><span className="font-bold">分类：</span>{detail.category}</p>
              <p><span className="font-bold">成果类型：</span>{detail.achievement_type||'—'}</p>
              <p><span className="font-bold">服务对象：</span>{detail.target_audience||'—'}</p>
              <p><span className="font-bold">资政形式：</span>{detail.consulting_form||'—'}</p>
              <p><span className="font-bold">作者：</span>{detail.author||'—'}</p>
              <p><span className="font-bold">机构：</span>{detail.organization||'—'}</p>
              <p><span className="font-bold">简介：</span>{detail.description||'—'}</p>
              {(() => {
                const atts = (detail.attachments && Array.isArray(detail.attachments)) ? detail.attachments : [];
                if (atts.length === 0) return null;
                return (
                  <div className="pt-2 border-t border-slate-50">
                    <p className="font-bold mb-2">附件 ({atts.length})：</p>
                    {atts.map((a: any, idx: number) => (
                      <a key={idx} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-[#0052cc] hover:underline py-1">
                        <Download className="w-3 h-3" />{a.name}
                      </a>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">审核意见</label>
              <textarea className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none h-24" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="可选填写审核意见…" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>setDetail(null)} className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl">取消</button>
              <button onClick={()=>handleReview(detail.id,'rejected')} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600">拒绝</button>
              <button onClick={()=>handleReview(detail.id,'approved')} className="px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6]">通过</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubmissionReview;
