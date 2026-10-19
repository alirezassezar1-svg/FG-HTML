import React, { useState, useEffect } from 'react';
import {
  ConversionJob,
  ConversionMode,
  GitHubConfig,
  Language,
  OutputItem,
  Theme
} from './types';
import { getT } from './utils/i18n';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { JobCard } from './components/JobCard';
import { PreviewModal } from './components/PreviewModal';
import { OutputsGallery } from './components/OutputsGallery';
import { RepoConverter } from './components/RepoConverter';
import { SettingsModal } from './components/SettingsModal';
import { LiveCodeStudio } from './components/LiveCodeStudio';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EXISTING_OUTPUTS } from './data/existingOutputs';
import { convertInBrowser } from './utils/inBrowserConverter';
import { packageAsPWA } from './utils/pwaPackager';
import {
  uploadToInbox,
  pollActionsRunAndOutput,
  testGitHubConnection
} from './utils/github';
import {
  FileCode2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Info,
  Code2
} from 'lucide-react';

export const App: React.FC = () => {
  // Localization & Theme
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('anyhtml_lang') as Language) || 'fa';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('anyhtml_theme') as Theme) || 'dark';
  });

  // Active Tab: convert | code | repos | outputs | settings
  const [activeTab, setActiveTab] = useState<'convert' | 'code' | 'repos' | 'outputs' | 'settings'>('convert');

  // File Conversion State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [conversionMode, setConversionMode] = useState<ConversionMode>('browser');
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  // GitHub Settings State (Defaulting to the imported repo)
  const [gitHubConfig, setGitHubConfig] = useState<GitHubConfig>(() => {
    const repo = localStorage.getItem('anyhtml_repo') || 'alirezassezar1-svg/Forge_html';
    const token = localStorage.getItem('anyhtml_tok') || '';
    return {
      repo,
      token,
      isConnected: false,
      canWrite: false,
      statusMessage: ''
    };
  });

  // Preview Modal State
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    title: string;
    htmlUrl: string;
    downloadName: string;
  }>({
    isOpen: false,
    title: '',
    htmlUrl: '',
    downloadName: ''
  });

  const t = getT(lang);

  // Apply language direction to document
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    localStorage.setItem('anyhtml_lang', lang);
  }, [lang]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('anyhtml_theme', theme);
  }, [theme]);

  // Test GitHub PAT on initial load if stored
  useEffect(() => {
    if (gitHubConfig.repo && gitHubConfig.token) {
      testGitHubConnection(gitHubConfig).then((res) => {
        setGitHubConfig((prev) => ({
          ...prev,
          isConnected: res.ok,
          canWrite: !!res.canWrite,
          defaultBranch: res.defaultBranch,
          statusMessage: res.message
        }));
      });
    }
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };

  const handleSaveConfig = (newConfig: GitHubConfig) => {
    setGitHubConfig(newConfig);
    localStorage.setItem('anyhtml_repo', newConfig.repo);
    localStorage.setItem('anyhtml_tok', newConfig.token);
  };

  const handleQuickSaveToken = async (newToken: string) => {
    const newConfig: GitHubConfig = {
      ...gitHubConfig,
      token: newToken.trim()
    };
    handleSaveConfig(newConfig);
    const res = await testGitHubConnection(newConfig);
    setGitHubConfig((prev) => ({
      ...prev,
      isConnected: res.ok,
      canWrite: !!res.canWrite,
      defaultBranch: res.defaultBranch,
      statusMessage: res.message
    }));
  };

  const handleClearConfig = () => {
    localStorage.removeItem('anyhtml_repo');
    localStorage.removeItem('anyhtml_tok');
    setGitHubConfig({
      repo: 'alirezassezar1-svg/Forge_html',
      token: '',
      isConnected: false,
      canWrite: false,
      statusMessage: ''
    });
  };

  // Main Conversion Pipeline
  const handleStartConversion = async () => {
    if (selectedFiles.length === 0 || isConverting) return;

    if (conversionMode === 'github' && (!gitHubConfig.repo || !gitHubConfig.token)) {
      setActiveTab('settings');
      return;
    }

    setIsConverting(true);
    const filesToConvert = [...selectedFiles];
    setSelectedFiles([]);

    for (const file of filesToConvert) {
      const jobId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
      const newJob: ConversionJob = {
        id: jobId,
        fileName: file.name,
        fileSize: file.size,
        status: 'reading',
        mode: conversionMode,
        progressMsg: lang === 'fa' ? 'در حال خواندن فایل...' : 'Reading file...',
        downloadName: file.name.replace(/\.[^.]+$/, '') + '.html',
        createdAt: Date.now()
      };

      setJobs((prev) => [newJob, ...prev]);

      try {
        if (conversionMode === 'browser') {
          // DIRECT IN-BROWSER CONVERSION
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: 'processing',
                    progressMsg:
                      lang === 'fa'
                        ? 'در حال تحلیل، رندر و بسته‌بندی PWA...'
                        : 'Analyzing, rendering & PWA packaging...'
                  }
                : j
            )
          );

          const result = await convertInBrowser(file);
          const blobUrl = URL.createObjectURL(result.blob);

          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: 'completed',
                    progressMsg: lang === 'fa' ? 'آماده شد (PWA) ✓' : 'PWA Ready ✓',
                    htmlBlob: result.blob,
                    htmlBlobUrl: blobUrl,
                    htmlSize: result.sizeBytes,
                    downloadName: result.fileName,
                    reportText: result.report,
                    strategy: result.strategy,
                    finishedAt: Date.now()
                  }
                : j
            )
          );
        } else {
          // GITHUB ACTIONS CONVERSION PIPELINE
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: 'uploading',
                    progressMsg:
                      lang === 'fa'
                        ? 'در حال ارسال فایل به ریپو (inbox)...'
                        : 'Uploading to inbox/...'
                  }
                : j
            )
          );

          const { stem, branch } = await uploadToInbox(
            file,
            gitHubConfig,
            (msg) => {
              setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, progressMsg: msg } : j))
              );
            }
          );

          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: 'queued',
                    progressMsg:
                      lang === 'fa'
                        ? 'در صف اجرای GitHub Actions...'
                        : 'Queued in GitHub Actions...'
                  }
                : j
            )
          );

          const { htmlBlob, htmlText, reportText } = await pollActionsRunAndOutput(
            stem,
            branch,
            gitHubConfig,
            (statusMsg) => {
              setJobs((prev) =>
                prev.map((j) =>
                  j.id === jobId
                    ? {
                        ...j,
                        status: 'running',
                        progressMsg: statusMsg
                      }
                    : j
                )
              );
            }
          );

          // Package remote HTML as standalone PWA
          const pwaHtml = packageAsPWA(htmlText, {
            title: stem,
            themeColor: '#0b0d12'
          });
          const finalBlob = new Blob([pwaHtml], { type: 'text/html;charset=utf-8' });
          const blobUrl = URL.createObjectURL(finalBlob);

          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: 'completed',
                    progressMsg: lang === 'fa' ? 'آماده شد (PWA) ✓' : 'PWA Ready ✓',
                    htmlBlob: finalBlob,
                    htmlBlobUrl: blobUrl,
                    htmlSize: finalBlob.size,
                    downloadName: `${stem}.html`,
                    reportText,
                    finishedAt: Date.now()
                  }
                : j
            )
          );
        }
      } catch (err: any) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status: 'error',
                  progressMsg: lang === 'fa' ? 'خطا در تبدیل' : 'Conversion failed',
                  errorMsg: err.message || String(err)
                }
              : j
          )
        );
      }
    }

    setIsConverting(false);
  };

  const handlePreviewJob = (job: ConversionJob) => {
    if (!job.htmlBlobUrl) return;
    setPreviewData({
      isOpen: true,
      title: job.fileName,
      htmlUrl: job.htmlBlobUrl,
      downloadName: job.downloadName
    });
  };

  const handlePreviewOutput = (item: OutputItem) => {
    setPreviewData({
      isOpen: true,
      title: item.title,
      htmlUrl: `/outputs/${item.htmlFile}`,
      downloadName: item.htmlFile
    });
  };

  const handlePreviewCustom = (title: string, htmlUrl: string, downloadName: string) => {
    setPreviewData({
      isOpen: true,
      title,
      htmlUrl,
      downloadName
    });
  };

  const handleDownloadJob = (job: ConversionJob) => {
    if (!job.htmlBlobUrl) return;
    const a = document.createElement('a');
    a.href = job.htmlBlobUrl;
    a.download = job.downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareJob = async (job: ConversionJob) => {
    if (!job.htmlBlob) {
      if (job.htmlBlobUrl) {
        window.open(job.htmlBlobUrl, '_blank');
      }
      return;
    }

    try {
      const file = new File([job.htmlBlob], job.downloadName, { type: 'text/html' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: job.fileName,
          text: `Converted with AnyHTML (PWA): ${job.fileName}`
        });
      } else {
        handleDownloadJob(job);
      }
    } catch {
      handleDownloadJob(job);
    }
  };

  const handleRepoConverted = (
    repoName: string,
    htmlBlob: Blob,
    htmlText: string,
    report: string
  ) => {
    // Ensure repo output is packaged as PWA
    const pwaHtml = packageAsPWA(htmlText, {
      title: repoName,
      themeColor: '#0b0d12'
    });
    const finalBlob = new Blob([pwaHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(finalBlob);

    const newJob: ConversionJob = {
      id: Date.now().toString(36),
      fileName: `${repoName}.zip`,
      fileSize: finalBlob.size,
      status: 'completed',
      mode: 'browser',
      progressMsg: lang === 'fa' ? 'تبدیل به PWA شد ✓' : 'PWA Converted ✓',
      htmlBlob: finalBlob,
      htmlBlobUrl: blobUrl,
      htmlSize: finalBlob.size,
      downloadName: `${repoName}.html`,
      reportText: report,
      strategy: 'static / pwa',
      createdAt: Date.now(),
      finishedAt: Date.now()
    };
    setJobs((prev) => [newJob, ...prev]);
    setActiveTab('convert');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      {/* Header */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isGitHubConnected={gitHubConfig.isConnected}
        outputsCount={EXISTING_OUTPUTS.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Tab 1: File Converter */}
        {activeTab === 'convert' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Drop Zone & File Selector */}
            <DropZone
              lang={lang}
              selectedFiles={selectedFiles}
              onFilesSelected={handleFilesSelected}
              onClearFiles={handleClearFiles}
              conversionMode={conversionMode}
              onChangeMode={setConversionMode}
              onStartConversion={handleStartConversion}
              isConverting={isConverting}
              hasGithubToken={gitHubConfig.isConnected}
              gitHubRepo={gitHubConfig.repo}
              onQuickSaveToken={handleQuickSaveToken}
              onOpenSettings={() => setActiveTab('settings')}
            />

            {/* Jobs List */}
            {jobs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--fg)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4f8cff]" />
                    <span>{t.jobsTitle}</span>
                  </h2>
                  <span className="text-xs text-[var(--mut)] font-mono">
                    {jobs.length} {lang === 'fa' ? 'مورد' : 'items'}
                  </span>
                </div>

                <div className="space-y-3">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      lang={lang}
                      onPreview={handlePreviewJob}
                      onDownload={handleDownloadJob}
                      onShare={handleShareJob}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Feature Highlights Card */}
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--fg)] mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#4f8cff]" />
                <span>
                  {lang === 'fa'
                    ? 'سازوکار رندر تمیز و تولید PWA در AnyHTML'
                    : 'Clean Rendering & PWA Architecture in AnyHTML'}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[var(--mut)]">
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1">
                  <div className="font-semibold text-[var(--fg)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>1. {lang === 'fa' ? 'خروجی ۱۰۰٪ PWA آفلاین' : '100% Offline PWA'}</span>
                  </div>
                  <p>
                    {lang === 'fa'
                      ? 'تمامی فایل‌های خروجی شامل منیفست درون‌خطی، سرویس‌ورکر کش آفلاین و آیکون مستقل بوده و مستقیماً روی صفحه اصلی آیفون و اندروید نصب می‌شوند.'
                      : 'All output HTML files embed an inlined manifest, offline caching service worker, and app icon, installing seamlessly on iOS & Android.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1">
                  <div className="font-semibold text-[var(--fg)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4f8cff]" />
                    <span>2. {lang === 'fa' ? 'رندر کدهای ری‌اکت و کامپوننت‌ها' : 'Live React & Component Rendering'}</span>
                  </div>
                  <p>
                    {lang === 'fa'
                      ? 'کدهای JSX/TSX و کامپوننت‌های مدرن ری‌اکت با بابل و استایل‌های Tailwind درون صفحه کامپایل شده و در کانتینر ایزوله اجرا می‌گردند.'
                      : 'Compiles JSX/TSX on the fly with inlined Babel Standalone, Tailwind CSS, and ErrorBoundary protection.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1">
                  <div className="font-semibold text-[var(--fg)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>3. {lang === 'fa' ? 'سایت‌های چندصفحه‌ای و استاتیک' : 'Static & Multi-page Inliner'}</span>
                  </div>
                  <p>
                    {lang === 'fa'
                      ? 'همه‌ی فایل‌های CSS، اسکریپت‌های محلی، فونت‌ها و تصاویر به کدهای درون‌خطی و Data-URI تبدیل می‌شوند.'
                      : 'Inlines all stylesheets, local scripts, fonts, and images into Base64 data URIs.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1">
                  <div className="font-semibold text-[var(--fg)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>4. {lang === 'fa' ? 'اتصال هوشمند به گیت‌هاب' : 'GitHub Token & Actions Integration'}</span>
                  </div>
                  <p>
                    {lang === 'fa'
                      ? 'پروژه‌های بسیار سنگین و مخازن گیت‌هاب از طریق توکن با خط لوله اتوماتیک بیلد و خروجی تک‌فایل تحویل داده می‌شوند.'
                      : 'Heavy build projects and repositories compile via GitHub Actions pipeline into standalone files.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Code & PWA Studio */}
        {activeTab === 'code' && (
          <LiveCodeStudio
            lang={lang}
            onPreviewInModal={handlePreviewCustom}
          />
        )}

        {/* Tab 3: GitHub Repos */}
        {activeTab === 'repos' && (
          <RepoConverter
            lang={lang}
            githubToken={gitHubConfig.token}
            defaultUsername={gitHubConfig.repo.split('/')[0] || 'alirezassezar1-svg'}
            onRepoConverted={handleRepoConverted}
          />
        )}

        {/* Tab 4: Outputs Gallery */}
        {activeTab === 'outputs' && (
          <OutputsGallery
            outputs={EXISTING_OUTPUTS}
            lang={lang}
            onPreview={handlePreviewOutput}
          />
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <SettingsModal
            config={gitHubConfig}
            onSaveConfig={handleSaveConfig}
            onClearConfig={handleClearConfig}
            lang={lang}
          />
        )}
      </main>

      {/* Offline Status Badge */}
      <OfflineIndicator lang={lang} />

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--mut)]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            AnyHTML Forge • {lang === 'fa' ? 'تبدیل هر برنامه و کد به فایل HTML و PWA مستقل' : 'Clean Code Rendering & Offline PWA Generator'}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('code')}
              className="hover:text-[var(--fg)] transition-colors cursor-pointer text-[#4f8cff] font-medium"
            >
              {lang === 'fa' ? 'استودیو کد PWA' : 'PWA Code Studio'}
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('outputs')}
              className="hover:text-[var(--fg)] transition-colors cursor-pointer"
            >
              {lang === 'fa' ? '۱۳ خروجی آماده' : '13 Pre-built Outputs'}
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-[var(--fg)] transition-colors cursor-pointer"
            >
              {lang === 'fa' ? 'تنظیمات اتصال' : 'Connection'}
            </button>
          </div>
        </div>
      </footer>

      {/* Device Frame Preview Modal */}
      <PreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData((prev) => ({ ...prev, isOpen: false }))}
        title={previewData.title}
        htmlUrl={previewData.htmlUrl}
        downloadName={previewData.downloadName}
        lang={lang}
      />
    </div>
  );
};
