import React from 'react';
import { cn } from '@/lib/utils';

interface LEDIndicatorProps {
  status?: 'online' | 'offline' | 'warning' | 'error';
  label?: string;
  className?: string;
}

export const LEDIndicator: React.FC<LEDIndicatorProps> = ({ status = 'online', label, className }) => {
  const colors = {
    online: "bg-green-500 shadow-[0_0_10px_2px_rgba(34,197,94,0.6)]",
    offline: "bg-slate-400 shadow-none",
    warning: "bg-yellow-500 shadow-[0_0_10px_2px_rgba(234,179,8,0.6)]",
    error: "bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.6)]",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "h-2.5 w-2.5 rounded-full animate-pulse",
        colors[status]
      )} />
      {label && (
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
      )}
    </div>
  );
};
