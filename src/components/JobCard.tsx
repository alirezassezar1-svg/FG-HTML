import React, { useState } from 'react';
import { ConversionJob, Language } from '../types';
import { getT } from '../utils/i18n';
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  Share2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Zap,
  Server
} from 'lucide-react';

interface JobCardProps {
  job: ConversionJob;
  lang: Language;
  onPreview: (job: ConversionJob) => void;
  onDownload: (job: ConversionJob) => void;
  onShare: (job: ConversionJob) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  lang,
  onPreview,
  onDownload,
  onShare
}) => {
  const t = getT(lang);
  const [showReport, setShowReport] = useState(false);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isBusy =
    job.status === 'reading' ||
    job.status === 'processing' ||
    job.status === 'uploading' ||
    job.status === 'queued' ||
    job.status === 'running';

  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 transition-all shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              job.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : job.status === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-[#4f8cff]/10 text-[#4f8cff] border border-[#4f8cff]/20'
            }`}
          >
            {job.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : job.status === 'error' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <FileCode className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <h3
              className="text-sm sm:text-base font-bold text-[var(--fg)] truncate font-mono"
              dir="ltr"
            >
              {job.fileName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--mut)] flex-wrap">
              <span>{formatSize(job.fileSize)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                {job.mode === 'browser' ? (
                  <>
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{lang === 'fa' ? 'مرورگر (آفلاین)' : 'In-Browser'}</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3 h-3 text-[#4f8cff]" />
                    <span>GitHub Actions</span>
                  </>
                )}
              </span>
              {job.htmlSize && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    {lang === 'fa' ? 'خروجی:' : 'Output:'} {formatSize(job.htmlSize)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              job.status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : job.status === 'error'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-[#4f8cff]/15 text-[#4f8cff] border border-[#4f8cff]/30 animate-pulse'
            }`}
          >
            {job.status === 'completed'
              ? lang === 'fa'
                ? 'آماده شد ✓'
                : 'Completed ✓'
              : job.status === 'error'
              ? lang === 'fa'
                ? 'خطا رخ داد'
                : 'Failed'
              : job.progressMsg}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {isBusy && (
        <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden my-3 relative">
          <div className="h-full bg-gradient-to-r from-[#4f8cff] to-[#3ecf8e] rounded-full w-2/5 animate-progress-slide" />
        </div>
      )}

      {/* Error Message */}
      {job.status === 'error' && job.errorMsg && (
        <div className="my-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono leading-relaxed overflow-x-auto">
          {job.errorMsg}
        </div>
      )}

      {/* Action Buttons */}
      {job.status === 'completed' && job.htmlBlobUrl && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--line)]/60 mt-3">
          <button
            onClick={() => onPreview(job)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#4f8cff] text-white hover:bg-[#3d7ae8] transition-colors shadow-sm cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t.btnPreview}</span>
          </button>

          <button
            onClick={() => onDownload(job)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--fg)] hover:border-[#4f8cff]/50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#4f8cff]" />
            <span>{t.btnDownload}</span>
          </button>

          <a
            href={job.htmlBlobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--fg)] hover:border-[#4f8cff]/50 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--mut)]" />
            <span>{t.btnOpen}</span>
          </a>

          <button
            onClick={() => onShare(job)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--fg)] hover:border-[#4f8cff]/50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--mut)]" />
            <span>{t.btnShare}</span>
          </button>

          {job.reportText && (
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-[var(--mut)] hover:text-[var(--fg)] ms-auto transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.btnReport}</span>
              {showReport ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Expandable Report */}
      {showReport && job.reportText && (
        <div className="mt-3 pt-3 border-t border-[var(--line)]">
          <div className="flex items-center justify-between text-xs text-[var(--mut)] mb-1.5 font-mono">
            <span>anyhtml conversion report:</span>
          </div>
          <pre
            className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[11px] font-mono leading-relaxed text-[var(--fg)] overflow-x-auto max-h-48 whitespace-pre-wrap"
            dir="ltr"
          >
            {job.reportText}
          </pre>
        </div>
      )}
    </div>
  );
};
