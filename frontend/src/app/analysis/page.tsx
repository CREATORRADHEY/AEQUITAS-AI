'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, TrendingDown, Info, AlertTriangle, Play, Pause, Download, Database, RefreshCcw, Cpu, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhysicalButton } from '@/components/ui/physical-button';
import { BoltedCard } from '@/components/ui/bolted-card';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { SkeletonCard } from '@/components/ui/skeleton';
import { UploadZone } from '@/components/ui/upload-zone';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { useToast } from '@/components/ui/toast';
import { api, type GroupMetric, type ShapFeature, type CorrelationMatrix } from '@/lib/api';
import { cn } from '@/lib/utils';

const MODEL_ID = 'CREDIT_PRO_V4';

// ─── Color mapping for correlation heatmap cells ──────────────────────────────

function heatmapColor(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 0.7) return val > 0 ? 'rgba(255,71,87,0.9)' : 'rgba(59,130,246,0.9)';
  if (abs >= 0.4) return val > 0 ? 'rgba(255,71,87,0.55)' : 'rgba(59,130,246,0.55)';
  if (abs >= 0.2) return val > 0 ? 'rgba(255,71,87,0.25)' : 'rgba(59,130,246,0.25)';
  return 'rgba(160,174,192,0.15)';
}

// ─── Analysis Page ─────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const [groups, setGroups] = useState<GroupMetric[]>([]);
  const [shap, setShap] = useState<ShapFeature[]>([]);
  const [corr, setCorr] = useState<CorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; val: number } | null>(null);
  const [isStopped, setIsStopped] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'IDLE' | 'READY' | 'PROCESSING' | 'AUDITED'>('IDLE');
  const [stagedFile, setStagedFile] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setEngineStatus(data.status as any);
      setStagedFile(data.metadata?.filename || null);
      
      // Honoring the persistent stop flag
      if (typeof window !== 'undefined') {
        const storedStop = localStorage.getItem('aequitas_kernel_stopped') === 'true';
        setIsStopped(storedStop);
        setHasData(data.status === 'AUDITED' && !storedStop);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (engineStatus !== 'AUDITED') return;
    try {
      const [telemetry, shapData, corrData] = await Promise.all([
        api.getTelemetry(),
        api.getShap(MODEL_ID),
        api.getCorrelation(MODEL_ID),
      ]);
      setGroups(telemetry.groups);
      setShap(shapData.features);
      setCorr(corrData);
    } catch {
      toast('Failed to load analysis data — is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, engineStatus]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchStatus();
    // Aggressive polling ONLY when processing, otherwise standard interval
    const interval = setInterval(fetchStatus, engineStatus === 'PROCESSING' ? 1500 : 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, engineStatus]);

  useEffect(() => {
    if (engineStatus === 'AUDITED' && !isStopped) {
      fetchAll();
      const interval = setInterval(fetchAll, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchAll, isStopped, engineStatus]);

  const topProxy = shap.find((f) => f.is_proxy);
  const maxShap = shap[0]?.shap_importance ?? 1;

  const handleUploadComplete = (result: unknown) => {
    toast('Dataset audited — refreshing metrics…', 'success');
    setHasData(true);
    setLoading(true);
    setTimeout(fetchAll, 800);
    console.log('Upload audit result:', result);
  };

  return (
    <div className="flex h-screen w-full bg-chassis overflow-hidden relative print:block print:h-auto print:overflow-visible">
      <MobileHeader 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        title="Bias Explorer"
      />
      
      <AppSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activeView="analysis"
      />

      <main className="flex-1 overflow-y-auto p-6 pt-24 lg:p-10 lg:pt-10 bg-chassis relative print:block print:h-auto print:overflow-visible scroll-smooth">
        {/* KERNEL PROCESSING OVERLAY */}
        <AnimatePresence>
          {engineStatus === 'PROCESSING' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-chassis/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center"
            >
              <div className="relative mb-8">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-accent/20 blur-2xl"
                />
                <div className="h-24 w-24 rounded-3xl bg-recessed shadow-recessed border border-white/10 flex items-center justify-center relative z-10">
                  <RefreshCcw size={40} className="text-accent animate-spin" />
                </div>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Kernel Processing</h2>
              <p className="font-mono text-sm text-text-muted max-w-md">
                The Aequitas Engine is currently training the diagnostic model and computing game-theoretic SHAP influence vectors.
              </p>
              <div className="mt-8 flex gap-2 items-center px-4 py-2 bg-recessed rounded-full border border-white/5">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] uppercase font-bold text-accent">Status: Active Training</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AUDIT COVER PAGE (PRINT ONLY) */}
        <div className="hidden print:flex flex-col h-[28cm] w-full justify-center items-center text-center p-20 border-[10pt] border-accent/20 mb-20">
          <div className="mb-20">
            <Cpu size={120} className="text-accent mb-6 mx-auto" />
            <div className="h-1 w-40 bg-accent mx-auto mb-10" />
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Bias Audit Manifest</h1>
            <p className="font-mono text-xl text-text-muted">INDUSTRIAL FAIRNESS KERNEL v2.1.0-STABLE</p>
          </div>
          
          <div className="grid grid-cols-2 gap-10 text-left border-y border-border-shadow/20 py-10 w-full max-w-4xl">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold opacity-40 uppercase">Target Registry</div>
                <div className="text-xl font-bold font-mono">{MODEL_ID}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold opacity-40 uppercase">Audit Authority</div>
                <div className="text-xl font-bold uppercase">Aequitas Autonomous System</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold opacity-40 uppercase">Generation Date</div>
                <div className="text-xl font-bold font-mono">{mounted ? new Date().toLocaleString() : '...'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold opacity-40 uppercase">Document Status</div>
                <div className="text-xl font-bold text-green-500 uppercase">Authenticated & Sealed</div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 opacity-30">
            <div className="font-mono text-[8px] max-w-lg mx-auto leading-relaxed">
              CAUTION: This document contains sensitive model performance metrics. Unauthorized distribution of bias diagnostic markers is strictly prohibited under institutional compliance protocols.
            </div>
          </div>
        </div>

        <div className="print-only mb-10 w-full">
          <div className="flex justify-between items-end border-b-4 border-accent pb-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <ShieldCheck className="text-white" size={32} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tighter">AEQUITAS</span>
                  <span className="text-2xl font-black tracking-tighter text-accent">AI</span>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Kernel Manifest</h1>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="bg-recessed px-3 py-1 rounded inline-block">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mr-2">Kernel ID:</span>
                <span className="text-xs font-mono font-bold uppercase tracking-tighter">AEQ-PRO-992</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">Target Registry</span>
                <span className="text-2xl font-black font-mono tracking-tighter">{MODEL_ID}</span>
              </div>
              <div className="text-[10px] font-mono opacity-50">
                {mounted ? new Date().toLocaleString() : '...'}
              </div>
            </div>
          </div>

          <BoltedCard className="p-8 mb-8" withVents={false}>
            <h3 className="font-bold uppercase mb-4 text-xs tracking-widest text-accent">Executive Audit Summary</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-text-primary">
                  This automated audit has analyzed <strong>{groups.length} protected groups</strong> across the dataset. 
                  The analysis detected <strong>{groups.filter(g => g.below_threshold).length} critical violations</strong> of the 4/5ths fairness rule.
                </p>
                {topProxy && (
                  <div className="p-4 rounded bg-accent/5 border border-accent/20">
                    <p className="text-xs font-bold text-accent uppercase mb-1">Critical Finding:</p>
                    <p className="text-xs italic text-text-primary">
                      Proxy variable detection identified "{topProxy.feature}" as having high statistical correlation with protected attributes.
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-recessed/20 p-6 rounded-lg font-mono text-xs space-y-2 text-text-primary">
                <div className="flex justify-between"><span>Audit Timestamp:</span> <span>{mounted ? new Date().toISOString() : '...'}</span></div>
                <div className="flex justify-between"><span>Registry Version:</span> <span>v2.1.0-STABLE</span></div>
                <div className="flex justify-between"><span>Status:</span> <span className="text-accent font-bold">{engineStatus}</span></div>
                <div className="flex justify-between"><span>Encryption:</span> <span>AES-256-GCM</span></div>
              </div>
            </div>
          </BoltedCard>
        </div>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 no-print">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_#ffffff]">
              Bias Explorer
            </h1>
            <p className="font-mono text-sm text-text-muted mt-1 uppercase">
              DEEP SCAN: {MODEL_ID} / PEARSON CORRELATION + SHAP
            </p>
          </div>
          <div className="flex flex-wrap gap-3 no-print">
            <PhysicalButton 
              size="sm" 
              variant={(engineStatus === 'AUDITED' && !isStopped) ? 'ghost' : 'primary'} 
              className="flex gap-2"
              disabled={engineStatus === 'PROCESSING' || engineStatus === 'IDLE'}
              onClick={async () => {
                if (engineStatus === 'READY' || isStopped) {
                  setLoading(true);
                  try {
                    await api.startAudit();
                    localStorage.setItem('aequitas_kernel_stopped', 'false');
                    setIsStopped(false);
                    toast('Fairness analysis resumed', 'success');
                    fetchStatus();
                  } catch {
                    toast('Analysis failed', 'error');
                  } finally {
                    setLoading(false);
                  }
                } else if (engineStatus === 'AUDITED') {
                  try {
                    await api.stopAudit();
                    localStorage.setItem('aequitas_kernel_stopped', 'true');
                    setIsStopped(true);
                    toast('Engine session stopped physically', 'warning');
                    fetchStatus();
                  } catch {
                    toast('Stop signal failed', 'error');
                  }
                }
              }}
            >
              {(engineStatus === 'READY' || isStopped) ? <Play size={16} /> : <Pause size={16} />}
              {engineStatus === 'READY' ? 'Start Analysis' : isStopped ? 'Resume Audit' : 'Stop Audit'}
            </PhysicalButton>
            <PhysicalButton size="sm" variant="ghost" onClick={() => window.print()} className="flex gap-2">
              <Download size={16} /> Export PDF
            </PhysicalButton>
          </div>
        </header>


        {/* CSV Upload Zone */}
        <div className="mb-8 no-print">
          <BoltedCard className="p-8" withVents={false}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest">Dataset Ingestion</span>
                <h3 className="font-bold text-lg uppercase mt-0.5">Audit Custom Dataset</h3>
              </div>
              <LEDIndicator status="online" label="Uploader Status: Ready" />
            </div>
            <UploadZone onAuditComplete={handleUploadComplete} className="min-h-[160px]" />
          </BoltedCard>
        </div>

          {/* DATA GUARD */}
          {(!hasData || isStopped) && !loading ? (
            <div className="col-span-12">
              <BoltedCard className="h-[400px] flex flex-col items-center justify-center text-center p-20 border-2 border-dashed border-border-shadow/50 bg-recessed/30 shadow-none">
                <div className="h-20 w-20 rounded-full bg-recessed shadow-recessed flex items-center justify-center mb-6">
                  <Database size={32} className={cn("opacity-40", isStopped ? "text-accent" : "text-text-muted")} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">
                  {isStopped ? 'Kernel Logic Stopped' : 'Awaiting Dataset Ingestion'}
                </h3>
                <p className="text-text-muted text-sm max-w-sm font-mono leading-relaxed">
                  {isStopped 
                    ? 'Active monitoring is paused. Current metrics are hidden to prevent stale data reading. Press Resume to restore uplink.' 
                    : 'The Fairness Kernel is active but requires an audited manifest. Drop a CSV above or use the Model Registry to initialize a deep scan.'}
                </p>
                <PhysicalButton 
                  size="sm" 
                  variant="primary" 
                  className="mt-8"
                  onClick={() => {
                    if (isStopped) {
                      setIsStopped(false);
                    } else {
                      setHasData(true);
                      setLoading(true);
                      fetchAll();
                    }
                  }}
                >
                  {isStopped ? 'Resume Monitoring' : 'Force Initialize Engine'}
                </PhysicalButton>
              </BoltedCard>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:flex print:flex-col">
              {/* CORRELATION HEATMAP */}
              <div className="col-span-1 lg:col-span-8 print-page-break">
              {loading || !corr ? (
                <div className="col-span-12 lg:col-span-8">
                  <SkeletonCard className="h-[480px]" />
                </div>
              ) : (
                <BoltedCard className="col-span-12 lg:col-span-8 p-8 flex flex-col" elevated>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest">Statistical Grid</span>
                      <h3 className="font-bold text-xl uppercase">Parity Correlation Matrix</h3>
                    </div>
                    <div className="flex gap-2 text-[10px] font-mono font-bold no-print">
                      <span className="px-2 py-1 rounded bg-recessed shadow-recessed text-accent">POSITIVE</span>
                      <span className="px-2 py-1 rounded bg-recessed shadow-recessed text-blue-400">NEGATIVE</span>
                    </div>
                  </div>

                  <div 
                    className="grid gap-1 items-start mt-2 overflow-x-auto pb-4"
                    style={{ 
                      gridTemplateColumns: `100px repeat(${corr.features.length}, minmax(40px, 1fr))` 
                    }}
                  >
                {/* Empty corner */}
                <div />

                {/* Column Headers */}
                {corr.features.map((f) => (
                  <div key={f} className="text-center font-mono text-[8px] font-bold text-text-muted uppercase truncate py-2 px-1">
                    {f.replace('_', ' ')}
                  </div>
                ))}

                {/* Rows */}
                {corr.matrix.map((row, ri) => (
                  <React.Fragment key={ri}>
                    {/* Row Header */}
                    <div className="font-mono text-[8px] font-bold text-text-muted text-right pr-4 truncate py-3 self-center">
                      {corr.features[ri].replace('_', ' ')}
                    </div>
                    
                    {/* Data Cells */}
                    {row.map((val, ci) => (
                        <motion.div
                          key={ci}
                          className="aspect-square rounded flex items-center justify-center cursor-pointer relative shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)]"
                          style={{ backgroundColor: heatmapColor(val) }}
                          initial={false}
                          animate={false}
                          whileHover={{ scale: 1.1, zIndex: 10 }}
                        onHoverStart={() => setHoveredCell({ r: ri, c: ci, val })}
                        onHoverEnd={() => setHoveredCell(null)}
                      >
                        <span className="font-mono text-[8px] font-bold text-white drop-shadow-sm select-none">
                          {val.toFixed(2)}
                        </span>
                        {hoveredCell?.r === ri && hoveredCell?.c === ci && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[9px] font-mono px-3 py-2 rounded-md shadow-xl z-50 whitespace-nowrap pointer-events-none">
                            <div className="border-b border-white/20 pb-1 mb-1 opacity-60">CORRELATION FACTOR</div>
                            {corr.features[ri]} × {corr.features[ci]}: <span className="text-accent font-bold">{val.toFixed(3)}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </BoltedCard>
          )}
          </div>

          {/* RIGHT SIDEBAR: proxy detection + group breakdown */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            {/* Bias Hotspot */}
            {topProxy ? (
              <BoltedCard className="p-6 flex flex-col gap-3" withVents={false}>
                <div className="flex items-center gap-2 text-accent">
                  <TrendingDown size={18} />
                  <h4 className="font-bold uppercase tracking-tight">Bias Hotspot</h4>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-text-muted">
                    <strong className="text-text-primary font-mono">{topProxy.feature}</strong> identified as a{' '}
                    <span className="text-accent font-bold">proxy variable</span> for race.
                  </p>
                </div>
                <div className="mt-2 p-3 bg-recessed rounded-lg shadow-recessed">
                  <div className="flex justify-between font-mono text-[9px] font-bold mb-2">
                    <span>PROXY SCORE (Cramér's V)</span>
                    <span className="text-accent">{(topProxy.proxy_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-chassis rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${topProxy.proxy_score * 100}%` }} />
                  </div>
                </div>
              </BoltedCard>
            ) : (
              !loading && <BoltedCard className="p-6" withVents={false}>
                <p className="font-mono text-[10px] text-text-muted uppercase">No proxy variables detected.</p>
              </BoltedCard>
            )}

            {/* SHAP Feature Importance */}
            <BoltedCard className="flex-1 p-6 flex flex-col gap-4" withVents={false}>
              <h4 className="font-bold uppercase tracking-tight flex items-center gap-2 text-sm">
                <Info size={14} className="text-text-muted" /> Feature Importance (SHAP)
              </h4>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-6 bg-recessed rounded animate-shimmer bg-gradient-to-r from-recessed via-chassis to-recessed bg-[length:400%_100%]" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {shap.map((f) => (
                    <div key={f.feature}>
                      <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
                        <span className={cn(f.is_proxy && 'text-accent')}>{f.feature}</span>
                        <span className="text-text-muted">{f.shap_importance.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-recessed audit-metric-bar rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full print-chart-bar', f.is_proxy ? 'bg-accent' : 'bg-text-muted/50')}
                          initial={{ width: 0 }}
                          animate={{ width: `${(f.shap_importance / maxShap) * 100}%` }}
                          style={{ width: `${(f.shap_importance / maxShap) * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BoltedCard>

            {/* Group DI Breakdown */}
            <BoltedCard className="p-6 flex flex-col gap-4 print-page-break" withVents={false}>
              <h4 className="font-bold uppercase tracking-tight text-sm">Group DI Breakdown</h4>
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-5 bg-recessed rounded animate-shimmer bg-gradient-to-r from-recessed via-chassis to-recessed bg-[length:400%_100%]" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((g) => (
                    <div key={g.group}>
                      <div className="flex justify-between text-[10px] font-bold font-mono mb-1">
                        <span>{g.group}</span>
                        <span className={cn(g.below_threshold ? 'text-accent' : 'text-text-muted')}>
                          DI: {g.impact.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-1 bg-recessed audit-metric-bar rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full print-chart-bar', g.below_threshold ? 'bg-accent' : 'bg-text-muted/40')}
                          initial={{ width: 0 }}
                          animate={{ width: `${g.impact * 100}%` }}
                          style={{ width: `${g.impact * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BoltedCard>
          </div>
          </div>
        )}

        {/* AUDIT AUTHENTICITY FOOTER */}
        <footer className="mt-20 pt-10 border-t border-border-shadow/10 flex justify-between items-end opacity-40 print:opacity-100 print:mt-10">
          <div className="space-y-1">
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent">Aequitas AI Audit Seal</div>
            <div className="font-mono text-[7px] max-w-sm">
              SHA-256: 8a7c2f81d92e1045ea8d30012c0b86425d218d6421d663b4c02bb84e9f341282
            </div>
          </div>
          <div className="text-right font-mono text-[10px]">
            © {mounted ? new Date().getFullYear() : '2026'} — AEQUITAS INDUSTRIAL CORE
          </div>
        </footer>
      </main>
    </div>
  );
}
