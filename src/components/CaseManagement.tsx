import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Download, FileText, Calendar, User, Plus, ExternalLink, ChevronDown, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { api } from '../api/client';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CaseManagementModal from './CaseManagementModal';

interface CaseManagementProps {
  user: { name: string; role: 'admin' | 'contributor' | 'auditor' | 'manager'; } | null;
}

// 筛选选项
const TOPIC_FIELDS  = ['全部','政治建设','经济建设','社会建设','文化建设','生态文明','法治建设','科技创新','应急管理'];
const ACHIEVEMENTS  = ['全部','专题编研成果','定向报送材料','品牌化资政产品','资政服务案例','创新实践案例'];
const AUDIENCES     = ['全部','党政领导','决策部门','基层单位','社会公众'];
const CONSULT_FORMS = ['全部','专报','内参','编研成果','展览展示','新媒体产品','数据库/平台'];

// 折叠筛选组件
const FilterSection: React.FC<{ title: string; options: string[]; value: string; onChange: (v: string) => void }> =
({ title, options, value, onChange }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-slate-100 pb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3 text-sm font-bold text-slate-700 hover:text-[#0052cc] transition-colors">
        {title}
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-0.5 pt-1 pb-2">
              {options.map(opt => (
                <button key={opt} onClick={() => onChange(opt === '全部' ? '' : opt)}
                  className={cn("w-full text-left px-3 py-1.5 text-[13px] rounded-lg transition-colors",
                    (opt === '全部' && !value) || opt === value
                      ? "bg-[#0052cc]/5 text-[#0052cc] font-bold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")}>
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CaseManagement: React.FC<CaseManagementProps> = ({ user }) => {
  const navigate = useNavigate();
  const { onLoginRequest } = useOutletContext<{ onLoginRequest: () => void }>();

  const handleCardClick = (caseId: string) => {
    if (!user) { onLoginRequest(); return; }
    navigate(`/cases/${caseId}`);
  };
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // 四个筛选状态
  const [topicFilter, setTopicFilter] = useState('');
  const [achievementFilter, setAchievementFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = (p?: number) => {
    const targetPage = p ?? 1;
    setPage(targetPage);
    setLoading(true);
    const params = new URLSearchParams();
    if (topicFilter) params.set('category', topicFilter);
    if (achievementFilter) params.set('achievement_type', achievementFilter);
    if (audienceFilter) params.set('target_audience', audienceFilter);
    if (formFilter) params.set('consulting_form', formFilter);
    if (searchQuery) params.set('search', searchQuery);
    params.set('page', String(targetPage));
    params.set('pageSize', String(PAGE_SIZE));
    api.get(`/cases?${params.toString()}`).then(r => {
      if (r.success) {
        setCases(r.data || []);
        if (r.pagination) { setTotal(r.pagination.total); setTotalPages(r.pagination.totalPages); }
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(1); }, [topicFilter, achievementFilter, audienceFilter, formFilter]);

  const handleSearch = () => { fetchData(1); };

  const handleExport = () => {
    const headers = ['案件编号','标题','分类','状态','优先级','负责人','创建时间'];
    const rows = cases.map(c => [c.case_number, c.title, c.category, c.status, c.priority, c.assignee_name||'未分配', formatDate(c.created_at)]);
    const csv = [headers, ...rows].map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿'+csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download=`案例导出_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">案例库</h1>
          <p className="text-slate-500 mt-1 text-sm">档案资政案例检索与浏览</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" />导出
              </button>
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0052cc] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#0052cc]/20 hover:bg-[#0747a6] transition-all">
                <Plus className="w-4 h-4" />新建案例
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* ========== 左侧筛选栏 ========== */}
        <aside className="w-[260px] shrink-0 hidden lg:block">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sticky top-32 space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 pb-3 border-b border-slate-100">筛选条件</h3>
            <FilterSection title="主题领域" options={TOPIC_FIELDS} value={topicFilter} onChange={setTopicFilter} />
            <FilterSection title="成果类型" options={ACHIEVEMENTS} value={achievementFilter} onChange={setAchievementFilter} />
            <FilterSection title="服务对象" options={AUDIENCES} value={audienceFilter} onChange={setAudienceFilter} />
            <FilterSection title="资政形式" options={CONSULT_FORMS} value={formFilter} onChange={setFormFilter} />
            <button onClick={() => { setTopicFilter(''); setAchievementFilter(''); setAudienceFilter(''); setFormFilter(''); }}
              className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-[#0052cc] transition-colors">清除全部筛选</button>
          </div>
        </aside>

        {/* ========== 右侧内容列表 ========== */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* 搜索栏 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="搜索案件编号、标题…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20" />
            </div>
            <button onClick={handleSearch} className="px-5 py-2.5 bg-[#0052cc] text-white rounded-xl text-sm font-bold shrink-0">搜索</button>
          </div>

          {/* 当前筛选条件（AND 逻辑） */}
          {(() => {
            const active: { key: string; label: string; dim: string }[] = [];
            if (topicFilter) active.push({ key: 'topic', label: topicFilter, dim: '主题领域' });
            if (achievementFilter) active.push({ key: 'achievement', label: achievementFilter, dim: '成果类型' });
            if (audienceFilter) active.push({ key: 'audience', label: audienceFilter, dim: '服务对象' });
            if (formFilter) active.push({ key: 'form', label: formFilter, dim: '资政形式' });
            if (active.length === 0) return null;
            const remove = (key: string) => {
              if (key === 'topic') setTopicFilter('');
              if (key === 'achievement') setAchievementFilter('');
              if (key === 'audience') setAudienceFilter('');
              if (key === 'form') setFormFilter('');
            };
            return (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-600">
                    已选 {active.length} 项筛选条件（AND 逻辑：需同时满足）
                  </span>
                  <button onClick={() => { setTopicFilter(''); setAchievementFilter(''); setAudienceFilter(''); setFormFilter(''); }}
                    className="text-blue-400 hover:text-blue-600 underline font-medium">清除全部</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {active.map((f, i) => (
                    <span key={i}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                      <span className="text-slate-400 font-medium">{f.dim}:</span>
                      <span className="text-blue-700 font-bold">{f.label}</span>
                      <button onClick={() => remove(f.key)}
                        className="p-0.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {active.length === 4 && (
                    <span className="text-xs text-blue-400 font-medium self-center">
                      （所有维度均已指定，将返回完全匹配的案例）
                    </span>
                  )}
                  {active.length === 1 && (
                    <span className="text-xs text-blue-400 font-medium self-center">
                      （剩余维度不设限，可继续选择以缩小范围）
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 空状态 */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && cases.length === 0 && (
            <div className="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">暂无案例</p>
              <p className="text-sm mt-1">尝试更换筛选条件或关键词</p>
            </div>
          )}

          {/* 案例列表 — 卡片风格 */}
          {!loading && cases.length > 0 && (
            <div className="space-y-4">
              {cases.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[#0052cc]/10 transition-all overflow-hidden group cursor-pointer"
                  onClick={() => handleCardClick(item.id)}>
                  <div className="p-6">
                    {/* 编号 + 分类标签 */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded">{item.case_number}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{item.category || '未分类'}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded",
                        item.priority === 'high' ? "bg-red-50 text-red-600" : item.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500")}>
                        {item.priority === 'high' ? '高优' : item.priority === 'medium' ? '中优' : '低优'}
                      </span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded",
                        item.status === 'open' ? "bg-blue-50 text-blue-600" : item.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")}>
                        {item.status === 'open' ? '开放' : item.status === 'completed' ? '已完结' : item.status}
                      </span>
                    </div>

                    {/* 标题 */}
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#0052cc] transition-colors leading-snug mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{item.description}</p>
                    )}

                    {/* 底部信息 */}
                    <div className="flex items-center gap-5 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.created_at)}</span>
                      {item.assignee_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.assignee_name}</span>}
                      {(item.files || []).length > 0 && (
                        <span className="flex items-center gap-1 text-[#0052cc]">
                          <FileText className="w-3 h-3" />{(item.files as any[]).length}个附件
                          {(item.files as any[]).map((f: any) => (
                            <a key={f.id} href={f.storage_url} target="_blank" rel="noopener noreferrer"
                              className="hover:underline ml-1 hidden sm:inline"><ExternalLink className="w-3 h-3 inline" /></a>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 翻页 */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-xs text-slate-400">共 {total} 条，第 {page}/{totalPages} 页</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => fetchData(1)} disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">首页</button>
                <button onClick={() => fetchData(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">上一页</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let start = Math.max(1, page - 3); let end = Math.min(totalPages, start + 6); if (end - start < 6) start = Math.max(1, end - 6);
                  const pn = start + i; if (pn > end) return null;
                  return <button key={pn} onClick={() => fetchData(pn)} className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${pn === page ? 'bg-[#0052cc] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>{pn}</button>;
                })}
                <button onClick={() => fetchData(page + 1)} disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">下一页</button>
                <button onClick={() => fetchData(totalPages)} disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">末页</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CaseManagementModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchData(page); }} />
    </div>
  );
};

export default CaseManagement;
