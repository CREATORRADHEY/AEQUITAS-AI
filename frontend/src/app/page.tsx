'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Search, Cpu, Database, Zap, Trash2, Info, X, Shield, Activity, BarChart3, ChevronRight, ShieldCheck, ShieldAlert, Loader2, Play, Pause, RefreshCcw
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { motion, AnimatePresence } from 'framer-motion';
import { PhysicalButton } from '@/components/ui/physical-button';
import { BoltedCard } from '@/components/ui/bolted-card';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useToast } from '@/components/ui/toast';
import { api, type TelemetryData, type AuditHistoryItem } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UploadZone } from '@/components/ui/upload-zone';

const BOUNCE = [0.175, 0.885, 0.32, 1.275];

function statusLabel(score: number) {
  if (score >= 90) return { text: 'PASS', cls: 'text-green-500' };
  if (score >= 75) return { text: 'WARNING', cls: 'text-yellow-500' };
  return { text: 'FAIL', cls: 'text-accent' };
}

function barColor(impact: number) {
  if (impact < 0.80) return 'bg-accent';
  if (impact >= 0.95) return 'bg-green-500';
  return 'bg-text-muted/40';
}

// ─── Remediation Sidebar Footer ───────────────────────────────────────────────

function RemediationPlaybook() {
  const [reweighting, setReweighting] = useState(65);
  const [threshold, setThreshold] = useState(45);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const applyMitigation = async () => {
    setLoading(true);
    try {
      // Apply BOTH values from the sliders to fine-tune the engine
      await api.applyRemediation(threshold / 100, reweighting / 40);
      
      toast(
        `Applied mitigation parameters successfully. Telemetry feed updating…`,
        'success'
      );
    } catch {
      toast('Failed to apply mitigation to active engine', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-1 rounded-lg bg-recessed shadow-recessed">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] font-bold text-text-muted opacity-60 uppercase">
            Remediation Playbook
          </span>
          <LEDIndicator status="warning" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[10px] font-bold">
              <span>REWEIGHTING</span>
              <span className="text-accent">{reweighting}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={reweighting}
              onChange={(e) => setReweighting(+e.target.value)}
              className="w-full accent-accent h-1.5 bg-chassis rounded-full shadow-recessed appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[10px] font-bold">
              <span>THRESHOLD</span>
              <span className="text-accent">{threshold}%</span>
            </div>
            <input
              type="range" min={30} max={70} value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              className="w-full accent-accent h-1.5 bg-chassis rounded-full shadow-recessed appearance-none cursor-pointer"
            />
          </div>
        </div>

        <PhysicalButton
          size="sm" variant="primary"
          className="w-full mt-2"
          onClick={applyMitigation}
          disabled={loading}
        >
          {loading ? 'Running…' : 'Apply Mitigation'}
        </PhysicalButton>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function Home() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // V2 UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [coreStatusOpen, setCoreStatusOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditHistoryItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'IDLE' | 'READY' | 'PROCESSING' | 'AUDITED'>('IDLE');
  const [stagedFile, setStagedFile] = useState<string | null>(null);
  const router = useRouter();

  const { toast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setEngineStatus(data.status as any);
      setStagedFile(data.metadata?.filename || null);
    } catch {
      // silently fail status poll
    }
  }, []);

  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await api.getTelemetry();
      setTelemetry(data);
    } catch {
      if (engineStatus === 'AUDITED') {
        toast('Fairness Engine offline — check backend', 'error');
      }
    } finally {
      const isGlobalStopped = localStorage.getItem('aequitas_kernel_stopped') === 'true';
      if (isGlobalStopped) {
        setEngineStatus('IDLE');
        setTelemetry(null);
      }
      setLoadingTelemetry(false);
    }
  }, [toast, engineStatus]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch {
      // silently fail for history
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchStatus();
    fetchTelemetry();
    fetchHistory();
    
    // Poll telemetry and status
    // Aggressive polling ONLY when processing
    const telemetryInterval = setInterval(fetchTelemetry, engineStatus === 'PROCESSING' ? 2000 : 8000);
    const statusInterval = setInterval(fetchStatus, engineStatus === 'PROCESSING' ? 1500 : 5000);
    
    return () => {
      clearInterval(telemetryInterval);
      clearInterval(statusInterval);
    };
  }, [fetchTelemetry, fetchHistory, fetchStatus, engineStatus]);

  const deleteRecord = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast('Audit record purged from registry', 'success');
    } catch {
      toast('Failed to delete record', 'error');
    }
  };

  const score = telemetry?.fairness_score ?? 0;
  const { text: statusText, cls: statusCls } = statusLabel(score);
  const groups = telemetry?.groups ?? [];
  const filteredHistory = history.filter(h => {
    const mId = (h.model_id || '').toLowerCase();
    const dName = (h.dataset_name || '').toLowerCase();
    const sQuery = searchQuery.toLowerCase();
    return mId.includes(sQuery) || dName.includes(sQuery);
  });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar footer={<RemediationPlaybook />} />

      <main className="flex-1 overflow-y-auto p-10 bg-chassis relative">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_#ffffff]">
              Audit Overview
            </h1>
            <p className="font-mono text-sm text-text-muted mt-1 uppercase">
              {engineStatus === 'AUDITED' && telemetry && mounted
                ? `${telemetry.total_records.toLocaleString()} RECORDS · ${telemetry.n_violations} VIOLATIONS · ${new Date(telemetry.timestamp).toLocaleTimeString()}`
                : engineStatus === 'PROCESSING' 
                ? 'ANALYZING KERNEL DATA…'
                : engineStatus === 'READY'
                ? `READY: ${stagedFile} LOADED`
                : 'AWAITING DATASET INGESTION…'}
            </p>
          </div>
          <div className="flex gap-3">
            <PhysicalButton 
              variant="ghost" 
              onClick={() => router.push('/analysis')}
              className="gap-2 border-white/5 bg-white/5 hover:bg-white/10"
            >
              <Database size={16} /> Ingest Data
            </PhysicalButton>
            <PhysicalButton 
              variant="primary" 
              onClick={() => setCoreStatusOpen(true)}
              className="gap-2"
            >
              <Cpu size={16} /> Manage Core
            </PhysicalButton>
            <PhysicalButton size="sm" className="w-12 px-0" onClick={() => setNotificationsOpen(true)}>
              <Bell size={16} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full border border-chassis" />
            </PhysicalButton>
          </div>
        </header>

        {engineStatus === 'IDLE' ? (
          <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8 bg-recessed/10 rounded-2xl border border-dashed border-accent/20 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-5 animate-pulse bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
            
            <div className="z-10 text-center space-y-6 max-w-lg">
              <div className="inline-flex p-4 rounded-full bg-accent/10 text-accent mb-4 border border-accent/20 animate-bounce">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-accent">Kernel Offline</h2>
              <p className="font-mono text-sm text-text-muted leading-relaxed uppercase">
                System Awaiting Dataset Ingestion. Access the model registry or use the upload zone to stage a fairness audit. 
                <br/>
                <span className="text-accent/60 mt-2 block">STATUS_CODE: WAITING_FOR_UPLINK...</span>
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <PhysicalButton onClick={() => router.push('/analysis')} className="gap-2">
                  <Database size={16} /> Load Dataset
                </PhysicalButton>
                <PhysicalButton variant="ghost" className="gap-2 text-text-muted border-text-muted/20" onClick={() => setCoreStatusOpen(true)}>
                  <Activity size={16} /> System Diagnostics
                </PhysicalButton>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-12 gap-6">
          {/* FAIRNESS GAUGE */}
          {loadingTelemetry ? (
            <div className="col-span-12 lg:col-span-5">
              <SkeletonCard className="h-[380px]" />
            </div>
          ) : (
            <BoltedCard className="col-span-12 lg:col-span-5 h-[380px] flex flex-col items-center p-10" elevated>
              <div className="w-full flex flex-col gap-1 mb-4">
                <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest">Main Diagnostic</span>
                <h3 className="font-bold text-lg uppercase">Overall Fairness</h3>
              </div>

              <div className="relative h-52 w-52 flex items-center justify-center mt-2">
                <svg viewBox="0 0 224 224" className="h-full w-full -rotate-90 overflow-visible">
                  <circle cx="112" cy="112" r="80" strokeWidth="12" fill="transparent" className="text-recessed stroke-current" />
                  <motion.circle
                    cx="112" cy="112" r="80"
                    strokeWidth="12" fill="transparent"
                    strokeDasharray={502.65}
                    initial={{ strokeDashoffset: 502.65 }}
                    animate={{ strokeDashoffset: 502.65 - (502.65 * score / 100) }}
                    transition={{ duration: 1.5, ease: BOUNCE as [number, number, number, number] }}
                    strokeLinecap="round"
                    className={cn("drop-shadow-[0_0_12px_var(--accent)] stroke-current",
                      score >= 90 ? 'text-green-500' : score >= 75 ? 'text-yellow-500' : 'text-accent'
                    )}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <motion.span
                    className="text-6xl font-black text-text-primary leading-none"
                    key={score}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    {score.toFixed(0)}
                  </motion.span>
                  <span className={cn("font-mono text-xs font-bold uppercase tracking-widest mt-1", statusCls)}>
                    {statusText}
                  </span>
                </div>
              </div>

              {telemetry && (
                <p className="text-center text-text-muted text-xs mt-4 max-w-xs mx-auto font-mono">
                  Accuracy: <strong className="text-text-primary">{(telemetry.model_accuracy * 100).toFixed(1)}%</strong>
                  {' · '}
                  {telemetry.n_violations} group{telemetry.n_violations !== 1 ? 's' : ''} below 4/5ths threshold
                </p>
              )}
            </BoltedCard>
          )}

          {/* GROUP PARITY BAR CHART */}
          {loadingTelemetry ? (
            <div className="col-span-12 lg:col-span-7">
              <SkeletonCard className="h-[380px]" />
            </div>
          ) : (
            <BoltedCard className="col-span-12 lg:col-span-7 h-[380px] flex flex-col p-10">
              <div className="w-full flex flex-col gap-1 mb-4">
                <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest">Disparate Impact Monitor</span>
                <h3 className="font-bold text-lg uppercase">Group Parity Analysis</h3>
              </div>

              <div className="flex-1 flex items-end justify-between gap-4 px-2 relative">
                {groups.map((group, idx) => (
                  <div key={group.group} className="flex-1 flex flex-col items-center gap-3 h-full">
                    <div className="relative w-full flex-1 bg-recessed rounded-t-lg shadow-recessed overflow-hidden border border-border-shadow/30">
                      <motion.div
                        className={cn('absolute bottom-0 w-full rounded-t-lg shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]', barColor(group.impact))}
                        initial={{ height: '0%' }}
                        animate={{ height: `${group.impact * 100}%` }}
                        transition={{ duration: 1.2, delay: idx * 0.1, ease: BOUNCE as [number, number, number, number] }}
                      />
                      {/* DI value tooltip */}
                      <div className="absolute top-1 left-0 right-0 flex justify-center">
                        <span className="font-mono text-[9px] font-bold text-text-muted">{group.impact.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-text-muted uppercase truncate w-full text-center">
                      {group.group}
                    </span>
                  </div>
                ))}

                {/* Legal threshold line — positioned inside the bar area */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-accent/40 pointer-events-none"
                  style={{ bottom: `calc(${0.80 * 100}% + 24px)` }}
                >
                  <span className="absolute right-0 -top-4 font-mono text-[8px] font-bold text-accent/70 bg-chassis px-1">
                    4/5 RULE: 0.80
                  </span>
                </div>
              </div>
            </BoltedCard>
          )}

          {/* FEATURE CARDS ROW */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <BoltedCard 
              className={cn(
                "flex flex-col gap-4 border-l-4",
                engineStatus === 'PROCESSING' ? "border-accent animate-pulse" : (score >= 90 ? "border-green-500" : score >= 75 ? "border-yellow-500" : "border-accent")
              )} 
              withVents={false}
            >
              <div className="h-12 w-12 rounded-full bg-recessed shadow-recessed flex items-center justify-center">
                {engineStatus === 'PROCESSING' ? (
                  <RefreshCcw size={22} className="text-accent animate-spin" />
                ) : score >= 75 ? (
                  <ShieldCheck size={22} className={score >= 90 ? "text-green-500" : "text-yellow-500"} />
                ) : (
                  <ShieldAlert size={22} className="text-accent" />
                )}
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-tight">Model Wellness</h4>
                <p className="text-[10px] font-mono text-text-muted opacity-60">
                  {engineStatus === 'PROCESSING' ? 'ANALYZING KERNEL...' : `SCORE: ${score.toFixed(1)} / ${statusText}`}
                </p>
              </div>
              <p className="text-xs text-text-muted">
                Registry status: <span className={cn("font-bold uppercase", engineStatus === 'PROCESSING' ? 'text-accent' : statusCls)}>
                  {engineStatus === 'PROCESSING' ? 'ADAPTING...' : (score >= 90 ? 'Healthy' : score >= 75 ? 'Concerning' : 'Critical')}
                </span>
              </p>
            </BoltedCard>

            <BoltedCard className="flex flex-col gap-4" withVents={false}>
              <div className="h-12 w-12 rounded-full bg-recessed shadow-recessed flex items-center justify-center">
                <Cpu size={22} className="text-accent" />
              </div>
              <h4 className="font-bold uppercase tracking-tight">Audit Engine</h4>
              <p className="text-xs text-text-muted">
                {telemetry
                  ? `Monitoring ${telemetry.total_records.toLocaleString()} records in real-time.`
                  : 'Connecting to engine…'}
              </p>
              <PhysicalButton size="sm" variant="ghost" className="mt-auto w-fit" onClick={() => setCoreStatusOpen(true)}>
                Manage Core
              </PhysicalButton>
            </BoltedCard>
 
            <BoltedCard className="flex flex-col gap-4" withVents={false}>
              <div className="h-12 w-12 rounded-full bg-recessed shadow-recessed flex items-center justify-center">
                <Database size={22} className="text-accent" />
              </div>
              <h4 className="font-bold uppercase tracking-tight">Data Integrity</h4>
              <p className="text-xs text-text-muted">
                Salted encryption layer verified. {groups.length || 0} protected groups tracked.
              </p>
              <PhysicalButton size="sm" variant="ghost" className="mt-auto w-fit" onClick={() => setSchemaOpen(true)}>
                View Schema
              </PhysicalButton>
            </BoltedCard>
 
            <BoltedCard className="flex flex-col gap-4" withVents={false}>
              <div className="h-12 w-12 rounded-full bg-recessed shadow-recessed flex items-center justify-center">
                <Zap size={22} className="text-accent" />
              </div>
              <h4 className="font-bold uppercase tracking-tight">Rapid Mitigation</h4>
              <p className="text-xs text-text-muted">
                {telemetry?.n_violations
                  ? <><span className="text-accent font-bold">{telemetry.n_violations} group{telemetry.n_violations > 1 ? 's' : ''}</span> need remediation.</>
                  : 'All groups within legal threshold.'}
              </p>
              <PhysicalButton size="sm" variant="ghost" className="mt-auto w-fit" onClick={() => {
                document.querySelector('.accent-accent')?.scrollIntoView({ behavior: 'smooth' });
                toast('Mitigation Playbook active', 'info');
              }}>
                Open Playbook
              </PhysicalButton>
            </BoltedCard>
          </div>
        </section>

        {/* SYSTEM TELEMETRY TABLE */}
        <section className="mt-8">
          <BoltedCard className="p-0 overflow-hidden">
            <div className="p-5 border-b border-border-shadow flex justify-between items-center bg-panel/30">
              <h3 className="font-bold uppercase tracking-tight">System Telemetry</h3>
              <LEDIndicator status={loadingHistory ? 'warning' : 'online'} label={loadingHistory ? 'Loading…' : `${history.length} Records`} />
            </div>
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-border-shadow text-left text-text-muted tracking-widest">
                  <th className="p-4 pl-8 uppercase">Timestamp</th>
                  <th className="p-4 uppercase">Model</th>
                  <th className="p-4 uppercase">Dataset</th>
                  <th className="p-4 uppercase">Status</th>
                  <th className="p-4 pr-8 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-shadow/50">
                {loadingHistory && [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={4} className="p-2"><SkeletonRow /></td></tr>
                ))}
                {!loadingHistory && history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-muted">
                      No audit history yet. Run an audit to see events here.
                    </td>
                  </tr>
                )}
                {filteredHistory.slice(0, 8).map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-panel/20 transition-colors cursor-pointer group"
                    onClick={() => setSelectedAudit(item)}
                  >
                    <td className="p-4 pl-8 opacity-60">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 font-bold">{item.model_id}</td>
                    <td className="p-4 opacity-70">{item.dataset_name || '—'}</td>
                    <td className="p-4">
                      <LEDIndicator
                        status={item.status === 'PASS' ? 'online' : item.status === 'FAIL' ? 'error' : 'warning'}
                        label={item.status}
                      />
                    </td>
                    <td className="p-4 pr-8 text-right">
                      <div className="flex justify-end gap-1">
                        <PhysicalButton 
                          size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAudit(item);
                          }}
                        >
                          <Info size={14} />
                        </PhysicalButton>
                        <PhysicalButton 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-accent hover:text-white hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => deleteRecord(item.id, e)}
                        >
                          <Trash2 size={14} />
                        </PhysicalButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BoltedCard>
        </section>
      </>
    )}
        
        {/* MODALS - Rendered outside conditional to work in all states */}
        
        {/* Notifications */}
        <Modal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="System Alerts">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-recessed border-l-4 border-accent">
              <div className="flex justify-between font-bold text-xs uppercase mb-1">
                <span>Security Alert</span>
                <span className="opacity-40">2m ago</span>
              </div>
              <p className="text-sm opacity-80">Unexpected traffic surge detected from kernel node #82. Salted filters active.</p>
            </div>
            <div className="p-4 rounded-lg bg-recessed border-l-4 border-yellow-500">
              <div className="flex justify-between font-bold text-xs uppercase mb-1">
                <span>Audit Warning</span>
                <span className="opacity-40">1h ago</span>
              </div>
              <p className="text-sm opacity-80">Model [CREDIT_PRO_V4] dropped below 80% fairness score. Playbook recommend.</p>
            </div>
          </div>
        </Modal>

        {/* Core Status */}
        <Modal isOpen={coreStatusOpen} onClose={() => setCoreStatusOpen(false)} title="Audit Engine Status">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-recessed shadow-recessed flex flex-col items-center gap-2">
              <Activity className="text-green-500" />
              <div className="text-[10px] font-bold opacity-60 uppercase">Kernel Load</div>
              <div className="text-xl font-black">12.4%</div>
            </div>
            <div className="p-4 rounded-lg bg-recessed shadow-recessed flex flex-col items-center gap-2">
              <Shield className="text-accent" />
              <div className="text-[10px] font-bold opacity-60 uppercase">Encryption</div>
              <div className="text-xl font-black text-green-500">AES-256</div>
            </div>
            <div className="col-span-2 p-4 rounded-lg bg-panel/20 font-mono text-[10px] space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between"><span>STATUS:</span> <span className="text-accent font-bold">{engineStatus}</span></div>
                <div className="flex justify-between"><span>STAGED_FILE:</span> <span>{stagedFile || 'NONE'}</span></div>
                <div className="flex justify-between"><span>NODE_ID:</span> <span className="text-accent">AEQ_772_PROD</span></div>
              </div>
              
              <div className="flex gap-2">
                <PhysicalButton 
                  size="sm" variant="primary" className="flex-1 gap-2"
                  disabled={engineStatus !== 'READY' || loadingTelemetry}
                  onClick={async () => {
                    setLoadingTelemetry(true);
                    try {
                      await api.startAudit();
                      toast('Fairness Kernel analysis started', 'success');
                      fetchStatus();
                    } catch {
                      toast('Audit failed to start', 'error');
                    } finally {
                      setLoadingTelemetry(false);
                    }
                  }}
                >
                  <Activity size={14} /> Start Audit
                </PhysicalButton>
                <PhysicalButton 
                  size="sm" variant="ghost" className="flex-1 gap-2 text-accent"
                  disabled={engineStatus === 'IDLE'}
                  onClick={async () => {
                    await api.stopAudit();
                    toast('Engine reset to IDLE', 'info');
                    fetchStatus();
                    setTelemetry(null);
                  }}
                >
                  <Trash2 size={14} /> Stop
                </PhysicalButton>
              </div>
            </div>
          </div>
        </Modal>

        {/* Dataset Schema */}
        <Modal isOpen={schemaOpen} onClose={() => setSchemaOpen(false)} title="Registry Schema: Demo Credit">
          <pre className="bg-recessed p-4 rounded-lg font-mono text-[10px] overflow-auto max-h-[300px] text-accent">
{`{
  "dataset": "demo_credit_dataset",
  "v": "2.1.0-stable",
  "fields": [
    { "id": "race", "type": "PROTECTED", "grouping": true },
    { "id": "gender", "type": "PROTECTED", "grouping": true },
    { "id": "income", "type": "NUMERIC", "range": [20000, 250000] },
    { "id": "credit_score", "type": "NUMERIC", "range": [300, 850] },
    { "id": "loan_approved", "type": "OUTCOME", "binary": true }
  ],
  "checksum": "sha256:d82e...77a1",
  "salt": "vttm-prod-key-002"
}`}
          </pre>
        </Modal>

        {/* Upload Ingestion Modal */}
        <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Ingest Fairness Dataset">
          <div className="space-y-4">
            <p className="text-xs text-text-muted font-mono uppercase">Stage CSV for audit kernel processing</p>
            <UploadZone onAuditComplete={() => {
              setUploadModalOpen(false);
              fetchStatus();
            }} />
          </div>
        </Modal>

        {/* Audit Detail Reasoning */}
        {selectedAudit && (
          <Modal isOpen={!!selectedAudit} onClose={() => setSelectedAudit(null)} title="Audit Intelligence">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black", 
                  selectedAudit.status === 'PASS' ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent'
                )}>
                  {selectedAudit.metrics.overall_fairness_score.toFixed(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg uppercase leading-tight">{selectedAudit.model_id}</h4>
                  <p className="font-mono text-[10px] opacity-60">{selectedAudit.dataset_name} · {new Date(selectedAudit.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-recessed flex items-center justify-center flex-shrink-0">
                    <Info size={16} className="text-accent" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {selectedAudit.reasoning || "Diagnostic summary generated by Aequitas AI kernel."}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-recessed border border-border-shadow grid grid-cols-2 gap-y-4">
                  <div>
                    <div className="text-[10px] font-bold opacity-40 uppercase">Violations</div>
                    <div className="text-sm font-bold text-accent">{selectedAudit.metrics.flags.length || 'NONE'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold opacity-40 uppercase">Samples</div>
                    <div className="text-sm font-bold">{selectedAudit.metrics.n_samples.toLocaleString()}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] font-bold opacity-40 uppercase mb-2">Group Variance</div>
                    <div className="flex gap-1 h-2 bg-chassis rounded-full overflow-hidden">
                      {selectedAudit.metrics.groups.map(g => (
                        <div key={g.group} className={cn("h-full", barColor(g.impact))} style={{ width: `${100/selectedAudit.metrics.groups.length}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <PhysicalButton variant="primary" className="w-full" onClick={() => setSelectedAudit(null)}>
                Dismiss Manifest
              </PhysicalButton>
            </div>
          </Modal>
        )}
  </main>
</div>
);
}
