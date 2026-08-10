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

export default function LojaDetalhes() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Custom Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const openConfirmModal = (title: string, description: string, confirmText: string, onConfirm: () => void, isDestructive = false) => {
    setModalState({ isOpen: true, title, description, confirmText, onConfirm, isDestructive });
  };
  const closeConfirmModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const fetchTenant = async () => {
    try {
      const res = await apiFetch(`http://localhost:4000/api/master/tenants/${id}`);
      if (res.ok) setTenant(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
          const res = await apiFetch(`http://localhost:4000/api/master/tenants/${id}/${action}`, { method: 'POST' });
          if (res.ok) {
            fetchTenant();
          } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || "Erro ao realizar ação na API.");
          }
        } catch (error: any) {
          alert(error.message || "Erro de conexão ao realizar ação.");
        } finally {
          setActionLoading(false);
        }
      },
      action === 'cancel' || action === 'suspend'
    );
  };

  const handleLifetime = async () => {
    openConfirmModal(
      'Tornar Vitalício',
      'Tem certeza que deseja dar acesso vitalício a esta loja? Ela não será mais cobrada mensalmente.',
      'Tornar Vitalício',
      async () => {
        closeConfirmModal();
        setActionLoading(true);
        try {
          const res = await apiFetch(`http://localhost:4000/api/master/tenants/${id}/lifetime`, { method: 'POST' });
          if (res.ok) {
            fetchTenant();
          } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || "Erro ao aplicar acesso vitalício na API.");
          }
        } catch (error: any) {
          alert(error.message || "Erro de conexão ao aplicar acesso vitalício.");
        } finally {
          setActionLoading(false);
        }
      }
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
          const res = await apiFetch(`http://localhost:4000/api/master/tenants/${id}/impersonate`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            const authData = JSON.parse(localStorage.getItem('painel-auth-storage') || '{}');
            if (authData.state) {
              authData.state.token = data.token;
              authData.state.tenant = data.tenant;
              authData.state.user = { ...authData.state.user, role: 'OWNER' };
              localStorage.setItem('painel-auth-storage', JSON.stringify(authData));
              window.location.href = '/';
            }
          } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || "Erro ao impersonar loja na API.");
          }
        } catch (error: any) {
          alert(error.message || "Erro de conexão ao impersonar loja.");
        }
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

          {tenant.subscriptionStatus !== 'LIFETIME' && (
            <button 
              onClick={handleLifetime}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Star className="w-4 h-4" /> Tornar Vitalício
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
              <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2">Dados da Empresa</h3>
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
            {!sub ? (
              <p className="text-stone-500 text-center py-8">Nenhuma assinatura cadastrada para esta loja.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-stone-900 border-b border-stone-100 pb-2">Plano Vigente</h3>
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
          <div className="text-center py-12 text-stone-500">
            Aba de atividade em construção. Serão exibidos os últimos pedidos, atualizações de cardápio e logs.
          </div>
        )}

      </div>
    </div>
  );
}
