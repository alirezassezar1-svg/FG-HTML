export interface PWAPackageOptions {
  title: string;
  shortName?: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  iconSvg?: string;
  includeInstallBanner?: boolean;
  includeTailwind?: boolean;
}

export function generateAppIconSvg(letter: string = 'A', color: string = '#4f8cff'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.45"/>
      </filter>
    </defs>
    <rect width="512" height="512" rx="115" fill="url(#bgGrad)"/>
    <rect x="24" y="24" width="464" height="464" rx="95" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>
    <g filter="url(#shadow)">
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="900" font-size="240" fill="#ffffff" letter-spacing="-4">
        ${letter.toUpperCase().slice(0, 2)}
      </text>
    </g>
  </svg>`;
}

export function packageAsPWA(
  innerHtml: string,
  options: PWAPackageOptions
): string {
  const {
    title,
    shortName = title.slice(0, 12).trim() || 'App',
    description = `${title} — Self-contained Progressive Web App`,
    themeColor = '#0b0d12',
    backgroundColor = '#0b0d12',
    iconSvg = generateAppIconSvg(title.charAt(0) || 'A', '#4f8cff'),
    includeInstallBanner = true,
    includeTailwind = true
  } = options;

  const svgBase64 = btoa(unescape(encodeURIComponent(iconSvg)));
  const iconDataUri = `data:image/svg+xml;base64,${svgBase64}`;

  const manifestObj = {
    id: '/',
    name: title,
    short_name: shortName,
    description: description,
    start_url: '.',
    scope: '.',
    display: 'standalone',
    orientation: 'any',
    theme_color: themeColor,
    background_color: backgroundColor,
    icons: [
      {
        src: iconDataUri,
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ]
  };

  const manifestBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(manifestObj))));
  const manifestDataUri = `data:application/manifest+json;base64,${manifestBase64}`;

  // Check if innerHtml already has <html> and <head>
  const hasHtmlTag = /<html\b/i.test(innerHtml);
  const hasHeadTag = /<head\b/i.test(innerHtml);
  const hasBodyTag = /<body\b/i.test(innerHtml);

  const pwaHeadTags = `
  <!-- AnyHTML PWA & Mobile Engine -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${escapeAttr(shortName)}">
  <meta name="theme-color" content="${themeColor}">
  <link rel="manifest" href="${manifestDataUri}">
  <link rel="icon" type="image/svg+xml" href="${iconDataUri}">
  <link rel="apple-touch-icon" href="${iconDataUri}">
  ${includeTailwind && !/<script\b[^>]*cdn\.tailwindcss\.com/i.test(innerHtml) ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  `;

  const pwaRuntimeScript = `
  <script>
  (function(){
    // 1. Offline Service Worker Registration
    if ('serviceWorker' in navigator && !window.location.protocol.startsWith('blob:')) {
      window.addEventListener('load', function() {
        try {
          var swCode = 'const C="pwa-app-cache-v1";self.addEventListener("install",e=>self.skipWaiting());self.addEventListener("activate",e=>self.clients.claim());self.addEventListener("fetch",e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});';
          var blob = new Blob([swCode], {type: 'application/javascript'});
          var swUrl = URL.createObjectURL(blob);
          navigator.serviceWorker.register(swUrl).catch(function(e){});
        } catch(e){}
      });
    }

    // 2. Runtime Error Diagnostics
    var errorCount = 0;
    var errorBox = null;
    function logError(msg, src, line) {
      errorCount++;
      if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.id = 'anyhtml-error-bar';
        errorBox.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;max-width:480px;background:#1e1014;border:1px solid #ff4d6d;color:#ff85a1;font:11px/1.4 ui-monospace,Menlo,monospace;padding:8px 12px;border-radius:12px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:space-between;direction:ltr;text-align:left';
        errorBox.innerHTML = '<div><b>⚠️ Runtime Error:</b> <span id="err-text"></span></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#ff85a1;font-size:16px;cursor:pointer;padding:0 4px">✕</button>';
        document.body.appendChild(errorBox);
      }
      var t = document.getElementById('err-text');
      if (t) t.textContent = msg + (line ? ' (line ' + line + ')' : '');
    }
    window.addEventListener('error', function(e){ logError(e.message, e.filename, e.lineno); });
    window.addEventListener('unhandledrejection', function(e){ logError(e.reason ? (e.reason.message || e.reason) : 'Promise rejected'); });

    ${includeInstallBanner ? `
    // 3. In-App PWA Install Banner
    window.addEventListener('DOMContentLoaded', function() {
      var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (isStandalone || sessionStorage.getItem('pwa_dismissed')) return;

      var isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      var deferredPrompt = null;

      var banner = document.createElement('div');
      banner.id = 'anyhtml-pwa-banner';
      banner.style.cssText = 'position:fixed;bottom:max(16px,env(safe-area-inset-bottom));left:16px;right:16px;max-width:440px;margin:0 auto;background:#12151c;border:1px solid #232836;border-radius:18px;padding:12px 14px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#e6e9f0;font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Tahoma,sans-serif;backdrop-filter:blur(10px);direction:rtl;text-align:right';

      banner.innerHTML = '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:#4f8cff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:18px;flex-shrink:0">📱</div>' +
        '<div style="min-width:0"><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + ${JSON.stringify(shortName)} + '</b><small style="color:#8b93a7;font-size:11px">' + (isIOS ? 'نصب روی صفحه اصلی آیفون' : 'نصب به عنوان اپلیکیشن مستقل') + '</small></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">' +
        '<button id="pwa-install-act" style="background:#4f8cff;border:none;color:#fff;font:inherit;font-size:12px;font-weight:600;padding:6px 12px;border-radius:10px;cursor:pointer">نصب</button>' +
        '<button id="pwa-dismiss" style="background:transparent;border:none;color:#8b93a7;font-size:16px;cursor:pointer;padding:4px 6px">✕</button>' +
        '</div>';

      document.body.appendChild(banner);

      document.getElementById('pwa-dismiss').onclick = function() {
        banner.remove();
        sessionStorage.setItem('pwa_dismissed', '1');
      };

      var actBtn = document.getElementById('pwa-install-act');
      if (isIOS) {
        actBtn.textContent = 'راهنما';
        actBtn.onclick = function() {
          alert('برای اجرای تمام‌صفحه مانند یک اپلیکیشن واقعی:\\n\\n۱. دکمه Share (اشتراک‌گذاری) در سافاری را بزنید.\\n۲. گزینه Add to Home Screen (افزودن به صفحه اصلی) را انتخاب کنید.');
        };
      } else {
        window.addEventListener('beforeinstallprompt', function(e) {
          e.preventDefault();
          deferredPrompt = e;
          actBtn.onclick = function() {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(function(r) {
                if (r.outcome === 'accepted') banner.remove();
                deferredPrompt = null;
              });
            }
          };
        });
      }
    });
    ` : ''}
  })();
  </script>
  `;

  if (hasHtmlTag) {
    let result = innerHtml;

    // Inject head tags
    if (hasHeadTag) {
      result = result.replace(/<head\b([^>]*)>/i, `<head$1>\n${pwaHeadTags}`);
    } else {
      result = result.replace(/<html\b([^>]*)>/i, `<html$1>\n<head>\n<title>${escapeHtml(title)}</title>\n${pwaHeadTags}\n</head>`);
    }

    // Inject runtime script before </body> or at end
    if (hasBodyTag && /<\/body>/i.test(result)) {
      result = result.replace(/<\/body>/i, `${pwaRuntimeScript}\n</body>`);
    } else {
      result += `\n${pwaRuntimeScript}`;
    }

    return result;
  }

  // Not a full HTML document — wrap into a pristine PWA shell
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  ${pwaHeadTags}
  <style>
    :root {
      --bg: ${backgroundColor};
      --fg: #e6e9f0;
      --acc: ${themeColor};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      min-height: 100dvh;
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Vazirmatn, Tahoma, sans-serif;
      -webkit-font-smoothing: antialiased;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }
  </style>
</head>
<body>
  ${innerHtml}
  ${pwaRuntimeScript}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}
