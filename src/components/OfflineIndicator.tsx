import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Language } from '../types';

interface OfflineIndicatorProps {
  lang: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 text-neutral-950 px-3.5 py-2 text-xs font-bold shadow-lg shadow-amber-500/20 border border-amber-400 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {lang === 'fa'
          ? 'حالت آفلاین — برنامه به صورت محلی در حافظه کش اجرا می‌شود.'
          : 'Offline Mode — Cached offline data is active.'}
      </span>
    </div>
  );
};
