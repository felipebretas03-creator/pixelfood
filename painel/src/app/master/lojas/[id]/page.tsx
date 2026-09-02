"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { 
  Store, 
  ArrowLeft,
  Play,
  PauseCircle,
  Ban,
  LogIn,
  Loader2,
  Calendar,
  CreditCard,
  Users,
  Activity,
  Shield,
  Star,
  X,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

const formatActionName = (action: string) => {
  const map: Record<string, string> = {
    'PLAN_CHANGED': 'Alteração de Plano',
    'IMPERSONATION_STARTED': 'Acesso Administrativo',
    'STORE_SUSPENDED': 'Loja Suspensa',
    'STORE_REACTIVATED': 'Loja Reativada',
    'STORE_CANCELED': 'Assinatura Cancelada'
  };
  return map[action] || action;
};

const formatLogMetadata = (action: string, metadataStr: string) => {
  try {
    const data = JSON.parse(metadataStr);
    
    switch (action) {
      case 'PLAN_CHANGED':
        return (
          <div className="space-y-1">
            <p><span className="font-semibold text-stone-700">Novo Plano:</span> {data.newPlan === 'ACTIVE' ? 'Ativo' : data.newPlan === 'LIFETIME' ? 'Vitalício/Liberado' : data.newPlan}</p>
            {data.days && <p><span className="font-semibold text-stone-700">Duração:</span> {data.days === 'infinity' ? 'Sem validade (Vitalício)' : `${data.days} dias`}</p>}
            {data.reason && <p><span className="font-semibold text-stone-700">Motivo:</span> {data.reason === 'Lifetime access revoked by master' ? 'Acesso vitalício revogado' : data.reason}</p>}
          </div>
        );
      case 'IMPERSONATION_STARTED':
        return <p><span className="font-semibold text-stone-700">IP de Acesso:</span> {data.ip}</p>;
      case 'STORE_SUSPENDED':
      case 'STORE_REACTIVATED':
        return data.reason ? <p><span className="font-semibold text-stone-700">Motivo:</span> {data.reason}</p> : <p className="text-stone-400 italic">Sem motivo informado</p>;
      default:
        return (
          <div className="space-y-1">
            {Object.entries(data).map(([key, value]) => (
              <p key={key}><span className="font-semibold text-stone-700 capitalize">{key}:</span> {String(value)}</p>
            ))}
          </div>
        );
    }
  } catch (e) {
    return <p>{metadataStr}</p>;
  }
};

