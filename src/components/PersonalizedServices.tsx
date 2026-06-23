import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Settings2, Bookmark, CheckSquare, ShieldAlert,
  FileText, Users, Database, Briefcase, Eye, ArrowUpRight, Loader2, Send, X, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api/client';

const PersonalizedServices: React.FC = () => {
  const { user } = useOutletContext<{ user: any }>();
  const navigate = useNavigate();

  // ====== State ======
  const [pushFrequency, setPushFrequency] = useState('daily');
  const [displayMode, setDisplayMode] = useState('light');
  const [searchWeights, setSearchWeights] = useState(['latest', 'core']);

  const [subs, setSubs] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [recMeta, setRecMeta] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regionInput, setRegionInput] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [availTags, setAvailTags] = useState<string[]>([]);
  const [availRegions, setAvailRegions] = useState<string[]>([]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ====== 拉取推荐（受订阅/区域/偏好影响） ======
  const fetchRecommendations = useCallback(() => {
    setRecsLoading(true);
    api.get<any>('/services/recommendations').then(res => {
      if (res.success) {
        setRecs(res.data || []);
        if ((res as any).meta) setRecMeta((res as any).meta);
      }
    }).catch(() => {}).finally(() => setRecsLoading(false));
  }, []);

  // ====== 拉取用户数据 ======
  const loadUserData = useCallback(() => {
    if (!user) return;
    setPrefsLoading(true);
    Promise.all([
      api.get<any>('/users/me/preferences'),
      api.get<any>('/services/subscriptions'),
      api.get<any>('/services/regions'),
    ]).then(([prefRes, subRes, regRes]) => {
      if (prefRes.success && prefRes.data) {
        setPushFrequency(prefRes.data.push_frequency || 'daily');
        setDisplayMode(prefRes.data.display_mode || 'light');
        setSearchWeights(Array.isArray(prefRes.data.search_weights) ? prefRes.data.search_weights : ['latest', 'core']);
      }
      if (subRes.success) setSubs(subRes.data || []);
      if (regRes.success) setRegions(regRes.data || []);
    }).catch(() => {}).finally(() => setPrefsLoading(false));
  }, [user]);

  // 初始加载
  useEffect(() => {
    fetchRecommendations();
    api.get<any>('/services/overview').then(res => {
      if (res.success) setOverview(res.data);
    }).catch(() => {});
    api.get<any>('/services/tags-and-regions').then(res => {
      if (res.success) {
        setAvailTags(res.data.tags || []);
        setAvailRegions(res.data.regions || []);
      }
    }).catch(() => {});
    loadUserData();
  }, [fetchRecommendations, loadUserData]);

  // ====== 保存偏好 → 立即刷新推荐 ======
  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.put('/users/me/preferences', { pushFrequency, displayMode, searchWeights });
      await fetchRecommendations(); // 偏好改变立即刷新推荐
      const weightDescs = searchWeights.includes('latest')
        ? '优先展示最新案例'
        : '优先展示热门案例';
      showToast(`✅ 偏好已保存。推荐列表已按"${weightDescs}"重新排列。`, 'success');
    } catch (e: any) {
      showToast('保存失败: ' + e.message, 'info');
    } finally { setSaving(false); }
  };

  // ====== 订阅标签切换 → 立即刷新推荐 ======
  const toggleSub = async (tag: string) => {
    if (!user) return;
    const updated = subs.includes(tag) ? subs.filter(t => t !== tag) : [...subs, tag];
    await api.put('/services/subscriptions', { tags: updated });
    setSubs(updated);
    await fetchRecommendations(); // 标签改变立即刷新
    showToast(`已${subs.includes(tag) ? '取消订阅' : '订阅'}"${tag}"，推荐列表已更新。`, 'success');
  };

  const removeSub = async (tag: string) => {
    if (!user) return;
    const updated = subs.filter(t => t !== tag);
    await api.put('/services/subscriptions', { tags: updated });
    setSubs(updated);
    await fetchRecommendations();
    showToast(`已取消订阅"${tag}"，推荐列表已更新。`, 'success');
  };

  // ====== 关注区域 → 立即刷新推荐 ======
  const removeRegion = async (r: string) => {
    if (!user) return;
    const updated = regions.filter(t => t !== r);
    await api.put('/services/regions', { regions: updated });
    setRegions(updated);
    await fetchRecommendations();
    showToast(`已取消关注"${r}"，推荐列表已更新。`, 'success');
  };

  const addRegion = async () => {
    if (!regionInput.trim() || !user) return;
    const updated = [...regions, regionInput.trim()];
    await api.put('/services/regions', { regions: updated });
    setRegions(updated);
    setRegionInput('');
    await fetchRecommendations();
    showToast(`已添加关注"${regionInput.trim()}"，推荐列表已更新。`, 'success');
  };

  // ====== 手动刷新 ======
  const refreshAll = () => {
    fetchRecommendations();
    loadUserData();
    showToast('已刷新推荐列表', 'info');
  };

  // ====== Render ======
  const hasSubscription = subs.length > 0;
  const hasRegion = regions.length > 0;
  const isPersonalized = hasSubscription || hasRegion;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Hero */}
      <div className="relative h-48 rounded-3xl overflow-hidden bg-gradient-to-r from-[#0052cc] to-blue-400 text-white flex items-center px-12 shadow-xl shadow-blue-500/20">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-white/5 backdrop-blur-2xl skew-x-[-20deg] translate-x-20" />
        <div className="max-w-2xl relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {user ? '个性化服务中心' : '档案服务门户'}
          </h1>
          <p className="text-blue-50/80 text-sm font-medium leading-relaxed">
            {user
              ? `欢迎，${user.name}。设置订阅标签和关注区域获取精准案例推荐，偏好立即生效。`
              : '登录后可设置订阅标签、关注区域和偏好，获取个性化案例推荐。'}
          </p>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={cn(
              'fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl shadow-2xl text-sm font-bold max-w-xl text-center',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-800 border border-slate-200',
            )}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ====== Left: Main Content ====== */}
        <div className="lg:col-span-2 space-y-8">

          {/* ---- Quick tools ---- */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">快捷入口</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: '案例库', desc: '浏览档案案例', path: '/cases', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                { label: '案例作者', desc: '查看投稿作者', path: '/users', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
                { label: '案例投稿', desc: '提交您的案例', path: '/submit', icon: Send, color: 'bg-amber-50 text-amber-600' },
              ].map(item => (
                <div key={item.label} onClick={() => navigate(item.path)}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all group">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.color.split(' ')[1])}>
                    <item.icon className={cn('w-5 h-5', item.color.split(' ')[0])} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{item.label}</h3>
                  <p className="text-[12px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---- 订阅标签选择 ---- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#0052cc]" />订阅设置
                {hasSubscription && (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {subs.length} 个标签 affecting 推荐
                  </span>
                )}
              </h2>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <p className="text-[12px] text-slate-500 leading-relaxed">
                {user
                  ? '选择标签后，推荐列表自动更新为匹配的案例。'
                  : '预览可订阅的标签（登录后生效）。'}
              </p>
              <div className="flex flex-wrap gap-2">
                {availTags.map(tag => (
                  <button key={tag} onClick={() => toggleSub(tag)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-all',
                      subs.includes(tag)
                        ? 'bg-[#0052cc] text-white border-[#0052cc] shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-[#0052cc]/40 hover:text-slate-700',
                    )}>
                    {subs.includes(tag) && <CheckSquare className="w-3 h-3 inline mr-1.5 align-[-1px]" />}
                    {tag}
                  </button>
                ))}
              </div>

              {subs.length > 0 && (
                <div className="pt-3 border-t border-slate-50">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">已订阅</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subs.map(tag => (
                      <span key={tag} onClick={() => removeSub(tag)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#0052cc] rounded-lg text-[11px] font-bold border border-blue-100 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors">
                        {tag} <X className="w-3 h-3" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 关注区域 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700">
                关注区域
                {hasRegion && (
                  <span className="ml-2 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {regions.length} 个区域 affecting 推荐
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2 min-h-[36px]">
                {!user ? (
                  <p className="text-[12px] text-slate-400 italic">登录后可管理关注区域</p>
                ) : regions.length === 0 ? (
                  <p className="text-[12px] text-slate-400">点击下方预设区域或自行输入添加</p>
                ) : (
                  regions.map(r => (
                    <span key={r} onClick={() => removeRegion(r)}
                      className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-[12px] font-bold border border-orange-100 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors">
                      {r} ×
                    </span>
                  ))
                )}
              </div>
              {/* 预设区域按钮 */}
              {user && availRegions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {availRegions.filter(r => !regions.includes(r)).map(r => (
                    <span key={r} onClick={() => { setRegions(prev => [...prev, r]); api.put('/services/regions', { regions: [...regions, r] }).then(() => fetchRecommendations()); }}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-500 cursor-pointer hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                      + {r}
                    </span>
                  ))}
                </div>
              )}
              {user && (
                <div className="flex gap-2">
                  <input value={regionInput} onChange={e => setRegionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRegion()}
                    placeholder="输入区域名称..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0052cc]/30" />
                  <button onClick={addRegion}
                    className="px-4 py-1.5 bg-[#0052cc] text-white rounded-lg text-xs font-bold hover:bg-[#0747a6] whitespace-nowrap">
                    添加
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ---- 案例推荐 ---- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {user && isPersonalized ? (
                  <span className="flex items-center gap-2">
                    为您推荐
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      个性化
                    </span>
                  </span>
                ) : (
                  '热门案例'
                )}
              </h2>
              <button onClick={refreshAll}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-[#0052cc] transition-colors">
                <RefreshCw className="w-3 h-3" />刷新
              </button>
            </div>

            {recMeta && isPersonalized && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                {hasSubscription && <span>标签：{recMeta.subscriptionTags?.join('、') || subs.join('、')}</span>}
                {hasRegion && <span>区域：{recMeta.regions?.join('、') || regions.join('、')}</span>}
                <span>排序：{searchWeights.includes('latest') ? '最新优先' : '热门优先'}</span>
              </div>
            )}

            {recsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#0052cc]" /></div>
            ) : recs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
                暂无推荐内容
              </div>
            ) : (
              <div className="space-y-3">
                {recs.map((c: any, i: number) => {
                  // 案例详情链接
                  const detailUrl = c.topic_id
                    ? `/library/${c.topic_id}/case/${c.id}`
                    : `/cases/${c.id}`;

                  return (
                    <div key={c.id || i} onClick={() => navigate(detailUrl)}
                      className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer flex items-center gap-6">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#0052cc] rounded text-[10px] font-bold uppercase">
                            {c.category || '案例'}
                          </span>
                          {c.status && (
                            <span className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-medium',
                              c.status === 'open' ? 'bg-emerald-50 text-emerald-600' :
                              c.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-amber-50 text-amber-600'
                            )}>
                              {{ open: '开放', completed: '已完结', pending: '审核中' }[c.status] || c.status}
                            </span>
                          )}
                          {c.topic_title && (
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{c.topic_title}</span>
                          )}
                          <span className="text-[11px] text-slate-400 ml-auto">
                            {c.created_at?.slice(0, 10)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-1">
                          {c.title}
                        </h3>
                        {c.description && (
                          <p className="text-[12px] text-slate-400 line-clamp-1">{c.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{c.case_number}</span>
                          {(c.view_count || 0) > 0 && (
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{c.view_count} 浏览</span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052cc] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ====== Right Sidebar ====== */}
        <aside className="space-y-6">
          {/* 偏好设置 */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 relative">
            {!user && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-2xl p-6 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">偏好设置已锁定</p>
                <p className="text-[12px] text-slate-400">登录后可保存偏好并影响推荐排序。</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-900">
              <Settings2 className="w-5 h-5 text-[#0052cc]" />
              <h2 className="font-bold">偏好设置</h2>
            </div>

            {prefsLoading && user ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0052cc]" />
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">推送频率</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'daily', label: '每日精选' },
                      { id: 'weekly', label: '每周摘要' },
                      { id: 'realtime', label: '实时重要' },
                      { id: 'off', label: '关闭推送' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => user && setPushFrequency(opt.id)}
                        className={cn('py-2 rounded-lg text-[11px] font-bold transition-all border',
                          pushFrequency === opt.id ? 'bg-[#0052cc] text-white border-[#0052cc]' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200')}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">推荐排序</label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    选择后保存，推荐列表立即重新排列。
                  </p>
                  {[
                    { id: 'latest', label: '优先最新发布', hint: '优先展示最近提交的案例' },
                    { id: 'core', label: '优先热门案例', hint: '优先展示浏览量高的案例' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => {
                      if (!user) return;
                      setSearchWeights(prev => prev.includes(opt.id) ? prev.filter(w => w !== opt.id) : [...prev, opt.id]);
                    }} className="flex items-start gap-2 w-full text-left py-1.5 group">
                      <div className={cn('w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all shrink-0',
                        searchWeights.includes(opt.id) ? 'bg-[#0052cc] border-[#0052cc] text-white' : 'border-slate-200')}>
                        {searchWeights.includes(opt.id) && <CheckSquare className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className={cn('text-[12px] font-medium', searchWeights.includes(opt.id) ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600')}>{opt.label}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button onClick={savePreferences} disabled={saving || !user}
                  className="w-full py-3 bg-[#0052cc] text-white rounded-xl font-bold text-[13px] hover:bg-[#0747a6] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '保存偏好并刷新推荐'}
                </button>
              </>
            )}
          </section>

          {/* 平台概览 */}
          <section className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#0052cc]" />平台概览
            </h2>
            {overview ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">累计资源量</span>
                    <span className="font-black text-slate-900">{overview.totalResources || '2.4M+'}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '92%' }} className="h-full bg-[#0052cc] rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">机构连接数</span>
                    <span className="font-black text-slate-900">{overview.connectedInstitutions || 142}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '65%' }} className="h-full bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
            )}
          </section>
        </aside>

      </div>
    </div>
  );
};

export default PersonalizedServices;
