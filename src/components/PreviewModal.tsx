import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getT } from '../utils/i18n';
import {
  X,
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  Download,
  ExternalLink,
  Share2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  htmlUrl: string;
  downloadName: string;
  lang: Language;
}

type DeviceMode = 'iphone' | 'tablet' | 'desktop';

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  htmlUrl,
  downloadName,
  lang
}) => {
  const t = getT(lang);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('iphone');
  const [isLandscape, setIsLandscape] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url: htmlUrl
        });
      } else {
        navigator.clipboard.writeText(htmlUrl);
      }
    } catch {
      // Ignored
    }
  };

  const getContainerDimensions = () => {
    if (deviceMode === 'desktop') {
      return { width: '100%', height: '100%' };
    }
    if (deviceMode === 'tablet') {
      return isLandscape
        ? { width: '1024px', height: '768px' }
        : { width: '768px', height: '1024px' };
    }
    // iPhone
    return isLandscape
      ? { width: '844px', height: '390px' }
      : { width: '390px', height: '844px' };
  };

  const dims = getContainerDimensions();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="bg-[var(--panel)] border-b border-[var(--line)] px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-[var(--fg)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="font-bold truncate max-w-xs sm:max-w-md font-mono" dir="ltr">
            {title}
          </h2>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--line)]">
          <button
            onClick={() => setDeviceMode('iphone')}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all ${
              deviceMode === 'iphone'
                ? 'bg-[#4f8cff] text-white shadow-sm'
                : 'text-[var(--mut)] hover:text-[var(--fg)]'
            }`}
            title={t.deviceIphone}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">iPhone</span>
          </button>

          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all ${
              deviceMode === 'tablet'
                ? 'bg-[#4f8cff] text-white shadow-sm'
                : 'text-[var(--mut)] hover:text-[var(--fg)]'
            }`}
            title={t.deviceTablet}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">iPad</span>
          </button>

          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all ${
              deviceMode === 'desktop'
                ? 'bg-[#4f8cff] text-white shadow-sm'
                : 'text-[var(--mut)] hover:text-[var(--fg)]'
            }`}
            title={t.deviceDesktop}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
        </div>

        {/* Actions & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {deviceMode !== 'desktop' && (
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className="p-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)] transition-colors"
              title={t.rotate}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href={htmlUrl}
            download={downloadName}
            className="p-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[#4f8cff] hover:bg-[#4f8cff]/10 transition-colors"
            title={t.btnDownload}
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)] transition-colors"
            title={t.btnOpen}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleShare}
            className="p-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--mut)] hover:text-[var(--fg)] transition-colors hidden sm:block"
            title={t.btnShare}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-950/70">
        {deviceMode === 'desktop' ? (
          <div className="w-full h-full max-w-6xl rounded-2xl overflow-hidden border border-[var(--line)] bg-white shadow-2xl">
            <iframe
              src={htmlUrl}
              title={title}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            />
          </div>
        ) : (
          <div
            style={{
              width: dims.width,
              height: dims.height,
              maxHeight: 'calc(100vh - 120px)',
              maxWidth: 'calc(100vw - 32px)',
              transform: `scale(${zoom})`
            }}
            className={`transition-all duration-300 relative flex flex-col bg-[#111] rounded-[48px] p-3 shadow-2xl border-[6px] border-[#2a2e39] ring-1 ring-white/10`}
          >
            {/* iPhone Dynamic Island / Speaker Notch */}
            {deviceMode === 'iphone' && !isLandscape && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-end px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a2e]" />
              </div>
            )}

            {/* Inner display */}
            <div className="flex-1 w-full h-full rounded-[36px] overflow-hidden bg-white relative">
              <iframe
                src={htmlUrl}
                title={title}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
              />
            </div>

            {/* iPhone bottom home bar */}
            {deviceMode === 'iphone' && (
              <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-2" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
