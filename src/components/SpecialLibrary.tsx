import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { api } from '../api/client';
import { Link, useOutletContext, useLocation } from 'react-router-dom';
import { Search, TrendingUp, Lock } from 'lucide-react';

const SpecialLibrary: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('全部领域');
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalCases, setTotalCases] = useState(0);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    api.get(`/library/topics?search=${encodeURIComponent(searchQuery)}`).then(r => {
      if (r.success) setTopics(r.data || []);
    });
  };

  // 路由变化时重新加载（从详情页返回时及时更新案例数）
  useEffect(() => {
    Promise.all([
      api.get(`/library/topics?category=${activeTab}&sort=latest`),
      api.get('/cases'),
    ]).then(([topicRes, caseRes]) => {
      if (topicRes.success) {
        const list = topicRes.data || [];
        setTopics(list);
        setTotalDocs(list.reduce((s: number, t: any) => s + (t.case_count || 0), 0));
        setTotalTopics(list.length);
      }
      if (caseRes.success) setTotalCases((caseRes.data || []).length);
    });
  }, [activeTab, location.key]);

  const tabs = ['全部领域', '宏观经济', '社会治理', '生态文明', '数字赋能'];

  const formatCount = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const stats = [
    { label: '收录专题', value: String(totalTopics) },
    { label: '案例总量', value: formatCount(totalCases) },
    { label: '案例集萃', value: formatCount(totalCases) },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Search & Hero Banner */}
      <section className="relative h-[320px] rounded-3xl overflow-hidden bg-[#0052cc] text-white flex items-center px-12">
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight">专题案例库</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            汇聚全国重点领域档案案例与权威研究成果，通过多维度数据整合与智能化分类，为您提供精准的决策参考与案例支持。
          </p>
          <div className="flex gap-12 pt-4">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black">{s.value}</p>
                <p className="text-sm font-bold text-white/50 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-full max-w-sm">
          <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索专题文献..."
                className="w-full h-12 pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 focus:border-white transition-all text-sm" />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-white/50">{user ? '常用关键词：' : '热门搜索：'}</span>
              {['数字经济', '乡村振兴', '碳中和'].map(k => (
                <button key={k} type="button"
                  onClick={() => { setSearchQuery(k); handleSearch(); }}
                  className="text-white/80 hover:text-white hover:underline transition-colors">{k}</button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Filters & Sorting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm relative">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all",
                activeTab === tab ? "bg-[#0052cc] text-white shadow-lg shadow-[#0052cc]/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>{tab}</button>
          ))}
          {!user && (
            <div className="absolute -top-12 left-0 flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-orange-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Lock className="w-3.5 h-3.5" /> 访客模式已开启受限视图
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {topics.map((topic, i) => (
          <motion.div key={topic.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="group">
            <Link to={`/library/${topic.id}`} className="block bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden h-full">
              <div className="h-56 relative overflow-hidden">
                <img src={topic.cover_image || '../../assets/images/hero-global-map.jpg'} alt={topic.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                {topic.is_hot && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#0052cc] text-white text-[10px] font-black rounded shadow-sm flex items-center gap-1.5 uppercase tracking-widest">
                      <TrendingUp className="w-3 h-3" /> 热门专题
                    </span>
                  </div>
                )}
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-[#0052cc] transition-colors line-clamp-1">{topic.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{topic.description || ''}</p>
                </div>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">案例数量</p>
                    <p className="text-lg font-black text-slate-900">{topic.case_count || 0} 篇</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-right">更新于</p>
                    <p className="text-sm font-bold text-slate-700">
                      {topic.latest_update ? new Date(topic.latest_update).toLocaleDateString('zh-CN') : topic.updated_at ? new Date(topic.updated_at).toLocaleDateString('zh-CN') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SpecialLibrary;
