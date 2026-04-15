'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhysicalButton } from './physical-button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onClose={onClose}
      className={cn(
        'rounded-2xl bg-chassis shadow-floating p-0 border border-border-highlight/40',
        'backdrop:bg-text-primary/20 backdrop:backdrop-blur-sm',
        'w-full max-w-lg outline-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border-shadow/40">
        <h2 className="font-bold text-base uppercase tracking-widest">{title}</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-recessed shadow-recessed flex items-center justify-center text-text-muted hover:text-accent transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-8 py-6">{children}</div>
    </dialog>
  );
}
