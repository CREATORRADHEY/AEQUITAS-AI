'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  LayoutDashboard,
  BarChart3,
  Database,
  Settings,
} from 'lucide-react';
import { PhysicalButton } from '@/components/ui/physical-button';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Optional extra controls rendered at the bottom (e.g. Remediation Playbook) */
  footer?: React.ReactNode;
  ledLabel?: string;
  isOpen?: boolean;
}

const NAV_ITEMS = [
  { href: '/',         label: 'Dashboard',      Icon: LayoutDashboard },
  { href: '/analysis', label: 'Data Analysis',  Icon: BarChart3 },
  { href: '/models',   label: 'Model Registry', Icon: Database },
  { href: '/advisor',  label: 'AI Advisor',     Icon: ShieldCheck },
];

export function AppSidebar({ footer, ledLabel = 'Kernel: Operational', isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "w-72 shrink-0 border-r border-border-shadow bg-chassis flex-col gap-8 overflow-y-auto no-print AppSidebar fixed lg:sticky top-0 z-40 h-screen transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
    )}>
      {/* Logo */}
      <div className="px-8 pt-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center shadow-floating shrink-0">
          <ShieldCheck className="text-white" size={22} />
        </div>
        <h2 className="font-sans font-extrabold text-xl tracking-tighter">
          AEQUITAS <span className="text-accent">AI</span>
        </h2>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4">
        <div className="px-4 mb-2">
          <LEDIndicator label={ledLabel} status="online" />
        </div>

        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} passHref>
              <PhysicalButton
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'text-accent'
                )}
              >
                <Icon size={18} />
                {label}
              </PhysicalButton>
            </Link>
          );
        })}

        <Link href="/settings" passHref>
          <PhysicalButton variant="ghost" className="w-full justify-start gap-3 text-text-muted/70">
            <Settings size={18} />
            System Config
          </PhysicalButton>
        </Link>
      </nav>

      {/* Footer slot */}
      {footer && (
        <div className="mt-auto px-4 pb-8">
          {footer}
        </div>
      )}
    </aside>
  );
}
