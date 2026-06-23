import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Calendar, Download } from 'lucide-react';
import { api } from '../api/client';

const CATEGORIES = ['全部', '通知公告', '政务发布', '技术成果', '标准规范', '国务院', '基础建设', '合规审计'];

const AnnouncementList: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const fetchData = (p?: number) => {
    const targetPage = p ?? 1;
    setPage(targetPage);
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== '全部') params.set('category', category);
    if (search) params.set('search', search);
    params.set('page', String(targetPage));
    params.set('pageSize', String(PAGE_SIZE));
    api.get(`/portal/announcements?${params.toString()}`).then(r => {
      if (r.success) {
        setList(r.data || []);
        if (r.pagination) {
          setTotalPages(r.pagination.totalPages);
          setTotal(r.pagination.total);
        }
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(1); }, [category]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <Link to="/" className="hover:text-[#0052cc]">首页</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">通知公告</span>
      </nav>

      {/* 头部 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">通知公告</h1>
          <p className="text-slate-500 mt-1.5 text-sm">国家档案局及相关机构发布的最新通知、政策文件和行业动态</p>
        </div>
      </div>

      {/* 搜索 & 分类筛选 */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="搜索标题或正文关键词..." value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData(1)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                category === c ? 'bg-[#0052cc] text-white shadow-md' : 'text-slate-500 bg-slate-50 hover:bg-slate-100'
              }`}>{c}</button>
          ))}
        </div>
        <button onClick={() => fetchData(1)} className="px-5 py-2.5 bg-[#0052cc] text-white rounded-xl text-sm font-bold shrink-0">搜索</button>
      </div>

      {/* 公告列表 */}
      <div className="space-y-0">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && list.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-medium">暂无公告</p>
            <p className="text-sm mt-1">尝试更换搜索关键词或分类</p>
          </div>
        )}
        {!loading && list.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={`/announcement/${item.id}`}
              className="flex items-start gap-4 px-6 py-5 bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors group first:rounded-t-2xl last:rounded-b-2xl first:border-t border-t-slate-100 last:border-b last:border-b-slate-100 border-x border-x-slate-100">
              <span className="text-xs font-black text-slate-300 mt-1 shrink-0 w-6 text-right">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug">
                  {item.title}
                </h3>
                {item.content && (
                  <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: (item.content || '').replace(/<[^>]+>/g, '').slice(0, 200) }} />
                )}
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-[#0052cc]/5 text-[#0052cc] font-medium">{item.category}</span>
                  {item.source && <span>来源：{item.source}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : ''}</span>
                  {(() => {
                    const attCount = (item.attachments && Array.isArray(item.attachments)) ? item.attachments.length : (item.attachment_url ? 1 : 0);
                    if (attCount === 0) return null;
                    return <span className="flex items-center gap-1 text-[#0052cc]"><Download className="w-3 h-3" />{attCount}个附件</span>;
                  })()}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052cc] transition-colors shrink-0 mt-1" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 翻页栏 */}
      <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
        <span className="text-xs text-slate-400">共 {total} 条，第 {page}/{totalPages} 页</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => fetchData(1)} disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">首页</button>
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">上一页</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let start = Math.max(1, page - 3);
            let end = Math.min(totalPages, start + 6);
            if (end - start < 6) start = Math.max(1, end - 6);
            const pn = start + i;
            if (pn > end) return null;
            return (
              <button key={pn} onClick={() => fetchData(pn)}
                className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                  pn === page ? 'bg-[#0052cc] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                }`}>{pn}</button>
            );
          })}
          <button onClick={() => fetchData(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">下一页</button>
          <button onClick={() => fetchData(totalPages)} disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">末页</button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementList;
