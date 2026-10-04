'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backHref,
  onBack,
  rightAction,
  badge,
  className = '',
}) => {
  return (
    <header className={`w-full py-4 px-4 sm:px-6 bg-[#FFF7F2] border-b-[3px] border-[#111111] ${className}`}>
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Kembali"
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-center btn-tactile shrink-0 active:translate-x-0.5 active:translate-y-0.5"
            >
              <ArrowLeft className="w-5 h-5 text-[#111111] stroke-[2.5]" />
            </Link>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali"
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-center btn-tactile shrink-0 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#111111] stroke-[2.5]" />
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111] truncate uppercase">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-[#6F6A67] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
};
