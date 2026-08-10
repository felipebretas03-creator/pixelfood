"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Store, 
  Loader2, 
  Filter
} from "lucide-react";

export default function LojasMaster() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTenants();
  }, [search, status, page]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Lojas ({total})</h1>
          <p className="text-sm text-stone-500 mt-1">Gerencie todos os restaurantes cadastrados.</p>
        </div>
        <button className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-brand-500/20 flex items-center justify-center gap-2">
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
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-48 shrink-0 flex items-center">
          <Filter className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none font-medium text-stone-700"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="TRIALING">Trial</option>
            <option value="PAST_DUE">Inadimplentes</option>
            <option value="SUSPENDED">Suspensas</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Loja</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Cadastro</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5 text-stone-500" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 group-hover:text-brand-600 transition-colors">{t.name}</div>
                          <div className="text-xs text-stone-500">{t.cpfCnpj || 'Sem CNPJ'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{t.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        t.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        t.subscriptionStatus === 'TRIALING' ? 'bg-purple-100 text-purple-700' :
                        t.subscriptionStatus === 'PAST_DUE' ? 'bg-orange-100 text-orange-700' :
                        t.subscriptionStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {t.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.subscriptions?.[0]?.plan?.name || 'Nenhum'}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/master/lojas/${t.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        {total > 20 && (
          <div className="p-4 border-t border-stone-200 flex justify-between items-center">
            <span className="text-sm text-stone-500">Mostrando {(page-1)*20 + 1} a {Math.min(page*20, total)} de {total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 border border-stone-200 rounded text-sm disabled:opacity-50 hover:bg-stone-50">Anterior</button>
              <button disabled={page*20 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1 border border-stone-200 rounded text-sm disabled:opacity-50 hover:bg-stone-50">Próximo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
