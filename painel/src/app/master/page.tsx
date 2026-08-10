"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ShieldAlert, Store, TrendingUp, Users, Search, Ban, CheckCircle, X, Loader2, Send } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
interface DashboardMetrics {
  totalUsers: number;
  newUsers: number;
  defaulters: number;
  expiringSoon: number;
  activeSubs: number;
  trials: number;
}

interface SaaSStore {
  id: string;
  name: string;
  email: string;
  slug: string;
  isMaster: boolean;
  active: boolean;
  createdAt: string;
  planName: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  ordersCount: number;
  totalRevenue: number;
}

export default function MasterAdminPage() {
  const [stores, setStores] = useState<SaaSStore[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedStore, setSelectedStore] = useState<SaaSStore | null>(null);
  const [billingPlan, setBillingPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [billingValue, setBillingValue] = useState<string>('97.00');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastSubject || !broadcastMessage) {
      alert("Preencha o assunto e a mensagem.");
      return;
    }
    setIsSendingBroadcast(true);
    try {
      const res = await apiFetch(`http://localhost:4000/api/master/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: broadcastSubject, message: broadcastMessage })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao enviar comunicados");
        return;
      }
      alert(`Comunicado enviado com sucesso para ${data.count} restaurantes!`);
      setIsBroadcastOpen(false);
      setBroadcastSubject("");
      setBroadcastMessage("");
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleGenerateSubscription = async () => {
    if (!selectedStore) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch(`http://localhost:4000/api/master/restaurants/${selectedStore.id}/asaas-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle: billingPlan, value: parseFloat(billingValue) })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao gerar assinatura");
        return;
      }
      alert("Assinatura criada com sucesso no Asaas! O cliente receberá a fatura por e-mail.");
      setSelectedStore(null);
      loadStores();
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadStores = async () => {
    try {
      const res = await apiFetch("http://localhost:4000/api/master/restaurants");
      const data = await res.json();
      setStores(data.stores || []);
      setMetrics(data.metrics || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const toggleStatus = async (id: string, isMaster: boolean) => {
    if (isMaster) return alert("Não é possível bloquear a conta Master.");
    if (!confirm("Tem certeza que deseja alterar o status desta conta?")) return;

    try {
      await apiFetch(`http://localhost:4000/api/master/restaurants/${id}/toggle`, { method: "POST" });
      loadStores();
    } catch (error) {
      alert("Erro ao alterar status");
    }
  };

  const filteredStores = stores.filter(s => 
    !s.isMaster &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.active).length;
  const globalRevenue = stores.reduce((acc, s) => acc + s.totalRevenue, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-0">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              PixelFood Admin
            </h1>
            <p className="text-stone-500 mt-1">Visão global de todos os restaurantes do SaaS.</p>
          </div>
          <button 
            onClick={() => setIsBroadcastOpen(true)}
            className="bg-brand-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-600 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar Comunicado
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Total de Usuários</p>
            <h3 className="text-3xl font-black text-stone-900 mt-2">{metrics?.totalUsers || 0}</h3>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Novos (30 dias)</p>
            <h3 className="text-3xl font-black text-brand-600 mt-2">+{metrics?.newUsers || 0}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Em Trial</p>
            <h3 className="text-3xl font-black text-stone-900 mt-2">{metrics?.trials || 0}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Assinantes Ativos</p>
            <h3 className="text-3xl font-black text-green-600 mt-2">{metrics?.activeSubs || 0}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Prestes a Vencer</p>
            <h3 className="text-3xl font-black text-yellow-600 mt-2">{metrics?.expiringSoon || 0}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Inadimplentes</p>
            <h3 className="text-3xl font-black text-red-600 mt-2">{metrics?.defaulters || 0}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar loja por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Loja</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">E-mail de Acesso</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Assinatura</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Faturamento</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStores.map(store => (
                  <tr key={store.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center font-bold">
                          {store.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{store.name}</p>
                          <p className="text-xs text-stone-500">/{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">{store.email}</td>
                    <td className="px-6 py-4">
                      {store.isMaster ? (
                        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-lg">MASTER</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            {store.subscriptionStatus === 'ACTIVE' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">ATIVO</span>}
                            {store.subscriptionStatus === 'TRIAL' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">TRIAL</span>}
                            {store.subscriptionStatus === 'PAST_DUE' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">VENCIDO</span>}
                            {store.subscriptionStatus === 'CANCELED' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">CANCELADO</span>}
                            <span className="text-xs font-bold text-stone-700">{store.planName}</span>
                          </div>
                          {store.subscriptionExpiresAt && (
                            <span className="text-xs text-stone-500">
                              Vence em: {new Date(store.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-900">{formatCurrency(store.totalRevenue)}</p>
                      <p className="text-xs text-stone-500">{store.ordersCount} pedidos</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!store.isMaster && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStore(store)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                          >
                            Cobrar
                          </button>
                          <button
                            onClick={() => toggleStatus(store.id, store.isMaster)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                              store.active 
                                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                            }`}
                          >
                            {store.active ? 'Bloquear' : 'Desbloquear'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filteredStores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                      Nenhuma loja encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

      {/* Modal Cobrança Asaas */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl flex flex-col gap-6 relative">
            <button onClick={() => setSelectedStore(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-black text-stone-900">Gerar Assinatura</h2>
              <p className="text-sm text-stone-500 mt-1">Loja: {selectedStore.name} ({selectedStore.email})</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ciclo de Cobrança</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setBillingPlan('MONTHLY')}
                    className={`py-2 px-4 rounded-xl text-sm font-bold border transition-colors ${billingPlan === 'MONTHLY' ? 'bg-brand-50 border-brand-500 text-brand-600' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
                  >
                    Mensal
                  </button>
                  <button 
                    onClick={() => setBillingPlan('YEARLY')}
                    className={`py-2 px-4 rounded-xl text-sm font-bold border transition-colors ${billingPlan === 'YEARLY' ? 'bg-brand-50 border-brand-500 text-brand-600' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
                  >
                    Anual
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Valor (R$)</label>
                <input 
                  type="number" 
                  value={billingValue}
                  onChange={(e) => setBillingValue(e.target.value)}
                  step="0.01"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleGenerateSubscription}
              disabled={isGenerating}
              className="w-full bg-brand-500 text-white rounded-xl py-3 font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isGenerating ? 'Processando...' : 'Confirmar e Cobrar (Asaas)'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Broadcast */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl flex flex-col gap-6 relative">
            <button onClick={() => setIsBroadcastOpen(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-black text-stone-900">Enviar Comunicado</h2>
              <p className="text-sm text-stone-500 mt-1">Isso enviará um e-mail para todos os lojistas ativos.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Assunto do E-mail</label>
                <input 
                  type="text" 
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Ex: Nova atualização disponível!"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Mensagem</label>
                <textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={5}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSendBroadcast}
              disabled={isSendingBroadcast}
              className="w-full bg-brand-500 text-white rounded-xl py-3 font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSendingBroadcast && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSendingBroadcast ? 'Enviando...' : 'Disparar para todos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
