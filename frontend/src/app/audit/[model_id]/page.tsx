'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PhysicalButton } from '@/components/ui/physical-button';
import { BoltedCard } from '@/components/ui/bolted-card';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { SkeletonCard, SkeletonRow } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { useToast } from '@/components/ui/toast';
import { api, type AuditResult, type ThresholdPoint } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const BOUNCE = [0.175, 0.885, 0.32, 1.275];

export default function AuditDetailPage({ params }: { params: Promise<{ model_id: string }> }) {
  const { model_id } = use(params);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [tradeoff, setTradeoff] = useState<ThresholdPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [auditData, remediationData] = await Promise.all([
        api.getAudit(model_id),
        api.remediate('threshold', { steps: 20 }),
      ]);
      setAudit(auditData);
      setTradeoff(remediationData.pareto_curve ?? []);
    } catch (err) {
      toast('Failed to load audit details', 'error');
    } finally {
      setLoading(false);
    }
  }, [model_id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunAudit = async () => {
    setRefreshing(true);
    try {
      const data = await api.getAudit(model_id);
      setAudit(data);
      toast('Audit re-computed successfully', 'success');
    } catch (err) {
      toast('Audit refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-chassis overflow-hidden relative">
        <MobileHeader onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} title="Loading Audit..." />
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} activeView="registry" />
        <main className="flex-1 p-6 pt-24 lg:p-12 lg:pt-12 overflow-y-auto space-y-8">
          <div className="h-10 w-48 bg-recessed animate-shimmer rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="col-span-1 lg:col-span-4"><SkeletonCard /></div>
            <div className="col-span-1 lg:col-span-8"><SkeletonCard /></div>
          </div>
        </main>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-chassis">
        <BoltedCard className="p-12 text-center max-w-md">
           <AlertTriangle size={48} className="text-accent mx-auto mb-4" />
           <h2 className="text-xl font-bold uppercase mb-2">Audit Not Found</h2>
           <p className="text-text-muted mb-6">Could not retrieve audit records for {model_id}.</p>
           <Link href="/models">
             <PhysicalButton variant="primary">Return to Registry</PhysicalButton>
           </Link>
        </BoltedCard>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-chassis overflow-hidden relative">
      <MobileHeader 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        title={`${model_id}`}
      />
      <AppSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeView="registry"
      />

      <main className="flex-1 overflow-y-auto p-6 pt-24 lg:p-12 lg:pt-12 bg-chassis relative scroll-smooth">
        {/* Header */}
        <header className="flex justify-between items-start mb-12">
          <div className="flex flex-col gap-4">
            <Link href="/models" className="flex items-center gap-2 text-text-muted hover:text-accent font-mono text-xs uppercase font-bold transition-colors">
              <ArrowLeft size={14} /> Back to Registry
            </Link>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_#ffffff]">{model_id}</h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="font-mono text-sm text-text-muted uppercase">Audit ID: {audit.timestamp?.split('.')[0]}</p>
                <div className="h-4 w-[1px] bg-border-shadow" />
                <LEDIndicator status={audit.status === 'PASS' ? 'online' : audit.status === 'FAIL' ? 'error' : 'warning'} label={audit.status.replace(/_/g, ' ')} />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <PhysicalButton variant="secondary" className="gap-2" onClick={handleRunAudit} disabled={refreshing}>
              <RefreshCw size={18} className={cn(refreshing && "animate-spin")} />
              {refreshing ? 'Analyzing…' : 'Run Audit'}
            </PhysicalButton>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: CRITICAL STATS */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-8">
            <BoltedCard elevated className="flex flex-col items-center p-8 gap-6">
              <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest self-start">Fairness Score</span>
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="45" strokeWidth="8" fill="transparent" className="text-recessed stroke-current" />
                  <motion.circle
                    cx="50" cy="50" r="45"
                    strokeWidth="8" fill="transparent"
                    strokeDasharray={282.7}
                    initial={{ strokeDashoffset: 282.7 }}
                    animate={{ strokeDashoffset: 282.7 - (282.7 * audit.overall_fairness_score / 100) }}
                    transition={{ duration: 1.5, ease: BOUNCE as any }}
                    strokeLinecap="round"
                    className={cn("drop-shadow-[0_0_8px_var(--accent)] stroke-current", 
                      audit.overall_fairness_score >= 90 ? 'text-green-500' : audit.overall_fairness_score >= 75 ? 'text-yellow-500' : 'text-accent'
                    )}
                  />
                </svg>
                <span className="absolute text-5xl font-black text-text-primary">{audit.overall_fairness_score}</span>
              </div>
              <div className="grid grid-cols-2 w-full gap-4 text-center">
                <div className="p-3 bg-recessed/50 rounded-lg shadow-recessed">
                  <p className="font-mono text-[9px] font-bold text-text-muted uppercase mb-1">Samples</p>
                  <p className="font-bold text-lg">{mounted ? audit.n_samples.toLocaleString() : '...'}</p>
                </div>
                <div className="p-3 bg-recessed/50 rounded-lg shadow-recessed">
                  <p className="font-mono text-[9px] font-bold text-text-muted uppercase mb-1">Flags</p>
                  <p className="font-bold text-lg text-accent">{audit.flags.length}</p>
                </div>
              </div>
            </BoltedCard>

            <BoltedCard className="p-8 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-primary">
                <ShieldCheck size={20} className="text-accent" />
                <h4 className="font-bold uppercase tracking-tight">Audit Metrics</h4>
              </div>
              <div className="space-y-4 font-mono text-xs">
                 <div className="flex justify-between border-b border-border-shadow/30 pb-2">
                    <span className="text-text-muted">PROTECTED ATTR</span>
                    <span className="font-bold uppercase">{audit.protected_attribute}</span>
                 </div>
                 <div className="flex justify-between border-b border-border-shadow/30 pb-2">
                    <span className="text-text-muted">OUTCOME ATTR</span>
                    <span className="font-bold uppercase">{audit.outcome_attribute}</span>
                 </div>
                 <div className="flex justify-between border-b border-border-shadow/30 pb-2">
                    <span className="text-text-muted">PRIVILEGED GRP</span>
                    <span className="font-bold uppercase">{audit.privileged_group}</span>
                 </div>
                 <div className="flex justify-between border-b border-border-shadow/30 pb-2">
                    <span className="text-text-muted">LAST AUDIT</span>
                    <span className="font-bold uppercase">{mounted ? new Date(audit.timestamp).toLocaleDateString() : '...'}</span>
                 </div>
              </div>
            </BoltedCard>
          </div>

          {/* RIGHT COLUMN: GRAPHS & DETAILS */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-8">
            {/* TRADEOFF CHART */}
            <BoltedCard className="flex-1 p-8 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest">Remediation Engine</span>
                  <h3 className="font-bold text-xl uppercase">Accuracy vs. Fairness Tradeoff</h3>
                </div>
                <div className="flex gap-4 font-mono text-[9px] font-bold">
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-accent" /> FAIRNESS</div>
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-text-muted/40" /> ACCURACY</div>
                </div>
              </div>

              <div className="flex-1 flex items-end justify-between gap-2 px-4 relative">
                 {tradeoff.map((point, idx) => (
                   <div key={idx} className="flex-1 flex flex-col justify-end gap-1 h-full group relative">
                      {/* Interaction tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[9px] font-mono p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-lg">
                        T: {point.threshold}<br/>
                        ACC: {(point.accuracy * 100).toFixed(1)}%<br/>
                        FAIR: {point.fairness_score}%
                      </div>
                      
                      {/* Accuracy bar */}
                      <motion.div 
                        className="w-full bg-text-muted/20 border-x border-t border-border-shadow/20 rounded-t-sm"
                        initial={{ height: 0 }}
                        animate={{ height: `${point.accuracy * 100}%` }}
                      />
                      {/* Fairness bar */}
                      <motion.div 
                        className="w-full bg-accent shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)] rounded-t-sm"
                        initial={{ height: 0 }}
                        animate={{ height: `${point.fairness_score}%` }}
                        transition={{ delay: idx * 0.02 }}
                      />
                   </div>
                 ))}
                 
                 {/* X-axis labels */}
                 <div className="absolute -bottom-6 left-0 right-0 flex justify-between font-mono text-[8px] font-bold text-text-muted uppercase px-4">
                    <span>Low threshold</span>
                    <span>Decision Threshold (α) Sweep</span>
                    <span>High threshold</span>
                 </div>
              </div>
            </BoltedCard>

            {/* GROUP DETAILS TABLE */}
            <BoltedCard className="p-0 overflow-hidden">
               <div className="p-6 border-b border-border-shadow bg-panel/30">
                  <h3 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
                    <Users size={16} className="text-accent" /> Group-Level Selection Rates
                  </h3>
               </div>
                <div className="overflow-x-auto">
                   <table className="w-full font-mono text-[10px] min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border-shadow text-left text-text-muted tracking-widest uppercase">
                           <th className="p-4 pl-8">Demographic Group</th>
                           <th className="p-4">Selection Rate</th>
                           <th className="p-4">DI Ratio</th>
                           <th className="p-4 pr-8">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-shadow/40">
                        {audit.groups.map((group) => (
                          <tr key={group.group} className="hover:bg-panel/10 transition-colors">
                            <td className="p-4 pl-8 font-bold">{group.group}</td>
                            <td className="p-4">{(group.selection_rate * 100).toFixed(1)}%</td>
                            <td className={cn("p-4 font-bold", group.impact < 0.8 ? "text-accent" : "text-green-600")}>
                              {group.impact.toFixed(3)}
                            </td>
                            <td className="p-4 pr-8">
                              <LEDIndicator status={group.below_threshold ? 'error' : 'online'} label={group.below_threshold ? 'FLAGGED' : 'OPTIMAL'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
            </BoltedCard>
          </div>
        </div>
      </main>
    </div>
  );
}
