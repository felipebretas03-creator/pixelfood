"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  Store, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Ban, 
  DollarSign, 
  Loader2,
  Activity,
  AlertCircle,
  Users
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/api/master/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const text = await res.text();
        setErrorMsg(`Erro API: ${res.status} - ${text}`);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(`Exceção: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] bg-stone-950 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data || errorMsg) {
    return (
      <div className="text-center mt-20 p-10 bg-stone-950 rounded-xl border border-stone-800">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-stone-200">System Error</h2>
        {errorMsg && <p className="text-sm text-red-400 mt-2">{errorMsg}</p>}
      </div>
    );
  }

  const hasAlerts = data.pastDue > 0;

  return (
    <div className="w-full bg-transparent min-h-[calc(100vh-8rem)] text-stone-300 font-mono relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-stone-800 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-brand-500" />
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Master Operations Center</h1>
          </div>
          <p className="text-xs text-stone-500 mt-2 tracking-widest uppercase">System Telemetry & Financials</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4 bg-stone-900/50 px-4 py-2 rounded-lg border border-stone-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs tracking-widest text-emerald-400 font-semibold uppercase">Live System</span>
          </div>
          <div className="w-px h-4 bg-stone-800"></div>
          <div className="text-xs text-stone-400 font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {hasAlerts && (
        <div className="mb-8 bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-start gap-4 relative z-10">
          <div className="mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Alertas Ativos</h3>
            <p className="text-xs text-red-300/80">Existem {data.pastDue} lojas com assinatura vencida que podem ter seus serviços interrompidos. É necessário entrar em contato para regularização.</p>
          </div>
        </div>
      )}

      {/* Nível Estratégico (MRR e Lojas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
        
        {/* MRR Card */}
        <div className="bg-stone-900/40 border border-stone-800/60 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-brand-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex items-center gap-3 text-stone-400 mb-4">
            <div className="p-2 bg-stone-800/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">Monthly Recurring Revenue</span>
          </div>
          <div className="text-5xl font-black text-white tracking-tighter">
            {formatCurrency(data.mrr)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-stone-500 uppercase tracking-widest">Growth:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              STABLE
            </span>
          </div>
        </div>

        {/* Total Lojas Card */}
        <div className="bg-stone-900/40 border border-stone-800/60 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex items-center gap-3 text-stone-400 mb-4">
            <div className="p-2 bg-stone-800/50 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">Total de Lojas Ativas</span>
          </div>
          <div className="text-5xl font-black text-white tracking-tighter">
            {data.active}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
             <span className="text-stone-500 uppercase tracking-widest">Novas (30D):</span>
             <span className="text-blue-400 font-semibold">+{data.newTenants}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
         <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Status Operacional do Ecossistema</h2>
      </div>

      {/* Nível Operacional (Tenants breakdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Total */}
        <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5 hover:bg-stone-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <Store className="w-4 h-4 text-stone-400" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Instâncias</span>
          </div>
          <div className="text-2xl font-black text-stone-200">{data.totalTenants}</div>
        </div>

        {/* Em Trial */}
        <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5 hover:bg-stone-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-purple-400">Em Trial (Avaliação)</span>
          </div>
          <div className="text-2xl font-black text-stone-200">{data.inTrial}</div>
        </div>

        {/* Vencendo / Inadimplente */}
        <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5 hover:bg-stone-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-orange-400">Vencendo</span>
          </div>
          <div className="text-2xl font-black text-stone-200">{data.pastDue}</div>
        </div>

        {/* Cancelados */}
        <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5 hover:bg-stone-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-2 opacity-70">
            <Ban className="w-4 h-4 text-stone-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Cancelamentos</span>
          </div>
          <div className="text-2xl font-black text-stone-400">0</div>
        </div>

      </div>

    </div>
  );
}
