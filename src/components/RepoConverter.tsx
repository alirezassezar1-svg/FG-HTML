import React, { useState } from 'react';
import { GitHubRepo, Language } from '../types';
import { getT } from '../utils/i18n';
import { fetchUserRepos, downloadRepoZipball } from '../utils/github';
import { convertInBrowser } from '../utils/inBrowserConverter';
import {
  FolderGit2,
  Search,
  Star,
  GitFork,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  Lock,
  Archive,
  RefreshCw,
  Zap
} from 'lucide-react';

interface RepoConverterProps {
  lang: Language;
  githubToken?: string;
  defaultUsername?: string;
  onRepoConverted: (
    repoName: string,
    htmlBlob: Blob,
    htmlText: string,
    report: string
  ) => void;
}

export const RepoConverter: React.FC<RepoConverterProps> = ({
  lang,
  githubToken,
  defaultUsername = 'alirezassezar1-svg',
  onRepoConverted
}) => {
  const t = getT(lang);
  const [username, setUsername] = useState(defaultUsername);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [includeForks, setIncludeForks] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  const [convertingRepoId, setConvertingRepoId] = useState<number | null>(null);
  const [conversionStatus, setConversionStatus] = useState<string>('');

  const handleFetchRepos = async () => {
    if (!username.trim() && !githubToken) {
      setError(lang === 'fa' ? 'لطفاً نام کاربری را وارد کنید.' : 'Please enter a username.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchUserRepos(username.trim(), githubToken);
      setRepos(list);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت لیست ریپوها');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertSingleRepo = async (repo: GitHubRepo) => {
    setConvertingRepoId(repo.id);
    setConversionStatus(lang === 'fa' ? 'در حال دانلود آرشیو ریپو...' : 'Downloading repo zipball...');
    try {
      const { blob: zipBlob, fileName } = await downloadRepoZipball(
        repo.full_name,
        githubToken
      );

      setConversionStatus(lang === 'fa' ? 'در حال بسته‌بندی در موتور AnyHTML...' : 'Packaging with AnyHTML engine...');
      const file = new File([zipBlob], fileName, { type: 'application/zip' });
      const result = await convertInBrowser(file);

      onRepoConverted(repo.name, result.blob, result.html, result.report);
      setConversionStatus(lang === 'fa' ? 'تبدیل با موفقیت انجام شد ✓' : 'Converted successfully ✓');
    } catch (err: any) {
      setConversionStatus(lang === 'fa' ? `خطا: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setTimeout(() => {
        setConvertingRepoId(null);
        setConversionStatus('');
      }, 3000);
    }
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFork = includeForks ? true : !r.fork;
    const matchesArchived = includeArchived ? true : !r.archived;
    return matchesSearch && matchesFork && matchesArchived;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Fetch Repos Form */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#4f8cff]/10 text-[#4f8cff] flex items-center justify-center">
            <FolderGit2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--fg)]">
              {t.reposTitle}
            </h2>
            <p className="text-xs text-[var(--mut)]">
              {t.reposSubtitle}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.githubUsername}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] text-xs sm:text-sm font-mono focus:outline-none focus:border-[#4f8cff]"
              dir="ltr"
            />
          </div>

          <button
            onClick={handleFetchRepos}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-[#4f8cff] text-white font-bold text-xs sm:text-sm hover:bg-[#3d7ae8] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-[#4f8cff]/20"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isLoading ? (lang === 'fa' ? 'در حال دریافت...' : 'Fetching...') : t.fetchRepos}</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Filters bar if repos loaded */}
        {repos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[var(--mut)] absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchRepos}
                className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] text-xs"
              />
            </div>

            <div className="flex items-center gap-3 text-[var(--mut)]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeForks}
                  onChange={(e) => setIncludeForks(e.target.checked)}
                  className="rounded border-[var(--line)] text-[#4f8cff]"
                />
                <span>{t.includeForks}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="rounded border-[var(--line)] text-[#4f8cff]"
                />
                <span>{t.includeArchived}</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Repos Grid */}
      {repos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRepos.map((repo) => {
            const isConverting = convertingRepoId === repo.id;

            return (
              <div
                key={repo.id}
                className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#4f8cff]/40 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3
                        className="font-bold text-sm sm:text-base text-[var(--fg)] truncate font-mono"
                        dir="ltr"
                      >
                        {repo.name}
                      </h3>
                      {repo.private && (
                        <span title="Private">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                      {repo.archived && (
                        <span title="Archived">
                          <Archive className="w-3.5 h-3.5 text-neutral-400" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--mut)] shrink-0">
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{repo.stargazers_count}</span>
                      </span>
                    </div>
                  </div>

                  {repo.description && (
                    <p className="text-xs text-[var(--mut)] line-clamp-2 mb-3 leading-relaxed">
                      {repo.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[var(--mut)] font-mono">
                    {repo.language && (
                      <span className="px-2 py-0.5 rounded bg-[var(--line)] text-[var(--fg)]">
                        {repo.language}
                      </span>
                    )}
                    <span>
                      {(repo.size / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>

                {/* Convert Button */}
                <div className="mt-4 pt-3 border-t border-[var(--line)]/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleConvertSingleRepo(repo)}
                    disabled={isConverting}
                    className="w-full py-2 px-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] hover:border-[#4f8cff] text-[#4f8cff] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{conversionStatus}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-[#4f8cff]/20" />
                        <span>{t.btnConvertRepo}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
