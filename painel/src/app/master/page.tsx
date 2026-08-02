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
interface SaaSStore {
  id: string;
  name: string;
  email: string;
  slug: string;
  isMaster: boolean;
  active: boolean;
  createdAt: string;
  storeName: string;
  ordersCount: number;
  totalRevenue: number;
}

export default function MasterAdminPage() {
  const [stores, setStores] = useState<SaaSStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadStores = async () => {
    try {
      const data = await apiFetch("/master/restaurants");
      setStores(data);
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
      await apiFetch(`/master/restaurants/${id}/toggle`, { method: "POST" });
      loadStores();
    } catch (error) {
      alert("Erro ao alterar status");
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Total de Lojas</p>
              <h3 className="text-2xl font-bold text-stone-900">{totalStores}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Faturamento Global</p>
              <h3 className="text-2xl font-bold text-stone-900">{formatCurrency(globalRevenue)}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Lojas Ativas</p>
              <h3 className="text-2xl font-bold text-stone-900">{activeStores}</h3>
            </div>
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
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Faturamento</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Status</th>
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
                      <p className="font-bold text-stone-900">{formatCurrency(store.totalRevenue)}</p>
                      <p className="text-xs text-stone-500">{store.ordersCount} pedidos</p>
                    </td>
                    <td className="px-6 py-4">
                      {store.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                          <Ban className="w-3.5 h-3.5" />
                          Bloqueada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!store.isMaster && (
                        <button
                          onClick={() => toggleStatus(store.id, store.isMaster)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                            store.active 
                              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                              : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                          }`}
                        >
                          {store.active ? 'Bloquear' : 'Desbloquear'}
                        </button>
                      )}
                      {store.isMaster && (
                        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-lg">
                          MASTER
                        </span>
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
