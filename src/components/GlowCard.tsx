import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'accent' | 'success';
  hover?: boolean;
  onClick?: () => void;
}

const glowMap = {
  primary: 'hover:shadow-[0_0_30px_rgba(158,127,255,0.15)]',
  secondary: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]',
  accent: 'hover:shadow-[0_0_30px_rgba(244,114,182,0.15)]',
  success: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
};

const borderMap = {
  primary: 'hover:border-primary/30',
  secondary: 'hover:border-secondary/30',
  accent: 'hover:border-accent/30',
  success: 'hover:border-success/30',
};

export default function GlowCard({
  children,
  className = '',
  glowColor = 'primary',
  hover = true,
  onClick,
}: GlowCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        glass rounded-2xl border border-border/50
        transition-all duration-300 ease-out
        ${hover ? `${glowMap[glowColor]} ${borderMap[glowColor]} hover:scale-[1.02] cursor-pointer` : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
