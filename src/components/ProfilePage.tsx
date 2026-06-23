import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Heart, Lock, Send, CheckCircle2, Mail,
  Briefcase, CreditCard, Edit3, Loader2, Star, Trash2, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { api } from '../api/client';
import MySubmissions from './MySubmissions';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
  department: string | null;
  phone: string | null;
  avatar: string | null;
  status: string;
  employeeId: string | null;
  creditScore: number;
  verifiedAt: string | null;
}

interface ProfilePageProps { user: { name: string; role: string; avatar?: string } | null; }

const roleLabel: Record<string, string> = { admin: '管理员', contributor: '研究员', auditor: '审计员', manager: '经理' };

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showNotification, setShowNotification] = useState('');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  // 编辑个人信息
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', phone: '' });
  const [editingSaving, setEditingSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // 修改密码
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  // ====== 拉取用户详细资料 ======
  const fetchProfile = () => {
    if (!user) return;
    setProfileLoading(true);
    api.get<any>('/users/me')
      .then(r => {
        if (r.success && r.data) setProfile(r.data);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  };

  useEffect(() => { fetchProfile(); }, [user]);

  // 用 user prop 兜底显示
  const displayName = profile?.name || user?.name || '';
  const displayRole = profile ? roleLabel[profile.role] || profile.role : (user ? roleLabel[user.role] || user.role : '');
  const displayAvatar = profile?.avatar || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'default'}`;

  // ====== 编辑个人信息 ======
  const openEdit = () => {
    if (!profile) return;
    setEditForm({ email: profile.email, phone: profile.phone || '' });
    setEditError('');
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    setEditingSaving(true);
    setEditError('');
    try {
      await api.put('/users/me', {
        email: editForm.email,
        phone: editForm.phone,
      });
      setEditing(false);
      fetchProfile();
      setShowNotification('个人资料已更新');
      setTimeout(() => setShowNotification(''), 3000);
    } catch (e: any) {
      setEditError(e.message);
    } finally { setEditingSaving(false); }
  };

  // ====== 修改密码 ======
  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.oldPassword || !pwForm.newPassword) {
      setPwError('请填写旧密码和新密码');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('新密码至少 8 位');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('两次输入的新密码不一致');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/users/me/password', {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowNotification('密码修改成功');
      setTimeout(() => setShowNotification(''), 3000);
    } catch (e: any) {
      setPwError(e.message);
    } finally { setPwSaving(false); }
  };

  // ====== 我的收藏 ======
  const loadFavorites = () => {
    setFavLoading(true);
    api.get('/favorites').then(r => { if (r.success) setFavorites(r.data || []); }).finally(() => setFavLoading(false));
  };
  useEffect(() => { if (activeTab === 'collection') loadFavorites(); }, [activeTab]);
  const removeFavorite = async (caseId: string) => {
    await api.delete(`/favorites/${caseId}`);
    setFavorites(prev => prev.filter(f => f.case_id !== caseId));
  };

  const sidebarItems = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'submissions', label: '我的投稿', icon: Send },
    { id: 'collection', label: '我的收藏', icon: Heart },
    { id: 'security', label: '账号安全', icon: Lock },
  ];

  const loginHistory = profile ? [
    { location: '当前设备', time: profile.verifiedAt ? `实名认证于 ${profile.verifiedAt?.slice(0, 10)}` : '未实名认证', type: 'desktop' },
  ] : [];

  return (
    <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-150px)]">
      <div className="flex gap-8">
        {/* ====== 左侧边栏 ====== */}
        <div className="w-[280px] shrink-0 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-100 to-blue-200">
                <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-sm font-medium text-slate-400 mt-1 uppercase">{displayRole}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-2">{sidebarItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all", activeTab === item.id ? "bg-[#0052cc]/5 text-[#0052cc] font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")}>
                <item.icon className="w-5 h-5 shrink-0" /><span className="text-[14px]">{item.label}</span></button>
            ))}</div>
          </div>
        </div>

        {/* ====== 右侧内容 ====== */}
        <div className="flex-1 space-y-8 animate-in fade-in duration-700 relative">
          {/* 通知 */}
          <AnimatePresence>
            {showNotification && (
              <motion.div initial={{ opacity:0,y:-20,x:'-50%'}} animate={{opacity:1,y:0,x:'-50%'}} exit={{opacity:0,y:-20,x:'-50%'}}
                className="fixed top-24 left-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />{showNotification}</motion.div>
            )}
          </AnimatePresence>

          {/* 我的投稿 */}
          {activeTab === 'submissions' && <MySubmissions />}

          {/* 我的收藏 */}
          {activeTab === 'collection' && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 mb-6"><h1 className="text-3xl font-bold text-slate-900">我的收藏</h1><p className="text-slate-400 text-sm font-medium">您已收藏的案例列表</p></div>
              {favLoading ? (<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" /></div>)
              : favorites.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm"><Star className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="font-medium">暂无收藏</p><p className="text-sm mt-1">浏览案例库时点击星标即可收藏</p></div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((item) => (
                    <div key={item.case_id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <div className="p-5 flex items-start justify-between gap-4">
                        <Link to={`/cases/${item.case_id}`} className="flex-1 min-w-0 space-y-2 group">
                          <div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded">{item.category||'未分类'}</span><span className="text-[10px] text-slate-400">收藏于 {item.favorited_at?.slice(0,10)}</span></div>
                          <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-[#0052cc] transition-colors leading-snug">{item.title}</h3>
                          {item.description && <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>}
                        </Link>
                        <button onClick={()=>removeFavorite(item.case_id)} className="p-2 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 个人资料 */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex flex-col space-y-2"><h1 className="text-3xl font-bold text-slate-900">个人资料</h1><p className="text-slate-400 text-sm font-medium">查看并管理您的个人账户基本信息。</p></div>

              {profileLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" /></div>
              ) : profile ? (
                <>
                  {/* 头像信息卡 */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex items-center justify-between group">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-inner bg-gradient-to-br from-blue-100 to-blue-200">
                        <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-bold text-slate-900">{profile.name}</h3>
                          {profile.status === 'active' && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5"/><span className="text-[10px] font-bold uppercase tracking-wider">已激活</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-8 text-slate-500">
                          {profile.employeeId && <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-400"/><span className="text-sm font-medium">工号：{profile.employeeId}</span></div>}
                          {profile.department && <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/><span className="text-sm font-medium">所属部门：{profile.department}</span></div>}
                        </div>
                      </div>
                    </div>
                    <button onClick={openEdit} className="flex items-center gap-2 px-6 py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-200 transition-all">
                      <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-[#0052cc]"/>编辑信息
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                      {/* 联系方式 */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center gap-3"><Mail className="w-5 h-5 text-[#0052cc]"/><h4 className="font-bold text-slate-900 uppercase tracking-wide text-sm">联系方式</h4></div>
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">电子邮箱</p>
                            <span className="text-slate-800 font-medium">{profile.email}</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">手机号码</p>
                            <span className="text-slate-800 font-medium">{profile.phone || '未设置'}</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">所属机构</p>
                            <span className="text-slate-800 font-medium">{profile.organization || '未设置'}</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">账户角色</p>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">{displayRole}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 信用积分 */}
                    <div className="space-y-8">
                      <div className="bg-[#0052cc] rounded-2xl p-10 text-white shadow-xl shadow-blue-600/20 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="relative z-10 text-center">
                          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">信用积分</p>
                          <span className="text-7xl font-black italic tracking-tighter">{profile.creditScore || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" />
                  <p>正在加载用户信息...</p>
                </div>
              )}

              {/* 编辑信息弹窗 */}
              <AnimatePresence>
                {editing && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="fixed inset-0 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-5">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-slate-900">编辑个人信息</h2>
                          <button onClick={() => setEditing(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">✕</button>
                        </div>
                        {editError && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{editError}</div>}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">姓名</label>
                            <input type="text" value={profile?.name || ''} disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">邮箱</label>
                            <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">手机号</label>
                            <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => setEditing(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">取消</button>
                          <button onClick={handleSaveProfile} disabled={editingSaving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all disabled:opacity-50">
                            {editingSaving ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : '保存修改'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 账号安全 */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="flex flex-col space-y-2"><h1 className="text-3xl font-bold text-slate-900">账号安全</h1><p className="text-slate-400 text-sm font-medium">管理您的登录密码与安全设置。</p></div>

              {/* 修改密码 */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#0052cc]"/>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-sm">修改密码</h4>
                </div>
                <div className="p-10 max-w-lg space-y-5">
                  {pwError && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{pwError}</div>}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">当前密码</label>
                    <input type="password" value={pwForm.oldPassword}
                      onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20 focus:border-[#0052cc]/30 transition-all"
                      placeholder="输入当前密码" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">新密码</label>
                    <input type="password" value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20 focus:border-[#0052cc]/30 transition-all"
                      placeholder="新密码（至少 8 位）" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">确认新密码</label>
                    <input type="password" value={pwForm.confirmPassword}
                      onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc]/20 focus:border-[#0052cc]/30 transition-all"
                      placeholder="再次输入新密码" />
                  </div>
                  <button onClick={handleChangePassword} disabled={pwSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                    {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" />修改中...</> : '确认修改密码'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
