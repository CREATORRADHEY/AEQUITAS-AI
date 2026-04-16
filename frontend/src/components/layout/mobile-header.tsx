'use client';

import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { PhysicalButton } from '@/components/ui/physical-button';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export function MobileHeader({ onMenuToggle, title = "Aequitas AI" }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between px-6 h-16 bg-chassis border-b border-border-shadow fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-accent rounded flex items-center justify-center shadow-floating">
          <ShieldCheck className="text-white" size={18} />
        </div>
        <span className="font-sans font-black text-sm uppercase tracking-tighter">
          {title}
        </span>
      </div>

      <PhysicalButton 
        variant="ghost" 
        size="icon" 
        onClick={onMenuToggle}
        className="h-10 w-10 p-0 hover:bg-recessed"
      >
        <Menu size={24} className="text-text-primary" />
      </PhysicalButton>
    </header>
  );
}
