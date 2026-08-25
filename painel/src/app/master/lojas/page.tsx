"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { showToast } from '@/store/toastStore';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Store, 
  Loader2, 
  Filter,
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function LojasMaster() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', email: '', phone: '', document: '', planId: '' });
  const [plans, setPlans] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // CRM Drawer State
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, [search, status, page]);

  const fetchPlans = async () => {
    try {
      const res = await apiFetch('/api/master/plans');
      if (res.ok) setPlans(await res.json());
    } catch(e) {}
  };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/master/tenants?page=${page}&limit=20&search=${search}&status=${status}`);
      if (res.ok) {
        const json = await res.json();
        setTenants(json.data);
        setTotal(json.meta.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch('/api/master/tenants', {
        method: 'POST',
        body: JSON.stringify(newStore)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewStore({ name: '', email: '', phone: '', document: '', planId: '' });
        fetchTenants();
        showToast('Loja criada com sucesso', 'success');
      } else {
        showToast('Erro ao criar loja', 'error');
      }
    } catch (e) {
      showToast('Erro ao criar loja', 'error');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'ACTIVE': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" />Ativa</span>;
      case 'TRIALING': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider w-max">Trial</span>;
      case 'PAST_DUE': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" />Vencendo</span>;
      case 'SUSPENDED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider w-max">Suspensa</span>;
      default: return <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-bold uppercase tracking-wider w-max">{s}</span>;
    }
  };

  return (
    <div className="relative h-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">CRM / Lojas ({total})</h1>
            <p className="text-sm text-stone-500 mt-1">Gerencie a sua carteira de restaurantes e contas.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Loja
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Buscar loja por nome, e-mail ou CNPJ..." 
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-56 shrink-0 flex items-center">
            <Filter className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none font-medium text-stone-700"
            >
              <option value="ALL">Todos os status</option>
              <option value="ACTIVE">Ativas</option>
              <option value="TRIALING">Trial</option>
              <option value="PAST_DUE">Inadimplentes</option>
              <option value="SUSPENDED">Suspensas</option>
            </select>
          </div>
        </div>

        {/* CRM Data Grid */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden relative">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Organização</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plano Vigente</th>
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
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-stone-500">
                      <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                      <p className="font-medium">Nenhuma loja encontrada.</p>
                      <p className="text-xs mt-1">Ajuste os filtros ou crie uma nova conta.</p>
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr 
                      key={t.id} 
                      className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTenant(t)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                            <Store className="w-5 h-5 text-stone-400" />
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 group-hover:text-brand-600 transition-colors">{t.name}</div>
                            <div className="text-xs text-stone-400 font-mono mt-0.5">{t.cpfCnpj || 'Documento não informado'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-stone-900 font-medium">{t.email}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{t.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(t.subscriptionStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-stone-400" />
                          <span className="font-medium text-stone-700">{t.subscriptions?.[0]?.plan?.name || 'Nenhum Plano'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedTenant(t); }}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-brand-600 hover:bg-brand-50 text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          Detalhes
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {total > 20 && (
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
              <span className="text-xs text-stone-500 font-medium tracking-wide">
                Exibindo {(page-1)*20 + 1} a {Math.min(page*20, total)} de {total} contas
              </span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-stone-50 transition-colors shadow-sm">Anterior</button>
                <button disabled={page*20 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-stone-50 transition-colors shadow-sm">Próximo</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Contextual (CRM Detail Drawer) */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTenant(null)}
          ></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 transform transition-transform animate-in slide-in-from-right">
            
            {/* Drawer Header */}
            <div className="px-6 py-6 border-b border-stone-100 flex items-start justify-between bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 leading-tight">{selectedTenant.name}</h2>
                  <div className="text-sm text-stone-500 font-mono mt-1">{selectedTenant.slug}</div>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Status & Plan */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Status da Conta</h3>
                <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Status</div>
                    {getStatusBadge(selectedTenant.subscriptionStatus)}
                  </div>
                  <div className="w-px h-8 bg-stone-200"></div>
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Plano Vigente</div>
                    <div className="font-bold text-stone-900">{selectedTenant.subscriptions?.[0]?.plan?.name || 'Nenhum'}</div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Dados de Contato</h3>
                <div className="space-y-4 bg-white rounded-xl">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-stone-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-stone-900">{selectedTenant.email}</div>
                      <div className="text-xs text-stone-500">E-mail principal</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-stone-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-stone-900">{selectedTenant.phone || 'Não informado'}</div>
                      <div className="text-xs text-stone-500">Telefone / WhatsApp</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-stone-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-stone-900">{new Date(selectedTenant.createdAt).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-stone-500">Data de Cadastro</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRM Actions */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Ações Rápidas</h3>
                <div className="space-y-2">
                  <Link 
                    href={`/master/lojas/${selectedTenant.id}`}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 hover:border-brand-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
                        <Store className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="text-sm font-bold text-stone-700 group-hover:text-brand-600">Acessar Painel da Loja</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-brand-500" />
                  </Link>
                  
                  {/* Future CRM actions can be added here, like "Suspender", "Zerar Mensalidade", etc */}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">Nova Organização (Conta)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Nome Fantasia / Empresa</label>
                  <input type="text" required value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">E-mail de Acesso</label>
                  <input type="email" required value={newStore.email} onChange={e => setNewStore({...newStore, email: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Telefone Principal</label>
                  <input type="text" required value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Documento (CPF/CNPJ)</label>
                  <input type="text" required value={newStore.document} onChange={e => setNewStore({...newStore, document: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Plano Inicial</label>
                  <select value={newStore.planId} onChange={e => setNewStore({...newStore, planId: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Selecione um plano...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-brand-500/20">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Criar Organização
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
