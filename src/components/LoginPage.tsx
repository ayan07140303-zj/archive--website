import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, User, Lock, CheckCircle2, Loader2, EyeOff, Eye, HelpCircle, Home } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onCancel: () => void;
  onRegisterRequest: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onCancel, onRegisterRequest }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('请输入邮箱和密码'); return; }
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (e: any) {
      setError(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex flex-col font-sans text-[#1e293b]">
      {/* Header — 与注册页一致 */}
      <header className="h-[72px] flex items-center justify-between px-10 bg-white border-b border-[#e2e8f0] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0052cc] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0052cc]">档案治理平台</span>
        </div>
        <div className="flex items-center gap-8 text-[14px] text-[#64748b]">
          <button onClick={onCancel} className="flex items-center gap-1.5 hover:text-[#0052cc] transition-colors">
            <Home className="w-4 h-4" /> 返回首页
          </button>
          <button className="flex items-center gap-1.5 hover:text-[#0052cc] transition-colors">
            <HelpCircle className="w-4 h-4" /> 帮助中心
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 min-h-0 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[1200px] bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex overflow-hidden min-h-[640px] my-auto"
        >
          {/* 左侧蓝色面板 — 与注册页一致 */}
          <div className="hidden lg:flex w-[40%] bg-[#065cc3] p-12 flex-col justify-center text-white relative shrink-0">
            <div className="space-y-12 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><ShieldCheck className="w-7 h-7" /></div>
                <span className="text-2xl font-bold tracking-wide">档案治理平台</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight">全周期档案治理与<br />安全合规体系</h1>
                <p className="text-white/70 text-[15px] leading-relaxed">
                  欢迎回到档案治理平台。登录后根据账户角色自动进入工作台，管理档案案例与合规审计。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                  <div><h3 className="font-bold mb-1">高等级安全防御</h3><p className="text-[13px] opacity-60">政务级加密与多维度访问控制</p></div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Zap className="w-5 h-5" /></div>
                  <div><h3 className="font-bold mb-1">智能角色识别</h3><p className="text-[13px] opacity-60">登录自动匹配权限，进入对应工作台</p></div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
          </div>

          {/* 右侧表单 — 与注册页等宽区域一致 */}
          <div className="flex-1 p-8 sm:p-12 lg:p-14 flex flex-col justify-center overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1e293b]">欢迎登录</h2>
              <p className="text-[#64748b] text-[14px] mt-2 font-medium">请使用您的邮箱和密码登录，系统自动识别角色。</p>
            </div>

            <div className="space-y-5 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">电子邮箱（工作邮箱）</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0052cc] transition-colors"><User className="w-5 h-5" /></div>
                  <input type="text" placeholder="email@organization.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">登录密码</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0052cc] transition-colors"><Lock className="w-5 h-5" /></div>
                  <input type={showPassword ? 'text' : 'password'} placeholder="请输入密码"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full h-11 pl-12 pr-12 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
                  <button onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0052cc] transition-colors">
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                className="w-full h-12 bg-[#065cc3] hover:bg-[#0052cc] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#065cc3]/20 active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? '登录中...' : '登录'}
              </button>

              <div className="text-center pt-8 mt-4">
                <p className="text-[14px] text-[#64748b]">
                  还没有账号？ <button onClick={onRegisterRequest} className="text-[#0052cc] font-bold hover:underline">注册新账号</button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer — 与注册页一致 */}
      <footer className="h-16 flex items-center justify-between px-10 text-[12px] text-[#94a3b8] shrink-0 border-t border-[#e2e8f0] bg-white">
        <div className="flex items-center gap-6">
          <span>© 2026 档案治理平台. 版权所有</span>
          <div className="flex items-center gap-3">
            <button className="hover:text-[#1e293b]">服务条款</button>
            <span className="opacity-30">|</span>
            <button className="hover:text-[#1e293b]">隐私政策</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />安全登录</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />自动识别角色</div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
