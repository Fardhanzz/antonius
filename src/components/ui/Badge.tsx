import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'dark';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  icon,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#FFF7F2] text-[#111111]',
    yellow: 'bg-[#FFD447] text-[#111111]',
    blue: 'bg-[#70C5E8] text-[#111111]',
    green: 'bg-[#A8E063] text-[#111111]',
    purple: 'bg-[#A98BE8] text-[#111111]',
    red: 'bg-[#D94336] text-white',
    dark: 'bg-[#111111] text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider
        rounded-lg border-[2px] border-[#111111] shadow-[2px_2px_0_#111111]
        select-none shrink-0
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
