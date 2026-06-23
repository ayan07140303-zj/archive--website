import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, Loader2, CheckCircle2, Clock, ShieldCheck, FileText, X, LogIn } from 'lucide-react';
import { api } from '../api/client';
import FileUploadZone from './FileUploadZone';

const CaseSubmission: React.FC = () => {
  const { user, onLoginRequest } = useOutletContext<{ user: any; onLoginRequest: () => void }>();
  const [form, setForm] = useState({
    title: '', category: '政治建设', achievement_type: '资政服务案例',
    target_audience: '党政领导', consulting_form: '专报',
    description: '', author: '', organization: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user) { onLoginRequest(); return; }
    if (!form.title) { setError('请输入案例标题'); return; }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      await api.uploadForm('/auth/submit', fd, 'POST');
      setSubmitted(true);
      setFiles([]);
    } catch (e: any) { setError(e.message || '提交失败'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">投稿成功！</h2>
        <p className="text-slate-500">您的案例已提交至审核队列，管理员审核通过后将在案例库中展示。</p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 bg-amber-50 border border-amber-100 rounded-xl py-3 px-4 max-w-sm mx-auto">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>预计 1-2 个工作日内完成审核</span>
        </div>
        <button onClick={() => { setSubmitted(false); setForm({ title: '', category: '政治建设', achievement_type: '资政服务案例', target_audience: '党政领导', consulting_form: '专报', description: '', author: '', organization: '' }); }}
          className="px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all">
          继续投稿
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">案例投稿</h1>
        <p className="text-slate-500 mt-1.5 text-sm">提交您的档案案例研究成果，审核通过后将收录至案例库并同步到专题案例库。</p>
      </div>

      {/* Guest 登录提醒 */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn className="w-5 h-5 text-[#0052cc]" />
            <div>
              <p className="text-sm font-bold text-slate-800">登录后即可投稿</p>
              <p className="text-[12px] text-slate-500">需要登录后才能提交案例投稿，点击右上角"登录"或下方按钮</p>
            </div>
          </div>
          <button onClick={onLoginRequest}
            className="px-5 py-2.5 bg-[#0052cc] text-white rounded-xl text-sm font-bold hover:bg-[#0747a6] transition-all shrink-0">
            立即登录
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">案例标题 *</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 transition-all" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="输入案例正式名称" />
          </div>
          {/* 四分类下拉 */}
          <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">主题领域</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['政治建设','经济建设','社会建设','文化建设','生态文明','法治建设','科技创新','应急管理'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">成果类型</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.achievement_type} onChange={e => setForm({ ...form, achievement_type: e.target.value })}>
              {['专题编研成果','定向报送材料','品牌化资政产品','资政服务案例','创新实践案例'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">服务对象</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}>
              {['党政领导','决策部门','基层单位','社会公众'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">资政形式</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.consulting_form} onChange={e => setForm({ ...form, consulting_form: e.target.value })}>
              {['专报','内参','编研成果','展览展示','新媒体产品','数据库/平台'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">作者/团队</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="案例作者" /></div>
          <div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase">机构</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="所属机构" /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">案例简介</label>
            <textarea rows={4} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="简述案例背景、主要内容与研究价值" /></div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase">附件上传（PDF/文档）<span className="text-slate-300 font-normal">（可选）</span></label>
          <FileUploadZone onFilesSelected={list => setFiles(prev => [...prev, ...list])} />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-bold">
                  <FileText className="w-3 h-3 shrink-0" />{f.name}
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 text-emerald-400 hover:text-red-400"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>提交后进入管理员审核队列，通过后自动收录至案例库</span>
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all shadow-lg disabled:opacity-50 shrink-0">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />提交中...</> : <><Send className="w-4 h-4" />提交投稿</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseSubmission;
