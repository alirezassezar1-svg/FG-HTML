import { unzipSync } from 'fflate';
import { marked } from 'marked';
import { packageAsPWA } from './pwaPackager';
import { renderCodeToPWA } from './codeRenderer';

export interface ConvertedResult {
  html: string;
  blob: Blob;
  report: string;
  strategy: 'static' | 'markdown' | 'explorer' | 'media';
  fileName: string;
  sizeBytes: number;
}

const MIME_MAP: Record<string, string> = {
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  txt: 'text/plain',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  pdf: 'application/pdf',
  xml: 'application/xml',
  md: 'text/markdown',
  markdown: 'text/markdown',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  jsx: 'text/javascript',
  py: 'text/x-python',
  sh: 'text/x-shellscript',
  yaml: 'text/yaml',
  yml: 'text/yaml'
};

function getMime(ext: string): string {
  return MIME_MAP[ext.toLowerCase()] || 'application/octet-stream';
}

function uint8ToBase64(u8: Uint8Array): string {
  let binary = '';
  const len = u8.byteLength;
  const chunk = 0x8000;
  for (let i = 0; i < len; i += chunk) {
    const sub = u8.subarray(i, Math.min(i + chunk, len));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

function uint8ToUtf8(u8: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(u8);
  } catch {
    return '';
  }
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '');
}

function resolveRelative(baseDir: string, relPath: string): string {
  const parts = baseDir.split('/').filter(Boolean);
  const rel = relPath.split('/').filter(Boolean);
  for (const seg of rel) {
    if (seg === '.') continue;
    if (seg === '..') {
      parts.pop();
    } else {
      parts.push(seg);
    }
  }
  return parts.join('/');
}

