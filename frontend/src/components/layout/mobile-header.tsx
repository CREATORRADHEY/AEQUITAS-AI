'use client';

import React from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { PhysicalButton } from '@/components/ui/physical-button';

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-chassis border-b border-border-shadow sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-accent rounded-md flex items-center justify-center shadow-floating">
          <ShieldCheck className="text-white" size={18} />
        </div>
        <h2 className="font-sans font-extrabold text-lg tracking-tighter">
          AEQUITAS <span className="text-accent">AI</span>
        </h2>
      </div>
      
      <PhysicalButton 
        size="sm" 
        variant="ghost" 
        className="w-10 h-10 p-0" 
        onClick={onToggle}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </PhysicalButton>
    </header>
  );
}
