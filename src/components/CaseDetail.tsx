import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Download, FileText, Image, FileSpreadsheet,
  Calendar, User, Loader2, Eye, Printer, Star, LogIn
} from 'lucide-react';
import { api } from '../api/client';
import { cn } from '../lib/utils';

const CaseDetail: React.FC = () => {
  const { caseId, topicId } = useParams();
  const { user, onLoginRequest } = useOutletContext<{ user: any; onLoginRequest: () => void }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedCases, setRelatedCases] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (topicId) {
      api.get(`/library/topics/${topicId}`).then(r => {
        if (r.success && r.data) setTopicTitle(r.data.title || '');
      }).catch(() => {});
    }
  }, [topicId]);

  useEffect(() => {
    if (!caseId) return;
    if (fetchedRef.current === caseId) return;
    fetchedRef.current = caseId;

    setLoading(true);
    Promise.all([
      api.get(`/cases/${caseId}`),
      api.get(`/cases?pageSize=4&status=open`),
      api.get(`/favorites/${caseId}/status`).catch(() => ({ success: false, data: { favorited: false } })),
    ]).then(([detail, rel, favStatus]) => {
      if (detail.success) setData(detail.data);
      if (rel.success) setRelatedCases((rel.data || []).filter((c: any) => c.id !== caseId).slice(0, 3));
      if (favStatus.success) setFavorited(favStatus.data.favorited);
    }).finally(() => setLoading(false));

    api.post(`/cases/${caseId}/view`).catch(() => {});
  }, [caseId]);

  const toggleFavorite = async () => {
    if (!caseId) return;
    setFavLoading(true);
    try {
      if (favorited) { await api.delete(`/favorites/${caseId}`); setFavorited(false); }
      else { await api.post(`/favorites/${caseId}`); setFavorited(true); }
    } catch { /* ignore */ }
    setFavLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="w-8 h-8 animate-spin text-[#0052cc]" />
    </div>
  );
  if (!data) return (
    <div className="text-center py-40">
      <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
      <p className="text-slate-500 text-lg font-medium">案例不存在或无权查看</p>
      <Link to="/cases" className="inline-block mt-6 px-6 py-2.5 bg-[#0052cc] text-white rounded-xl font-bold text-sm hover:bg-[#0747a6] transition-all">返回案例库</Link>
    </div>
  );

  const statusLabel = (s: string) => ({ open:'开放', completed:'已完结' } as any)[s] || s;
  const statusColor = (s: string) => s==='open'?'bg-blue-50 text-blue-600':'bg-emerald-50 text-emerald-600';
  const priorityLabel = (p: string) => p==='high'?'高优先级':p==='medium'?'中优先级':'低优先级';
  const files = data.files || [];

  const formatBytes = (n: number) => {
    if (!n) return '';
    if (n < 1048576) return `${(n/1024).toFixed(1)} KB`;
    return `${(n/1048576).toFixed(1)} MB`;
  };

  // 文件类型图标判定
  const isImageExt = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
  const isSpreadsheetExt = (name: string) => /\.(xls|xlsx|csv)$/i.test(name);

  // 文件预览类型判定
  const isPreviewableImg = (name: string) => isImageExt(name);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* 面包屑 — 根据来源区分 */}
      <nav className="flex items-center gap-1 text-xs font-medium text-slate-400 flex-wrap">
        <Link to="/" className="hover:text-[#0052cc] transition-colors">首页</Link>
        {topicId ? (
          <>
            <ChevronRight className="w-3 h-3 mx-0.5" />
            <Link to="/library" className="hover:text-[#0052cc] transition-colors">专题案例库</Link>
            {topicTitle && (
              <>
                <ChevronRight className="w-3 h-3 mx-0.5" />
                <Link to={`/library/${topicId}`} className="hover:text-[#0052cc] transition-colors truncate max-w-[160px]">{topicTitle}</Link>
              </>
            )}
          </>
        ) : (
          <>
            <ChevronRight className="w-3 h-3 mx-0.5" />
            <Link to="/cases" className="hover:text-[#0052cc] transition-colors">案例库</Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 mx-0.5" />
        <span className="text-slate-600 truncate max-w-[300px]">{data.title}</span>
      </nav>

      {/* Guest 登录提醒 */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn className="w-5 h-5 text-[#0052cc]" />
            <div>
              <p className="text-sm font-bold text-slate-800">登录享受完整服务</p>
              <p className="text-[12px] text-slate-500">登录后即可查看完整案例信息、下载附件并使用收藏功能</p>
            </div>
          </div>
          <button onClick={onLoginRequest}
            className="px-5 py-2.5 bg-[#0052cc] text-white rounded-xl text-sm font-bold hover:bg-[#0747a6] transition-all shrink-0">
            立即登录
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ====== 左侧主内容区 ====== */}
        <div className="lg:col-span-3 space-y-6">
          {/* 标题卡片 */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-slate-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                  <span className="px-2.5 py-1 bg-[#0052cc]/10 text-[#0052cc] text-[11px] font-bold rounded-md">{data.category || '未分类'}</span>
                  <span className={cn("px-2.5 py-1 text-[11px] font-bold rounded-md", statusColor(data.status))}>{statusLabel(data.status)}</span>
                  <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded",
                    data.priority==='high'?"bg-red-50 text-red-600":"bg-slate-100 text-slate-500")}>{priorityLabel(data.priority)}</span>
                </div>
                <button onClick={toggleFavorite} disabled={favLoading}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0",
                    favorited ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                    : "border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50"
                  )}>
                  <Star className={cn("w-4 h-4", favorited && "fill-amber-400 text-amber-400")} />
                  {favorited ? '已收藏' : '收藏'}
                </button>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">{data.title}</h1>
              <div className="flex flex-wrap items-center gap-5 text-[13px] text-slate-400">
                {data.assignee_name && (
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-300" />
                    <span className="text-slate-600 font-medium">{data.assignee_name}</span></span>
                )}
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-300" />{data.created_at?.slice(0, 10)}</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-slate-300" />{(data.view_count || 0).toLocaleString()} 次浏览</span>
                <span className="font-mono text-[11px] font-bold text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded">{data.case_number}</span>
              </div>
            </div>

            <div className="px-8 py-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
                <span className="w-1 h-5 bg-[#0052cc] rounded-full" />案例摘要</h2>
              {data.description ? (
                <div className="prose prose-slate max-w-none text-[15px] text-slate-600 leading-relaxed space-y-4">
                  {data.description.split('\n').map((p: string, i: number) => (<p key={i}>{p}</p>))}
                </div>
              ) : (<p className="text-slate-400 text-sm italic">暂无案例摘要信息</p>)}
            </div>

            <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/50">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
                <span className="w-1 h-5 bg-[#0052cc] rounded-full" />案例信息</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[['主题领域', data.category || '—'], ['成果类型', data.achievement_type || '—'],
                  ['服务对象', data.target_audience || '—'], ['资政形式', data.consulting_form || '—'],
                  ['收录日期', data.created_at?.slice(0, 10) || '—'],
                  ['最后更新', data.updated_at?.slice(0, 10) || data.created_at?.slice(0, 10) || '—'],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-white rounded-xl border border-slate-100 px-4 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-700">{value}</p>
                  </div>))}
              </div>
            </div>
          </div>

          {/* 附件区 — 多格式图标 */}
          {files.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="w-1 h-5 bg-[#0052cc] rounded-full" />附件文件
                  <span className="text-xs font-normal text-slate-400 ml-1">({files.length}个)</span>
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {files.map((f: any, i: number) => {
                  const isImg = isImageExt(f.file_name || '');
                  const isSheet = isSpreadsheetExt(f.file_name || '');
                  return (
                    <div key={f.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-bold text-slate-300 w-5 shrink-0">{(i+1).toString().padStart(2,'0')}</span>
                        {isImg ? <Image className="w-5 h-5 text-emerald-500 shrink-0" />
                          : isSheet ? <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
                          : <FileText className="w-5 h-5 text-[#0052cc] shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 group-hover:text-[#0052cc] transition-colors truncate">{f.file_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{formatBytes(f.file_size)}{f.file_type ? ` · ${f.file_type}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-6">
                        <button onClick={() => {
                          if (!user) { onLoginRequest(); return; }
                          setPreviewFile(previewFile?.url === f.storage_url ? null : { name: f.file_name, url: f.storage_url });
                        }}
                          className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm",
                            previewFile?.url === f.storage_url
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-[#0052cc] text-white hover:bg-[#0747a6]"
                          )}>
                          <Eye className="w-3.5 h-3.5" />{previewFile?.url === f.storage_url ? '收起' : '预览'}
                        </button>
                        <button onClick={() => {
                          if (!user) { onLoginRequest(); return; }
                          window.open(f.storage_url + '?download=1', '_blank');
                        }}
                          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:border-[#0052cc]/30 hover:text-[#0052cc] hover:bg-blue-50/50 transition-all">
                          <Download className="w-3.5 h-3.5" />下载
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 内嵌预览区 — 仅 PDF 和图片支持在线预览，其他自动下载 */}
          {previewFile && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-[#0052cc] shrink-0" />
                  <span className="text-sm font-bold text-slate-700 truncate">{previewFile.name}</span>
                </div>
                <button onClick={() => {
                  if (!user) { onLoginRequest(); return; }
                  window.open(previewFile.url + '?download=1', '_blank');
                }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0052cc] text-white rounded-lg text-xs font-bold hover:bg-[#0747a6] transition-all shadow-sm">
                  <Download className="w-3.5 h-3.5" />下载
                </button>
              </div>
              {isPreviewableImg(previewFile.name) ? (
                <div className="flex items-center justify-center p-8 bg-slate-100">
                  <img src={previewFile.url} alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-slate-200" />
                </div>
              ) : /\.(pdf)$/i.test(previewFile.name) ? (
                <iframe src={previewFile.url} className="w-full border-0"
                  style={{ height: '80vh', minHeight: '500px' }} title={previewFile.name} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-5">
                  <FileText className="w-16 h-16 opacity-15" />
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-600">
                      {/\.(doc|docx|xls|xlsx|ppt|pptx|csv|txt)$/i.test(previewFile.name)
                        ? `${(previewFile.name.match(/\.(\w+)$/i) || ['', ''])[1].toUpperCase()} 格式文件`
                        : '此文件格式'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {/\.(doc|docx)$/i.test(previewFile.name) ? 'Word 文档需下载后用 Microsoft Word 或 WPS 打开'
                       : /\.(xls|xlsx)$/i.test(previewFile.name) ? 'Excel 表格需下载后用 Excel 或 WPS 打开'
                       : /\.(ppt|pptx)$/i.test(previewFile.name) ? 'PPT 演示文稿需下载后打开'
                       : '暂不支持在线预览，请下载后查看'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={previewFile.url} download={previewFile.name}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] text-white rounded-xl text-xs font-bold hover:bg-[#0747a6] transition-all shadow-sm">
                      <Download className="w-3.5 h-3.5" />下载查看
                    </a>
                    <a href={previewFile.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-[#0052cc]/30 hover:text-[#0052cc] transition-all">
                      新窗口打开
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====== 右侧边栏 ====== */}
        <aside className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
            <button onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" />打印案例</button>
            <Link to="/cases"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0052cc] text-white rounded-xl text-sm font-bold hover:bg-[#0747a6] transition-all shadow-sm">
              <ChevronLeft className="w-4 h-4" />返回案例库</Link>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">案例标签</h3>
            <div className="flex flex-wrap gap-2">
              {[data.category, data.achievement_type, data.target_audience, data.consulting_form].filter(Boolean)
                .map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[11px] font-medium hover:bg-[#0052cc]/5 hover:text-[#0052cc] hover:border-[#0052cc]/20 transition-colors cursor-default">{tag}</span>))}
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">案例统计</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#0052cc]">{(data.view_count || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">浏览次数</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#0052cc]">{files.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">附件数量</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#0052cc]">{data.created_at?.slice(0, 7).replace('-', '年')}月</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">收录时间</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-[#0052cc]">{statusLabel(data.status)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">当前状态</p>
              </div>
            </div>
          </div>
          {relatedCases.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">相关案例</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {relatedCases.map((item: any) => (
                  <Link key={item.id} to={`/cases/${item.id}`} className="block px-5 py-3.5 hover:bg-slate-50/50 transition-colors group">
                    <p className="text-[13px] font-bold text-slate-700 group-hover:text-[#0052cc] transition-colors leading-snug line-clamp-2">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">{item.category} · {item.created_at?.slice(0, 10)}</p>
                  </Link>))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CaseDetail;
