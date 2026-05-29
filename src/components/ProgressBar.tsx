import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'success';
}

const sizeMap = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
const colorMap = {
  primary: 'from-primary to-secondary',
  secondary: 'from-secondary to-primary',
  accent: 'from-accent to-primary',
  success: 'from-success to-secondary',
};

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-text-secondary">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-mono text-primary">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${sizeMap[size]} bg-surface-light rounded-full overflow-hidden`}>
        <div
          className={`${sizeMap[size]} bg-gradient-to-r ${colorMap[color]} rounded-full transition-all duration-500 ease-out relative`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse-glow rounded-full" />
        </div>
      </div>
    </div>
  );
}
