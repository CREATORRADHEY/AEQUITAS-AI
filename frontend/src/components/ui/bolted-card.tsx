import React from 'react';
import { cn } from '@/lib/utils';

interface BoltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  withScrews?: boolean;
  withVents?: boolean;
  children: React.ReactNode;
}

const ScrewHead = () => (
  <div className="absolute h-3 w-3 rounded-full bg-recessed shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2),1px_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center">
    <div className="w-[1px] h-2 bg-text-muted/30 rotate-45" />
  </div>
);

const VentGroup = () => (
  <div className="flex gap-1.5">
    {[1, 2, 3].map((v) => (
      <div 
        key={v} 
        className="h-6 w-1 rounded-full bg-recessed shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]" 
      />
    ))}
  </div>
);

export const BoltedCard = React.forwardRef<HTMLDivElement, BoltedCardProps>(
  ({ className, elevated = false, withScrews = true, withVents = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative p-8 bg-chassis rounded-xl transition-all duration-300",
          elevated ? "shadow-floating -translate-y-1" : "shadow-card",
          className
        )}
        {...props}
      >
        {withScrews && (
          <>
            <div className="absolute top-3 left-3"><ScrewHead /></div>
            <div className="absolute top-3 right-3"><ScrewHead /></div>
            <div className="absolute bottom-3 left-3"><ScrewHead /></div>
            <div className="absolute bottom-3 right-3"><ScrewHead /></div>
          </>
        )}
        
        {withVents && (
          <div className="absolute top-8 right-8">
            <VentGroup />
          </div>
        )}

        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

BoltedCard.displayName = 'BoltedCard';
