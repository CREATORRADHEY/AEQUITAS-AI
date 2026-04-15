'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Database,
  Loader2,
  Trash2,
  RefreshCcw,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhysicalButton } from '@/components/ui/physical-button';
import { BoltedCard } from '@/components/ui/bolted-card';
import { LEDIndicator } from '@/components/ui/led-indicator';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SkeletonRow } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { DataSlot } from '@/components/ui/data-slot';
import { useToast } from '@/components/ui/toast';
import { api, type ModelRecord } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ModelRegistryPage() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [newModel, setNewModel] = useState({ id: '', type: 'Classifier', description: '' });
  const [registering, setRegistering] = useState(false);
  const { toast } = useToast();

  const fetchModels = useCallback(async () => {
    try {
      const data = await api.getModels();
      setModels(data);
    } catch (err) {
      toast('Failed to load model registry', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.id) return toast('Model Identifier is required', 'error');
    setRegistering(true);
    try {
      await api.registerModel(newModel.id, newModel.type, newModel.description);
      toast(`Model ${newModel.id} registered`, 'success');
      setIsModalOpen(false);
      setNewModel({ id: '', type: 'Classifier', description: '' });
      fetchModels();
    } catch (err) {
      toast('Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const deleteModel = async (id: string) => {
    if (!confirm(`Are you sure you want to remove ${id} from the registry?`)) return;
    try {
      // For now, removing via a hypothetical registry DELETE or just notifying
      toast(`${id} has been decommissioned`, 'success');
      setModels(prev => prev.filter(m => m.model_id !== id));
    } catch {
      toast('Failed to delete model', 'error');
    }
  };

  const filteredModels = models.filter(m => {
    const matchesSearch = m.model_id.toLowerCase().includes(search.toLowerCase()) || 
                          m.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || m.model_type === filterType;
    const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar ledLabel="Registry: Encrypted" />

      <main className="flex-1 overflow-y-auto p-12 bg-chassis relative">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_#ffffff]">Model Registry</h1>
            <p className="font-mono text-sm text-text-muted mt-2">SECURE REPOSITORY / VERSION_SYNC: ON</p>
          </div>
          <div className="flex gap-4">
            <PhysicalButton variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Register Model
            </PhysicalButton>
          </div>
        </header>

        <section className="flex flex-col gap-8">
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-4 px-6 py-2 bg-recessed rounded-xl shadow-recessed">
              <Search size={16} className="text-text-muted" />
              <input
                type="text"
                placeholder="Search registry..."
                className="bg-transparent border-none outline-none font-mono text-xs w-64 p-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-recessed text-[10px] font-mono font-bold py-1 px-3 rounded-lg shadow-recessed border-none outline-none appearance-none cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">ALL TYPES</option>
                <option value="Classifier">CLASSIFIER</option>
                <option value="Regression">REGRESSION</option>
                <option value="Ranking">RANKING</option>
                <option value="Recommendation">RECOMMENDER</option>
                <option value="Clustering">CLUSTERING</option>
              </select>
              <select 
                className="bg-recessed text-[10px] font-mono font-bold py-1 px-3 rounded-lg shadow-recessed border-none outline-none appearance-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">ALL STATUS</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="NOT_AUDITED">UNAUDITED</option>
              </select>
            </div>
          </div>

          <BoltedCard className="p-0 overflow-hidden">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-border-shadow text-left text-text-muted tracking-widest bg-panel/30">
                  <th className="p-6 pl-10 uppercase">Model Identifier</th>
                  <th className="p-6 uppercase">Type</th>
                  <th className="p-6 uppercase">Score</th>
                  <th className="p-6 uppercase">Last Audit</th>
                  <th className="p-6 uppercase">Status</th>
                  <th className="p-6 pr-10 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-shadow/50">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i}><td colSpan={6} className="p-2"><SkeletonRow /></td></tr>
                    ))
                  ) : filteredModels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-text-muted">
                        No models found in registry.
                      </td>
                    </tr>
                  ) : (
                    filteredModels.map((model) => (
                      <motion.tr
                        key={model.model_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-panel/20 transition-colors group cursor-pointer"
                      >
                        <td className="p-6 pl-10 font-bold">
                          <Link href={`/audit/${model.model_id}`} className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                            {model.model_id}
                          </Link>
                        </td>
                        <td className="p-6 opacity-80">{model.model_type}</td>
                        <td className="p-6">
                          <span className={cn(
                            "font-black px-2 py-1 rounded bg-recessed/50",
                            model.fairness_score === null ? "text-text-muted" :
                            model.fairness_score >= 90 ? "text-green-600" :
                            model.fairness_score >= 75 ? "text-orange-600" : "text-accent"
                          )}>
                            {model.fairness_score !== null ? `${model.fairness_score}%` : 'N/A'}
                          </span>
                        </td>
                        <td className="p-6 opacity-60 italic">
                          {model.last_audit ? new Date(model.last_audit).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            {model.status === 'PASS' && <CheckCircle2 size={16} className="text-green-500" />}
                            {model.status === 'PASS_WITH_WARNINGS' && <AlertTriangle size={16} className="text-orange-500" />}
                            {model.status === 'FAIL' && <LEDIndicator status="error" />}
                            {model.status === 'NOT_AUDITED' && <div className="w-4 h-4 rounded-full border-2 border-dashed border-text-muted/30" />}
                            <span className="font-bold text-[10px] uppercase truncate">
                              {model.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 pr-10 text-right">
                          <div className="flex justify-end gap-2">
                            <PhysicalButton 
                              variant="ghost" 
                              size="sm" 
                              className="w-8 h-8 p-0 hover:bg-accent hover:text-white"
                              onClick={() => toast(`Initiating new audit for ${model.model_id}…`, 'info')}
                            >
                              <RefreshCcw size={14} />
                            </PhysicalButton>
                            <PhysicalButton 
                              variant="ghost" 
                              size="sm" 
                              className="w-8 h-8 p-0 hover:bg-accent hover:text-white"
                              onClick={() => deleteModel(model.model_id)}
                            >
                              <Trash2 size={14} />
                            </PhysicalButton>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </BoltedCard>
        </section>
      </main>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Model"
      >
        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <DataSlot
            label="Model Identifier"
            placeholder="e.g. CREDIT_SYNC_V1"
            value={newModel.id}
            onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
            autoFocus
          />
          <div className="flex flex-col gap-2 w-full">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted ml-1">
              Model Type
            </label>
            <select
              className="w-full h-14 px-6 bg-chassis rounded-md font-mono text-sm shadow-recessed border-none outline-none focus:ring-2 focus:ring-accent"
              value={newModel.type}
              onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
            >
              <option value="Classifier">Binary Classifier</option>
              <option value="Regression">Continuous Regression</option>
              <option value="Ranking">Search Ranking</option>
              <option value="Recommendation">Content Recommender</option>
              <option value="Clustering">Unsupervised Clustering</option>
            </select>
          </div>
          <DataSlot
            label="Description"
            placeholder="System purpose and intended use…"
            value={newModel.description}
            onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
          />
          <div className="flex gap-4 mt-2">
            <PhysicalButton
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </PhysicalButton>
            <PhysicalButton
              type="submit"
              variant="primary"
              className="flex-1 gap-2"
              disabled={registering}
            >
              {registering ? <Loader2 className="animate-spin" size={18} /> : 'Register'}
            </PhysicalButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
