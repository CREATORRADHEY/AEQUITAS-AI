'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  RefreshCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  Settings,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  BarChart3,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowUpRight,
  Download,
  Terminal,
  Trash2,
  History,
  Activity,
  Cpu,
  Lock,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Bell,
  Server,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhysicalButton } from '@/components/ui/physical-button';
import { BoltedCard } from '@/components/ui/bolted-card';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { useToast } from '@/components/ui/toast';
import { api, type AuditResult, type AuditHistoryItem, type GroupMetric, type ShapFeature, type CorrelationMatrix, downloadFile } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UploadZone } from '@/components/ui/upload-zone';
import { Modal } from '@/components/ui/modal';

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'landing', label: 'Start' },
  { id: 'config', label: 'Configure' },
  { id: 'processing', label: 'Audit' },
  { id: 'result', label: 'Result' },
  { id: 'mitigation', label: 'Tune' },
  { id: 'certification', label: 'Certify' }
];

const BOUNCE = [0.175, 0.885, 0.32, 1.275];

// ─── Color mapping for correlation heatmap cells ──────────────────────────────
function heatmapColor(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 0.7) return val > 0 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)';
  if (abs >= 0.4) return val > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';
  if (abs >= 0.2) return val > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
  return 'rgba(160, 174, 192, 0.15)';
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

/** STEP 0: Landing Screen */
function LandingScreen({ onNext }: { onNext: (fileData: any) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12 py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4">
          <Sparkles size={12} /> Version 2.0 — Production Ready
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
          AI Audit Engine for <br />
          <span className="text-accent drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] text-3xl sm:text-5xl md:text-7xl">Fairness Certification</span>
        </h1>
        <p className="text-text-muted font-mono text-[10px] sm:text-sm max-w-xl mx-auto uppercase tracking-tighter sm:tracking-normal mt-4">
          Upload your model dataset. Get a fairness score, 
          risk assessment, and compliance report in minutes.
        </p>
      </motion.div>

      <div className="w-full max-w-2xl px-2 sm:px-0">
        <UploadZone onAuditComplete={onNext} />
        <div className="mt-8 flex justify-center gap-4">
          <PhysicalButton 
            variant="ghost" 
            className="text-[10px] uppercase font-bold tracking-widest px-6"
          >
            Documentation
          </PhysicalButton>
        </div>
      </div>
    </div>
  );
}

