"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { showToast } from '@/store/toastStore';
import { 
  Search, 
  Plus, 
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
  Shield,
  Star,
  Ban,
  Play,
  PauseCircle,
  LogIn
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

  // Actions State
  const [actionLoading, setActionLoading] = useState(false);
  const [daysInput, setDaysInput] = useState('');
  const [planInput, setPlanInput] = useState('');

  // Confirm Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: (data?: any) => void;
    isDestructive?: boolean;
    showDaysInput?: boolean;
    showPlanSelect?: boolean;
    plans?: any[];
    isAlertOnly?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {},
    isDestructive: false,
    showDaysInput: false,
    showPlanSelect: false,
    plans: [],
    isAlertOnly: false
  });

  useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, [search, status, page]);

  // Update selectedTenant when tenants array updates to keep UI fresh after actions
  useEffect(() => {
    if (selectedTenant && tenants.length > 0) {
      const updatedTenant = tenants.find(t => t.id === selectedTenant.id);
      if (updatedTenant) {
        setSelectedTenant(updatedTenant);
      }
    }
  }, [tenants]);

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
      case 'LIFETIME': return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Star className="w-3 h-3" />Vitalício</span>;
      case 'TRIALING': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider w-max">Trial</span>;
      case 'PAST_DUE': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" />Vencendo</span>;
      case 'SUSPENDED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider w-max">Suspensa</span>;
      default: return <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-bold uppercase tracking-wider w-max">{s}</span>;
    }
  };

  // ----- MODAL HANDLERS -----

  const openConfirmModal = (title: string, description: string, confirmText: string, onConfirm: (data?: any) => void, isDestructive = false, showDaysInput = false, showPlanSelect = false, plansList: any[] = []) => {
    setModalState({ isOpen: true, title, description, confirmText, onConfirm, isDestructive, showDaysInput, showPlanSelect, plans: plansList, isAlertOnly: false });
    setDaysInput('');
    if (plansList.length > 0) setPlanInput(plansList[0].id);
  };

  const openAlertModal = (title: string, description: string, isDestructive = false) => {
    setModalState({ 
      isOpen: true, title, description, confirmText: 'OK', 
      onConfirm: () => closeConfirmModal(), 
      isDestructive, showDaysInput: false, showPlanSelect: false, plans: [], isAlertOnly: true 
    });
  };

  const closeConfirmModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setDaysInput('');
    setPlanInput('');
  };

  // ----- ACTION HANDLERS -----

  const handleAction = async (action: 'suspend' | 'reactivate' | 'cancel' | 'delete') => {
    if (!selectedTenant) return;
    const tenantId = selectedTenant.id;
    const actionNames = { suspend: 'suspender', reactivate: 'reativar', cancel: 'cancelar', delete: 'EXCLUIR PERMANENTEMENTE' };
    
    openConfirmModal(
      `Confirmar Ação`,
      `Tem certeza que deseja ${actionNames[action]} esta loja?${action === 'delete' ? ' Esta ação não pode ser desfeita.' : ''}`,
      'Confirmar',
      async () => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const res = await apiFetch(
            action === 'delete' ? `/api/master/tenants/${tenantId}` : `/api/master/tenants/${tenantId}/${action}`,
            { method: action === 'delete' ? 'DELETE' : 'POST' }
          );
          if (res.ok) {
            if (action === 'delete') setSelectedTenant(null);
            fetchTenants();
            showToast(`Ação realizada com sucesso!`, 'success');
          } else {
            const err = await res.json().catch(() => ({}));
            openAlertModal("Ops!", err.error || "Erro ao realizar ação na API.", true);
          }
        } catch (error: any) {
          openAlertModal("Ops!", error.message || "Erro de conexão ao realizar ação.", true);
        } finally {
          setActionLoading(false);
        }
      },
      action === 'cancel' || action === 'suspend' || action === 'delete'
    );
  };

  const handleLifetime = async () => {
    if (!selectedTenant) return;
    const tenantId = selectedTenant.id;
    
    openConfirmModal(
      'Acesso Liberado / Vitalício',
      'Tem certeza que deseja dar acesso liberado a esta loja? Ela não será mais cobrada.',
      'Liberar Acesso',
      async (days?: string) => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const body = days ? JSON.stringify({ days: parseInt(days) }) : undefined;
          const res = await apiFetch(`/api/master/tenants/${tenantId}/lifetime`, { 
            method: 'POST',
            body
          });
          if (res.ok) {
            fetchTenants();
            showToast('Acesso liberado com sucesso!', 'success');
          } else {
            const err = await res.json().catch(() => ({}));
            openAlertModal("Ops!", err.error || "Erro ao aplicar acesso vitalício na API.", true);
          }
        } catch (error: any) {
          openAlertModal("Ops!", error.message || "Erro de conexão ao aplicar acesso vitalício.", true);
        } finally {
          setActionLoading(false);
        }
      },
      false,
      true
    );
  };

  const handleRevokeLifetime = async () => {
    if (!selectedTenant) return;
    const tenantId = selectedTenant.id;
    
    openConfirmModal(
      'Revogar Acesso',
      'Tem certeza que deseja revogar o acesso liberado desta loja? Ela voltará a ser cobrada nas próximas faturas.',
      'Revogar',
      async () => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const res = await apiFetch(`/api/master/tenants/${tenantId}/revoke-lifetime`, { method: 'POST' });
          if (res.ok) {
            fetchTenants();
            showToast('Acesso revogado com sucesso!', 'success');
          } else {
            const err = await res.json().catch(() => ({}));
            openAlertModal("Ops!", err.error || "Erro ao revogar acesso na API.", true);
          }
        } catch (error: any) {
          openAlertModal("Ops!", error.message || "Erro de conexão ao revogar acesso.", true);
        } finally {
          setActionLoading(false);
        }
      },
      true // isDestructive
    );
  };

  const handleImpersonate = async () => {
    if (!selectedTenant) return;
    const tenantId = selectedTenant.id;

    openConfirmModal(
      'Entrar como Loja',
      'Você entrará no painel como administrador desta loja. Deseja continuar?',
      'Entrar Agora',
      async () => {
        closeConfirmModal();
        try {
          const res = await apiFetch(`/api/master/tenants/${tenantId}/impersonate`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            const authData = JSON.parse(localStorage.getItem('painel-auth-storage') || '{}');
            if (authData.state) {
              localStorage.setItem('painel-master-impersonate', JSON.stringify({
                token: authData.state.token,
                user: authData.state.user
              }));
              
              authData.state.token = data.token;
              authData.state.tenant = data.tenant;
              authData.state.user = { ...authData.state.user, role: 'OWNER' };
              localStorage.setItem('painel-auth-storage', JSON.stringify(authData));
              window.location.href = '/';
            }
          } else {
            const err = await res.json().catch(() => ({}));
            openAlertModal("Ops!", err.error || "Erro ao impersonar loja na API.", true);
          }
        } catch (error: any) {
          openAlertModal("Ops!", error.message || "Erro de conexão ao impersonar loja.", true);
        }
      }
    );
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
              <option value="LIFETIME">Vitalício</option>
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
                            {t.logoUrl ? (
                              <img src={t.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Store className="w-5 h-5 text-stone-400" />
                            )}
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
                          <span className="font-medium text-stone-700">
                            {t.subscriptionStatus === 'LIFETIME' ? 'Vitalício/Liberado' : (t.subscriptions?.[0]?.plan?.name || 'Nenhum Plano')}
                          </span>
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
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTenant(null)}
          ></div>
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 transform transition-transform animate-in slide-in-from-right overflow-hidden">
            
            {/* Drawer Header */}
            <div className="px-6 py-6 border-b border-stone-100 flex items-start justify-between bg-stone-50/80">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedTenant.logoUrl ? (
                    <img src={selectedTenant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-7 h-7 text-brand-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900 leading-tight">{selectedTenant.name}</h2>
                  <div className="text-sm text-brand-600 hover:underline font-medium mt-1">
                    <a href={`https://pixelfood-app.vercel.app/${selectedTenant.slug}`} target="_blank" rel="noreferrer">
                      /{selectedTenant.slug}
                    </a>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors bg-white border border-stone-200 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-stone-50/30">
              
              {/* Status & Plan */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Assinatura e Status</h3>
                <div className="flex items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <div>
                    <div className="text-xs text-stone-500 font-semibold mb-2">Status</div>
                    {getStatusBadge(selectedTenant.subscriptionStatus)}
                  </div>
                  <div className="w-px h-10 bg-stone-200 mx-2"></div>
                  <div>
                    <div className="text-xs text-stone-500 font-semibold mb-1">Plano Vigente</div>
                    <div className="font-bold text-stone-900">
                      {selectedTenant.subscriptionStatus === 'LIFETIME' ? 'Acesso Vitalício / Liberado' : (selectedTenant.subscriptions?.[0]?.plan?.name || 'Nenhum plano atribuído')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações da Loja */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Informações da Loja</h3>
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm divide-y divide-stone-100">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-stone-600">
                      <Mail className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-medium">E-mail</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{selectedTenant.email}</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-stone-600">
                      <Phone className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-medium">Telefone</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{selectedTenant.phone || 'Não informado'}</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-stone-600">
                      <CreditCard className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-medium">Documento</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{selectedTenant.cpfCnpj || 'Não informado'}</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-stone-600">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-medium">Data de Cadastro</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900">{new Date(selectedTenant.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              {/* Configurações Atuais */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Configurações Operacionais</h3>
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-stone-500 mb-1">Operação do App</div>
                    <div className="font-semibold text-stone-900 flex items-center gap-2">
                      {selectedTenant.operationalStatus === 'OPEN' ? (
                        <><span className="w-2 h-2 rounded-full bg-green-500"></span>Aberta</>
                      ) : (
                        <><span className="w-2 h-2 rounded-full bg-red-500"></span>Fechada</>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-500 mb-1">Cor do Tema</div>
                    <div className="font-semibold text-stone-900 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-stone-200" style={{ backgroundColor: selectedTenant.settings?.primaryColor || '#22c55e' }} />
                      {selectedTenant.settings?.primaryColor || '#22c55e'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CRM Actions */}
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Ações Administrativas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Botão de Entrar (Impersonate) */}
                  <button 
                    onClick={handleImpersonate}
                    className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 transition-colors group shadow-sm"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="text-sm font-bold">Entrar como Loja</span>
                  </button>
                  
                  {/* Botão Vitalício */}
                  {selectedTenant.subscriptionStatus !== 'LIFETIME' ? (
                    <button 
                      onClick={handleLifetime}
                      disabled={actionLoading}
                      className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      <Star className="w-5 h-5" />
                      <span className="text-sm font-bold">Tornar Vitalício</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleRevokeLifetime}
                      disabled={actionLoading}
                      className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
                    >
                      <Ban className="w-5 h-5" />
                      <span className="text-sm font-bold">Revogar Vitalício</span>
                    </button>
                  )}

                  {/* Suspender/Reativar */}
                  {selectedTenant.subscriptionStatus === 'SUSPENDED' ? (
                    <button 
                      onClick={() => handleAction('reactivate')}
                      disabled={actionLoading}
                      className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-5 h-5" />
                      <span className="text-sm font-bold">Reativar Loja</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAction('suspend')}
                      disabled={actionLoading}
                      className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                    >
                      <PauseCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">Suspender Loja</span>
                    </button>
                  )}

                  {/* Cancelar Assinatura */}
                  <button 
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading}
                    className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-5 h-5" />
                    <span className="text-sm font-bold">Cancelar Assinatura</span>
                  </button>

                  {/* Excluir Loja */}
                  <button 
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                    className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 sm:col-span-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">Excluir Conta Permanentemente</span>
                  </button>

                </div>

                {/* Link para página completa (para logs/usuarios) */}
                <div className="mt-4 text-center">
                  <Link 
                    href={`/master/lojas/${selectedTenant.id}`}
                    className="inline-flex items-center justify-center text-sm font-semibold text-stone-500 hover:text-brand-600 transition-colors"
                  >
                    Acessar Logs e Histórico Completo &rarr;
                  </Link>
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

      {/* Confirm Modal (CRM Actions) */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${modalState.isDestructive ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
                  {modalState.isDestructive ? <AlertCircle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                </div>
                <button onClick={closeConfirmModal} className="text-stone-400 hover:text-stone-600 p-2 rounded-full hover:bg-stone-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">{modalState.title}</h3>
              <p className="text-stone-500 leading-relaxed text-sm">{modalState.description}</p>
              
              {modalState.showDaysInput && (
                <div className="mt-5">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Duração (em dias)</label>
                  <input 
                    type="number" 
                    value={daysInput}
                    onChange={e => setDaysInput(e.target.value)}
                    placeholder="Ex: 30 (deixe em branco para acesso vitalício)"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-stone-700 font-medium transition-all"
                  />
                  <p className="text-xs text-stone-400 mt-2 font-medium">
                    Se você preencher, o acesso será revogado automaticamente após os dias informados.
                  </p>
                </div>
              )}

              {modalState.showPlanSelect && (
                <div className="mt-5">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Selecione o Plano</label>
                  <select 
                    value={planInput}
                    onChange={e => setPlanInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-3 text-stone-700 font-medium transition-all"
                  >
                    {modalState.plans?.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(p.priceCents/100)}/{p.billingCycle}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
              {!modalState.isAlertOnly && (
                <button 
                  onClick={closeConfirmModal}
                  className="px-5 py-2.5 text-stone-600 font-semibold hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => modalState.onConfirm(modalState.showDaysInput ? daysInput : modalState.showPlanSelect ? planInput : undefined)}
                disabled={actionLoading}
                className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 ${
                  modalState.isDestructive 
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/20' 
                    : 'bg-brand-600 hover:bg-brand-700 hover:shadow-brand-500/20'
                } disabled:opacity-50 disabled:hover:translate-y-0`}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
