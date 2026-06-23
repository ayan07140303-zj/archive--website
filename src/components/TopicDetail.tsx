import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight, Briefcase } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { api } from '../api/client';

const TopicDetail: React.FC = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    Promise.all([
      api.get(`/library/topics/${topicId}`),
      api.get(`/cases?topic_id=${topicId}&pageSize=50`),
    ]).then(([topicRes, caseRes]) => {
      if (topicRes.success) setTopic(topicRes.data);
      if (caseRes.success) setCases(caseRes.data || []);
    }).finally(() => setLoading(false));
  }, [topicId]);

  // 前端搜索：标题或编号匹配
  const filteredCases = cases.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || (c.case_number || '').toLowerCase().includes(q);
  });

  const statusLabel = (s: string) => ({ open: '开放', pending: '待处理', completed: '已完结', archived: '已归档', flagged: '已标记' } as any)[s] || s;
  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-50 text-blue-600';
      case 'completed': return 'bg-emerald-50 text-emerald-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'flagged': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  if (loading || !topic) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <Link to="/" className="hover:text-[#0052cc]">首页</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/library" className="hover:text-[#0052cc]">专题案例库</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">{topic.title}</span>
      </nav>

      {/* 标题头部 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-0.5 bg-[#0052cc]/10 text-[#0052cc] text-[11px] font-bold rounded">{topic.category || '专题'}</span>
          <span className="text-[11px] text-slate-400">更新于 {topic.latest_update ? new Date(topic.latest_update).toLocaleDateString('zh-CN') : topic.updated_at ? new Date(topic.updated_at).toLocaleDateString('zh-CN') : '—'}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">{topic.title}</h1>
        <p className="text-[14px] text-slate-500 leading-relaxed max-w-3xl">{topic.description}</p>
        <div className="flex items-center gap-8 mt-6 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Briefcase className="w-3.5 h-3.5 text-[#0052cc]" />
            <span className="font-bold text-slate-700">{cases.length}</span> 篇案例
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="搜索本专题案例标题或编号..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20" />
        </div>
      </div>

      {/* 案例列表 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#0052cc] rounded-full"></span>本专题案例
          </h2>
          <span className="text-[11px] text-slate-400">共 {cases.length} 篇</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="px-6 py-3 w-16 text-center">序号</th>
                <th className="px-6 py-3">案例标题</th>
                <th className="px-6 py-3 w-24">状态</th>
                <th className="px-6 py-3 w-28">发布时间</th>
                <th className="px-6 py-3 w-24 text-center">浏览量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCases.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                  {search ? `未找到匹配"${search}"的案例` : '暂无案例，可通过后台案例管理关联到本专题'}
                </td></tr>
              )}
              {filteredCases.map((c: any, i: number) => (
                <motion.tr key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/library/${topicId}/case/${c.id}`)}>
                  <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-[14px] font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-1">
                      {c.title}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">{c.case_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', statusColor(c.status))}>
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{c.created_at?.slice(0, 10)}</td>
                  <td className="px-6 py-4 text-center text-xs text-slate-400">{c.view_count || 0}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
