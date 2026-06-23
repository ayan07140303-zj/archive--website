import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Zap, User, Lock, ShieldAlert,
  HelpCircle, Home, ChevronRight, EyeOff, Eye,
  CheckCircle2, Globe, Headphones, Mail, Phone, Send,
  AlertCircle, X, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RegisterPageProps {
  onRegister: (data: Record<string, unknown>) => Promise<void>;
  onLoginRequest: () => void;
  onCancel: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onLoginRequest, onCancel }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!name || !department || !email || !phone || !password) {
      setError('请填写所有必填字段'); return;
    }
    if (password.length < 8) {
      setError('密码至少8位字符'); return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致'); return;
    }
    if (!agreeTerms) {
      setError('请同意服务条款和隐私政策'); return;
    }

    setLoading(true);
    try {
      await onRegister({
        realName: name, department, email, phone, password, reason, agreeTerms: true,
      });
    } catch (e: any) {
      setError(e.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex flex-col font-sans text-[#1e293b]">
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
          className="w-full max-w-[1200px] bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex overflow-hidden min-h-[700px] my-auto"
        >
          <div className="hidden lg:flex w-[40%] bg-[#065cc3] p-12 flex-col justify-center text-white relative shrink-0">
            <div className="space-y-12 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><ShieldCheck className="w-7 h-7" /></div>
                <span className="text-2xl font-bold tracking-wide">档案治理平台</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight">全周期档案治理与<br />安全合规体系</h1>
                <p className="text-white/70 text-[15px] leading-relaxed">
                  欢迎加入档案治理平台。我们为授权人员提供严谨的数据管理、审计追踪以及合规性评估工具，确保组织核心数字资产的安全与主权。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></div>
                  <div><h3 className="font-bold mb-1">高等级安全防御</h3><p className="text-[13px] opacity-60">政务级加密与多维度访问控制</p></div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                  <div><h3 className="font-bold mb-1">多级合规性审计</h3><p className="text-[13px] opacity-60">全链条链路追踪与审计闭环</p></div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
          </div>

          <div className="flex-1 p-8 sm:p-12 lg:p-14 flex flex-col justify-center overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1e293b]">申请访问权限</h2>
              <p className="text-[#64748b] text-[14px] mt-2 font-medium">请填写以下信息以提交注册申请。</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">真实姓名 *</label>
                <input type="text" placeholder="请输入姓名" value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">所属部门 / 机构 *</label>
                <input type="text" placeholder="如：合规部" value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full h-11 px-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[13px] font-bold text-[#475569]">电子邮箱（工作邮箱）*</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0052cc] transition-colors"><Mail className="w-5 h-5" /></div>
                  <input type="email" placeholder="email@organization.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[13px] font-bold text-[#475569]">手机号码 *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0052cc] transition-colors"><Phone className="w-5 h-5" /></div>
                  <input type="tel" placeholder="1xx xxxx xxxx" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">设置密码 *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"><Lock className="w-4 h-4" /></div>
                  <input type="password" placeholder="最少8位字符" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">确认密码 *</label>
                <input type="password" placeholder="再次输入密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[13px] font-bold text-[#475569]">申请权限原因</label>
                <textarea rows={3} placeholder="请简述您的业务需求或访问目的..." value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full p-4 bg-[#f1f5f9] border border-transparent rounded-lg text-[14px] focus:outline-none focus:bg-white focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all resize-none" />
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                className="w-5 h-5 rounded border-[#cbd5e1] text-[#0052cc] focus:ring-[#0052cc]/20" />
              <p className="text-[13px] text-[#0f172a] leading-relaxed">
                我已阅读并同意 <button className="text-[#0052cc] font-bold hover:underline">《服务条款》</button> 与 <button className="text-[#0052cc] font-bold hover:underline">《隐私政策》</button> ，并承诺遵守平台治理规范。
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 bg-[#065cc3] hover:bg-[#0052cc] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#065cc3]/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 提交中...</> : <>提交注册申请 <Send className="w-4 h-4 ml-1" /></>}
            </button>

            <div className="text-center pt-8 mt-6">
              <p className="text-[14px] text-[#64748b]">
                已有账号？ <button onClick={onLoginRequest} className="text-[#0052cc] font-bold hover:underline">返回登录</button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-[110]">
            <div className="bg-[#eef2ff] border border-[#0052cc]/20 p-5 rounded-2xl shadow-xl flex items-start gap-4 max-w-[320px] relative">
              <div className="w-10 h-10 rounded-full bg-[#0052cc]/10 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-[#0052cc]" /></div>
              <div className="space-y-1 pr-6">
                <h4 className="text-[14px] font-bold text-[#1e293b]">注册提示</h4>
                <p className="text-[12px] text-[#64748b] leading-relaxed">建议使用企业/机构邮箱注册。</p>
              </div>
              <button onClick={() => setShowToast(false)} className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#1e293b]"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
