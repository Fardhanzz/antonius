import React from 'react';

export type CardVariant =
  | 'white'
  | 'canvas'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'purple';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'white',
  shadow = 'md',
  interactive = false,
  children,
  className = '',
  ...props
}) => {
  const variantStyles: Record<CardVariant, string> = {
    white: 'bg-white text-[#111111]',
    canvas: 'bg-[#FFF7F2] text-[#111111]',
    yellow: 'bg-[#FFD447] text-[#111111]',
    blue: 'bg-[#70C5E8] text-[#111111]',
    green: 'bg-[#A8E063] text-[#111111]',
    purple: 'bg-[#A98BE8] text-[#111111]',
  };

  const shadowStyles = {
    sm: 'shadow-[3px_3px_0_#111111]',
    md: 'shadow-[5px_5px_0_#111111]',
    lg: 'shadow-[7px_7px_0_#111111]',
    none: 'shadow-none',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1'
    : '';

  return (
    <div
      className={`
        border-[3px] border-[#111111] rounded-2xl p-4 sm:p-5
        ${variantStyles[variant]}
        ${shadowStyles[shadow]}
        ${interactiveStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
