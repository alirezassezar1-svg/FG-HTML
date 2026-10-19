import React, { useRef, useState } from 'react';
import { ConversionMode, Language } from '../types';
import { getT } from '../utils/i18n';
import {
  UploadCloud,
  FileArchive,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image,
  Zap,
  Server,
  X,
  Play,
  Check,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface DropZoneProps {
  lang: Language;
  selectedFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onClearFiles: () => void;
  conversionMode: ConversionMode;
  onChangeMode: (mode: ConversionMode) => void;
  onStartConversion: () => void;
  isConverting: boolean;
  hasGithubToken: boolean;
  gitHubRepo?: string;
  onQuickSaveToken?: (token: string) => void;
  onOpenSettings: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  lang,
  selectedFiles,
  onFilesSelected,
  onClearFiles,
  conversionMode,
  onChangeMode,
  onStartConversion,
  isConverting,
  hasGithubToken,
  gitHubRepo = 'alirezassezar1-svg/Forge_html',
  onQuickSaveToken,
  onOpenSettings
}) => {
  const t = getT(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickToken, setQuickToken] = useState('');
  const [showQuickTokenInput, setShowQuickTokenInput] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'zip' || ext === 'tgz' || ext === 'tar') {
      return <FileArchive className="w-4 h-4 text-amber-400" />;
    }
    if (ext === 'csv' || ext === 'tsv' || ext === 'xlsx') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    }
    if (ext === 'html' || ext === 'htm' || ext === 'js' || ext === 'ts' || ext === 'json' || ext === 'jsx' || ext === 'tsx') {
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    }
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || ext === 'svg') {
      return <Image className="w-4 h-4 text-purple-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  const handleSaveQuickToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickToken.trim() && onQuickSaveToken) {
      onQuickSaveToken(quickToken.trim());
      setShowQuickTokenInput(false);
      setQuickToken('');
    }
  };

  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-xl transition-all">
      {/* Mode Selector */}
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--mut)] mb-2 block">
          {lang === 'fa' ? 'انتخاب روش و موتور تبدیل' : 'Select Conversion Engine'}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChangeMode('browser')}
            className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer relative overflow-hidden ${
              conversionMode === 'browser'
                ? 'border-[#4f8cff] bg-[#4f8cff]/10 shadow-md ring-1 ring-[#4f8cff]/30'
                : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--line)]/80 text-[var(--mut)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className={`w-4 h-4 ${conversionMode === 'browser' ? 'text-[#4f8cff]' : 'text-[var(--mut)]'}`} />
              <span className="text-sm font-bold text-[var(--fg)]">
                {t.modeBrowser}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-medium ms-auto">
                {lang === 'fa' ? 'فوری + PWA' : 'Instant + PWA'}
              </span>
            </div>
            <p className="text-xs text-[var(--mut)] leading-relaxed">
              {t.modeBrowserDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('github')}
            className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer relative overflow-hidden ${
              conversionMode === 'github'
                ? 'border-[#4f8cff] bg-[#4f8cff]/10 shadow-md ring-1 ring-[#4f8cff]/30'
                : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--line)]/80 text-[var(--mut)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Server className={`w-4 h-4 ${conversionMode === 'github' ? 'text-[#4f8cff]' : 'text-[var(--mut)]'}`} />
              <span className="text-sm font-bold text-[var(--fg)]">
                {t.modeGithub}
              </span>
              {hasGithubToken ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-medium ms-auto flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {lang === 'fa' ? 'توکن فعال ✓' : 'Token Active'}
                </span>
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickTokenInput(true);
                  }}
                  className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-medium ms-auto underline cursor-pointer"
                >
                  {lang === 'fa' ? 'فعال‌سازی توکن' : 'Activate Token'}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--mut)] leading-relaxed">
              {t.modeGithubDesc}
            </p>
          </button>
        </div>
      </div>

      {/* Quick Token Activation Form */}
      {(!hasGithubToken || showQuickTokenInput) && conversionMode === 'github' && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {lang === 'fa'
                  ? 'فعال‌سازی با توکن گیت‌هاب (اتصال به ' + gitHubRepo + ')'
                  : 'Activate with GitHub Token (Target: ' + gitHubRepo + ')'}
              </span>
            </span>
            <button
              onClick={() => onOpenSettings()}
              className="text-[#4f8cff] hover:underline"
            >
              {lang === 'fa' ? 'تنظیمات پیشرفته' : 'Full Settings'}
            </button>
          </div>
          <form onSubmit={handleSaveQuickToken} className="flex gap-2">
            <input
              type="password"
              value={quickToken}
              onChange={(e) => setQuickToken(e.target.value)}
              placeholder="github_pat_... یا ghp_..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] font-mono text-xs focus:outline-none focus:border-[#4f8cff]"
              dir="ltr"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#4f8cff] text-white font-semibold text-xs hover:bg-[#3d7ae8] transition cursor-pointer"
            >
              {lang === 'fa' ? 'فعال‌سازی' : 'Activate'}
            </button>
          </form>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          isDragOver
            ? 'border-[#4f8cff] bg-[#4f8cff]/10 scale-[1.008]'
            : 'border-[var(--line)] hover:border-[#4f8cff]/60 bg-[var(--bg)]/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-[#4f8cff]/10 text-[#4f8cff] flex items-center justify-center shadow-inner">
          <UploadCloud className="w-7 h-7 stroke-[2]" />
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--fg)] mb-1">
            {t.dropTitle}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--mut)] max-w-md">
            {t.dropSub}
          </p>
        </div>

        {/* PWA & Mobile Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Smartphone className="w-3.5 h-3.5" />
          <span>
            {lang === 'fa'
              ? 'تولید خروجی ۱۰۰٪ PWA • قابلیت نصب مستقل در آیفون و اندروید'
              : 'Outputs 100% Offline PWA • Installs on iPhone & Android'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--mut)]">
            .ZIP
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--mut)]">
            .HTML
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--mut)]">
            .JSX / .TSX
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--mut)]">
            .MD
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--mut)]">
            .CSV
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--line)] text-[var(--mut)]">
            Images
          </span>
        </div>
      </div>

      {/* Selected Files List & Action */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--fg)]">
              {selectedFiles.length} {t.filesSelected}
            </span>
            <button
              onClick={onClearFiles}
              className="text-xs text-[var(--mut)] hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.clearFiles}</span>
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 mb-4 pe-1">
            {selectedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(f.name)}
                  <span className="truncate font-mono text-[var(--fg)]" dir="ltr">
                    {f.name}
                  </span>
                </div>
                <span className="text-[var(--mut)] font-mono text-[11px] shrink-0 ms-2">
                  {formatSize(f.size)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onStartConversion}
            disabled={isConverting}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
              isConverting
                ? 'bg-[#4f8cff]/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#4f8cff] to-[#1f5fe0] hover:shadow-[#4f8cff]/30 active:scale-[0.99] cursor-pointer'
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {isConverting
                ? lang === 'fa'
                  ? 'در حال پردازش و پکیج PWA...'
                  : 'Packaging PWA...'
                : t.btnStartConvert}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