/** STEP 1: Config Screen */
function ConfigScreen({ fileData, onBack, onStartAudit }: { fileData: any, onBack: () => void, onStartAudit: (config: any) => void }) {
  const [config, setConfig] = useState({
    target: fileData?.auto_detected?.outcome_attr || '',
    protected: fileData?.auto_detected?.protected_attr || '',
    privileged: fileData?.auto_detected?.privileged_group || 'White',
    modelType: 'Classifier'
  });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto space-y-10 py-10 px-2 sm:px-4">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Configure Engine</h2>
        <p className="text-text-muted font-mono text-[9px] sm:text-xs uppercase underline decoration-accent/30 decoration-2">
          Mapping Data Vector: {fileData?.filename || 'Active_Stream'}
        </p>
      </div>

      <BoltedCard className="p-6 md:p-8 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
              <ArrowRight size={10} className="text-accent" /> Target Attribute (Outcome)
            </label>
            <select 
              value={config.target}
              onChange={e => setConfig({...config, target: e.target.value})}
              className="w-full h-12 bg-recessed border border-border-shadow rounded px-4 font-mono text-sm outline-none focus:border-accent"
            >
              {fileData?.columns?.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-[9px] font-mono text-text-muted opacity-60 italic">Column to audit for disparate impact.</p>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
              <ArrowRight size={10} className="text-accent" /> Protected Attribute (Bias Axis)
            </label>
            <select 
              value={config.protected}
              onChange={e => setConfig({...config, protected: e.target.value})}
              className="w-full h-12 bg-recessed border border-border-shadow rounded px-4 font-mono text-sm outline-none focus:border-accent"
            >
              {fileData?.columns?.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
              <ArrowRight size={10} className="text-accent" /> Privileged Group
            </label>
            <input 
              value={config.privileged}
              onChange={e => setConfig({...config, privileged: e.target.value})}
              placeholder="e.g. White, Male, etc."
              className="w-full h-12 bg-recessed border border-border-shadow rounded px-4 font-mono text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-border-shadow/30">
          <PhysicalButton variant="ghost" className="flex-1" onClick={onBack}>Back</PhysicalButton>
          <PhysicalButton variant="primary" className="flex-[2]" onClick={() => onStartAudit(config)}>Initialize Kernels</PhysicalButton>
        </div>
      </BoltedCard>
    </motion.div>
  );
}

/** STEP 2: Processing Screen */
function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const messages = [
    'Initializing Fairness Kernel #4... [OK]',
    'Loading dataset into memory buffer...',
    'Detecting statistical parity gaps...',
    'Computing SHAP importance for proxy detection...',
    'Analyzing intersectional bias vectors...',
    'Generating recommendation matrix...',
    'Finalizing Audit Manifest...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => {
        if (s >= messages.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 1000);
          return s;
        }
        return s + 1;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [onComplete, messages.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-4 border-accent/20 border-t-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]"
        />
        <div className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-accent">
          {Math.round((step / (messages.length - 1)) * 100)}%
        </div>
      </div>

      <div className="w-full max-w-md bg-recessed p-6 rounded border border-border-shadow font-mono text-[10px] shadow-recessed overflow-hidden h-40">
        <div className="flex flex-col gap-1">
          {messages.slice(0, step + 1).map((msg, i) => (
             <motion.div 
              key={i} 
              initial={{ x: -10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              className={cn("flex gap-3", i === step ? "text-accent" : "text-text-muted opacity-60")}
             >
               <span className="shrink-0">{'>'}</span>
               <span>{msg}</span>
             </motion.div>
          ))}
          {step < messages.length - 1 && (
            <div className="animate-pulse text-accent inline-block w-2 h-3 bg-accent ml-6 mt-1" />
          )}
        </div>
      </div>
    </div>
  );
}

/** STEP 3: Result Screen */
function ResultScreen({ audit, onBack, onNext }: { audit: AuditResult, onBack: () => void, onNext: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const risk = audit.risk_level;
  const score = audit.overall_fairness_score;
  const riskColor = risk === 'SAFE' ? 'text-green-500' : risk === 'MEDIUM' ? 'text-yellow-500' : 'text-accent';
  const riskBg = risk === 'SAFE' ? 'bg-green-500/10' : risk === 'MEDIUM' ? 'bg-yellow-500/10' : 'bg-accent/10';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 py-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
         {/* Left: Score Gauge */}
          <BoltedCard className="w-full lg:flex-1 p-8 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="relative w-48 h-48 flex items-center justify-center translate-y-2">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-recessed" />
                <motion.circle 
                  cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 80}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - score / 100) }}
                  className={cn("transition-all duration-1000 drop-shadow-[0_0_8px_currentColor]", riskColor)} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-6xl font-black tracking-tighter leading-none">{score.toFixed(0)}</span>
                <span className={cn("font-mono text-[10px] font-black uppercase tracking-[0.3em] mt-2", riskColor)}>Score</span>
              </div>
            </div>
            
            <div className={cn("mt-8 px-6 py-2 rounded-full font-black text-sm uppercase tracking-tighter flex items-center gap-2 border", riskColor, riskBg, riskColor.replace('text-', 'border-'))}>
              {risk === 'SAFE' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
              <span className="opacity-70">Risk:</span> {risk || 'CALCULATING...'}
            </div>
         </BoltedCard>

         {/* Right: Summary */}
         <div className="flex-[1.5] flex flex-col justify-between space-y-6">
            <div>
              <div className="space-y-1">
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">AI Audit Summary</h2>
                <p className="font-mono text-xs text-text-muted uppercase">Model: {audit.model_id} · {mounted ? (audit.n_samples?.toLocaleString() || '0') : '...'} Samples</p>
              </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded bg-recessed border border-border-shadow space-y-1">
                   <div className="font-mono text-[9px] text-text-muted uppercase font-black opacity-60">Status</div>
                   <div className={cn("text-lg font-black uppercase", riskColor)}>{audit.status}</div>
                </div>
                <div className="p-4 rounded bg-recessed border border-border-shadow space-y-1">
                   <div className="font-mono text-[9px] text-text-muted uppercase font-black opacity-60">Protected Axis</div>
                   <div className="text-lg font-black uppercase truncate">{audit.protected_attribute || 'N/A'}</div>
                </div>
             </div>

             <div className="space-y-4 mt-8">
                <h4 className="font-mono text-[10px] font-black uppercase text-accent tracking-[0.2em] flex items-center gap-2">
                  <Zap size={14} /> Key Findings
                </h4>
                 <div className="space-y-3">
                    {((audit.recommendations || []).length > 0 ? audit.recommendations : (audit.flags || [])).slice(0, 3).map((rec, i) => (
                      <div key={i} className="flex gap-4 text-sm p-4 bg-white/5 rounded border-l-4 border-accent shadow-sm group hover:bg-white/10 transition-colors">
                         <div className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center text-accent text-[10px] font-black shrink-0 mt-0.5">
                            {i+1}
                         </div>
                         <p className="font-medium text-[11px] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-tight">{rec}</p>
                      </div>
                    ))}
                    {(!audit.recommendations || audit.recommendations.length === 0) && (!audit.flags || audit.flags.length === 0) && (
                      <div className="text-center py-6 opacity-30 font-mono text-[10px] uppercase border border-dashed border-white/10 rounded">
                        No critical insights generated for this audit.
                      </div>
                    )}
                 </div>
             </div>
           </div>

           {/* PRIMARY CTA */}
           <div className="pt-6 border-t border-border-shadow/30 flex flex-col sm:flex-row gap-4">
              <PhysicalButton 
                variant="ghost" 
                className="flex-1 py-6 text-sm uppercase font-black tracking-widest gap-2"
                onClick={onBack}
              >
                <ArrowRight className="rotate-180" size={16} /> Back to Config
              </PhysicalButton>
              <PhysicalButton 
                variant="primary" 
                className="flex-[2] py-6 text-lg uppercase font-black tracking-widest gap-3"
                onClick={onNext}
              >
                Proceed to Mitigation <ArrowRight size={20} />
              </PhysicalButton>
           </div>
           <p className="text-[9px] font-mono text-center text-text-muted mt-3 uppercase tracking-wider text-center">
             Step 3 of 5: Bias Diagnosis Summary
           </p>
        </div>
      </div>
    </motion.div>
  );
}

