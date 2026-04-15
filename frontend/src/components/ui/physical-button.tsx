import React from 'react';
import { cn } from '@/lib/utils';

interface PhysicalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const PhysicalButton = React.forwardRef<HTMLButtonElement, PhysicalButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-150 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-accent text-accent-foreground rounded-lg shadow-[4px_4px_8px_rgba(166,50,60,0.4),-4px_-4px_8px_rgba(255,100,110,0.4)] hover:brightness-110 active:shadow-pressed",
      secondary: "bg-chassis text-text-primary rounded-lg shadow-card hover:text-accent active:shadow-pressed",
      ghost: "text-text-muted hover:bg-recessed hover:shadow-recessed rounded-md",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs h-10",
      md: "px-8 py-3 text-sm h-12",
      lg: "px-10 py-4 text-base h-14",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PhysicalButton.displayName = 'PhysicalButton';