export async function convertInBrowser(file: File): Promise<ConvertedResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
  };

  const buffer = await file.arrayBuffer();
  const u8 = new Uint8Array(buffer);
  const name = file.name;
  const ext = (name.split('.').pop() || '').toLowerCase();

  const isZip =
    u8.length > 4 &&
    u8[0] === 0x50 &&
    u8[1] === 0x4b &&
    !/\.(docx|xlsx|pptx|epub|jar|apk)$/i.test(name);

  if (isZip) {
    log(`File detected as ZIP archive (${(u8.length / 1024 / 1024).toFixed(2)} MB)`);
    const unzipped = unzipSync(u8);
    const fileEntries: Record<string, Uint8Array> = {};

    for (const [rawKey, data] of Object.entries(unzipped)) {
      const k = normalizePath(rawKey);
      if (
        k.endsWith('/') ||
        k.startsWith('__MACOSX/') ||
        k.includes('.DS_Store') ||
        k.includes('Thumbs.db')
      ) {
        continue;
      }
      fileEntries[k] = data;
    }

    const fileKeys = Object.keys(fileEntries);
    log(`Extracted ${fileKeys.length} files from archive`);

    // Look for an index.html
    let indexPath = fileKeys.find((k) => k.toLowerCase() === 'index.html');
    if (!indexPath) {
      indexPath = fileKeys.find((k) => /(^|\/)index\.html?$/i.test(k));
    }

    if (indexPath) {
      log(`Found web entrypoint: ${indexPath} → running static inliner`);
      const indexDir = indexPath.includes('/')
        ? indexPath.slice(0, indexPath.lastIndexOf('/'))
        : '';
      const htmlText = uint8ToUtf8(fileEntries[indexPath]);

      const inlinedHtml = inlineStaticHtml(htmlText, indexDir, fileEntries, log);
      log(`Packaging as standalone Progressive Web App (PWA)...`);
      const pwaHtml = packageAsPWA(inlinedHtml, {
        title: name.replace(/\.[^.]+$/, ''),
        themeColor: '#0b0d12'
      });
      log(`DONE via "static" in-browser engine (PWA Ready)`);

      const report = logs.join('\n');
      const blob = new Blob([pwaHtml], { type: 'text/html;charset=utf-8' });
      return {
        html: pwaHtml,
        blob,
        report,
        strategy: 'static',
        fileName: name.replace(/\.[^.]+$/, '') + '.html',
        sizeBytes: blob.size
      };
    } else {
      // Check if there is an App.tsx, App.jsx, or main React component in archive
      const reactEntry = fileKeys.find((k) => /(^|\/)App\.(tsx|jsx|js)$/i.test(k));
      if (reactEntry) {
        log(`Found React component: ${reactEntry} → rendering live React PWA...`);
        const reactCode = uint8ToUtf8(fileEntries[reactEntry]);
        const renderedReactPwa = renderCodeToPWA(reactCode, {
          title: name.replace(/\.[^.]+$/, ''),
          type: 'react'
        });
        log(`DONE via live "react" compiler (PWA Ready)`);
        const report = logs.join('\n');
        const blob = new Blob([renderedReactPwa], { type: 'text/html;charset=utf-8' });
        return {
          html: renderedReactPwa,
          blob,
          report,
          strategy: 'react' as any,
          fileName: name.replace(/\.[^.]+$/, '') + '.html',
          sizeBytes: blob.size
        };
      }

      // Create explorer for project archive
      log(`Generating interactive AnyHTML embedded Explorer...`);
      const rawExplorerHtml = createExplorerHtml(name, fileEntries, log);
      const explorerHtml = packageAsPWA(rawExplorerHtml, {
        title: name.replace(/\.[^.]+$/, '') + ' Explorer',
        themeColor: '#0b0d12'
      });
      log(`DONE via "explorer" strategy: ${fileKeys.length} files packed (PWA Ready)`);

      const report = logs.join('\n');
      const blob = new Blob([explorerHtml], { type: 'text/html;charset=utf-8' });
      return {
        html: explorerHtml,
        blob,
        report,
        strategy: 'explorer',
        fileName: name.replace(/\.[^.]+$/, '') + '-explorer.html',
        sizeBytes: blob.size
      };
    }
  }

  // Handle single non-zip files
  if (ext === 'html' || ext === 'htm') {
    log(`Single HTML file detected: inlining and packaging as PWA`);
    const text = uint8ToUtf8(u8);
    const pwaHtml = packageAsPWA(text, {
      title: name.replace(/\.[^.]+$/, ''),
      themeColor: '#0b0d12'
    });
    const blob = new Blob([pwaHtml], { type: 'text/html;charset=utf-8' });
    return {
      html: pwaHtml,
      blob,
      report: `strategy: static\n1 HTML page processed & PWA packaged\nSize: ${(blob.size / 1024).toFixed(1)} KB`,
      strategy: 'static',
      fileName: name.replace(/\.[^.]+$/, '') + '.html',
      sizeBytes: blob.size
    };
  }

  if (ext === 'jsx' || ext === 'tsx') {
    log(`React component detected (${ext}): compiling to live PWA HTML...`);
    const code = uint8ToUtf8(u8);
    const renderedPwa = renderCodeToPWA(code, {
      title: name.replace(/\.[^.]+$/, ''),
      type: 'react'
    });
    const blob = new Blob([renderedPwa], { type: 'text/html;charset=utf-8' });
    return {
      html: renderedPwa,
      blob,
      report: `strategy: react\nLive React JSX/TSX rendered with Babel & Tailwind\nSize: ${(blob.size / 1024).toFixed(1)} KB`,
      strategy: 'react' as any,
      fileName: name.replace(/\.[^.]+$/, '') + '.html',
      sizeBytes: blob.size
    };
  }

  if (ext === 'md' || ext === 'markdown') {
    log(`Markdown file detected: compiling to single responsive offline HTML`);
    const mdText = uint8ToUtf8(u8);
    const parsedHtml = await Promise.resolve(marked.parse(mdText));
    const fullHtml = createMarkdownTemplate(name, mdText, parsedHtml);
    const pwaHtml = packageAsPWA(fullHtml, {
      title: name.replace(/\.[^.]+$/, ''),
      themeColor: '#0b0d12'
    });
    const blob = new Blob([pwaHtml], { type: 'text/html;charset=utf-8' });
    return {
      html: pwaHtml,
      blob,
      report: `strategy: markdown\nRendered Markdown with table of contents & PWA capabilities\nSize: ${(blob.size / 1024).toFixed(1)} KB`,
      strategy: 'markdown',
      fileName: name.replace(/\.[^.]+$/, '') + '.html',
      sizeBytes: blob.size
    };
  }

  // Any other single file (code, csv, image, pdf, etc.)
  log(`Single file "${name}" (${ext}) → Generating standalone AnyHTML viewer`);
  const fileEntries: Record<string, Uint8Array> = { [name]: u8 };
  const rawExplorerHtml = createExplorerHtml(name, fileEntries, log);
  const pwaHtml = packageAsPWA(rawExplorerHtml, {
    title: name,
    themeColor: '#0b0d12'
  });
  const blob = new Blob([pwaHtml], { type: 'text/html;charset=utf-8' });
  return {
    html: pwaHtml,
    blob,
    report: `strategy: explorer\nEmbedded ${name} into standalone PWA viewer\nSize: ${(blob.size / 1024).toFixed(1)} KB`,
    strategy: 'explorer',
    fileName: name + '.html',
    sizeBytes: blob.size
  };
}