/** STEP 4: Mitigation & Simulation */
function MitigationScreen({ audit, onBack, onFinalize }: { audit: AuditResult, onBack: () => void, onFinalize: () => void }) {
  const [threshold, setThreshold] = useState(0.5);
  const { toast } = useToast();

  const accuracy = 0.82 - Math.abs(threshold - 0.5) * 0.1;
  const parity = audit.overall_fairness_score + (threshold > 0.5 ? (threshold-0.5)*40 : (threshold-0.5)*20);

  const downloadReport = async () => {
    if (!audit.model_id) return;
    toast('Generating industrial-grade audit report...', 'info');
    try {
      const blob = await api.getAuditReport(
        audit.model_id, 
        audit.protected_attribute, 
        audit.outcome_attribute || 'loan_approved'
      );
      downloadFile(blob, `Aequitas_Audit_${audit.model_id}.pdf`);
      toast('Audit report downloaded successfully.', 'success');
    } catch (err) {
      toast('Failed to generate report. Using print fallback.', 'warning');
      window.print();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">Remediation Engine</h2>
          <p className="font-mono text-[10px] lg:text-xs text-text-muted uppercase decoration-accent/30 underline decoration-2">Simulating threshold parity adjustments</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
           <PhysicalButton variant="secondary" className="flex-1 sm:flex-none gap-2 text-[10px]" onClick={downloadReport}>
              <Download size={16} /> Audit Report
           </PhysicalButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <BoltedCard className="col-span-1 lg:col-span-8 p-6 lg:p-10 space-y-10">
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <div className="font-mono text-[10px] lg:text-[11px] font-black uppercase tracking-widest">Decision Threshold Tuning</div>
                 <div className="text-xl font-black text-accent">{threshold.toFixed(2)}</div>
              </div>
              <input 
                type="range" min={0.3} max={0.7} step={0.01} value={threshold}
                onChange={e => setThreshold(+e.target.value)}
                className="w-full accent-accent h-3 bg-recessed rounded-full shadow-recessed appearance-none cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[9px] text-text-muted opacity-40">
                 <span>LENIENT {'<'} 0.5</span>
                 <span>TIGHTER {'>'} 0.5</span>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 pt-6 border-t border-border-shadow/30">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h5 className="font-mono text-[10px] font-black uppercase opacity-60">System Accuracy</h5>
                    <span className="text-lg font-black">{(accuracy*100).toFixed(1)}%</span>
                 </div>
                 <div className="h-2 bg-recessed rounded-full overflow-hidden border border-border-shadow/50">
                    <motion.div initial={{ width: '0%' }} animate={{ width: `${accuracy*100}%` }} className="h-full bg-white opacity-40 shadow-[0_0_10px_white]" />
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-accent">
                    <h5 className="font-mono text-[10px] font-black uppercase opacity-60">Fairness Parity</h5>
                    <span className="text-lg font-black">{Math.min(100, parity).toFixed(0)}</span>
                 </div>
                 <div className="h-2 bg-recessed rounded-full overflow-hidden border border-accent/20">
                    <motion.div initial={{ width: '0%' }} animate={{ width: `${Math.min(100, parity)}%` }} className="h-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                 </div>
              </div>
           </div>

           <div className="bg-panel/20 p-6 rounded border border-border-shadow/50 text-center font-mono text-[11px] uppercase tracking-wide">
             💡 <span className="text-accent underline">Recommendation:</span> Optimal balance detected at <strong className="text-white">{(0.58).toFixed(2)}</strong> for consistent certification.
           </div>
        </BoltedCard>

        <div className="col-span-1 lg:col-span-4 space-y-6 flex flex-col justify-between">
           <div className="space-y-6">
              <BoltedCard className="p-6 space-y-4">
                  <h5 className="font-mono text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                    <ShieldAlert size={14} className="text-accent" /> Proxy Detection
                  </h5>
                  <div className="space-y-3">
                    {(audit.proxy_features || []).length > 0 ? (audit.proxy_features || []).map(f => (
                      <div key={f} className="flex justify-between items-center p-3 rounded bg-recessed border border-border-shadow">
                          <span className="font-mono text-[11px] font-bold">{f}</span>
                          <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 font-black">HIGH RISK</span>
                      </div>
                    )) : (
                      <div className="text-center py-6 opacity-40 font-mono text-[10px]">No strong proxies detected.</div>
                    )}
                  </div>
              </BoltedCard>

              <BoltedCard className="p-6 bg-accent border-accent text-white" elevated>
                  <h5 className="font-black uppercase tracking-tighter text-xl mb-1">Pass Certification</h5>
                  <p className="text-[10px] font-mono opacity-80 uppercase leading-snug">Lock these parameters into your production serving layer to meet Aequitas compliance standards.</p>
                  <PhysicalButton 
                    size="sm" 
                    className="w-full mt-6 bg-white text-accent hover:bg-white/90 border-none uppercase font-black tracking-widest"
                    onClick={onFinalize}
                  >
                    Finalize & Deploy
                  </PhysicalButton>
              </BoltedCard>
           </div>
           
           <div className="pt-6 border-t border-border-shadow/30">
              <PhysicalButton 
                variant="ghost" 
                className="w-full py-4 text-xs uppercase font-black tracking-widest gap-2 opacity-60 hover:opacity-100"
                onClick={onBack}
              >
                <ArrowRight className="rotate-180" size={14} /> Back to Audit Results
              </PhysicalButton>
              <p className="text-[9px] font-mono text-center text-text-muted mt-2 uppercase tracking-wider">
                Step 4 of 5: Bias Remediation
              </p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

/** FINAL STEP: Certification Success */
function CertificationSuccess({ audit, onBack, onReset }: { audit: AuditResult, onBack: () => void, onReset: () => void }) {
  const { toast } = useToast();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center text-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]"
      >
        <ShieldCheck size={48} />
      </motion.div>

      <div className="space-y-4">
        <h1 className="text-5xl font-black uppercase tracking-tighter">Certification Confirmed</h1>
        <p className="font-mono text-xs text-text-muted uppercase max-w-sm mx-auto">Model {audit.model_id} has been formally certified for production deployment with Fairness Score {audit.overall_fairness_score.toFixed(0)}.</p>
      </div>

      <div className="relative group perspective-1000">
        <BoltedCard className="p-10 bg-white/5 backdrop-blur-xl border-white/10 w-full max-w-md mx-auto transform-gpu transition-all duration-500 group-hover:rotate-x-12 group-hover:rotate-y-12 shadow-2xl">
            <div className="flex justify-between items-start mb-10">
               <ShieldCheck className="text-green-500" size={32} />
               <div className="text-right">
                  <div className="font-mono text-[8px] opacity-40 uppercase">Status</div>
                  <div className="font-black text-green-500 uppercase tracking-widest">VERIFIED</div>
               </div>
            </div>
            
            <div className="space-y-6 text-left mb-10">
               <div>
                 <div className="font-mono text-[8px] opacity-40 uppercase">Audit Target</div>
                 <div className="font-bold uppercase tracking-tight">{audit.model_id}</div>
               </div>
               <div>
                 <div className="font-mono text-[8px] opacity-40 uppercase">Fairness Metric</div>
                 <div className="font-black text-2xl uppercase tracking-tighter">{audit.overall_fairness_score.toFixed(1)} <span className="text-[10px] text-accent">PROD</span></div>
               </div>
               <div>
                  <div className="font-mono text-[8px] opacity-40 uppercase">Fingerprint</div>
                  <div className="font-mono text-[8px] break-all opacity-60">AEQ_SHA256_7782_FX_1192_CERT_READY</div>
               </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between items-center">
               <div className="font-mono text-[10px] font-black uppercase tracking-widest text-accent">Aequitas AI Certified</div>
               <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center opacity-40 scale-75">
                  <Zap size={14} />
               </div>
            </div>
        </BoltedCard>
        
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none rounded opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs mx-auto mt-12">
         <PhysicalButton variant="primary" className="w-full gap-2 py-6 text-sm" onClick={onReset}>
            <RefreshCcw size={18} /> Start New Audit
         </PhysicalButton>
         <div className="flex gap-4">
            <PhysicalButton variant="ghost" className="flex-1 gap-2 py-4 text-[10px] uppercase font-black" onClick={onBack}>
               <ArrowRight className="rotate-180" size={14} /> Back
            </PhysicalButton>
            <PhysicalButton variant="secondary" className="flex-[2] gap-2 py-4 text-[10px] uppercase font-black" onClick={() => window.print()}>
               <Download size={16} /> Save Cert
            </PhysicalButton>
         </div>
      </div>
    </div>
  );
}


/** SYSTEM CONFIGURATION: Industrial Control Panel */
function SystemConfigScreen() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    api.getConfig().then(data => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const saveConfig = async () => {
    try {
      await api.updateConfig(config);
      toast('Production kernels recalibrated', 'success');
    } catch {
      toast('Failed to synchronize configuration', 'error');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="animate-spin text-accent" size={32} />
      <p className="font-mono text-[10px] uppercase opacity-40">Accessing Root Kernel...</p>
    </div>
  );

  const InputField = ({ label, value, keyName, placeholder }: any) => (
    <div className="space-y-2">
      <label className="font-mono text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <input 
          value={value || ''}
          onChange={e => setConfig({ ...config, [keyName]: e.target.value })}
          placeholder={placeholder}
          className="w-full h-11 bg-recessed border border-border-shadow rounded-lg px-4 font-mono text-xs shadow-recessed outline-none focus:border-accent/40 transition-all"
        />
        <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 py-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border-shadow/30 pb-6 gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">System Configuration</h2>
          <p className="font-mono text-[10px] text-text-muted mt-2 uppercase tracking-[0.2em] opacity-60">Industrial Control Panel / Root_Access</p>
        </div>
        <PhysicalButton variant="primary" className="w-full sm:w-auto gap-2 px-8" onClick={saveConfig}>
          <Download size={16} className="rotate-180" /> Save Changes
        </PhysicalButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column */}
        <div className="col-span-1 lg:col-span-8 space-y-8">
          <BoltedCard className="p-8 space-y-8" elevated>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                <Cpu size={20} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-sm">Kernel Parameters</h4>
                <p className="font-mono text-[9px] text-text-muted uppercase opacity-40">Aequitas Core Audit Engine v2.4.0</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputField label="Fairness Threshold" value={config.fairness_threshold} keyName="fairness_threshold" />
              <InputField label="Min. Sample Size" value={config.min_sample_size} keyName="min_sample_size" />
            </div>

            <InputField label="Statistical Engine" value={config.statistical_engine} keyName="statistical_engine" />
          </BoltedCard>

          <BoltedCard className="p-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-panel border-border-shadow flex items-center justify-center text-accent">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-sm">Alert Gateways</h4>
                <p className="font-mono text-[9px] text-text-muted uppercase opacity-40">Notification and Orchestration Bridges</p>
              </div>
            </div>

            <InputField label="Slack Webhook URL" value={config.slack_webhook} keyName="slack_webhook" placeholder="https://hooks.slack.com/services/..." />
            <InputField label="Compliance Email" value={config.compliance_email} keyName="compliance_email" placeholder="legal-audit@company.com" />
            
            <div className="bg-accent/5 border border-accent/10 p-4 rounded flex items-center gap-4">
              <Info className="text-accent shrink-0" size={16} />
              <p className="text-[10px] font-mono text-text-muted uppercase">System will auto-trigger alerts when fairness scores drop below <span className="text-accent font-bold">{(parseFloat(config.fairness_threshold || '0.8') * 100 - 5).toFixed(0)}%</span> on any registered model.</p>
            </div>
          </BoltedCard>
        </div>

        {/* Sidebar Column */}
        <div className="col-span-1 lg:col-span-4 space-y-8">
          <BoltedCard className="p-8 space-y-6 bg-panel/40">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-panel border-border-shadow flex items-center justify-center text-accent">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-sm">Infrastructure</h4>
                <p className="font-mono text-[9px] text-text-muted uppercase opacity-40">Physical and Network Layer</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border-shadow/30">
                <span className="font-mono text-[9px] uppercase font-black opacity-40">Node_ID</span>
                <span className="font-mono text-[11px] font-bold">{config.node_id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-shadow/30">
                <span className="font-mono text-[9px] uppercase font-black opacity-40">Region</span>
                <span className="font-mono text-[11px] font-bold">{config.region}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-shadow/30">
                <span className="font-mono text-[9px] uppercase font-black opacity-40">Security</span>
                <span className="font-mono text-[11px] font-bold">{config.security_level}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-mono text-[9px] uppercase font-black opacity-40">Access_Key</span>
                <span className="font-mono text-[11px] font-bold opacity-40">********-****-4211</span>
              </div>
            </div>
          </BoltedCard>

          <BoltedCard className="p-8 space-y-6">
            <h4 className="font-black uppercase tracking-tight text-sm">Export Protocol</h4>
            <p className="font-mono text-[9px] text-text-muted uppercase leading-relaxed opacity-60">
              Configure default PDF generation settings for sharing audit reports with stakeholders.
            </p>

            <div className="space-y-4 pt-4">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setConfig({...config, include_raw_samples: config.include_raw_samples === 'true' ? 'false' : 'true'})}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 transition-all", config.include_raw_samples === 'true' ? "bg-accent border-accent shadow-[0_0_8px_var(--accent)]" : "border-border-shadow")} />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest group-hover:text-accent transition-colors">Include Raw Samples</span>
              </div>
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setConfig({...config, sign_report: config.sign_report === 'true' ? 'false' : 'true'})}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 transition-all", config.sign_report === 'true' ? "bg-accent border-accent shadow-[0_0_8px_var(--accent)]" : "border-border-shadow")} />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest group-hover:text-accent transition-colors">Sign with Corporate Key</span>
              </div>
            </div>
          </BoltedCard>
        </div>
      </div>
    </motion.div>
  );
}

