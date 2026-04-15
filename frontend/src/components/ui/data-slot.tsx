import React from 'react';
import { cn } from '@/lib/utils';

interface DataSlotProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DataSlot = React.forwardRef<HTMLInputElement, DataSlotProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full h-14 px-6 bg-chassis rounded-md font-mono text-sm shadow-recessed border-none outline-none transition-all duration-200",
              "placeholder:text-text-muted/50",
              "focus:shadow-[inset_4px_4px_8px_var(--shadow-color),_inset_-4px_-4px_8px_var(--highlight-color),_0_0_0_2px_var(--accent)]",
              error && "focus:shadow-[inset_4px_4px_8px_var(--shadow-color),_inset_-4px_-4px_8px_var(--highlight-color),_0_0_0_2px_#ff0000]",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[10px] font-mono text-red-500 uppercase ml-1">{error}</span>}
      </div>
    );
  }
);

DataSlot.displayName = 'DataSlot';
