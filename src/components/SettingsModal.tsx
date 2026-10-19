import React, { useState } from 'react';
import { GitHubConfig, Language } from '../types';
import { getT } from '../utils/i18n';
import { testGitHubConnection } from '../utils/github';
import {
  Settings,
  KeyRound,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface SettingsModalProps {
  config: GitHubConfig;
  onSaveConfig: (config: GitHubConfig) => void;
  onClearConfig: () => void;
  lang: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onClearConfig,
  lang
}) => {
  const t = getT(lang);
  const [repo, setRepo] = useState(config.repo || 'alirezassezar1-svg/Forge_html');
  const [token, setToken] = useState(config.token);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSaveMessage(null);
    try {
      const res = await testGitHubConnection({
        repo: repo.trim(),
        token: token.trim(),
        isConnected: false,
        canWrite: false,
        statusMessage: ''
      });
      setTestResult(res);
      if (res.ok) {
        onSaveConfig({
          repo: repo.trim(),
          token: token.trim(),
          defaultBranch: res.defaultBranch,
          isConnected: true,
          canWrite: !!res.canWrite,
          statusMessage: res.message
        });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      repo: repo.trim(),
      token: token.trim(),
      isConnected: config.isConnected,
      canWrite: config.canWrite,
      statusMessage: ''
    });
    setSaveMessage(lang === 'fa' ? 'تنظیمات با موفقیت در مرورگر ذخیره شد ✓' : 'Settings saved successfully ✓');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#4f8cff]/10 text-[#4f8cff] flex items-center justify-center">
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--fg)]">
            {t.settingsTitle}
          </h2>
          <p className="text-xs text-[var(--mut)]">
            {t.settingsDesc}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Repo Field */}
        <div>
          <label className="block text-xs font-semibold text-[var(--fg)] mb-1.5">
            {t.repoLabel}
          </label>
          <div className="relative">
            <GitBranch className="w-4 h-4 text-[var(--mut)] absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="username/anyhtml"
              className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4f8cff]"
              dir="ltr"
            />
          </div>
          <span className="text-[11px] text-[var(--mut)] block mt-1">
            {lang === 'fa'
              ? 'نام کامل مخزن در گیت‌هاب (مثلاً alirezassezar1-svg/Forge_html)'
              : 'Full repository path (e.g. alirezassezar1-svg/Forge_html)'}
          </span>
        </div>

        {/* Token Field */}
        <div>
          <label className="block text-xs font-semibold text-[var(--fg)] mb-1.5">
            {t.tokenLabel}
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[var(--mut)] absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
              className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4f8cff]"
              dir="ltr"
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--mut)]">
            <span>{t.tokenHelp}</span>
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4f8cff] hover:underline flex items-center gap-1"
            >
              <span>GitHub Token Settings</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4f8cff] text-white text-xs sm:text-sm font-semibold hover:bg-[#3d7ae8] transition-colors shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t.btnSave}</span>
          </button>

          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--fg)] text-xs sm:text-sm font-semibold hover:border-[#4f8cff] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#4f8cff]" />
            ) : (
              <KeyRound className="w-4 h-4 text-[#4f8cff]" />
            )}
            <span>{isTesting ? (lang === 'fa' ? 'در حال تست...' : 'Testing...') : t.btnTest}</span>
          </button>

          {config.token && (
            <button
              onClick={onClearConfig}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors ms-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'حذف مشخصات' : 'Clear'}</span>
            </button>
          )}
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Save Confirmation */}
        {saveMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {saveMessage}
          </div>
        )}

        {/* Security & Privacy Notices */}
        <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-2">
          <div className="flex items-start gap-2 text-xs text-[var(--mut)]">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t.securityNotice}</p>
          </div>
          <p className="text-[11px] text-[var(--mut)] leading-relaxed">
            {lang === 'fa'
              ? '⚠️ توجه: اگر ریپوی گیت‌هاب شما عمومی (Public) باشد، فایل‌های ارسالی تا پایان فرآیند در inbox/ و خروجی‌ها در outputs/ برای عموم قابل رؤیت هستند. برای کارهای حساس می‌توانید از یک ریپوی خصوصی استفاده کنید.'
              : '⚠️ Note: If your GitHub repository is public, uploaded files in inbox/ and generated outputs in outputs/ will be publicly visible. Use a private repository for sensitive projects.'}
          </p>
        </div>
      </div>
    </div>
  );
};
