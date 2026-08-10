"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  Store, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  DollarSign, 
  Loader2 
} from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function MasterDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/api/master/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-bold text-stone-700">Erro ao carregar os dados</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Visão Geral da Plataforma</h1>
          <p className="text-sm text-stone-500 mt-1">Métricas de crescimento e faturamento do PixelFood.</p>
        </div>
      </div>

      {/* Métricas Principais (Tenants) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Total de Lojas</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">{data.totalTenants}</span>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Novas Lojas <span className="text-[10px]">(30D)</span></span>
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">{data.newTenants}</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Em Trial</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">{data.inTrial}</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Ativas</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">{data.active}</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Vencendo</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">{data.pastDue}</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Inadimplentes</span>
          </div>
          <span className="text-3xl font-black tracking-tight text-stone-900">{data.pastDue}</span>
        </div>
      </div>

      <div className="pt-6">
        <h2 className="text-lg font-bold text-stone-900 mb-4 tracking-tight">Métricas Financeiras SaaS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-6 text-white shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-stone-300 font-semibold mb-2 uppercase text-sm tracking-widest">
                <DollarSign className="w-4 h-4" />
                MRR (Receita Recorrente)
              </div>
              <div className="text-4xl font-black tracking-tight mt-1">{formatCurrency(data.mrr)}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-stone-500 font-semibold mb-2 uppercase text-sm tracking-widest">
              Cancelamentos (Churn)
            </div>
            <div className="text-3xl font-black tracking-tight text-stone-900">0</div>
            <p className="text-xs text-stone-400 mt-2 font-medium">Lojas que cancelaram neste mês.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
