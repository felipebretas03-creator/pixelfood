"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ShieldAlert, Store, TrendingUp, Users, Search, Ban, CheckCircle } from "lucide-react";

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
              SaaS Admin
            </h1>
            <p className="text-stone-500 mt-1">Visão global de todos os restaurantes do SaaS.</p>
          </div>
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
                            onClick={() => alert('Em breve: Enviar Link da Cakto')}
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
    </div>
  );
}
