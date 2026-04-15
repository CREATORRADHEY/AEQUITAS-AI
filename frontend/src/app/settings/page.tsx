'use client';

import React, { useState } from 'react';
import { 
  Shield, Server, Bell, Link2, Info, Save, Cpu, HardDrive, Key, Globe 
} from 'lucide-react';
import { PhysicalButton } from '@/components/ui/physical-button';
import { BoltedCard } from '@/components/ui/bolted-card';
import { DataSlot } from '@/components/ui/data-slot';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast('Platform configuration persisted to kernel', 'success');
    }, 1200);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar ledLabel="System: Configuration" />

      <main className="flex-1 overflow-y-auto p-12 bg-chassis relative">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_#ffffff]">System Configuration</h1>
            <p className="font-mono text-sm text-text-muted mt-2">INDUSTRIAL CONTROL PANEL / ROOT_ACCESS</p>
          </div>
          <PhysicalButton variant="primary" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Persisting…' : 'Save Changes'}
          </PhysicalButton>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Engine Parameters */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <BoltedCard className="p-8" withVents={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-recessed rounded-full flex items-center justify-center shadow-recessed text-accent">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-tight">Kernel Parameters</h3>
                  <p className="font-mono text-[10px] text-text-muted">Aequitas Core Audit Engine v2.4.0</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <DataSlot label="Fairness Threshold" defaultValue="0.80" type="number" step="0.01" />
                  <DataSlot label="Min. Sample Size" defaultValue="200" type="number" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Statistical Engine</label>
                  <select className="w-full h-14 px-6 bg-chassis rounded-md font-mono text-sm shadow-recessed border-none outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer">
                    <option>CHI-SQUARE (DEFAULT)</option>
                    <option>Z-TEST (ENTERPRISE)</option>
                    <option>BAYESIAN INFERENCE</option>
                    <option>WILCOXON SIGNED-RANK</option>
                  </select>
                </div>
              </div>
            </BoltedCard>

            <BoltedCard className="p-8" withVents={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-recessed rounded-full flex items-center justify-center shadow-recessed text-accent">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-tight">Alert Gateways</h3>
                  <p className="font-mono text-[10px] text-text-muted">Notification and Orchestration Bridges</p>
                </div>
              </div>

              <div className="space-y-6">
                 <DataSlot label="Slack Webhook URL" placeholder="https://hooks.slack.com/services/..." type="password" />
                 <DataSlot label="Compliance Email" placeholder="legal-audit@company.com" />
                 <div className="flex items-center gap-4 p-4 bg-highlight/30 rounded-lg border border-border-shadow/50">
                   <Info size={16} className="text-accent shrink-0" />
                   <p className="text-xs leading-relaxed">System will auto-trigger alerts when fairness scores drop below <strong>75%</strong> on any registered model.</p>
                 </div>
              </div>
            </BoltedCard>
          </div>

          {/* Infrastructure Stats */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
             <BoltedCard className="p-8" withVents={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-recessed rounded-full flex items-center justify-center shadow-recessed text-accent">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-tight">Infrastructure</h3>
                  <p className="font-mono text-[10px] text-text-muted">Physical and Network Layer</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'NODE_ID', value: 'AEQ_772_PROD', icon: Server },
                  { label: 'REGION', value: 'US-CENTRAL-1 (BOLTED)', icon: Globe },
                  { label: 'SECURITY', value: 'FIPS 140-2 LEVEL 3', icon: Shield },
                  { label: 'ACCESS_KEY', value: '********-****-4211', icon: Key },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-recessed rounded-xl shadow-recessed overflow-hidden group">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-text-muted group-hover:text-accent transition-colors" />
                      <span className="font-mono text-[10px] font-bold opacity-60">{item.label}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </BoltedCard>

            <BoltedCard className="p-8 bg-panel/30" withVents={false}>
              <h4 className="font-bold uppercase tracking-tight mb-4">Export Protocol</h4>
              <p className="text-xs text-text-muted mb-6 leading-relaxed">
                Configure default PDF generation settings for sharing audit reports with stakeholders.
              </p>
              <div className="space-y-3">
                <PhysicalButton variant="ghost" size="sm" className="w-full justify-start gap-3">
                  <Shield size={14} className="text-accent" /> Include Raw Samples
                </PhysicalButton>
                <PhysicalButton variant="ghost" size="sm" className="w-full justify-start gap-3">
                  <Shield size={14} className="text-accent" /> Sign with Corporate Key
                </PhysicalButton>
              </div>
            </BoltedCard>
          </div>
        </div>
      </main>
    </div>
  );
}
