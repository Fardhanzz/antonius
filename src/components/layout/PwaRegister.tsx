'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Download, X } from 'lucide-react';

// Extended Event interface for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaRegister: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running in standalone PWA mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Initial online status
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture PWA install prompt (Android Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // When app is installed, immediately hide the button
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed:', err));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div
          role="alert"
          className="fixed top-0 left-0 right-0 z-50 bg-[#FFD447] text-[#111111] px-4 py-2 border-b-[3px] border-[#111111] shadow-[0_3px_0_#111111] text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>Kamu sedang offline. Fitur AI membutuhkan koneksi internet.</span>
        </div>
      )}

      {/* PWA Install Banner (Muncul di browser sebelum diunduh/dipasang ke HP) */}
      {!isStandalone && installPrompt && !isDismissed && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#FFF7F2] border-[3px] border-[#111111] shadow-[5px_5px_0_#111111] rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#FFD447] border-[2px] border-[#111111] flex items-center justify-center shrink-0 text-[#111111]">
                <Download className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase text-[#111111] block tracking-wide truncate">
                  Pasang Antonius
                </span>
                <span className="text-[11px] text-[#6F6A67] font-semibold block truncate">
                  Akses instan dari layar utama HP
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-[#D94336] hover:bg-[#B83228] text-white border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] text-xs font-black uppercase px-3 py-2 rounded-xl active:translate-x-0.5 active:translate-y-0.5 min-h-[44px] flex items-center cursor-pointer"
              >
                Unduh
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                aria-label="Tutup ajakan pasang"
                className="p-2 text-[#6F6A67] hover:text-[#111111] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
