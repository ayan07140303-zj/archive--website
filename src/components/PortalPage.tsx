import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import HeroCarousel from './HeroCarousel';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORIES = [
  { label: '政治建设', href: '/cases?category=政治建设' },
  { label: '经济建设', href: '/cases?category=经济建设' },
  { label: '社会建设', href: '/cases?category=社会建设' },
  { label: '文化建设', href: '/cases?category=文化建设' },
  { label: '生态文明', href: '/cases?category=生态文明' },
  { label: '法治建设', href: '/cases?category=法治建设' },
  { label: '科技创新', href: '/cases?category=科技创新' },
  { label: '应急管理', href: '/cases?category=应急管理' },
];

interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  category: string;
  status: string;
  description: string | null;
  view_count?: number;
  created_at: string;
}

const PortalPage: React.FC = () => {
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [latestCases, setLatestCases] = React.useState<CaseItem[]>([]);
  const [hotCases, setHotCases] = React.useState<CaseItem[]>([]);
  const [topics, setTopics] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 三条请求独立处理，任一条失败不影响其他
    api.get<any>('/portal/announcements?pageSize=4').then(res => {
      if (res.success) setAnnouncements(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
    api.get<any>('/cases?status=all&pageSize=20').then(res => {
      if (res.success) {
        const all: CaseItem[] = res.data || [];
        const sorted = [...all].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLatestCases(sorted.slice(0, 4));
        if (all.some(c => (c.view_count || 0) > 0)) {
          setHotCases([...all].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4));
        } else {
          setHotCases(sorted.slice(0, 4));
        }
      }
    }).catch(() => {});
    api.get<any>('/library/topics?sort=popular&pageSize=4').then(res => {
      if (res.success) setTopics((res.data || []).slice(0, 4));
    }).catch(() => {});
    setLoading(false);
  }, []);

  const statusLabel = (s: string) => ({ open: '开放', pending: '待处理', completed: '已完结', archived: '已归档', flagged: '已标记' } as any)[s] || s;
  const statusColor = (s: string) => s === 'open' ? 'bg-blue-50 text-blue-600' : s === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500';

  return (
    <div className="space-y-6">
      {/* Hero 轮播 */}
      <HeroCarousel />

      {/* 两栏布局 */}
      <div className="grid grid-cols-12 gap-6">
        {/* ====== 左侧：案例分类 + 专题动态 ====== */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* 案例分类 */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <Link to="/cases"
              className="block px-5 py-4 bg-gradient-to-r from-[#0052cc] to-blue-500 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">案例分类</h2>
                <ChevronRight className="w-5 h-5" />
              </div>
              <p className="text-blue-100 text-[11px] mt-1">按主题领域浏览档案案例</p>
            </Link>
            <div className="divide-y divide-slate-50">
              {CATEGORIES.map((cat, i) => (
                <Link key={cat.label} to={cat.href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-[#0052cc]/10 group-hover:text-[#0052cc] transition-colors">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0052cc] transition-colors">
                      {cat.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052cc] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* 专题动态 */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#0052cc] rounded-full"></span>专题动态
              </h2>
              <Link to="/library" className="text-[11px] font-medium text-slate-400 hover:text-[#0052cc] transition-colors flex items-center gap-1">
                更多 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {topics.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] text-slate-400">
                  暂无专题，请通过后台管理添加
                </div>
              ) : (
                topics.map((t, i) => {
                  const tags = ['热门', '最新', '专题', '推荐'];
                  return (
                    <Link key={t.id} to={`/library/${t.id}`}
                      className="block px-5 py-3 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#0052cc]/5 text-[#0052cc] font-medium rounded shrink-0 mt-0.5">
                          {t.is_hot ? '热门' : tags[i % 4]}
                        </span>
                        <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-1">
                          {t.title}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* 平台数据 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col items-center text-center gap-1.5">
              <span className="text-xl">📄</span>
              <p className="text-xl font-extrabold text-slate-900">{latestCases.length > 0 ? latestCases.length : 4}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">最新案例</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col items-center text-center gap-1.5">
              <span className="text-xl">🔥</span>
              <p className="text-xl font-extrabold text-slate-900">{hotCases.length > 0 ? hotCases.length : 4}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">热门案例</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col items-center text-center gap-1.5">
              <span className="text-xl">📢</span>
              <p className="text-xl font-extrabold text-slate-900">{announcements.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">通知公告</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col items-center text-center gap-1.5">
              <span className="text-xl">📊</span>
              <p className="text-xl font-extrabold text-slate-900">8</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">案例分类</p>
            </div>
          </div>
        </div>

        {/* ====== 右侧 ====== */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 通知公告 */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#0052cc] rounded-full"></span>通知公告
              </h2>
              <Link to="/announcements" className="text-[11px] font-medium text-slate-400 hover:text-[#0052cc] transition-colors flex items-center gap-1">
                全部公告 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50 max-h-[344px] overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="flex items-center justify-center h-[344px] text-[12px] text-slate-400">
                  暂无公告，请通过后台管理添加
                </div>
              ) : (
                announcements.map((item, i) => (
                  <Link key={item.id} to={`/announcement/${item.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                    <span className="text-xs font-black text-slate-300 mt-0.5 shrink-0 w-5 text-right">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <h4 className="text-[13px] font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-1">
                        {item.title}
                      </h4>
                      {item.content && (
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {item.content.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#0052cc]/5 text-[#0052cc] font-medium rounded">{item.category}</span>
                        <span className="text-[10px] text-slate-400">{item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : ''}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 最新案例 + 热门案例 — 双列并排 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 最新案例 — 按发布时间 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>最新案例
                </h2>
                <Link to="/cases" className="text-[11px] font-medium text-slate-400 hover:text-[#0052cc] transition-colors flex items-center gap-1">
                  更多 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="px-5 py-8 text-center text-[12px] text-slate-400">加载中...</div>
                ) : latestCases.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[12px] text-slate-400">
                    暂无案例，可前往<Link to="/submit" className="text-[#0052cc] hover:underline mx-1">案例投稿</Link>提交
                  </div>
                ) : (
                  latestCases.map(c => (
                    <Link key={c.id} to={`/cases/${c.id}`}
                      className="block px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                      <h4 className="text-[13px] font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-1">
                        {c.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-medium rounded">
                          {c.category}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 font-medium rounded', statusColor(c.status))}>
                          {statusLabel(c.status)}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{c.created_at?.slice(0, 10)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* 热门案例 — 按浏览量 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>热门案例
                </h2>
                <Link to="/cases" className="text-[11px] font-medium text-slate-400 hover:text-[#0052cc] transition-colors flex items-center gap-1">
                  更多 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="px-5 py-8 text-center text-[12px] text-slate-400">加载中...</div>
                ) : hotCases.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[12px] text-slate-400">
                    暂无案例，可前往<Link to="/submit" className="text-[#0052cc] hover:underline mx-1">案例投稿</Link>提交
                  </div>
                ) : (
                  hotCases.map((c, i) => (
                    <Link key={c.id} to={`/cases/${c.id}`}
                      className="block px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <span className={cn('text-[11px] font-black shrink-0 w-5 text-center mt-0.5',
                          i < 3 ? 'text-orange-500' : 'text-slate-300')}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-1">
                            {c.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-medium rounded">
                              {c.category}
                            </span>
                            {(c.view_count ?? 0) > 0 ? (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5" />{c.view_count!.toLocaleString()} 浏览
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />{c.created_at?.slice(0, 10)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalPage;
