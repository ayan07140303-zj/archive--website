import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Download, Eye, Calendar, FileText } from 'lucide-react';
import { api } from '../api/client';

const AnnouncementDetail: React.FC = () => {
  const { annId } = useParams<{ annId: string }>();
  const [ann, setAnn] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!annId) return;
    // 加载详情
    api.get(`/portal/announcements/${annId}`).then(r => {
      if (r.success) setAnn(r.data);
    });
    // 加载相关公告（同分类或其他）
    api.get('/portal/announcements?pageSize=5').then(r => {
      if (r.success) setRelated((r.data || []).filter((a: any) => a.id !== annId).slice(0, 4));
    });
  }, [annId]);

  if (!ann) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <Link to="/" className="hover:text-[#0052cc]">首页</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">通知公告</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-400 truncate max-w-[300px]">{ann.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* === 左侧：正文区 === */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {/* 标题区 */}
            <div className="p-8 sm:p-12 pb-6 border-b border-slate-50">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 bg-[#0052cc]/10 text-[#0052cc] text-[11px] font-bold rounded">
                  {ann.category || '通知公告'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {ann.title}
              </h1>
              <div className="flex flex-wrap items-center gap-5 mt-6 text-xs font-medium text-slate-400">
                {ann.source && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px]">源</span>
                    {ann.source}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {ann.published_at ? new Date(ann.published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {(ann.view_count || 0).toLocaleString()} 次阅读
                </span>
              </div>
            </div>

            {/* 正文区 — HTML 渲染 */}
            <div className="p-8 sm:p-12">
              <div
                className="prose prose-slate max-w-none
                  prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                  prose-p:text-[15px] prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-4
                  prose-strong:text-slate-800
                  prose-ul:text-slate-600 prose-ul:text-[15px]
                  prose-li:my-1.5
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5"
                dangerouslySetInnerHTML={{ __html: ann.content || '<p class="text-slate-400 italic">暂无正文内容</p>' }}
              />
            </div>

            {/* 附件下载区 — 支持多附件 */}
            {(() => {
              const atts: { name: string; url: string; size?: number }[] = [];
              // 优先用新 JSONB 数组
              if (ann.attachments && Array.isArray(ann.attachments) && ann.attachments.length > 0) {
                atts.push(...ann.attachments);
              } else if (ann.attachment_url) {
                // 向后兼容旧单字段
                atts.push({ name: ann.attachment_name || '附件下载', url: ann.attachment_url });
              }
              if (atts.length === 0) return null;

              return (
                <div className="mx-8 sm:mx-12 mb-10 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">附件下载 ({atts.length})</h4>
                  {atts.map((a: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-[#0052cc]/10 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#0052cc]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{a.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">点击下载查看全文{a.size ? ` · ${a.size > 1048576 ? (a.size/1048576).toFixed(1)+'MB' : (a.size/1024).toFixed(0)+'KB'}` : ''}</p>
                        </div>
                      </div>
                      <a href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all shadow-sm shrink-0">
                        <Download className="w-4 h-4" />下载
                      </a>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 底部分页 */}
          <div className="flex items-center justify-between text-sm">
            <Link to="/" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl font-bold text-slate-500 hover:text-[#0052cc] hover:border-[#0052cc]/20 transition-all shadow-sm">
              ← 返回首页
            </Link>
          </div>
        </div>

        {/* === 右侧：相关公告 === */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#0052cc] rounded-full"></span>
                相关公告
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {related.length > 0 ? related.map((item: any, i: number) => (
                <Link
                  key={item.id}
                  to={`/announcement/${item.id}`}
                  className="block px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-black text-slate-300 mt-0.5 shrink-0">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-700 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        {item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              )) : (
                <p className="px-6 py-8 text-center text-xs text-slate-400">暂无相关公告</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
