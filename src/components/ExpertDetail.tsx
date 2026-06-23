import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Search, X,
  Mail, Building2, Calendar, FileText
} from 'lucide-react';
import { api } from '../api/client';
import { cn } from '../lib/utils';

interface AuthorData {
  id: string;
  name: string;
  email: string | null;
  institution: string | null;
  department: string | null;
  avatar_url: string | null;
  role: string;
  case_count: number;
}

interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  description: string | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
}

const roleLabel = (r: string) => ({ admin: '管理员', contributor: '研究员', auditor: '审计员', manager: '经理' } as any)[r] || r;

const ExpertDetail: React.FC = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [caseSearch, setCaseSearch] = useState('');
  const [debouncedCaseSearch, setDebouncedCaseSearch] = useState('');

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCaseSearch(caseSearch), 300);
    return () => clearTimeout(timer);
  }, [caseSearch]);

  // 拉取作者详情
  useEffect(() => {
    if (!expertId) return;
    setLoading(true);
    api.get<any>(`/authors/${expertId}`)
      .then((res) => {
        if (res.success && res.data) setAuthor(res.data);
      })
      .catch((err) => console.error('获取作者详情失败', err))
      .finally(() => setLoading(false));
  }, [expertId]);

  // 拉取投稿案例
  const fetchCases = useCallback(() => {
    if (!expertId) return;
    setCasesLoading(true);
    const params = new URLSearchParams();
    if (debouncedCaseSearch) params.set('search', debouncedCaseSearch);
    api.get<any>(`/authors/${expertId}/cases?${params.toString()}`)
      .then((res) => {
        if (res.success && res.data) setCases(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error('获取案例列表失败', err))
      .finally(() => setCasesLoading(false));
  }, [expertId, debouncedCaseSearch]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

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
  const priorityLabel = (p: string) => p === 'high' ? '高' : p === 'medium' ? '中' : '低';
  const priorityColor = (p: string) => p === 'high' ? 'bg-red-50 text-red-600' : p === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500';

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">正在加载作者信息...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center py-32 text-slate-400">
        <p className="text-lg font-bold mb-2">作者不存在</p>
        <Link to="/users" className="text-[#0052cc] hover:underline text-sm">← 返回作者列表</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1 text-xs font-medium text-slate-400 flex-wrap">
        <Link to="/" className="hover:text-[#0052cc] transition-colors">首页</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/users" className="hover:text-[#0052cc] transition-colors">案例作者</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 truncate max-w-[300px]">{author.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ====== 左侧：作者信息卡 ====== */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden sticky top-24">
            {/* 头像 + 姓名区 */}
            <div className="px-6 pt-8 pb-6 text-center border-b border-slate-50">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden shadow-md mb-4">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-[#0052cc]">{author.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{author.name}</h2>
              <p className="text-[#0052cc] text-xs font-bold mt-1.5 uppercase tracking-wider">
                {roleLabel(author.role)}
              </p>
            </div>

            {/* 联系方式 */}
            <div className="px-6 py-5 space-y-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <a href={`mailto:${author.email}`} className="text-[13px] text-[#0052cc] font-medium hover:underline truncate">
                  {author.email || '—'}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span className="text-[13px] text-slate-600 font-medium">{author.institution || '—'}</span>
              </div>
              {author.department && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-300 uppercase w-4">部</span>
                  <span className="text-[13px] text-slate-500">{author.department}</span>
                </div>
              )}
            </div>

            {/* 统计 */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900">{author.case_count || cases.length}</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">投稿案例</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== 右侧：投稿案例列表 ====== */}
        <div className="lg:col-span-3 space-y-6">
          {/* 标题 + 搜索 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#0052cc] rounded-full" />
                投稿案例
              </h2>
              <p className="text-[13px] text-slate-400 mt-1">
                {author.name} 创建的案例，共 {cases.length} 篇
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                placeholder="搜索案例标题或编号..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0052cc]/5 focus:border-[#0052cc]/30 transition-all"
              />
              {caseSearch && (
                <button
                  onClick={() => { setCaseSearch(''); setDebouncedCaseSearch(''); }}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 案例列表 */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <div>案例名称</div>
              <div className="w-20 text-center">状态</div>
              <div className="w-12 text-center">优先级</div>
            </div>

            {casesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-bold">
                  {debouncedCaseSearch ? `未找到匹配"${debouncedCaseSearch}"的案例` : '暂无投稿案例'}
                </p>
              </div>
            ) : (
              <div>
                {cases.map((c, i) => (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className={cn(
                      'grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 items-center hover:bg-blue-50/40 transition-colors group',
                      i < cases.length - 1 && 'border-b border-slate-50'
                    )}
                  >
                    {/* 案例标题 */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-[#0052cc] transition-colors truncate">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          {c.case_number}
                        </span>
                        {c.category && (
                          <span className="text-[11px] text-slate-400">
                            {c.category}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-300">
                          {c.created_at?.slice(0, 10)}
                        </span>
                      </div>
                    </div>

                    {/* 状态 */}
                    <div className="w-20 text-center">
                      <span className={cn('px-2.5 py-1 text-[11px] font-bold rounded-md', statusColor(c.status))}>
                        {statusLabel(c.status)}
                      </span>
                    </div>

                    {/* 优先级 */}
                    <div className="w-12 text-center">
                      <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded', priorityColor(c.priority))}>
                        {priorityLabel(c.priority)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-[#0052cc] transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            返回作者列表
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExpertDetail;
