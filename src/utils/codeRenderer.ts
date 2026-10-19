import { packageAsPWA, PWAPackageOptions } from './pwaPackager';

export type CodeSnippetType = 'html' | 'react' | 'canvas' | 'javascript';

export interface RenderCodeOptions extends Partial<PWAPackageOptions> {
  type?: CodeSnippetType;
  title: string;
}

export function detectCodeType(code: string): CodeSnippetType {
  const trimmed = code.trim();

  // If it's a full HTML document
  if (/<!doctype\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    return 'html';
  }

  // React JSX / TSX
  if (
    /import\s+.*?from\s+['"]react['"]/i.test(trimmed) ||
    /function\s+[A-Z]\w*\s*\(/i.test(trimmed) && /return\s*\(/i.test(trimmed) ||
    /const\s+[A-Z]\w*\s*=\s*\(.*?\)\s*=>/i.test(trimmed) ||
    /<\w+[\s>].*?<\/\w+>/s.test(trimmed) && (trimmed.includes('useState') || trimmed.includes('useEffect') || trimmed.includes('className='))
  ) {
    return 'react';
  }

  // Canvas game or animation
  if (
    /canvas\.getContext\(/i.test(trimmed) ||
    /requestAnimationFrame\(/i.test(trimmed) ||
    /ctx\.(fillRect|beginPath|arc|drawImage)/i.test(trimmed)
  ) {
    return 'canvas';
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return 'html';
  }

  return 'javascript';
}

export function renderCodeToPWA(rawCode: string, options: RenderCodeOptions): string {
  const detected = options.type || detectCodeType(rawCode);
  const title = options.title || 'AnyHTML App';
  const themeColor = options.themeColor || '#4f8cff';

  let innerHtml = '';

  if (detected === 'react') {
    innerHtml = generateReactWrapper(rawCode, title);
  } else if (detected === 'canvas') {
    innerHtml = generateCanvasWrapper(rawCode, title);
  } else if (detected === 'javascript') {
    innerHtml = generateJavaScriptWrapper(rawCode, title);
  } else {
    // Pure HTML
    innerHtml = rawCode;
  }

  return packageAsPWA(innerHtml, {
    title,
    shortName: options.shortName || title.slice(0, 12),
    description: options.description || `${title} — Generated with AnyHTML`,
    themeColor: options.themeColor || '#0b0d12',
    backgroundColor: options.backgroundColor || '#0b0d12',
    includeInstallBanner: options.includeInstallBanner !== false,
    includeTailwind: options.includeTailwind !== false
  });
}

function generateReactWrapper(code: string, title: string): string {
  // Strip import statements so Babel can run smoothly in browser
  let cleanCode = code
    .replace(/import\s+(?:React\s*,?\s*)?(?:\{[^}]*\})?\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+/g, 'const AnyHTMLDefaultApp = ');

  // Identify root component name
  let rootComponentName = 'AnyHTMLDefaultApp';
  if (!cleanCode.includes('AnyHTMLDefaultApp')) {
    const match = cleanCode.match(/(?:function|const|class)\s+([A-Z]\w*)/);
    if (match && match[1]) {
      rootComponentName = match[1];
    }
  }

  return `
  <div id="root"></div>

  <!-- React 18 & Babel Standalone CDN -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback, useId } = React;

    // Error Boundary wrapper
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, errorInfo) {
        console.error("React Error caught:", error, errorInfo);
      }
      render() {
        if (this.state.hasError) {
          return (
            <div style={{
              minHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: '#0b0d12',
              color: '#ff6b6b',
              fontFamily: 'ui-monospace, monospace',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#ff85a1' }}>خطای اجرای کامپوننت ری‌اکت</h2>
              <pre style={{
                background: '#161a24',
                border: '1px solid #232836',
                padding: '16px',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                overflowX: 'auto',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                {this.state.error?.toString()}
              </pre>
            </div>
          );
        }
        return this.props.children;
      }
    }

    try {
      ${cleanCode}

      const AppToRender = typeof ${rootComponentName} !== 'undefined' ? ${rootComponentName} : () => (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2>برنامه ری‌اکت با موفقیت کامپایل شد</h2>
        </div>
      );

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <ErrorBoundary>
          <AppToRender />
        </ErrorBoundary>
      );
    } catch (e) {
      console.error("Compilation error:", e);
      document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ff6b6b;font-family:monospace"><b>خطای کامپایل ری‌اکت:</b><br>' + e.message + '</div>';
    }
  </script>
  `;
}

function generateCanvasWrapper(code: string, title: string): string {
  return `
  <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b0d12;overflow:hidden">
    <canvas id="gameCanvas" style="max-width:100%;max-height:100%;touch-action:none;box-shadow:0 10px 40px rgba(0,0,0,0.8)"></canvas>
  </div>
  <script>
    (function(){
      var canvas = document.getElementById('gameCanvas');
      var ctx = canvas.getContext('2d');

      // Auto-sizing canvas
      function resize() {
        if (!canvas.width || canvas.width === 300) {
          canvas.width = Math.min(window.innerWidth, 800);
          canvas.height = Math.min(window.innerHeight, 800);
        }
      }
      resize();

      try {
        ${code}
      } catch (err) {
        console.error("Canvas execution error:", err);
      }
    })();
  </script>
  `;
}

function generateJavaScriptWrapper(code: string, title: string): string {
  return `
  <div style="max-width:860px;margin:0 auto;padding:24px 16px;">
    <header style="margin-bottom:20px;border-bottom:1px solid #232836;padding-bottom:12px;">
      <h1 style="font-size:20px;font-weight:bold">${escapeHtml(title)}</h1>
      <p style="font-size:12px;color:#8b93a7">AnyHTML Script App</p>
    </header>
    <div id="app"></div>
    <div id="output" style="margin-top:20px;background:#12151c;border:1px solid #232836;border-radius:14px;padding:16px;font:12px/1.6 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;overflow-x:auto;"></div>
  </div>
  <script>
    (function(){
      var out = document.getElementById('output');
      var oldLog = console.log;
      console.log = function() {
        var args = Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
        var d = document.createElement('div');
        d.textContent = '› ' + args;
        out.appendChild(d);
        oldLog.apply(console, arguments);
      };
      try {
        ${code}
      } catch (err) {
        console.error("Execution error:", err);
        var errDiv = document.createElement('div');
        errDiv.style.color = '#ff6b6b';
        errDiv.textContent = '❌ Error: ' + err.message;
        out.appendChild(errDiv);
      }
    })();
  </script>
  `;
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
