'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from './toast';

interface UploadZoneProps {
  onAuditComplete?: (result: unknown) => void;
  className?: string;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export function UploadZone({ onAuditComplete, className }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files are supported');
      setState('error');
      return;
    }
    setFileName(file.name);
    setState('uploading');
    setProgress(10);

    // Simulate progress ticks while fetching
    const ticker = setInterval(() => setProgress((p) => Math.min(p + 8, 85)), 400);

    try {
      const result = await api.uploadCsv(file);
      clearInterval(ticker);
      setProgress(100);
      setState('success');
      toast(`Dataset staged: ${file.name}. Ready for audit.`, 'success');
      onAuditComplete?.(result);
    } catch (err: any) {
      clearInterval(ticker);
      let msg = err instanceof Error ? err.message : 'Upload failed';
      if (msg.includes('Failed to fetch')) {
        msg = 'Kernel Offline: Check if backend is running (port 8000)';
      }
      setError(msg);
      setState('error');
      toast(msg, 'error');
    }
  }, [onAuditComplete, toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => { setState('idle'); setProgress(0); setFileName(''); setError(''); };

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
        state === 'dragging' && 'border-accent bg-accent/5 scale-[1.01]',
        state === 'idle' && 'border-border-shadow hover:border-accent/50',
        state === 'success' && 'border-green-500/50 bg-green-500/5',
        state === 'error' && 'border-accent/60 bg-accent/5',
        state === 'uploading' && 'border-accent/40',
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setState('dragging'); }}
      onDragLeave={() => setState('idle')}
      onDrop={onDrop}
      onClick={() => state === 'idle' && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />

      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[140px]">
        {state === 'idle' && (
          <>
            <div className="h-12 w-12 rounded-full bg-recessed shadow-recessed flex items-center justify-center">
              <Upload size={22} className="text-text-muted" />
            </div>
            <div>
              <p className="font-bold text-sm">Drop CSV dataset here</p>
              <p className="font-mono text-[10px] text-text-muted mt-1 uppercase tracking-wider">
                or click to browse
              </p>
            </div>
          </>
        )}

        {state === 'dragging' && (
          <div className="flex flex-col items-center gap-2 text-accent">
            <Upload size={28} className="animate-bounce" />
            <p className="font-bold text-sm uppercase tracking-wider">Release to upload</p>
          </div>
        )}

        {state === 'uploading' && (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-accent animate-spin" />
              <span className="font-mono text-xs font-bold text-text-muted uppercase">
                Staging {fileName}…
              </span>
            </div>
            <div className="h-1.5 w-full bg-recessed rounded-full overflow-hidden shadow-recessed">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-text-muted">{progress}%</span>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={28} className="text-green-500" />
            <p className="font-bold text-sm text-green-600 uppercase tracking-wider">Dataset Staged</p>
            <p className="font-mono text-[10px] text-text-muted">{fileName}</p>
            <button onClick={(e) => { e.stopPropagation(); reset(); }}
              className="mt-1 font-mono text-[10px] text-accent underline uppercase">
              Upload another
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle size={28} className="text-accent" />
            <p className="font-bold text-sm uppercase tracking-wider text-accent">Upload Failed</p>
            <p className="font-mono text-[10px] text-text-muted max-w-xs">{error}</p>
            <button onClick={(e) => { e.stopPropagation(); reset(); }}
              className="mt-1 font-mono text-[10px] text-accent underline uppercase">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
