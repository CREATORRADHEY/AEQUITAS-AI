'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  LayoutDashboard,
  BarChart3,
  Database,
  Settings,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { PhysicalButton } from '@/components/ui/physical-button';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: (view: 'wizard' | 'registry' | 'config' | 'analysis' | 'advisor') => void;
  activeView?: string;
  isProcessing?: boolean;
}

const NAV_ITEMS = [
  { id: 'wizard',   label: 'Certification',  Icon: LayoutDashboard },
  { id: 'analysis', label: 'Data Analysis',  Icon: BarChart3 },
  { id: 'registry', label: 'Audit Registry', Icon: Database },
  { id: 'advisor',  label: 'AI Advisor',     Icon: BrainCircuit },
];

export function AppSidebar({ isOpen, onNavigate, activeView, isProcessing }: SidebarProps) {
  return (
    <aside className={cn(
      "w-72 shrink-0 border-r border-border-shadow bg-chassis flex-col gap-8 overflow-y-auto no-print AppSidebar fixed lg:sticky top-0 z-40 h-screen transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
    )}>
      {/* Logo */}
      <div className="px-8 pt-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center shadow-floating shrink-0 transition-transform hover:scale-105 active:scale-95">
          <ShieldCheck className="text-white" size={22} />
        </div>
        <h2 className="font-sans font-extrabold text-xl tracking-tighter uppercase">
          AEQUITAS <span className="text-accent underline decoration-2 decoration-white/20 underline-offset-4">AI</span>
        </h2>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4">
        <div className="px-4 mb-4 flex justify-between items-center group">
          <LEDIndicator label={activeView === 'config' ? 'Kernel: Configuration Mode' : 'Kernel: Operational'} status="online" />
          {isProcessing && (
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[8px] font-mono font-black text-accent flex items-center gap-1.5"
            >
              <Activity size={10} /> PROCESSING...
            </motion.div>
          )}
        </div>

        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeView === id;
          return (
            <PhysicalButton
              key={id}
              variant={isActive ? 'secondary' : 'ghost'}
              onClick={() => onNavigate?.(id as any)}
              className={cn(
                'w-full justify-start gap-3 h-12 px-6 font-mono text-[10px] font-bold uppercase tracking-widest transition-all',
                isActive ? 'text-accent shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.1)]' : 'text-text-muted hover:text-white'
              )}
            >
              <Icon size={16} className={cn(isActive ? 'text-accent' : 'opacity-40')} />
              {label}
            </PhysicalButton>
          );
        })}

        <div className="mt-4 pt-4 border-t border-border-shadow/30">
          <PhysicalButton 
            variant={activeView === 'config' ? 'secondary' : 'ghost'} 
            onClick={() => onNavigate?.('config')}
            className={cn(
              "w-full justify-start gap-3 h-12 px-6 font-mono text-[10px] font-bold uppercase tracking-widest",
              activeView === 'config' ? 'text-accent' : 'text-text-muted hover:text-white'
            )}
          >
            <Settings size={16} className={cn(activeView === 'config' ? 'text-accent' : 'opacity-40')} />
            System Config
          </PhysicalButton>
        </div>
      </nav>

      {/* Stats Footer Overlay */}
      <div className="mt-auto px-8 pb-8 space-y-4">
        <div className="p-4 rounded-lg bg-panel/30 border border-border-shadow/50 space-y-2">
           <div className="flex justify-between items-center text-[8px] font-mono text-text-muted uppercase font-black tracking-tighter">
              <span>Node Load</span>
              <span className="text-accent">14%</span>
           </div>
           <div className="h-1 w-full bg-recessed rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '14%' }} className="h-full bg-accent" />
           </div>
        </div>
      </div>
    </aside>
  );
}
