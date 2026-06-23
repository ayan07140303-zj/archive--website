import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFilesSelected, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList);

    // 显示上传进度动画
    const sims: UploadingFile[] = newFiles.map((f, i) => ({
      id: `${Date.now()}_${i}`,
      name: f.name,
      progress: 0,
    }));
    setUploadingFiles(prev => [...prev, ...sims]);

    // 模拟进度（实际上传在 CaseManagementModal 的 handleCreate 里执行）
    sims.forEach(sim => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 25 + 10;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== sim.id));
          }, 800);
        }
        setUploadingFiles(prev => prev.map(p => p.id === sim.id ? { ...p, progress: Math.min(prog, 100) } : p));
      }, 200);
    });

    // 实际文件传给父组件
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
          isDragging ? "border-[#0052cc] bg-blue-50/50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
        )}
      >
        <input
          type="file" multiple
          className="hidden" ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all",
          isDragging ? "scale-110 bg-[#0052cc] text-white shadow-lg" : "bg-blue-50 text-[#0052cc]"
        )}>
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">点击或拖拽文件至此处</h3>
        <p className="text-slate-400 text-xs">支持 PDF, Word, JPG, PNG (单文件 ≤ 50MB)</p>
      </div>

      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
            {uploadingFiles.map(f => (
              <div key={f.id} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#0052cc] tabular-nums shrink-0 ml-2">{Math.round(f.progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.progress}%` }}
                    className="h-full bg-gradient-to-r from-[#0052cc] to-blue-400"
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadZone;
