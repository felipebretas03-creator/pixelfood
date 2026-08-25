"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { showToast } from '@/store/toastStore';
import { 
  Package, 
  Search, 
  Plus, 
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Ban,
  Pencil,
  Trash2
} from "lucide-react";

export default function PlanosMaster() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    priceCents: 0,
    billingCycle: 'MONTHLY',
    features: '',
    isActive: true
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Pass all=true to fetch active and inactive plans
      const res = await apiFetch('/api/master/plans?all=true');
      if (res.ok) setPlans(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      priceCents: 0,
      billingCycle: 'MONTHLY',
      features: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      priceCents: plan.priceCents / 100, // Show in Reais
      billingCycle: plan.billingCycle,
      features: plan.features || '',
      isActive: plan.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        priceCents: Math.round(Number(formData.priceCents) * 100) // convert to cents
      };

      const url = editingPlan ? `/api/master/plans/${editingPlan.id}` : '/api/master/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPlans();
        showToast(`Plano ${editingPlan ? 'atualizado' : 'criado'} com sucesso!`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erro ao salvar plano', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao salvar plano', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (plan: any) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/master/plans/${planToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setPlanToDelete(null);
        fetchPlans();
        showToast('Plano excluído com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erro ao excluir plano', 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao excluir plano', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Planos de Assinatura</h1>
          <p className="text-sm text-stone-500 mt-1">Gerencie os pacotes e preços disponíveis para os restaurantes.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-brand-500/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Buscar plano por nome ou código (ID)..." 
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CRM Grid */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Código (Gateway ID)</th>
                <th className="px-6 py-4">Preço / Ciclo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-stone-500">
                    <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="font-medium">Nenhum plano encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-brand-500" />
                        {plan.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded border border-stone-200">
                        {plan.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.priceCents / 100)}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {plan.billingCycle === 'MONTHLY' ? 'Por Mês' : 'Por Ano'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {plan.isActive ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max">
                          <Ban className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(plan)}
                          className="p-2 text-stone-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(plan)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                {editingPlan ? <Pencil className="w-5 h-5 text-brand-500" /> : <Plus className="w-5 h-5 text-brand-500" />}
                {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Nome do Plano</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Ex: Profissional"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1 flex items-center gap-2">
                    Código do Plano (Gateway ID)
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                    placeholder="Ex: plan_xyz123"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono transition-shadow" 
                  />
                  <p className="text-xs text-stone-400 mt-1">Este código deve ser idêntico ao ID do plano no Asaas/Stripe para que as integrações funcionem.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Preço (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        required 
                        value={formData.priceCents} 
                        onChange={e => setFormData({...formData, priceCents: parseFloat(e.target.value) || 0})} 
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow font-bold text-stone-900" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1">Ciclo</label>
                    <select 
                      value={formData.billingCycle} 
                      onChange={e => setFormData({...formData, billingCycle: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow font-semibold"
                    >
                      <option value="MONTHLY">Mensal</option>
                      <option value="YEARLY">Anual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Funcionalidades (Separadas por vírgula)</label>
                  <textarea 
                    rows={3}
                    value={formData.features} 
                    onChange={e => setFormData({...formData, features: e.target.value})} 
                    placeholder="Ex: Gestão de Pedidos, Cardápio Digital, Até 5 funcionários..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow resize-none" 
                  />
                </div>

                <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-brand-500 rounded border-stone-300 focus:ring-brand-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-stone-700 cursor-pointer">
                    Plano Ativo (Disponível para novas assinaturas)
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-brand-500/20 transition-all">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Excluir Plano</h3>
              <p className="text-stone-500 text-sm mb-6">
                Tem certeza que deseja excluir o plano <strong>{planToDelete?.name}</strong>? 
                Esta ação só será permitida se não houver NENHUMA loja utilizando este plano.
              </p>
              
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors w-full"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm w-full transition-all"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
