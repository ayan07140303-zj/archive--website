import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Users, Search, ChevronRight, Mail, Building2, X, FileText } from 'lucide-react';
import { api } from '../api/client';
import { cn } from '../lib/utils';

interface Author {
  id: string;
  name: string;
  email: string | null;
  institution: string | null;
  department: string | null;
  avatar_url: string | null;
  role: string;
  case_count: number;
}

const ExpertLibrary: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>();
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);

  // 搜索防抖 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('pageSize', '100');
      const res = await api.get<any>(`/authors?${params.toString()}`);
      if (res.success && res.data) {
        setAuthors(Array.isArray(res.data) ? res.data : []);
      }
      if ((res as any).stats) setStats((res as any).stats);
    } catch (err) {
      console.error('获取作者列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchAuthors(); }, [fetchAuthors]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#0052cc]">
            <Users className="w-6 h-6" />
            <span className="text-sm font-black uppercase tracking-wider">作者库</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">案例作者</h1>
          <p className="text-slate-500 font-medium text-lg lg:max-w-xl">
            收录本平台贡献过案例的作者，按投稿数量排序展示。
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
            >
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索作者姓名、单位或邮箱..."
          className="w-full pl-14 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052cc]/5 focus:border-[#0052cc]/30 transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setDebouncedSearch(''); }}
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Author List Table */}
      <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_2fr_2fr_1fr_auto] gap-4 px-8 py-4 bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <div className="w-10" />
          <div>作者</div>
          <div>单位</div>
          <div>邮箱</div>
          <div className="w-16 text-center">案例数</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm font-medium">正在加载...</p>
            </div>
          </div>
        ) : authors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-bold">
              {debouncedSearch ? `未找到匹配"${debouncedSearch}"的作者` : '暂无作者数据'}
            </p>
            <p className="text-xs text-slate-300 mt-1">用户创建案例后将自动出现在作者库中</p>
          </div>
        ) : (
          <div>
            {authors.map((author, i) => (
              <motion.div
                key={author.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/experts/${author.id}`)}
                className={cn(
                  'grid grid-cols-[auto_2fr_2fr_1fr_auto] gap-4 px-8 py-5 items-center cursor-pointer hover:bg-blue-50/40 transition-all group',
                  i < authors.length - 1 && 'border-b border-slate-50'
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-[#0052cc]">{author.name?.charAt(0) || '?'}</span>
                  )}
                </div>

                {/* Name + department */}
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-[#0052cc] transition-colors truncate block">
                    {author.name}
                  </span>
                  <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">
                    {author.department || '—'}
                  </p>
                </div>

                {/* Institution */}
                <div className="flex items-center gap-2 min-w-0 text-slate-500">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />
                  <span className="text-[13px] font-medium truncate">{author.institution || '—'}</span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />
                  <a
                    href={`mailto:${author.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[13px] text-[#0052cc] font-medium hover:underline truncate"
                  >
                    {author.email || '—'}
                  </a>
                </div>

                {/* Case count + arrow */}
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[13px] font-black text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg min-w-[2.5rem] text-center">
                    {author.case_count}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052cc] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && authors.length > 0 && (
        <p className="text-center text-[12px] text-slate-400 font-medium">
          共 {authors.length} 位作者，提交案例后自动收录
        </p>
      )}
    </div>
  );
};

export default ExpertLibrary;
