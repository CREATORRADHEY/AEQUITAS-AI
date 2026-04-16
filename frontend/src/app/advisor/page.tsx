'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  Loader2,
  Database,
  ArrowRight,
  Zap
} from 'lucide-react';
import { BoltedCard } from '@/components/ui/bolted-card';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { PhysicalButton } from '@/components/ui/physical-button';
import { api, type AuditResult } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AIAdvisorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function syncNeuralLink() {
      try {
        const history = await api.getHistory();
        if (history && history.length > 0) {
          // Sync with the latest successful audit in registry
          const latest = history[0];
          setAudit({
            ...latest.metrics,
            model_id: latest.model_id,
            status: latest.status,
            n_samples: 5000, // Demo constant
            risk_level: latest.metrics.overall_fairness_score > 90 ? 'SAFE' : 
                        latest.metrics.overall_fairness_score > 75 ? 'MEDIUM' : 'HIGH'
          } as any);
        }
      } catch (err) {
        console.error("Neural Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    }
    syncNeuralLink();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-chassis">
      <MobileHeader isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <AppSidebar isOpen={isSidebarOpen} activeView="advisor" />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
        <div className="absolute top-6 lg:top-8 left-6 lg:left-8 z-20 no-print">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-accent transition-colors group">
            <div className="h-8 w-8 rounded bg-recessed shadow-recessed flex items-center justify-center group-hover:shadow-pressed transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="hidden sm:inline">Return to Hub</span>
          </Link>
        </div>

        {/* Neural Link Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
            <Loader2 className="animate-spin text-accent" size={40} />
            <p className="font-mono text-[10px] uppercase opacity-40 tracking-widest">Establishing Neural Connection...</p>
          </div>
        ) : !audit ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-10 space-y-8 max-w-md mx-auto">
            <div className="w-24 h-24 rounded-3xl bg-recessed border border-border-shadow flex items-center justify-center shadow-recessed">
               <BrainCircuit className="text-accent/30" size={32} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black uppercase tracking-tight italic">Neural Link: Restricted</h3>
              <p className="font-mono text-[10px] text-text-muted leading-relaxed uppercase tracking-widest opacity-60">Architectural reasoning and remediation strategies are currently locked. Perform a model certification to establish an advisory link.</p>
            </div>
            <Link href="/">
              <PhysicalButton size="sm" variant="accent" className="px-10">
                 Access Neural Port
              </PhysicalButton>
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 py-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-6 border-b border-border-shadow/30 pb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-purple-800 flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                <BrainCircuit size={40} className="relative z-10" />
                <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 bg-white" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">AI Fairness Advisor</h2>
                <p className="font-mono text-[10px] text-text-muted mt-2 uppercase tracking-widest font-black text-accent">Active Remediation Agent: Online</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* RECOMMENDATIONS */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                 <h4 className="font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                   <ShieldAlert size={14} className="text-accent" /> Prioritized Mitigation Steps
                 </h4>
                 <div className="space-y-4">
                    {(audit.recommendations || []).map((rec, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-recessed/30 rounded-lg border-l-4 border-accent shadow-recessed group hover:bg-recessed/50 transition-all"
                      >
                        <div className="flex gap-4">
                          <div className="h-8 w-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-mono text-xs font-black shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm font-medium leading-relaxed group-hover:text-white transition-colors uppercase tracking-tight">{rec}</p>
                        </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              {/* RISK PROFILE */}
              <div className="col-span-12 lg:col-span-5 space-y-8">
                 <BoltedCard className="p-8 space-y-6" elevated>
                    <h4 className="font-black uppercase tracking-tight text-sm mb-2">Executive Risk Profile</h4>
                    <div className="flex items-center gap-3">
                       <div className={cn("px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest", 
                          audit.risk_level === 'SAFE' ? "bg-green-500/20 text-green-500 border border-green-500/30" : 
                          audit.risk_level === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                          "bg-accent/20 text-accent border border-accent/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                       )}>
                          {audit.risk_level} RISK
                       </div>
                       <div className="h-px flex-1 bg-border-shadow" />
                    </div>
                    
                    <div className="space-y-6 pt-4">
                       <div>
                          <div className="flex justify-between text-[9px] font-mono font-black uppercase mb-2">
                             <span>Compliance Buffer</span>
                             <span className="text-accent">{(audit.overall_fairness_score - 80).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-recessed rounded-full overflow-hidden shadow-recessed">
                             <motion.div 
                                className="h-full bg-accent"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, audit.overall_fairness_score)}%` }}
                             />
                          </div>
                       </div>
                       
                       <div className="bg-panel/20 p-4 rounded border border-border-shadow/30 font-mono text-[9px] leading-relaxed uppercase opacity-80">
                         System logic suggests that re-weighting the <strong>{audit.protected_attribute}</strong> attribute by a factor of <strong>1.4x</strong> could achieve parity without sacrificing accuracy.
                       </div>
                    </div>
                 </BoltedCard>

                 <BoltedCard className="p-8 border-dashed flex flex-col items-center justify-center gap-4 group cursor-help">
                    <Lock size={20} className="text-text-muted opacity-20 group-hover:text-accent group-hover:opacity-100 transition-all" />
                    <p className="font-mono text-[9px] text-center text-text-muted uppercase tracking-widest">Neural Link: Advanced Contextual reasoning Locked</p>
                 </BoltedCard>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
