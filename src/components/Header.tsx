import React from 'react';
import { Language, Theme } from '../types';
import { getT } from '../utils/i18n';
import { PWAInstallButton } from './PWAInstallButton';
import {
  FileCode2,
  FolderGit2,
  LayoutGrid,
  Settings,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  AlertCircle,
  Code2,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  activeTab: 'convert' | 'code' | 'repos' | 'outputs' | 'settings';
  onSelectTab: (tab: 'convert' | 'code' | 'repos' | 'outputs' | 'settings') => void;
  isGitHubConnected: boolean;
  outputsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  isGitHubConnected,
  outputsCount
}) => {
  const t = getT(lang);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f8cff] to-[#1f5fe0] flex items-center justify-center text-white shadow-md shadow-[#4f8cff]/20">
              <FileCode2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--fg)]">
                  Any<span className="text-[#4f8cff]">HTML</span>
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PWA Engine
                </span>
              </div>
              <p className="text-xs text-[var(--mut)] hidden sm:block max-w-md line-clamp-1">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick controls: In-App PWA Install, Language, Theme & GitHub Status */}
          <div className="flex items-center gap-2">
            {/* PWA In-App Install Button */}
            <PWAInstallButton lang={lang} />

            <button
              onClick={() => onSelectTab('settings')}
              title={isGitHubConnected ? 'GitHub Connected' : 'GitHub Not Configured'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                isGitHubConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)]'
              }`}
            >
              {isGitHubConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline font-mono">Token Active ✓</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">GitHub Token</span>
                </>
              )}
            </button>

            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] hover:border-[#4f8cff]/50 transition-colors cursor-pointer"
              title="تغییر زبان / Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#4f8cff]" />
              <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
            </button>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] hover:border-[#4f8cff]/50 transition-colors cursor-pointer"
              title={t.themeToggle}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-2 border-t border-[var(--line)]/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectTab('convert')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'convert'
                ? 'bg-[#4f8cff] text-white shadow-sm shadow-[#4f8cff]/30'
                : 'text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>{t.tabConvert}</span>
          </button>

          <button
            onClick={() => onSelectTab('code')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[#4f8cff] text-white shadow-sm shadow-[#4f8cff]/30'
                : 'text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>{t.tabCode}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'code'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              NEW
            </span>
          </button>

          <button
            onClick={() => onSelectTab('repos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'repos'
                ? 'bg-[#4f8cff] text-white shadow-sm shadow-[#4f8cff]/30'
                : 'text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>{t.tabRepos}</span>
          </button>

          <button
            onClick={() => onSelectTab('outputs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'outputs'
                ? 'bg-[#4f8cff] text-white shadow-sm shadow-[#4f8cff]/30'
                : 'text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{t.tabOutputs}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'outputs'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--line)] text-[var(--mut)]'
              }`}
            >
              {outputsCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#4f8cff] text-white shadow-sm shadow-[#4f8cff]/30'
                : 'text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.tabSettings}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