function inlineStaticHtml(
  html: string,
  baseDir: string,
  files: Record<string, Uint8Array>,
  log: (m: string) => void
): string {
  let doc = html;

  // Inline stylesheets: <link rel="stylesheet" href="...">
  doc = doc.replace(
    /<link\b([^>]*?)href=(["'])(.*?)\2([^>]*?)>/gi,
    (match, pre, quote, href, post) => {
      if (/rel=(["'])stylesheet\1/i.test(match) || /stylesheet/i.test(pre + post)) {
        if (/^(https?:|\/\/|data:)/i.test(href)) return match;
        const cleanHref = href.split('?')[0].split('#')[0];
        const targetPath = resolveRelative(baseDir, cleanHref);
        const fileData = files[targetPath] || files[cleanHref];
        if (fileData) {
          log(`Inlined stylesheet: ${cleanHref} (${fileData.length} B)`);
          const cssContent = uint8ToUtf8(fileData);
          // Inline sub-assets inside CSS url(...)
          const inlinedCss = inlineCssUrls(cssContent, targetPath, files);
          return `<style data-original="${escapeAttr(cleanHref)}">${inlinedCss}</style>`;
        }
      }
      return match;
    }
  );

  // Inline scripts: <script src="...">
  doc = doc.replace(
    /<script\b([^>]*?)src=(["'])(.*?)\2([^>]*?)>([\s\S]*?)<\/script>/gi,
    (match, pre, quote, src, post, inner) => {
      if (/^(https?:|\/\/|data:)/i.test(src)) return match;
      const cleanSrc = src.split('?')[0].split('#')[0];
      const targetPath = resolveRelative(baseDir, cleanSrc);
      const fileData = files[targetPath] || files[cleanSrc];
      if (fileData) {
        log(`Inlined script: ${cleanSrc} (${fileData.length} B)`);
        const jsContent = uint8ToUtf8(fileData).replace(/<\/script/gi, '<\\/script');
        return `<script ${pre} ${post}>${jsContent}</script>`;
      }
      return match;
    }
  );

  // Inline images: <img src="...">
  doc = doc.replace(
    /<img\b([^>]*?)src=(["'])(.*?)\2([^>]*?)>/gi,
    (match, pre, quote, src, post) => {
      if (/^(https?:|\/\/|data:)/i.test(src)) return match;
      const cleanSrc = src.split('?')[0].split('#')[0];
      const targetPath = resolveRelative(baseDir, cleanSrc);
      const fileData = files[targetPath] || files[cleanSrc];
      if (fileData) {
        const ext = cleanSrc.split('.').pop() || 'png';
        const mime = getMime(ext);
        const b64 = uint8ToBase64(fileData);
        log(`Inlined image: ${cleanSrc} (${(fileData.length / 1024).toFixed(1)} KB)`);
        return `<img ${pre} src="data:${mime};base64,${b64}" ${post}>`;
      }
      return match;
    }
  );

  return doc;
}

function inlineCssUrls(
  css: string,
  cssFilePath: string,
  files: Record<string, Uint8Array>
): string {
  const cssDir = cssFilePath.includes('/')
    ? cssFilePath.slice(0, cssFilePath.lastIndexOf('/'))
    : '';
  return css.replace(/url\((["']?)(.*?)\1\)/gi, (match, quote, relUrl) => {
    if (/^(https?:|\/\/|data:)/i.test(relUrl)) return match;
    const cleanUrl = relUrl.split('?')[0].split('#')[0];
    const targetPath = resolveRelative(cssDir, cleanUrl);
    const assetData = files[targetPath] || files[cleanUrl];
    if (assetData && assetData.length < 5 * 1024 * 1024) {
      const ext = cleanUrl.split('.').pop() || 'bin';
      const mime = getMime(ext);
      const b64 = uint8ToBase64(assetData);
      return `url('data:${mime};base64,${b64}')`;
    }
    return match;
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

function createMarkdownTemplate(title: string, raw: string, contentHtml: string): string {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>${escapeHtml(title)} — AnyHTML</title>
<style>
:root{--bg:#0b0d12;--panel:#12151c;--line:#232836;--fg:#e6e9f0;--mut:#8b93a7;--acc:#4f8cff;--code-bg:#161a24}
@media (prefers-color-scheme:light){:root{--bg:#f6f7fb;--panel:#fff;--line:#dfe3ee;--fg:#161a24;--mut:#667089;--acc:#1f5fe0;--code-bg:#f0f2f7}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI",Vazirmatn,Tahoma,sans-serif;
 padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));min-height:100dvh}
.container{max-width:860px;margin:0 auto}
header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:24px;flex-wrap:wrap;gap:12px}
h1.title{margin:0;font-size:22px;color:var(--fg)}
.btn{font:600 14px inherit;border:1px solid var(--line);border-radius:10px;padding:8px 14px;background:var(--panel);color:var(--fg);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.btn:hover{border-color:var(--acc);color:var(--acc)}
.btn.pri{background:var(--acc);color:#fff;border-color:transparent}
#rendered{line-height:1.8}
#rendered h1,#rendered h2,#rendered h3{color:var(--fg);margin-top:1.4em;margin-bottom:0.6em}
#rendered a{color:var(--acc);text-decoration:none}
#rendered a:hover{text-decoration:underline}
#rendered code{background:var(--code-bg);border:1px solid var(--line);padding:2px 6px;border-radius:6px;font-family:ui-monospace,Menlo,monospace;font-size:14px;direction:ltr;display:inline-block}
#rendered pre{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;overflow-x:auto;direction:ltr;text-align:left}
#rendered pre code{background:transparent;border:0;padding:0;display:block}
#rendered blockquote{border-inline-start:4px solid var(--acc);margin:1em 0;padding:8px 16px;background:color-mix(in srgb,var(--acc) 8%,transparent);border-radius:0 8px 8px 0}
#rendered table{width:100%;border-collapse:collapse;margin:1.5em 0}
#rendered th,#rendered td{border:1px solid var(--line);padding:8px 12px;text-align:right}
#rendered th{background:var(--panel)}
#raw{display:none;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;font:13px/1.6 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;overflow-x:auto;white-space:pre-wrap}
</style>
</head>
<body>
<div class="container">
  <header>
    <div><h1 class="title">${escapeHtml(title)}</h1></div>
    <div style="display:flex;gap:8px">
      <button class="btn" id="toggleBtn">نمایش متن خام / Raw</button>
      <button class="btn" id="copyBtn">کپی متن</button>
    </div>
  </header>
  <div id="rendered">${contentHtml}</div>
  <pre id="raw">${escapeHtml(raw)}</pre>
</div>
<script>
(function(){
  var ren = document.getElementById('rendered');
  var raw = document.getElementById('raw');
  var tBtn = document.getElementById('toggleBtn');
  var cBtn = document.getElementById('copyBtn');
  var isRaw = false;
  tBtn.onclick = function() {
    isRaw = !isRaw;
    ren.style.display = isRaw ? 'none' : 'block';
    raw.style.display = isRaw ? 'block' : 'none';
    tBtn.textContent = isRaw ? 'نمایش فرمت شده' : 'نمایش متن خام / Raw';
  };
  cBtn.onclick = function() {
    navigator.clipboard.writeText(raw.textContent).then(function() {
      cBtn.textContent = 'کپی شد ✓';
      setTimeout(function(){ cBtn.textContent = 'کپی متن'; }, 2000);
    });
  };
})();
</script>
</body>
</html>`;
}

interface ExplorerFileItem {
  path: string;
  size: number;
  ext: string;
  kind: 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'binary';
  mime: string;
  text?: string;
  b64?: string;
}

function createExplorerHtml(
  title: string,
  files: Record<string, Uint8Array>,
  log: (m: string) => void
): string {
  const items: ExplorerFileItem[] = [];

  const sortedPaths = Object.keys(files).sort();

  for (const p of sortedPaths) {
    const data = files[p];
    const ext = (p.split('.').pop() || '').toLowerCase();
    const mime = getMime(ext);

    const isImage = /^(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(ext);
    const isAudio = /^(mp3|wav|ogg)$/i.test(ext);
    const isVideo = /^(mp4|webm)$/i.test(ext);
    const isPdf = ext === 'pdf';
    const isText =
      /^(html?|css|js|mjs|jsx|ts|tsx|json|txt|md|markdown|csv|tsv|xml|yaml|yml|sh|py|sql|env|gitignore|webmanifest)$/i.test(
        ext
      );

    if (isText) {
      const text = uint8ToUtf8(data);
      items.push({
        path: p,
        size: data.length,
        ext,
        kind: 'text',
        mime,
        text
      });
    } else if (isImage && data.length < 15 * 1024 * 1024) {
      items.push({
        path: p,
        size: data.length,
        ext,
        kind: 'image',
        mime,
        b64: uint8ToBase64(data)
      });
    } else if (isAudio && data.length < 25 * 1024 * 1024) {
      items.push({
        path: p,
        size: data.length,
        ext,
        kind: 'audio',
        mime,
        b64: uint8ToBase64(data)
      });
    } else if (isVideo && data.length < 35 * 1024 * 1024) {
      items.push({
        path: p,
        size: data.length,
        ext,
        kind: 'video',
        mime,
        b64: uint8ToBase64(data)
      });
    } else if (isPdf && data.length < 25 * 1024 * 1024) {
      items.push({
        path: p,
        size: data.length,
        ext,
        kind: 'pdf',
        mime,
        b64: uint8ToBase64(data)
      });
    } else {
      items.push({
        path: p,
        size: data.length,
        ext,
        kind: 'binary',
        mime,
        b64: data.length < 10 * 1024 * 1024 ? uint8ToBase64(data) : undefined
      });
    }
  }

  const manifest = {
    title,
    count: items.length,
    files: items
  };

  const jsonPayload = JSON.stringify(manifest)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0b0d12">
<title>${escapeHtml(title)} — AnyHTML Explorer</title>
<style>
:root{--bg:#0b0d12;--panel:#12151c;--panel-hover:#191e28;--line:#232836;--fg:#e6e9f0;--mut:#8b93a7;--acc:#4f8cff;--ok:#3ecf8e}
@media (prefers-color-scheme:light){:root{--bg:#f6f7fb;--panel:#fff;--panel-hover:#f0f2f7;--line:#dfe3ee;--fg:#161a24;--mut:#667089;--acc:#1f5fe0;--ok:#118a5a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Vazirmatn,sans-serif;min-height:100dvh;
 padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
header{position:sticky;top:0;z-index:20;display:flex;gap:10px;align-items:center;padding:10px 16px;background:var(--panel);border-bottom:1px solid var(--line)}
header b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
button{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:7px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
button:hover{border-color:var(--acc);color:var(--acc)}
button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 15%,transparent);color:var(--acc)}
nav{position:fixed;inset:0 0 0 auto;width:min(88vw,360px);background:var(--panel);border-inline-start:1px solid var(--line);transform:translateX(105%);transition:transform .2s ease;z-index:30;overflow:auto;padding:14px;padding-top:max(14px,env(safe-area-inset-top))}
[dir=rtl] nav{inset:0 auto 0 0;transform:translateX(-105%)}
nav.open{transform:none}
#scrim{position:fixed;inset:0;background:#0008;z-index:25;display:none;backdrop-filter:blur(2px)}#scrim.open{display:block}
.search-box{width:100%;margin-bottom:12px;padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit;font-size:13px}
.nav-list{display:flex;flex-direction:column;gap:3px}
nav a{display:block;padding:8px 10px;border-radius:8px;color:var(--fg);text-decoration:none;font:13px/1.4 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;word-break:break-all;cursor:pointer}
nav a:hover{background:var(--panel-hover)}
nav a small{display:block;color:var(--mut);font-size:11px}
nav a.sel{background:color-mix(in srgb,var(--acc) 20%,transparent);color:var(--acc);font-weight:600}
main{padding:16px;max-width:1100px;margin:0 auto}
.meta{color:var(--mut);font:12px ui-monospace,Menlo,monospace;direction:ltr;text-align:left;margin-bottom:12px;word-break:break-all;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
pre{direction:ltr;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;overflow:auto;font:13px/1.6 ui-monospace,Menlo,monospace;white-space:pre;tab-size:2}
.wrap pre{white-space:pre-wrap;word-break:break-word}
img,video{max-width:100%;border-radius:10px;background:repeating-conic-gradient(#8883 0 25%,transparent 0 50%) 0 0/16px 16px;margin:10px 0}
iframe{width:100%;height:75dvh;border:1px solid var(--line);border-radius:12px;background:#fff}
table{border-collapse:collapse;direction:ltr;font-size:13px;display:block;overflow:auto;max-width:100%;border-radius:10px;border:1px solid var(--line)}
td,th{border:1px solid var(--line);padding:7px 11px;white-space:nowrap}
th{background:var(--panel);position:sticky;top:0}
.btns{display:flex;gap:8px;margin:0 0 12px;flex-wrap:wrap}
a.dl{color:var(--acc);text-decoration:none;display:inline-flex;align-items:center;padding:8px 14px;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
@media(min-width:960px){
  nav{position:fixed;transform:none!important;inset:0 auto 0 0;width:340px;padding-top:64px}
  [dir=rtl] nav{inset:0 0 0 auto;border-inline-start:0;border-inline-end:1px solid var(--line)}
  #menu{display:none}
  main{margin-inline-start:0;margin-inline-end:350px}
  header{margin-inline-end:340px}
}
</style>
</head>
<body>
<header>
  <button id="menu" aria-label="فهرست">☰ فایل‌ها</button>
  <b id="ttl"></b>
  <button id="wrapb">شکستن خط (Wrap)</button>
</header>
<div id="scrim"></div>
<nav id="nav">
  <input type="text" class="search-box" id="search" placeholder="جستجوی فایل...">
  <div class="nav-list" id="navList"></div>
</nav>
<main id="view"></main>

<script id="data" type="application/json">${jsonPayload}</script>
<script>
(function(){
  var D = JSON.parse(document.getElementById('data').textContent);
  var F = D.files;
  var nav = document.getElementById('nav');
  var navList = document.getElementById('navList');
  var view = document.getElementById('view');
  var scrim = document.getElementById('scrim');
  var searchInput = document.getElementById('search');
  var ttl = document.getElementById('ttl');
  ttl.textContent = D.title + ' — ' + F.length + ' فایل';

  function esc(s){ return String(s).replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
  function sz(n){ return n < 1024 ? n + ' B' : n < 1048576 ? (n/1024).toFixed(1) + ' KB' : (n/1048576).toFixed(2) + ' MB'; }
  function b64ToBlob(b64, mime){
    var s = atob(b64), u = new Uint8Array(s.length);
    for(var i=0; i<s.length; i++) u[i] = s.charCodeAt(i);
    return new Blob([u], {type: mime});
  }

  function csvToTable(t, sep){
    var rows=[], r=[], c='', q=false;
    for(var i=0; i<t.length; i++){
      var ch = t[i];
      if(q){
        if(ch === '"'){
          if(t[i+1] === '"'){ c += '"'; i++; } else { q = false; }
        } else { c += ch; }
      } else if(ch === '"'){ q = true; }
      else if(ch === sep){ r.push(c); c = ''; }
      else if(ch === '\\n'){ r.push(c.replace(/\\r$/,'')); rows.push(r); r = []; c = ''; }
      else { c += ch; }
    }
    if(c || r.length){ r.push(c); rows.push(r); }
    return rows;
  }

  var cur = 0, wrap = false;

  function renderList(filter){
    navList.innerHTML = '';
    var q = (filter || '').toLowerCase();
    F.forEach(function(f, i){
      if(q && !f.path.toLowerCase().includes(q)) return;
      var a = document.createElement('a');
      a.className = (i === cur) ? 'sel' : '';
      a.innerHTML = esc(f.path) + '<small>' + sz(f.size) + '</small>';
      a.onclick = function(){ show(i); };
      navList.appendChild(a);
    });
  }

  searchInput.oninput = function(){ renderList(this.value); };

  function show(i){
    cur = i;
    var f = F[i];
    location.hash = '#' + encodeURIComponent(f.path);
    [].forEach.call(navList.children, function(el){ el.classList.remove('sel'); });
    renderList(searchInput.value);
    nav.classList.remove('open');
    scrim.classList.remove('open');
    view.className = wrap ? 'wrap' : '';
    view.innerHTML = '';

    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = '<span>' + esc(f.path) + '</span><span>' + sz(f.size) + ' (' + (f.mime||'binary') + ')</span>';
    view.appendChild(meta);

    var ext = f.ext;
    if(f.kind === 'text'){
      if(/^(html?|svg)$/.test(ext)){
        var b = document.createElement('div'); b.className = 'btns';
        var fr = document.createElement('iframe'); fr.setAttribute('sandbox', '');
        fr.srcdoc = f.text;
        var pre = document.createElement('pre'); pre.style.display = 'none'; pre.textContent = f.text;
        var t1 = document.createElement('button'); t1.textContent = 'کد خام / Source';
        t1.onclick = function(){
          var s = pre.style.display === 'none';
          pre.style.display = s ? '' : 'none';
          fr.style.display = s ? 'none' : '';
          t1.classList.toggle('on', s);
        };
        b.appendChild(t1); view.appendChild(b); view.appendChild(fr); view.appendChild(pre);
      } else if(/^(csv|tsv)$/.test(ext)){
        var rows = csvToTable(f.text, ext === 'tsv' ? '\\t' : ',').slice(0, 1500);
        var table = '<table>';
        rows.forEach(function(r, k){
          table += '<tr>' + r.map(function(c){ return k ? '<td>' + esc(c) + '</td>' : '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
        });
        table += '</table>';
        var d = document.createElement('div'); d.innerHTML = table; view.appendChild(d);
      } else {
        var text = f.text;
        if(ext === 'json'){ try { text = JSON.stringify(JSON.parse(f.text), null, 2); } catch(e){} }
        var p = document.createElement('pre'); p.textContent = text; view.appendChild(p);
      }
    } else if(f.kind === 'image' && f.b64){
      var img = document.createElement('img'); img.src = 'data:' + f.mime + ';base64,' + f.b64; view.appendChild(img);
    } else if(f.kind === 'audio' && f.b64){
      var au = document.createElement('audio'); au.controls = true; au.src = URL.createObjectURL(b64ToBlob(f.b64, f.mime)); view.appendChild(au);
    } else if(f.kind === 'video' && f.b64){
      var vid = document.createElement('video'); vid.controls = true; vid.playsInline = true; vid.src = URL.createObjectURL(b64ToBlob(f.b64, f.mime)); view.appendChild(vid);
    } else if(f.kind === 'pdf' && f.b64){
      var u = URL.createObjectURL(b64ToBlob(f.b64, f.mime));
      var alink = document.createElement('a'); alink.className = 'dl'; alink.href = u; alink.target = '_blank'; alink.textContent = 'باز کردن PDF در تب جدید';
      view.appendChild(alink);
      var ifr = document.createElement('iframe'); ifr.src = u; view.appendChild(ifr);
    } else if(f.b64){
      var u2 = URL.createObjectURL(b64ToBlob(f.b64, f.mime));
      var dl = document.createElement('a'); dl.className = 'dl'; dl.href = u2; dl.download = f.path.split('/').pop(); dl.textContent = 'دانلود فایل';
      view.appendChild(dl);
    } else {
      var p2 = document.createElement('p'); p2.textContent = 'این فایل باینری بزرگ است و برای صرفه‌جویی در حجم جاسازی نشده.'; view.appendChild(p2);
    }
    window.scrollTo(0, 0);
  }

  document.getElementById('menu').onclick = function(){ nav.classList.add('open'); scrim.classList.add('open'); };
  scrim.onclick = function(){ nav.classList.remove('open'); scrim.classList.remove('open'); };
  document.getElementById('wrapb').onclick = function(){ wrap = !wrap; this.classList.toggle('on', wrap); view.className = wrap ? 'wrap' : ''; };

  renderList('');
  var want = decodeURIComponent((location.hash || '').slice(1));
  var found = F.findIndex(function(f){ return f.path === want; });
  show(found >= 0 ? found : 0);
})();
</script>
</body>
</html>`;
}
