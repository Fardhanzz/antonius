import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        w-full p-6 sm:p-8 rounded-2xl bg-white border-[3px] border-[#111111] shadow-[5px_5px_0_#111111]
        flex flex-col items-center text-center
        ${className}
      `}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFD447] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center mb-4 shrink-0 text-[#111111]">
        {icon || <HelpCircle className="w-8 h-8 stroke-[2.5]" />}
      </div>

      <h3 className="text-base sm:text-lg font-black text-[#111111] uppercase tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#6F6A67] font-medium max-w-xs mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>

      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
};
