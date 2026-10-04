'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Clock, Settings } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isScan = pathname === '/scan';
  const isHistory = pathname === '/history';
  const isSettings = pathname === '/settings';

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-[#111111] shadow-[0_-4px_0_#111111]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Home Link */}
        <Link
          href="/"
          aria-label="Beranda"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-transform active:scale-95 ${
            isHome ? 'text-[#D94336]' : 'text-[#111111] hover:text-[#D94336]'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              isHome
                ? 'bg-[#FFD447] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111]'
                : ''
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider mt-0.5 ${
            isHome ? 'font-black underline underline-offset-2' : 'font-bold'
          }`}>
            Beranda
          </span>
        </Link>

        {/* Scan Soal - Visually Dominant Center Action */}
        <div className="relative -top-5">
          <Link
            href="/scan"
            aria-label="Pindai Soal Baru"
            className="flex flex-col items-center group"
          >
            <div
              className={`
                w-14 h-14 rounded-2xl bg-[#D94336] text-white
                border-[4px] border-[#111111] shadow-[5px_5px_0_#111111]
                flex items-center justify-center
                btn-tactile active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#111111]
                group-hover:bg-[#B83228]
                ${isScan ? 'ring-4 ring-[#FFD447]' : ''}
              `}
            >
              <Camera className="w-7 h-7 stroke-[2.5]" />
            </div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#111111] mt-1 bg-[#FFD447] px-1.5 py-0.2 rounded border border-[#111111] shadow-[1px_1px_0_#111111]">
              SCAN
            </span>
          </Link>
        </div>

        {/* History Link */}
        <Link
          href="/history"
          aria-label="Riwayat Pertanyaan"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-transform active:scale-95 ${
            isHistory ? 'text-[#D94336]' : 'text-[#111111] hover:text-[#D94336]'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              isHistory
                ? 'bg-[#FFD447] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111]'
                : ''
            }`}
          >
            <Clock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider mt-0.5 ${
            isHistory ? 'font-black underline underline-offset-2' : 'font-bold'
          }`}>
            Riwayat
          </span>
        </Link>

        {/* Settings Link */}
        <Link
          href="/settings"
          aria-label="Pengaturan"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-transform active:scale-95 ${
            isSettings ? 'text-[#D94336]' : 'text-[#111111] hover:text-[#D94336]'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-colors ${
              isSettings
                ? 'bg-[#FFD447] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111]'
                : ''
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider mt-0.5 ${
            isSettings ? 'font-black underline underline-offset-2' : 'font-bold'
          }`}>
            Setelan
          </span>
        </Link>
      </div>
    </nav>
  );
};
