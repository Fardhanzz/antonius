'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const PwaRegister: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Register Service Worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.warn('SW registration failed:', err));
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-[#FFD447] text-[#111111] px-4 py-2 border-b-[3px] border-[#111111] shadow-[0_3px_0_#111111] text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4 shrink-0 stroke-[2.5]" />
      <span>Kamu sedang offline. Fitur AI membutuhkan koneksi internet.</span>
    </div>
  );
};
