import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { renderCodeToPWA, detectCodeType } from '../utils/codeRenderer';
import { generateAppIconSvg } from '../utils/pwaPackager';
import {
  Code2,
  Play,
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Sparkles,
  Gamepad2,
  CheckSquare,
  Timer,
  BarChart3,
  Settings2,
  RotateCcw,
  Zap
} from 'lucide-react';

interface LiveCodeStudioProps {
  lang: Language;
  onPreviewInModal: (title: string, htmlBlobUrl: string, downloadName: string) => void;
}

const TEMPLATES = [
  {
    id: 'react-app',
    nameFa: 'اپلیکیشن موبایل ری‌اکت',
    nameEn: 'React Mobile App',
    icon: Sparkles,
    type: 'react' as const,
    title: 'تسک‌میت — مدیریت کارها',
    shortName: 'TaskMate',
    themeColor: '#4f8cff',
    code: `function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'بررسی کدهای پروژه AnyHTML', done: true },
    { id: 2, text: 'خروجی گرفتن به صورت PWA برای آیفون', done: false },
    { id: 3, text: 'تست حالت آفلاین بدون اینترنت', done: false }
  ]);
  const [newText, setNewText] = useState('');

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newText.trim(), done: false }]);
    setNewText('');
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-[#e6e9f0] p-4 max-w-md mx-auto flex flex-col font-sans">
      <header className="py-6 border-b border-[#232836] mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Task<span className="text-[#4f8cff]">Mate</span>
          </h1>
          <p className="text-xs text-[#8b93a7]">برنامه PWA مستقل و کاملاً آفلاین</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#4f8cff]/15 text-[#4f8cff] border border-[#4f8cff]/30">
          {tasks.filter(t => t.done).length}/{tasks.length}
        </span>
      </header>

      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="افزودن کار جدید..."
          className="flex-1 px-4 py-3 rounded-2xl bg-[#12151c] border border-[#232836] text-sm text-white placeholder-[#667089] focus:outline-none focus:border-[#4f8cff]"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-[#4f8cff] text-white font-bold text-sm shadow-lg shadow-[#4f8cff]/30 active:scale-95 transition"
        >
          افزودن
        </button>
      </form>

      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={"p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between " + 
              (task.done ? 'bg-[#12151c]/50 border-[#232836] opacity-60' : 'bg-[#12151c] border-[#232836] hover:border-[#4f8cff]/50')}
          >
            <span className={"text-sm font-medium " + (task.done ? 'line-through text-[#8b93a7]' : 'text-white')}>
              {task.text}
            </span>
            <div className={"w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold " + 
              (task.done ? 'bg-emerald-500 text-white' : 'border border-[#32394c]')}>
              {task.done ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-6 pt-4 border-t border-[#232836] text-center text-xs text-[#667089]">
        طراحی شده با AnyHTML • قابلیت اجرای تمام‌صفحه PWA
      </footer>
    </div>
  );
}`
  },
  {
    id: 'arcade-game',
    nameFa: 'بازی دوبعدی آرکید (Canvas)',
    nameEn: '2D Arcade Game (Canvas)',
    icon: Gamepad2,
    type: 'canvas' as const,
    title: 'اسپیس دوج — بازی آرکید',
    shortName: 'SpaceDodge',
    themeColor: '#ff007f',
    code: `// Responsive 2D Space Dodge Arcade Game
canvas.width = 480;
canvas.height = 640;

let player = { x: 240, y: 550, size: 24, speed: 7 };
let meteors = [];
let score = 0;
let gameOver = false;
let keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Touch / Mouse controls for mobile PWA
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  let rect = canvas.getBoundingClientRect();
  player.x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
});
canvas.addEventListener('mousemove', e => {
  let rect = canvas.getBoundingClientRect();
  player.x = (e.clientX - rect.left) * (canvas.width / rect.width);
});

function spawnMeteor() {
  if (!gameOver && Math.random() < 0.08) {
    meteors.push({
      x: Math.random() * (canvas.width - 30),
      y: -30,
      size: 15 + Math.random() * 25,
      speed: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? '#ff4d6d' : '#f72585'
    });
  }
}

function update() {
  if (gameOver) return;

  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));

  spawnMeteor();

  for (let i = meteors.length - 1; i >= 0; i--) {
    let m = meteors[i];
    m.y += m.speed;

    // Collision detection
    let dx = player.x - m.x;
    let dy = player.y - m.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < player.size + m.size) {
      gameOver = true;
    }

    if (m.y > canvas.height + 40) {
      meteors.splice(i, 1);
      score += 10;
    }
  }
}

function draw() {
  ctx.fillStyle = '#06070a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 20; i++) {
    let sx = (i * 73 + score * 2) % canvas.width;
    let sy = (i * 97 + score * 4) % canvas.height;
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Draw Player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#4f8cff';
  ctx.beginPath();
  ctx.moveTo(0, -player.size);
  ctx.lineTo(player.size, player.size);
  ctx.lineTo(0, player.size * 0.6);
  ctx.lineTo(-player.size, player.size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw Meteors
  meteors.forEach(m => {
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Score HUD
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('امتیاز: ' + score, 20, 40);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('پایان بازی!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText('برای بازی دوباره لمس کنید', canvas.width / 2, canvas.height / 2 + 25);
  }
}

canvas.addEventListener('click', () => {
  if (gameOver) {
    gameOver = false;
    score = 0;
    meteors = [];
  }
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();`
  },
  {
    id: 'pomodoro',
    nameFa: 'تایمر تمرکز پومودورو',
    nameEn: 'Pomodoro Focus Timer',
    icon: Timer,
    type: 'react' as const,
    title: 'تایمر تمرکز پومودورو',
    shortName: 'FocusPWA',
    themeColor: '#ff6b4a',
    code: `function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      if (mode === 'focus') {
        alert('زمان تمرکز به پایان رسید! وقت ۵ دقیقه استراحت است ☕');
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        alert('استراحت تمام شد! آماده تمرکز مجدد هستید؟ 💪');
        setMode('focus');
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="min-h-screen bg-[#0d0f17] text-[#e6e9f0] p-6 flex flex-col items-center justify-center font-sans select-none">
      <div className="w-full max-w-sm bg-[#151926] border border-[#232b40] rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => { setMode('focus'); setTimeLeft(25 * 60); setIsRunning(false); }}
            className={"px-4 py-1.5 rounded-full text-xs font-bold transition " + (mode === 'focus' ? 'bg-[#ff6b4a] text-white shadow-lg' : 'bg-[#1e2436] text-[#8b93a7]')}
          >
            تمرکز (۲۵ دقیقه)
          </button>
          <button
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsRunning(false); }}
            className={"px-4 py-1.5 rounded-full text-xs font-bold transition " + (mode === 'break' ? 'bg-[#3ecf8e] text-white shadow-lg' : 'bg-[#1e2436] text-[#8b93a7]')}
          >
            استراحت (۵ دقیقه)
          </button>
        </div>

        {/* Circular Clock Display */}
        <div className="relative w-56 h-56 mx-auto mb-8 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#232b40" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={mode === 'focus' ? '#ff6b4a' : '#3ecf8e'}
              strokeWidth="6"
              strokeDasharray="264"
              strokeDashoffset={264 - (264 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute text-5xl font-mono font-black tracking-tight text-white">
            {timeFormatted}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={"px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition " + 
              (isRunning ? 'bg-amber-500 text-neutral-950' : 'bg-[#ff6b4a] text-white')}
          >
            {isRunning ? 'توقف موقت' : 'شروع تمرکز'}
          </button>
          <button
            onClick={() => { setIsRunning(false); setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60); }}
            className="px-5 py-3.5 rounded-2xl bg-[#1e2436] border border-[#2b354d] text-[#8b93a7] hover:text-white transition"
          >
            بازنشانی
          </button>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    id: 'dashboard',
    nameFa: 'داشبورد مدیریتی و تحلیلی',
    nameEn: 'Analytics Dashboard',
    icon: BarChart3,
    type: 'html' as const,
    title: 'داشبورد آمار و تحلیل',
    shortName: 'Analytics',
    themeColor: '#3ecf8e',
    code: `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>داشبورد آمار</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0d12] text-[#e6e9f0] p-4 sm:p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#232836] gap-3">
      <div>
        <h1 class="text-xl font-bold text-white">داشبورد آمار عملکرد</h1>
        <p class="text-xs text-[#8b93a7]">گزارش زنده فعالیت‌ها و شاخص‌های کلیدی</p>
      </div>
      <button class="px-4 py-2 rounded-xl bg-[#3ecf8e] text-neutral-950 font-bold text-xs shadow-lg shadow-[#3ecf8e]/20 self-start sm:self-auto">
        دریافت گزارش PDF
      </button>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-[#12151c] border border-[#232836] space-y-1">
        <span class="text-xs text-[#8b93a7]">کل تبدیل‌های AnyHTML</span>
        <div class="text-2xl font-black text-white">۲,۴۸۰</div>
        <span class="text-[11px] text-[#3ecf8e] font-semibold">↑ ۱۸٪ رشد نسبت به ماه قبل</span>
      </div>
      <div class="p-5 rounded-2xl bg-[#12151c] border border-[#232836] space-y-1">
        <span class="text-xs text-[#8b93a7]">برنامه‌های فعال PWA</span>
        <div class="text-2xl font-black text-[#4f8cff]">۸۹۰</div>
        <span class="text-[11px] text-[#4f8cff] font-semibold">۱۰۰٪ آفلاین و بدون سرور</span>
      </div>
      <div class="p-5 rounded-2xl bg-[#12151c] border border-[#232836] space-y-1">
        <span class="text-xs text-[#8b93a7]">سرعت رندر میانگین</span>
        <div class="text-2xl font-black text-amber-400">۰.۲ ثانیه</div>
        <span class="text-[11px] text-amber-400 font-semibold">بسته‌بندی در حافظه مرورگر</span>
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-[#12151c] border border-[#232836]">
      <h2 class="text-sm font-bold text-white mb-4">آخرین پروژه‌های بسته‌بندی شده</h2>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 rounded-xl bg-[#0b0d12] border border-[#232836] text-xs">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-[#4f8cff]/15 text-[#4f8cff] flex items-center justify-center font-bold">PWA</span>
            <div>
              <b class="text-white block">پروژه استودیو محتوا</b>
              <span class="text-[#8b93a7]">فرمت: تک‌فایل HTML</span>
            </div>
          </div>
          <span class="text-[#3ecf8e] font-semibold">موفق ✓</span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-xl bg-[#0b0d12] border border-[#232836] text-xs">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-[#ff6b4a]/15 text-[#ff6b4a] flex items-center justify-center font-bold">JS</span>
            <div>
              <b class="text-white block">بازی آرکید فضایی</b>
              <span class="text-[#8b93a7]">کنترل لمسی آیفون</span>
            </div>
          </div>
          <span class="text-[#3ecf8e] font-semibold">موفق ✓</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  }
];

export const LiveCodeStudio: React.FC<LiveCodeStudioProps> = ({
  lang,
  onPreviewInModal
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [shortName, setShortName] = useState(TEMPLATES[0].shortName);
  const [themeColor, setThemeColor] = useState(TEMPLATES[0].themeColor);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Compile and generate preview whenever code or settings change
  useEffect(() => {
    try {
      const generated = renderCodeToPWA(code, {
        title: title.trim() || 'AnyHTML App',
        shortName: (shortName.trim() || title.trim() || 'App').slice(0, 12),
        themeColor,
        includeInstallBanner: true,
        includeTailwind: true
      });

      setPreviewHtml(generated);

      const blob = new Blob([generated], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Render error:', err);
    }
  }, [code, title, shortName, themeColor]);

  const handleSelectTemplate = (tId: string) => {
    const t = TEMPLATES.find((x) => x.id === tId);
    if (!t) return;
    setSelectedTemplate(t.id);
    setCode(t.code);
    setTitle(t.title);
    setShortName(t.shortName);
    setThemeColor(t.themeColor);
  };

  const handleDownload = () => {
    if (!previewBlobUrl) return;
    const a = document.createElement('a');
    a.href = previewBlobUrl;
    a.download = `${(shortName || 'app').toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCode = async () => {
    if (!previewHtml) return;
    await navigator.clipboard.writeText(previewHtml);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!previewHtml) return;
    try {
      const file = new File([previewHtml], `${shortName || 'app'}.html`, {
        type: 'text/html'
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Check out this PWA created with AnyHTML: ${title}`
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const handleOpenInModal = () => {
    if (!previewBlobUrl) return;
    onPreviewInModal(
      title,
      previewBlobUrl,
      `${(shortName || 'app').toLowerCase().replace(/\s+/g, '-')}.html`
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner & Template Chooser */}
      <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#4f8cff]" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--fg)]">
                {lang === 'fa'
                  ? 'رندر زنده کد و تولید PWA اختصاصی'
                  : 'Live Code to Standalone PWA Studio'}
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                100% Offline PWA
              </span>
            </div>
            <p className="text-xs text-[var(--mut)] mt-1">
              {lang === 'fa'
                ? 'هر کدی (ری‌اکت، HTML، جاوااسکریپت یا بازی Canvas) را بنویسید یا پیست کنید؛ بلافاصله به یک اپلیکیشن PWA تک‌فایلی تبدیل می‌شود.'
                : 'Write or paste any React, HTML, JS, or Canvas code; instantly rendered into a standalone, installable PWA HTML file.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                showConfig
                  ? 'bg-[#4f8cff]/15 border-[#4f8cff] text-[#4f8cff]'
                  : 'bg-[var(--bg)] border-[var(--line)] text-[var(--mut)] hover:text-[var(--fg)]'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'تنظیمات نام و ظاهر PWA' : 'PWA Settings'}</span>
            </button>
          </div>
        </div>

        {/* Templates Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-[var(--mut)] whitespace-nowrap font-medium me-1">
            {lang === 'fa' ? 'قالب‌های آماده:' : 'Templates:'}
          </span>
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#4f8cff] text-white border-transparent shadow-md shadow-[#4f8cff]/20'
                    : 'bg-[var(--bg)] border-[var(--line)] text-[var(--mut)] hover:text-[var(--fg)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? tmpl.nameFa : tmpl.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* PWA Configuration Drawer */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-[var(--line)] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--mut)] mb-1">
                {lang === 'fa' ? 'نام کامل اپلیکیشن' : 'App Full Name'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:border-[#4f8cff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--mut)] mb-1">
                {lang === 'fa' ? 'نام کوتاه (صفحه اصلی موبایل - حداکثر ۱۲ کاراکتر)' : 'Short Name (≤ 12 chars)'}
              </label>
              <input
                type="text"
                value={shortName}
                maxLength={12}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:border-[#4f8cff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--mut)] mb-1">
                {lang === 'fa' ? 'رنگ تم PWA' : 'Theme Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor & Live Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Code Input Area */}
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 flex flex-col shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-3">
            <span className="text-xs font-mono font-bold text-[var(--fg)] flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-[#4f8cff]" />
              <span>{lang === 'fa' ? 'کد منبع برنامه (HTML / React / JS)' : 'Source Code Editor'}</span>
            </span>
            <span className="text-[11px] text-[var(--mut)] font-mono">
              {detectCodeType(code).toUpperCase()}
            </span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 min-h-[380px] p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-mono text-[var(--fg)] leading-relaxed focus:outline-none focus:border-[#4f8cff] resize-y"
            dir="ltr"
          />
        </div>

        {/* Live Preview Container */}
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 flex flex-col shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-[var(--fg)]">
                {lang === 'fa' ? 'پیش‌نمایش زنده خروجی PWA' : 'Live Output Preview'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenInModal}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#4f8cff] text-white hover:bg-[#3d7ae8] transition cursor-pointer shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'فریم آیفون' : 'iPhone Frame'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--fg)] hover:text-[#4f8cff] hover:border-[#4f8cff] transition cursor-pointer"
                title="دانلود HTML"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'fa' ? 'دانلود HTML' : 'Download'}</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)] transition cursor-pointer"
                title="کپی HTML خروجی"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)] transition cursor-pointer"
                title="اشتراک‌گذاری"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[380px] rounded-xl overflow-hidden border border-[var(--line)] bg-[#0b0d12] shadow-inner relative">
            {previewBlobUrl && (
              <iframe
                src={previewBlobUrl}
                title="Live Output Preview"
                className="w-full h-full min-h-[380px] border-0 bg-transparent"
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
