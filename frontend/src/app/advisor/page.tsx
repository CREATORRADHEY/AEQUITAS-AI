'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, ShieldAlert, Zap, Lock, ArrowLeft } from 'lucide-react';
import { BoltedCard } from '@/components/ui/bolted-card';
import Link from 'next/link';

export default function AIAdvisorPage() {
  return (
    <div className="flex flex-col h-full bg-chassis">
      <main className="flex-1 overflow-y-auto p-10 relative">
        {/* Navigation */}
        <div className="absolute top-8 left-8 z-20">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-accent transition-colors group">
            <div className="h-8 w-8 rounded bg-recessed shadow-recessed flex items-center justify-center group-hover:shadow-pressed transition-all">
              <ArrowLeft size={16} />
            </div>
            Back to Dashboard
          </Link>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-12 py-12">
          {/* Animated Hero Icon */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="h-32 w-32 bg-accent rounded-3xl flex items-center justify-center shadow-floating relative z-10">
              <Brain size={64} className="text-white" />
            </div>
            {/* Pulsing Aura */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-0 bg-accent rounded-3xl -z-10 blur-xl"
            />
          </motion.div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl font-black uppercase tracking-tighter">
              AI <span className="text-accent">Advisor</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-border-shadow" />
              <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-text-muted">
                Generative Remediation Reasoning
              </p>
              <span className="h-px w-12 bg-border-shadow" />
            </div>
          </div>

          {/* Coming Soon Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="px-6 py-2 rounded-full border border-accent/20 bg-accent/5 text-accent font-mono text-sm font-bold flex items-center gap-2"
          >
            <Zap size={14} className="animate-pulse" />
            DEPLOYMENT: PHASE 2 (Q3 2026)
          </motion.div>

          {/* Features Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            {[
              {
                icon: <Sparkles className="text-accent" />,
                title: "Gemini Integration",
                desc: "Powered by Gemini 1.5 Pro for deep multi-modal audit reasoning."
              },
              {
                icon: <ShieldAlert className="text-accent" />,
                title: "Contextual Bias Fixes",
                desc: "Automated human-centric remediation steps tailored to your specific industry."
              },
              {
                icon: <Lock className="text-accent" />,
                title: "Registry Secure",
                desc: "Privacy-first LLM inference ensures your raw dataset never leaves the audit kernel."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <BoltedCard className="p-6 h-full flex flex-col gap-4" withVents={false}>
                  <div className="h-10 w-10 rounded-lg bg-recessed flex items-center justify-center shadow-recessed">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold uppercase text-xs tracking-widest">{f.title}</h3>
                    <p className="text-xs text-text-muted mt-2 leading-relaxed">{f.desc}</p>
                  </div>
                </BoltedCard>
              </motion.div>
            ))}
          </div>

          {/* Lock Overlay Content */}
          <div className="pt-8 space-y-6">
            <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              We are currently fine-tuning the <strong>Aequitas Generative Model</strong> to interpret disparate impact matrices with human-level nuance. 
              The AI Advisor will seamlessly bridge the gap between statistical parity and executive action.
            </p>
            
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-4 py-2 rounded border border-accent/20">
              <Lock size={12} />
              Access Restricted: Alpha Developers Only
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
