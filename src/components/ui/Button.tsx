'use client';

import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent-yellow'
  | 'accent-blue'
  | 'accent-green'
  | 'accent-purple'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'hero';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  // Base neo-brutalist button classes
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold select-none cursor-pointer transition-all ' +
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#111111] focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  // Variant classes
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#D94336] hover:bg-[#B83228] text-white border-[3px] border-[#111111] shadow-[5px_5px_0_#111111] btn-tactile',
    secondary:
      'bg-white hover:bg-[#FFF7F2] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] btn-tactile',
    'accent-yellow':
      'bg-[#FFD447] hover:bg-[#F0C433] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] btn-tactile',
    'accent-blue':
      'bg-[#70C5E8] hover:bg-[#5CB5DE] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] btn-tactile',
    'accent-green':
      'bg-[#A8E063] hover:bg-[#97D44F] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] btn-tactile',
    'accent-purple':
      'bg-[#A98BE8] hover:bg-[#9676DC] text-[#111111] border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] btn-tactile',
    danger:
      'bg-[#C7372F] text-white border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] btn-tactile',
    ghost:
      'bg-transparent hover:bg-black/5 text-[#111111] border-[2px] border-transparent shadow-none',
  };

  // Size classes (ensuring minimum 44px height for mobile accessibility)
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs sm:text-sm py-2 px-3.5 min-h-[44px] rounded-xl gap-1.5',
    md: 'text-sm sm:text-base py-2.5 px-4 sm:px-5 min-h-[48px] rounded-2xl gap-2',
    lg: 'text-base sm:text-lg py-3.5 px-6 min-h-[54px] rounded-2xl gap-2.5 tracking-wide',
    hero: 'text-base sm:text-xl py-4 px-7 min-h-[60px] rounded-2xl border-[4px] shadow-[6px_6px_0_#111111] btn-tactile-hero gap-3 font-extrabold uppercase tracking-wider',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </button>
  );
};
