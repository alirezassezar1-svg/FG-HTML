import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { Language } from '../types';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 transition cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lang === 'fa' ? 'نصب برنامه' : 'Install PWA'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] hover:border-[#4f8cff]/50 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#4f8cff]" />
          <span>{lang === 'fa' ? 'نصب در آیفون' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--panel)] border border-[var(--line)] p-5 shadow-2xl text-start">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#4f8cff]" />
                  <h3 className="text-sm font-bold text-[var(--fg)]">
                    {lang === 'fa' ? 'نصب روی آیفون / آیپد' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[var(--mut)] hover:text-[var(--fg)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[var(--fg)]">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                  <span className="w-6 h-6 rounded-full bg-[#4f8cff]/15 text-[#4f8cff] flex items-center justify-center font-bold shrink-0">
                    ۱
                  </span>
                  <div>
                    <span className="font-semibold block mb-0.5">
                      {lang === 'fa' ? 'لمس دکمه Share' : 'Tap the Share Button'}
                    </span>
                    <span className="text-[var(--mut)]">
                      {lang === 'fa'
                        ? 'در نوار پایین مرورگر Safari دکمه اشتراک‌گذاری (مربع با فلش به بالا) را بزنید.'
                        : 'In Safari toolbar, tap the Share icon (square with upward arrow).'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                  <span className="w-6 h-6 rounded-full bg-[#4f8cff]/15 text-[#4f8cff] flex items-center justify-center font-bold shrink-0">
                    ۲
                  </span>
                  <div>
                    <span className="font-semibold block mb-0.5">
                      {lang === 'fa' ? 'افزودن به صفحه اصلی' : 'Add to Home Screen'}
                    </span>
                    <span className="text-[var(--mut)]">
                      {lang === 'fa'
                        ? 'به پایین اسکرول کنید و گزینه "Add to Home Screen" را انتخاب کنید.'
                        : 'Scroll down and select "Add to Home Screen".'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-[#4f8cff] text-white font-semibold text-xs hover:bg-[#3d7ae8] transition cursor-pointer"
              >
                {lang === 'fa' ? 'متوجه شدم' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
