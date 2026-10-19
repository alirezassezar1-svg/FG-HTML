import { GitHubConfig, GitHubRepo } from '../types';

export function uint8ToBase64(u8: Uint8Array): string {
  let binary = '';
  const len = u8.byteLength;
  const chunk = 0x8000;
  for (let i = 0; i < len; i += chunk) {
    const sub = u8.subarray(i, Math.min(i + chunk, len));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

export function stemOf(name: string): { stem: string; ext: string } {
  const m = name.match(/^(.*?)(\.tar\.gz|\.tgz|\.[A-Za-z0-9]{1,6})?$/);
  let base = (m && m[1]) || 'file';
  let ext = (m && m[2]) || '';
  ext = ext.toLowerCase();
  if (ext === '.tar.gz') ext = '.tgz';

  base = base
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'file';

  const stem = Date.now().toString(36) + '-' + base;
  return { stem, ext: ext || '.bin' };
}

export async function testGitHubConnection(config: GitHubConfig): Promise<{
  ok: boolean;
  message: string;
  defaultBranch?: string;
  canWrite?: boolean;
}> {
  const { repo, token } = config;
  if (!repo || !token) {
    return { ok: false, message: 'لطفاً نام ریپو و توکن را وارد کنید.' };
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return { ok: false, message: 'فرمت نام ریپو باید owner/repo باشد.' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.message || `خطای گیت‌هاب (${res.status})` };
    }

    const canWrite = !!(data.permissions && data.permissions.push);
    const branch = data.default_branch || 'main';
    let msg = `اتصال برقرار است ✓ — شاخه اصلی: ${branch}`;
    if (!canWrite) {
      msg += ' (⚠️ دسترسی نوشتن وجود ندارد - نیاز به دسترسی Contents: Read & write)';
    }

    return {
      ok: true,
      message: msg,
      defaultBranch: branch,
      canWrite
    };
  } catch (err: any) {
    return { ok: false, message: `خطای شبکه: ${err.message}` };
  }
}

export async function uploadToInbox(
  file: File,
  config: GitHubConfig,
  onProgress?: (msg: string) => void
): Promise<{ stem: string; ext: string; branch: string }> {
  const { stem, ext } = stemOf(file.name);
  const path = `inbox/${stem}${ext}`;

  onProgress?.('در حال بررسی شاخه اصلی ریپو...');
  const repoRes = await fetch(`https://api.github.com/repos/${config.repo}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  const repoData = await repoRes.json();
  if (!repoRes.ok || !repoData.default_branch) {
    throw new Error(repoData.message || 'ریپو پیدا نشد یا دسترسی وجود ندارد.');
  }

  const branch = repoData.default_branch;

  onProgress?.('در حال آماده‌سازی و کدگذاری فایل...');
  const arrayBuffer = await file.arrayBuffer();
  const b64Content = uint8ToBase64(new Uint8Array(arrayBuffer));

  onProgress?.('در حال آپلود به شاخه ریپو (inbox)...');
  const uploadRes = await fetch(
    `https://api.github.com/repos/${config.repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `anyhtml: add ${stem}${ext}`,
        content: b64Content,
        branch
      })
    }
  );

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(uploadData.message || `آپلود ناموفق بود (${uploadRes.status})`);
  }

  return { stem, ext, branch };
}

export async function pollActionsRunAndOutput(
  stem: string,
  branch: string,
  config: GitHubConfig,
  onStatus: (statusText: string, isBusy: boolean) => void,
  maxWaitMinutes: number = 20
): Promise<{ htmlBlob: Blob; htmlText: string; reportText: string }> {
  const startTime = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;
  let lastStatus = '';
  let found = false;

  onStatus('در صف اجرای GitHub Actions...', true);

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 6000));

    // 1. Check if output exists in outputs/
    try {
      const outListRes = await fetch(
        `https://api.github.com/repos/${config.repo}/contents/outputs?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github+json'
          },
          cache: 'no-store'
        }
      );

      if (outListRes.ok) {
        const list = await outListRes.json();
        if (Array.isArray(list)) {
          if (list.some((item: any) => item.name === `${stem}.html`)) {
            found = true;
            break;
          }
          if (
            list.some((item: any) => item.name === `${stem}.report.txt`) &&
            !list.some((item: any) => item.name === `${stem}.html`)
          ) {
            // Report is there but html is not - process failed
            break;
          }
        }
      }
    } catch {
      // Continue polling
    }

    // 2. Poll action runs
    try {
      const runsRes = await fetch(
        `https://api.github.com/repos/${config.repo}/actions/runs?per_page=1&branch=${encodeURIComponent(branch)}`,
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github+json'
          },
          cache: 'no-store'
        }
      );

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        const run = runsData.workflow_runs && runsData.workflow_runs[0];
        if (run) {
          const runStatus =
            run.status === 'completed'
              ? `پایان اکشن (${run.conclusion})`
              : run.status === 'in_progress'
              ? 'در حال اجرای کامپایلر در گیت‌هاب...'
              : 'در صف اجرای GitHub Actions...';

          if (runStatus !== lastStatus) {
            lastStatus = runStatus;
            onStatus(runStatus, run.status !== 'completed');
          }
        }
      }
    } catch {
      // Ignore transient errors
    }
  }

  // Fetch report if available
  let reportText = '';
  try {
    const reportRes = await fetch(
      `https://api.github.com/repos/${config.repo}/contents/outputs/${stem}.report.txt?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.raw+json'
        },
        cache: 'no-store'
      }
    );
    if (reportRes.ok) {
      reportText = await reportRes.text();
    }
  } catch {
    // optional report
  }

  if (!found) {
    throw new Error(
      `فایل خروجی ساخته نشد. گزارش:\n${reportText || 'لاگ را در تب Actions ریپو بررسی کنید.'}`
    );
  }

  // Fetch final HTML
  onStatus('در حال بارگیری فایل HTML نهایی...', true);
  const htmlRes = await fetch(
    `https://api.github.com/repos/${config.repo}/contents/outputs/${stem}.html?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.raw+json'
      },
      cache: 'no-store'
    }
  );

  if (!htmlRes.ok) {
    throw new Error('دریافت فایل نهایی از ریپو با شکست مواجه شد.');
  }

  const htmlBlob = await htmlRes.blob();
  const htmlText = await htmlBlob.text();

  return { htmlBlob, htmlText, reportText };
}

export async function fetchUserRepos(
  username: string,
  token?: string
): Promise<GitHubRepo[]> {
  const all: GitHubRepo[] = [];
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  for (let page = 1; page <= 5; page++) {
    const url =
      token && !username
        ? `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner`
        : `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`خطای دریافت ریپوها (${res.status}): ${err.slice(0, 150)}`);
    }

    const items: GitHubRepo[] = await res.json();
    all.push(...items);
    if (items.length < 100) break;
  }

  return all;
}

export async function downloadRepoZipball(
  fullName: string,
  token?: string
): Promise<{ blob: Blob; fileName: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${fullName}/zipball`, {
    headers,
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`دانلود آرشیو ریپو با خطا مواجه شد (${res.status})`);
  }

  const blob = await res.blob();
  const safeName = fullName.replace(/[\/\\]/g, '-');
  return { blob, fileName: `${safeName}.zip` };
}