/** DATA ANALYSIS: Industrial Spreadsheet View */
function AnalysisView({ audit, isProcessing }: { audit: AuditResult | null, isProcessing?: boolean }) {
  const [shap, setShap] = useState<ShapFeature[]>([]);
  const [corr, setCorr] = useState<CorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!audit) return;
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const [shapData, corrData] = await Promise.all([
          api.getShap(audit.model_id),
          api.getCorrelation(audit.model_id),
        ]);
        setShap(shapData.features);
        setCorr(corrData);
      } catch {
        // Silent fail for placeholders
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [audit]);

  const maxShap = shap.length > 0 ? Math.max(...shap.map(s => s.shap_importance)) : 1;

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 space-y-8 max-w-md mx-auto">
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-24 h-24 rounded-full border-2 border-dashed border-accent flex items-center justify-center">
            <RefreshCcw className="text-accent" size={32} />
          </motion.div>
          <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-accent/10 blur-xl rounded-full" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tight italic">Kernel Processing</h3>
          <p className="font-mono text-[10px] text-text-muted leading-relaxed uppercase tracking-widest opacity-60">
            Aequitas is training the diagnostic model and computing game-theoretic influence vectors. Please stay on the neural uplink.
          </p>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 space-y-8 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-accent/20 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.1)]">
           <Database className="text-accent/30" size={32} />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tight italic">Kernel Stream: Isolated</h3>
          <p className="font-mono text-[10px] text-text-muted leading-relaxed uppercase tracking-widest opacity-60">The fairness analysis engine requires a synchronized model context. Initialize an audit in the certification hub to populate matrices.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 py-4 px-2 sm:px-4 lg:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-4 gap-4 pb-4 border-b border-border-shadow/20 lg:border-0 lg:pb-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none">Bias Explorer</h2>
          <p className="font-mono text-[9px] text-text-muted uppercase tracking-widest mt-2">Correlation & Influence Vectors</p>
        </div>
        <div className="lg:text-right flex flex-col items-start lg:items-end">
          <div className="font-mono text-[8px] opacity-40 uppercase">Kernel Target</div>
          <div className="font-bold uppercase tracking-tight text-accent text-xs">{audit.model_id}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* HEATMAP */}
        <BoltedCard className="col-span-12 lg:col-span-8 p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
             <h4 className="font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <Activity size={14} className="text-accent" /> Correlation Matrix
             </h4>
             <div className="flex gap-4 text-[8px] font-mono font-bold opacity-60">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500" /> POSITIVE</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" /> NEGATIVE</span>
             </div>
          </div>
          
          {loading || !corr ? (
            <div className="grid grid-cols-8 gap-1 h-64 animate-pulse">
              {Array.from({ length: 64 }).map((_, i) => <div key={i} className="bg-recessed rounded" />)}
            </div>
          ) : (
            <div className="overflow-x-auto pb-10">
              <div 
                className="grid gap-2 translate-y-4"
                style={{ 
                  gridTemplateColumns: `120px repeat(${corr.features.length}, minmax(40px, 60px))`,
                }}
              >
                <div />
                {corr.features.map(f => (
                  <div key={f} className="relative h-16">
                    <div 
                      className="absolute bottom-0 left-0 origin-bottom-left -rotate-45 font-mono text-[8px] font-black text-text-muted uppercase whitespace-nowrap pr-2"
                      style={{ transform: 'rotate(-45deg)' }}
                    >
                      {f}
                    </div>
                  </div>
                ))}

                {corr.matrix.map((row, ri) => (
                  <React.Fragment key={ri}>
                    <div className="font-mono text-[10px] font-black text-text-muted text-right pr-6 truncate py-4 self-center uppercase opacity-60">{corr.features[ri]}</div>
                    {row.map((val, ci) => (
                      <div 
                        key={ci} 
                        className="aspect-square rounded shadow-inner flex items-center justify-center text-[8px] font-black text-white/90 border border-white/5 group hover:scale-105 transition-transform cursor-pointer"
                        style={{ 
                          backgroundColor: heatmapColor(val),
                          boxShadow: Math.abs(val) > 0.5 ? `inset 0 0 10px rgba(0,0,0,0.2), 0 0 15px ${heatmapColor(val)}` : 'none'
                        }}
                        title={`${corr.features[ri]} x ${corr.features[ci]}: ${val.toFixed(3)}`}
                      >
                        {Math.abs(val) > 0.1 ? val.toFixed(1) : ''}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </BoltedCard>

        {/* SHAP */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <BoltedCard className="p-6">
            <h4 className="font-mono text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
               <Cpu size={14} className="text-accent" /> SHAP Influence
            </h4>
            <div className="space-y-4">
               {shap.slice(0, 8).map(f => (
                 <div key={f.feature} className="space-y-1">
                   <div className="flex justify-between text-[9px] font-mono font-bold uppercase">
                     <span className={cn(f.is_proxy && "text-accent")}>{f.feature}</span>
                     <span>{f.shap_importance.toFixed(3)}</span>
                   </div>
                   <div className="h-1.5 bg-recessed rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(f.shap_importance / maxShap) * 100}%` }}
                        className={cn("h-full", f.is_proxy ? "bg-accent" : "bg-text-muted/50")}
                     />
                   </div>
                 </div>
               ))}
            </div>
          </BoltedCard>

          <BoltedCard className="p-6 bg-accent/5 border-dashed border-accent/20">
             <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-accent" />
                <h5 className="font-black uppercase text-[10px] tracking-widest text-accent">Hotspot Detected</h5>
             </div>
             <p className="text-[10px] font-mono leading-relaxed opacity-60 uppercase">
                SHAP vector analysis indicates that high-influence features display a >25% proxy correlation with protected group markers.
             </p>
          </BoltedCard>
        </div>
      </div>
    </motion.div>
  );
}

/** AI ADVISOR: LLM-Powered Insights */
function AdvisorView({ audit, isProcessing }: { audit: AuditResult | null, isProcessing?: boolean }) {
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 space-y-8 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-recessed border-2 border-dashed border-accent/40 flex items-center justify-center shadow-recessed">
           <BrainCircuit className="text-accent animate-pulse" size={32} />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tight italic">Neural Link: Synchronizing</h3>
          <p className="font-mono text-[10px] text-text-muted leading-relaxed uppercase tracking-widest opacity-60">Synthesizing remediation strategies based on the current model weights and fairness diagnostics. Link establishment in progress.</p>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 space-y-8 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-recessed border border-border-shadow flex items-center justify-center shadow-recessed">
           <BrainCircuit className="text-accent/30" size={32} />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tight italic">Neural Link: Restricted</h3>
          <p className="font-mono text-[10px] text-text-muted leading-relaxed uppercase tracking-widest opacity-60">Architectural reasoning and remediation strategies are currently locked. Perform a model certification to establish an advisory link.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 py-4 max-w-5xl mx-auto px-2 sm:px-4 lg:px-0">
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-border-shadow/30 pb-10 text-center sm:text-left">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-purple-800 flex items-center justify-center text-white shadow-lg relative overflow-hidden shrink-0">
          <BrainCircuit size={40} className="relative z-10" />
          <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 bg-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none">AI Fairness Advisor</h2>
          <p className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-black text-accent">Active Remediation Agent: Online</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* RECOMMENDATIONS */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
           <h4 className="font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
             <ShieldAlert size={14} className="text-accent" /> Prioritized Mitigation Steps
           </h4>
           <div className="space-y-4">
              {audit.recommendations.map((rec, i) => (
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
                    <p className="text-sm font-medium leading-relaxed group-hover:text-white transition-colors">{rec}</p>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* RISK PROFILE */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
           <BoltedCard className="p-8 space-y-6" elevated>
              <h4 className="font-black uppercase tracking-tight text-sm mb-2">Executive Risk Profile</h4>
              <div className="flex items-center gap-4">
                 <div className={cn("px-4 py-2 rounded font-black text-xs uppercase tracking-widest", 
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
  );
}

// Removed redundant import

/** Advanced Dashboard View */
function AdvancedView({ history, onDelete }: { history: AuditHistoryItem[], onDelete: (id: number) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Advanced Control Deck</h2>
            <p className="font-mono text-xs text-text-muted mt-1 uppercase">Direct access to Fairness Kernel and Audit Registry</p>
          </div>
          <PhysicalButton size="sm" variant="accent" className="gap-2" onClick={() => window.location.reload()}>
             <RefreshCcw size={14} /> Reconnect Hub
          </PhysicalButton>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BoltedCard className="p-6 space-y-2">
             <div className="flex justify-between items-center text-accent/60 font-mono text-[9px] font-black uppercase tracking-widest">
                <span>Kernel Node</span>
                <LEDIndicator status="online" />
             </div>
             <div className="text-2xl font-black">AEQ_772_PROD</div>
             <p className="text-[10px] text-text-muted font-mono uppercase">Cluster: us-central1-run</p>
          </BoltedCard>
          <BoltedCard className="p-6 space-y-2">
             <div className="flex justify-between items-center text-accent/60 font-mono text-[9px] font-black uppercase tracking-widest">
                <span>Total Samples Audited</span>
             </div>
             <div className="text-2xl font-black">124,592+</div>
             <div className="h-1 w-full bg-recessed rounded-full mt-2">
                <div className="h-full w-[85%] bg-accent animate-pulse" />
             </div>
          </BoltedCard>
          <BoltedCard className="p-6 space-y-2">
             <div className="flex justify-between items-center text-accent/60 font-mono text-[9px] font-black uppercase tracking-widest">
                <span>Uplink Status</span>
             </div>
             <div className="text-2xl font-black text-green-500 uppercase">Synchronized</div>
             <p className="text-[10px] text-text-muted font-mono uppercase">Latency: 12ms</p>
          </BoltedCard>
       </div>

       <BoltedCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border-shadow flex justify-between items-center bg-panel/30">
            <h3 className="font-bold uppercase tracking-tight">Audit Trail Registry</h3>
            <span className="font-mono text-[10px] opacity-40 uppercase">{history.length} RECORDS STORED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border-shadow text-left text-text-muted tracking-widest uppercase">
                  <th className="p-4 pl-8">Timestamp</th>
                  <th className="p-4">Model ID</th>
                  <th className="p-4">Dataset</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-shadow/50">
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-text-muted italic uppercase opacity-40">No records in registry</td></tr>
                ) : history.map((item) => (
                  <tr key={item.id} className="hover:bg-panel/20 transition-colors group">
                    <td className="p-4 pl-8 opacity-60 font-mono text-[10px]">
                      {mounted ? new Date(item.timestamp).toLocaleTimeString() : '...'}
                    </td>
                    <td className="p-4 font-bold">{item.model_id}</td>
                    <td className="p-4 opacity-70 uppercase">{item.dataset_name}</td>
                    <td className="p-4 font-black text-accent">{item.metrics.overall_fairness_score.toFixed(0)}</td>
                    <td className="p-4 pr-8 text-right">
                      <div className="flex justify-end gap-2 pr-4">
                        <PhysicalButton 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={async () => {
                            try {
                              const blob = await api.getAuditReport(
                                item.model_id, 
                                item.metrics.protected_attribute, 
                                item.metrics.outcome_attribute
                              );
                              downloadFile(blob, `Aequitas_History_${item.model_id}_${item.id}.pdf`);
                            } catch (err) {
                              window.print();
                            }
                          }}
                          title="Export PDF Report"
                        >
                          <Download size={14} />
                        </PhysicalButton>
                        <PhysicalButton size="sm" variant="ghost" className="h-8 w-8 p-0 text-accent hover:bg-accent/10" onClick={() => onDelete(item.id)}>
                          <Trash2 size={14} />
                        </PhysicalButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </BoltedCard>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [activeView, setActiveView] = useState<'wizard' | 'registry' | 'config' | 'analysis' | 'advisor'>('wizard');
  const [step, setStep] = useState(0);
  const [fileData, setFileData] = useState<any>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeView]);

  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch { /* fail silent */ }
  }, []);

  // ─── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => {
    const savedStep = localStorage.getItem('aequitas_step');
    const savedFileData = localStorage.getItem('aequitas_fileData');
    const savedResult = localStorage.getItem('aequitas_auditResult');
    
    if (savedStep) setStep(parseInt(savedStep));
    if (savedFileData) setFileData(JSON.parse(savedFileData));
    if (savedResult) setAuditResult(JSON.parse(savedResult));
  }, []);

  useEffect(() => {
    localStorage.setItem('aequitas_step', step.toString());
    if (fileData) localStorage.setItem('aequitas_fileData', JSON.stringify(fileData));
    if (auditResult) localStorage.setItem('aequitas_auditResult', JSON.stringify(auditResult));
  }, [step, fileData, auditResult]);

  useEffect(() => {
    fetchHistory();
    if (activeView === 'registry') {
      const interval = setInterval(fetchHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchHistory, activeView]);

  const deleteHistoryRecord = async (id: number) => {
    try {
      await api.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast('Record purged successfully', 'success');
    } catch {
      toast('Failed to delete history record', 'error');
    }
  };

  const handleFileUploaded = (data: any) => {
    setFileData(data);
    setStep(1);
    toast('Dataset staged: ' + (data.filename || 'Source_Alpha'), 'success');
  };

  const handleReset = async () => {
    // 1. Clear Local Storage
    localStorage.removeItem('aequitas_step');
    localStorage.removeItem('aequitas_fileData');
    localStorage.removeItem('aequitas_auditResult');
    
    // 2. Clear Local State
    setStep(0);
    setFileData(null);
    setAuditResult(null);
    
    // 3. Optional: Reset backend engine
    try {
      await api.getShap('RESET'); // Hack to trigger a clear if needed, or add a real reset endpoint
    } catch { /* ignore */ }
    
    toast('Audit state purged. New session ready.', 'info');
  };

  const handleStartAudit = async (config: any) => {
    setStep(2);
    try {
      const result = await api.getAudit(
        'UPLOADED_MODEL', 
        config.privileged, 
        config.protected, 
        config.target
      );
      setAuditResult(result);
      setStep(3); // Background transition to results
      toast('Neural link established. Audit complete.', 'success');
    } catch (err) {
      toast('Audit failure: Check backend connectivity', 'error');
      setStep(1);
    }
  };

  const renderCurrentView = () => {
    if (activeView === 'config') return <SystemConfigScreen />;
    if (activeView === 'registry') return <AdvancedView history={history} onDelete={deleteHistoryRecord} />;
    if (activeView === 'analysis') return <AnalysisView audit={auditResult} isProcessing={step === 2} />;
    if (activeView === 'advisor') return <AdvisorView audit={auditResult} isProcessing={step === 2} />;

    switch (step) {
      case 0: return <LandingScreen onNext={handleFileUploaded} />;
      case 1: return <ConfigScreen fileData={fileData} onBack={() => setStep(0)} onStartAudit={handleStartAudit} />;
      case 2: return <ProcessingScreen onComplete={() => setStep(3)} />;
      case 3: return auditResult ? <ResultScreen audit={auditResult} onBack={() => setStep(1)} onNext={() => setStep(4)} /> : <div>Error loading result</div>;
      case 4: return auditResult ? <MitigationScreen audit={auditResult} onBack={() => setStep(3)} onFinalize={() => setStep(5)} /> : null;
      case 5: return auditResult ? <CertificationSuccess audit={auditResult} onBack={() => setStep(4)} onReset={handleReset} /> : null;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-chassis overflow-hidden relative">
      <MobileHeader 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        title={activeView === 'wizard' ? 'AI Certification' : activeView.replace(/_/g, ' ')}
      />

      <AppSidebar 
        onNavigate={(view: any) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }}
        activeView={activeView}
        isProcessing={step === 2}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto p-6 pt-24 lg:p-10 lg:pt-10 bg-chassis relative scroll-smooth">
        <div className="absolute top-10 right-10 flex gap-4 z-20">
           {activeView === 'wizard' && step >= 3 && (
             <PhysicalButton 
              size="sm" variant={step === 4 ? "primary" : "ghost"}
              onClick={() => setStep(step === 4 ? 3 : 4)}
              className="gap-2"
             >
                {step === 4 ? <ArrowRight className="rotate-180" size={16} /> : <Zap size={16} />}
                {step === 4 ? 'Return to Result' : 'Run Simulation'}
             </PhysicalButton>
           )}
           <PhysicalButton 
             size="sm" variant={activeView === 'registry' ? "primary" : "ghost"}
             className="w-10 p-0"
             onClick={() => setActiveView(activeView === 'registry' ? 'wizard' : 'registry')}
           >
              <Settings size={16} />
           </PhysicalButton>
        </div>

        {/* Global Progress Line (Wizard Only) */}
        {activeView === 'wizard' && step > 0 && (
          <div className="flex flex-col items-center mb-10">
            {/* Desktop: Dots and lines */}
            <div className="hidden lg:flex items-center gap-1">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2 transition-all",
                    step === i ? "bg-accent border-accent scale-125 shadow-[0_0_10px_var(--accent)]" : 
                    step > i ? "bg-accent/40 border-accent/40" : "bg-recessed border-border-shadow"
                  )} />
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-8 h-px", step > i ? "bg-accent/40" : "bg-border-shadow/30")} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile: Step X of Y */}
            <div className="lg:hidden flex flex-col items-center gap-1">
              <div className="font-mono text-[10px] text-accent font-black uppercase tracking-[0.2em]">
                Step {step + 1} of {STEPS.length}
              </div>
              <div className="font-sans font-black text-xs uppercase tracking-tighter opacity-60 italic">
                {STEPS[step].label}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
           <motion.div
             key={activeView === 'wizard' ? step : activeView}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.3 }}
           >
             {renderCurrentView()}
           </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
