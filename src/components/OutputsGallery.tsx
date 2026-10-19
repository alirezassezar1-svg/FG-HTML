import React, { useState } from 'react';
import { OutputItem, Language } from '../types';
import { getT } from '../utils/i18n';
import {
  FileCode2,
  Download,
  ExternalLink,
  Smartphone,
  FileText,
  Search,
  Filter,
  CheckCircle,
  X,
  Layers
} from 'lucide-react';

interface OutputsGalleryProps {
  outputs: OutputItem[];
  lang: Language;
  onPreview: (item: OutputItem) => void;
}

export const OutputsGallery: React.FC<OutputsGalleryProps> = ({
  outputs,
  lang,
  onPreview
}) => {
  const t = getT(lang);
  const [searchTerm, setSearchTerm] = useState('');
  const [strategyFilter, setStrategyFilter] = useState<'all' | 'build' | 'static'>('all');
  const [activeReport, setActiveReport] = useState<{ title: string; content: string } | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const filteredOutputs = outputs.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.htmlFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      strategyFilter === 'all'
        ? true
        : strategyFilter === 'build'
        ? item.strategy.includes('build')
        : item.strategy.includes('static');

    return matchesSearch && matchesFilter;
  });

  const handleOpenReport = async (item: OutputItem) => {
    setIsLoadingReport(true);
    try {
      const res = await fetch(`/outputs/${item.reportFile}`);
      if (res.ok) {
        const text = await res.text();
        setActiveReport({ title: item.title, content: text });
      } else {
        setActiveReport({
          title: item.title,
          content: `فایل گزارش پیدا نشد (${res.status})`
        });
      }
    } catch (err: any) {
      setActiveReport({
        title: item.title,
        content: `خطا در دریافت گزارش: ${err.message}`
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header and Filter Controls */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#4f8cff]" />
              <span>{t.galleryTitle}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--mut)] mt-1">
              {t.gallerySubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[var(--mut)] absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'fa' ? 'جستجو در خروجی‌ها...' : 'Search outputs...'}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[#4f8cff]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--line)]">
              <button
                onClick={() => setStrategyFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  strategyFilter === 'all'
                    ? 'bg-[#4f8cff] text-white shadow-sm'
                    : 'text-[var(--mut)] hover:text-[var(--fg)]'
                }`}
              >
                {t.filterAll} ({outputs.length})
              </button>
              <button
                onClick={() => setStrategyFilter('build')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  strategyFilter === 'build'
                    ? 'bg-[#4f8cff] text-white shadow-sm'
                    : 'text-[var(--mut)] hover:text-[var(--fg)]'
                }`}
              >
                Vite / Build
              </button>
              <button
                onClick={() => setStrategyFilter('static')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  strategyFilter === 'static'
                    ? 'bg-[#4f8cff] text-white shadow-sm'
                    : 'text-[var(--mut)] hover:text-[var(--fg)]'
                }`}
              >
                Static
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutputs.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#4f8cff]/50 transition-all shadow-md group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                    item.strategy.includes('build')
                      ? 'bg-[#4f8cff]/15 text-[#4f8cff] border border-[#4f8cff]/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {item.strategy}
                </span>

                <span className="text-xs font-mono font-bold text-emerald-400">
                  {item.sizeMb} MB
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[var(--fg)] group-hover:text-[#4f8cff] transition-colors line-clamp-1 mb-1">
                {item.title}
              </h3>

              {item.description && (
                <p className="text-xs text-[var(--mut)] line-clamp-2 mb-3 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="text-[11px] font-mono text-[var(--mut)] truncate mb-4" dir="ltr">
                {item.htmlFile}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[var(--line)]/60 flex items-center justify-between gap-2">
              <button
                onClick={() => onPreview(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#4f8cff] text-white hover:bg-[#3d7ae8] transition-colors shadow-sm cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t.btnPreview}</span>
              </button>

              <div className="flex items-center gap-1">
                <a
                  href={`/outputs/${item.htmlFile}`}
                  download={item.htmlFile}
                  className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] hover:text-[#4f8cff] hover:border-[#4f8cff]/50 transition-colors"
                  title={t.btnDownload}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`/outputs/${item.htmlFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] hover:text-[#4f8cff] hover:border-[#4f8cff]/50 transition-colors"
                  title={t.btnOpen}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleOpenReport(item)}
                  className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)] transition-colors"
                  title={t.btnReport}
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOutputs.length === 0 && (
        <div className="text-center py-12 text-[var(--mut)] text-sm">
          {lang === 'fa' ? 'هیچ موردی با این فیلتر پیدا نشد.' : 'No matching outputs found.'}
        </div>
      )}

      {/* Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4f8cff]" />
                <h3 className="font-bold text-sm text-[var(--fg)]">
                  {lang === 'fa' ? 'گزارش تبدیل:' : 'Build Report:'} {activeReport.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg text-[var(--mut)] hover:text-[var(--fg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre
                className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-mono leading-relaxed text-[var(--fg)] whitespace-pre-wrap"
                dir="ltr"
              >
                {activeReport.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