export default function LojaDetalhes() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [actionLoading, setActionLoading] = useState(false);
  const [daysInput, setDaysInput] = useState('');
  const [planInput, setPlanInput] = useState('');
  const [activity, setActivity] = useState<{ orders: any[], logs: any[] } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  // Edit Tenant State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', cpfCnpj: '', phone: '' });
  
  // Custom Modal State
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

  const openConfirmModal = (title: string, description: string, confirmText: string, onConfirm: (data?: any) => void, isDestructive = false, showDaysInput = false, showPlanSelect = false, plans: any[] = []) => {
    setModalState({ isOpen: true, title, description, confirmText, onConfirm, isDestructive, showDaysInput, showPlanSelect, plans, isAlertOnly: false });
    setDaysInput('');
    if (plans.length > 0) setPlanInput(plans[0].id);
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

  useEffect(() => {
    fetchTenant();
    fetchActivity();
    fetchPlans();
  }, [id]);

  const fetchPlans = async () => {
    try {
      const res = await apiFetch(`/api/master/plans`);
      if (res.ok) setPlans(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchActivity = async () => {
    try {
      const res = await apiFetch(`/api/master/tenants/${id}/activity`);
      if (res.ok) setActivity(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTenant = async () => {
    try {
      const res = await apiFetch(`/api/master/tenants/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
        setEditForm({ name: data.name, email: data.email, cpfCnpj: data.cpfCnpj || '', phone: data.phone || '' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/master/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        fetchTenant();
        setIsEditModalOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        openAlertModal("Ops!", err.error || "Erro ao atualizar loja.", true);
      }
    } catch (error: any) {
      openAlertModal("Ops!", error.message || "Erro de conexão.", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action: 'suspend' | 'reactivate' | 'cancel') => {
    const actionNames = { suspend: 'suspender', reactivate: 'reativar', cancel: 'cancelar' };
    openConfirmModal(
      `Confirmar Ação`,
      `Tem certeza que deseja ${actionNames[action]} esta loja?`,
      'Confirmar',
      async () => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const res = await apiFetch(`/api/master/tenants/${id}/${action}`, { method: 'POST' });
          if (res.ok) {
            fetchTenant();
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
      action === 'cancel' || action === 'suspend'
    );
  };

  const handleLifetime = async () => {
    openConfirmModal(
      'Acesso Liberado / Vitalício',
      'Tem certeza que deseja dar acesso liberado a esta loja? Ela não será mais cobrada.',
      'Liberar Acesso',
      async (days?: string) => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const body = days ? JSON.stringify({ days: parseInt(days) }) : undefined;
          const res = await apiFetch(`/api/master/tenants/${id}/lifetime`, { 
            method: 'POST',
            body
          });
          if (res.ok) {
            fetchTenant();
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
    openConfirmModal(
      'Revogar Acesso',
      'Tem certeza que deseja revogar o acesso liberado desta loja? Ela voltará a ser cobrada nas próximas faturas.',
      'Revogar',
      async () => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const res = await apiFetch(`/api/master/tenants/${id}/revoke-lifetime`, { method: 'POST' });
          if (res.ok) {
            fetchTenant();
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

  const handleManualSubscription = () => {
    if (plans.length === 0) {
      openAlertModal("Ops!", "Nenhum plano cadastrado no sistema.", true);
      return;
    }
    openConfirmModal(
      'Assinatura Manual',
      'Selecione o plano que deseja atribuir manualmente para esta loja. Ela ficará ativa e você pode gerenciar a cobrança por fora.',
      'Atribuir Plano',
      async (planId?: string) => {
        if (!planId) {
          openAlertModal("Ops!", "Selecione um plano válido.", true);
          return;
        }
        closeConfirmModal();
        setActionLoading(true);
        try {
          const res = await apiFetch(`/api/master/tenants/${id}/manual-subscription`, {
            method: 'POST',
            body: JSON.stringify({ planId })
          });
          if (res.ok) fetchTenant();
          else {
            const err = await res.json().catch(() => ({}));
            openAlertModal("Ops!", err.error || "Erro ao atribuir assinatura manual na API.", true);
          }
        } catch (e: any) {
          openAlertModal("Ops!", e.message || "Erro de conexão.", true);
        } finally {
          setActionLoading(false);
        }
      },
      false, // isDestructive
      false, // showDaysInput
      true,  // showPlanSelect
      plans  // plans
    );
  };

  const handleImpersonate = async () => {
    openConfirmModal(
      'Entrar como Loja',
      'Você entrará no painel como administrador desta loja. Deseja continuar?',
      'Entrar Agora',
      async () => {
        closeConfirmModal();
        try {
          const res = await apiFetch(`/api/master/tenants/${id}/impersonate`, { method: 'POST' });
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
        } finally { }
      }
    );
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-brand-500" /></div>;
  if (!tenant) return <div className="text-center p-12">Loja não encontrada.</div>;

  const sub = tenant.subscriptions?.[0];

  return (
    <div className="space-y-6">
      <Link href="/master/lojas" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Lojas
      </Link>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Store className="w-8 h-8 text-stone-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3">
              {tenant.name}
              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                tenant.subscriptionStatus === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                tenant.subscriptionStatus === 'LIFETIME' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                tenant.subscriptionStatus === 'TRIALING' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                tenant.subscriptionStatus === 'SUSPENDED' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-stone-50 text-stone-700 border-stone-200'
              }`}>
                {tenant.subscriptionStatus}
              </span>
            </h1>
            <p className="text-stone-500">{tenant.email} • {tenant.cpfCnpj || 'Sem documento'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleImpersonate}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" /> Entrar como Loja
          </button>

          {tenant.subscriptionStatus !== 'LIFETIME' ? (
            <button 
              onClick={handleLifetime}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Star className="w-4 h-4" /> Tornar Vitalício
            </button>
          ) : (
            <button 
              onClick={handleRevokeLifetime}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Revogar Vitalício
            </button>
          )}
          
          {tenant.subscriptionStatus === 'SUSPENDED' ? (
            <button 
              onClick={() => handleAction('reactivate')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Reativar
            </button>
          ) : (
            <button 
              onClick={() => handleAction('suspend')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <PauseCircle className="w-4 h-4" /> Suspender
            </button>
          )}

          <button 
            onClick={() => handleAction('cancel')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            <Ban className="w-4 h-4" /> Cancelar Assinatura
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-stone-200">
        {[
          { id: 'visao-geral', label: 'Visão Geral', icon: Store },
          { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
          { id: 'usuarios', label: 'Usuários', icon: Users },
          { id: 'atividade', label: 'Atividade', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-4 px-2 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'text-brand-600 border-brand-500' 
                : 'text-stone-500 border-transparent hover:text-stone-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        {activeTab === 'visao-geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-bold text-lg text-stone-900">Dados da Empresa</h3>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold transition-colors"
                >
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-stone-500 font-medium">Nome</span>
                <span className="col-span-2 font-semibold text-stone-900">{tenant.name}</span>
                
                <span className="text-stone-500 font-medium">Documento</span>
                <span className="col-span-2 font-semibold text-stone-900">{tenant.cpfCnpj || '-'}</span>
                
                <span className="text-stone-500 font-medium">E-mail</span>
                <span className="col-span-2 font-semibold text-stone-900">{tenant.email}</span>
                
                <span className="text-stone-500 font-medium">Telefone</span>
                <span className="col-span-2 font-semibold text-stone-900">{tenant.phone || '-'}</span>
                
                <span className="text-stone-500 font-medium">Cadastro</span>
                <span className="col-span-2 font-semibold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2">Configurações Atuais</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-stone-500 font-medium">Operação</span>
                <span className="col-span-2 font-semibold text-stone-900">{tenant.operationalStatus === 'OPEN' ? '🟢 Aberta' : '🔴 Fechada'}</span>
                
                <span className="text-stone-500 font-medium">Tema</span>
                <span className="col-span-2 font-semibold text-stone-900 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tenant.settings?.primaryColor || '#22c55e' }} />
                  {tenant.settings?.primaryColor || '#22c55e'}
                </span>
                
                <span className="text-stone-500 font-medium">URL</span>
                <span className="col-span-2 text-brand-600 font-semibold truncate hover:underline">
                  <a href={`https://pixelfood-app.vercel.app/${tenant.slug}`} target="_blank" rel="noreferrer">
                    /{tenant.slug}
                  </a>
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assinatura' && (
          <div className="space-y-6">
            {tenant.subscriptionStatus === 'LIFETIME' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2">Plano Vigente</h3>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 text-indigo-500/10">
                      <Star className="w-32 h-32" />
                    </div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Acesso Especial</div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-indigo-100 text-indigo-700">Ativo</span>
                      </div>
                      <div className="text-3xl font-black text-stone-900 mb-2">Vitalício / Liberado</div>
                      
                      {tenant.lifetimeExpiresAt ? (() => {
                        const daysLeft = Math.ceil((new Date(tenant.lifetimeExpiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        return (
                          <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100/50 flex justify-between items-center">
                            <div>
                              <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Validade Restante</div>
                              <div className={`text-2xl font-black ${daysLeft <= 3 ? 'text-red-500' : 'text-indigo-600'}`}>
                                {daysLeft > 0 ? `${daysLeft} dias` : 'Expirado'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Data Exata</div>
                              <div className="text-sm font-semibold text-stone-700">
                                {new Date(tenant.lifetimeExpiresAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100/50">
                          <p className="text-sm text-stone-600 font-medium">
                            Este acesso <strong className="text-indigo-600">não possui data de expiração</strong> e não gerará cobranças automáticas para esta loja.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : !sub ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2">Plano Vigente</h3>
                  <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-stone-500 mb-4 font-medium">Nenhuma assinatura cadastrada para esta loja.</p>
                    <button 
                      onClick={handleManualSubscription}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Adicionar Assinatura Manual
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h3 className="font-bold text-lg text-stone-900">Plano Vigente</h3>
                    <button 
                      onClick={handleManualSubscription}
                      className="text-xs px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold transition-colors"
                    >
                      Trocar Plano
                    </button>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-1">{sub.plan?.name || 'Customizado'}</div>
                    <div className="text-3xl font-black text-stone-900 mb-4">
                      {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format((sub.plan?.priceCents || 0)/100)}
                      <span className="text-sm text-stone-500 font-medium">/mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-600">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{sub.status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2">Informações Técnicas</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm font-mono bg-stone-900 text-stone-300 p-4 rounded-xl">
                    <div>
                      <span className="text-stone-500 block text-xs">Customer ID (Asaas)</span>
                      <span className="text-emerald-400 break-all">{sub.providerCustomerId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-xs">Subscription ID (Asaas)</span>
                      <span className="text-blue-400 break-all">{sub.providerSubscriptionId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-xs">Próxima Cobrança</span>
                      <span className="text-stone-100">
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tenant.memberships?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-900">{m.user?.name}</td>
                    <td className="px-4 py-3">{m.user?.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-stone-200 text-stone-700 rounded text-xs font-bold">{m.role}</span>
                    </td>
                    <td className="px-4 py-3">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'atividade' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-stone-400" /> 
                Últimas Ações (Logs)
              </h3>
              {!activity ? (
                <div className="text-center py-8 text-stone-400 animate-pulse">Carregando atividades...</div>
              ) : activity.logs.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm">Nenhum log registrado recentemente.</div>
              ) : (
                <div className="space-y-3">
                  {activity.logs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-stone-700 bg-stone-200 px-2 py-0.5 rounded text-xs">{formatActionName(log.action)}</span>
                        <span className="text-stone-400 text-xs">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      {log.metadata && (
                        <div className="text-stone-600 mt-2 text-sm bg-white p-3 border border-stone-100 rounded-lg shadow-sm">
                          {formatLogMetadata(log.action, log.metadata)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Store className="w-5 h-5 text-stone-400" />
                Últimos Pedidos
              </h3>
              {!activity ? (
                <div className="text-center py-8 text-stone-400 animate-pulse">Carregando pedidos...</div>
              ) : activity.orders.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm">Nenhum pedido realizado recentemente.</div>
              ) : (
                <div className="space-y-3">
                  {activity.orders.map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center p-3 border border-stone-200 rounded-lg bg-white hover:bg-stone-50 transition-colors">
                      <div>
                        <div className="font-bold text-stone-900">
                          #{order.orderNumber} <span className="text-stone-400 font-normal ml-2">{order.customer?.name || 'Cliente'}</span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1">
                          {new Date(order.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-600">
                          {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(order.totalCents / 100)}
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 uppercase">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Confirm Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
              <p className="text-stone-500 leading-relaxed">{modalState.description}</p>
              
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
                className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 ${
                  modalState.isDestructive 
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/20' 
                    : 'bg-brand-600 hover:bg-brand-700 hover:shadow-brand-500/20'
                }`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h2 className="text-lg font-black text-stone-900">Editar Loja</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Nome da Empresa</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition-all font-medium text-stone-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition-all font-medium text-stone-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">CPF ou CNPJ</label>
                <input 
                  type="text" 
                  value={editForm.cpfCnpj}
                  onChange={e => setEditForm({...editForm, cpfCnpj: e.target.value})}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition-all font-medium text-stone-800"
                  placeholder="Somente números"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">WhatsApp / Telefone</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 transition-all font-medium text-stone-800"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
