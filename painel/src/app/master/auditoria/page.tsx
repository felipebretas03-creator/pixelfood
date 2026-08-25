"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  Activity, 
  Loader2, 
  Search, 
  Shield, 
  Plus, 
  CreditCard, 
  Megaphone, 
  PauseCircle, 
  Play, 
  Ban, 
  Store,
  Filter,
  User,
  Clock
} from "lucide-react";
import Link from "next/link";

const getActionInfo = (action: string) => {
  switch (action) {
    case 'IMPERSONATION_STARTED': 
      return { label: 'Acesso Administrativo (Login)', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' };
    case 'STORE_CREATED': 
      return { label: 'Criação de nova Loja', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
    case 'PLAN_CHANGED': 
      return { label: 'Alteração de Plano', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
    case 'COMMUNICATION_SENT': 
      return { label: 'Envio de Comunicado', icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
    case 'TENANT_SUSPENDED': 
    case 'STORE_SUSPENDED':
      return { label: 'Suspensão de Loja', icon: PauseCircle, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
    case 'TENANT_REACTIVATED': 
    case 'STORE_REACTIVATED':
      return { label: 'Reativação de Loja', icon: Play, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    case 'TENANT_CANCELED': 
    case 'STORE_CANCELED':
      return { label: 'Cancelamento de Assinatura', icon: Ban, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    default: 
      return { label: action, icon: Activity, color: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200' };
  }
};

const formatLogMetadata = (action: string, metadataStr: string) => {
  try {
    const data = JSON.parse(metadataStr);
    
    switch (action) {
      case 'PLAN_CHANGED':
        return (
          <div className="space-y-1.5 mt-2">
            <p className="flex justify-between items-center bg-white/60 p-2 rounded border border-stone-100 text-sm">
              <span className="text-stone-500 font-medium">Plano Aplicado</span> 
              <span className="font-bold text-stone-900">{data.newPlan === 'ACTIVE' ? 'Ativo' : data.newPlan === 'LIFETIME' ? 'Vitalício/Liberado' : data.newPlan}</span>
            </p>
            {data.days && (
              <p className="flex justify-between items-center bg-white/60 p-2 rounded border border-stone-100 text-sm">
                <span className="text-stone-500 font-medium">Duração</span> 
                <span className="font-bold text-stone-900">{data.days === 'infinity' ? 'Sem validade (Vitalício)' : `${data.days} dias`}</span>
              </p>
            )}
            {data.reason && (
              <p className="flex justify-between items-center bg-white/60 p-2 rounded border border-stone-100 text-sm">
                <span className="text-stone-500 font-medium">Motivo/Ação</span> 
                <span className="font-bold text-stone-900">{data.reason === 'Lifetime access revoked by master' ? 'Acesso vitalício revogado' : data.reason}</span>
              </p>
            )}
          </div>
        );
      case 'IMPERSONATION_STARTED':
        return (
          <div className="mt-2 flex items-center gap-2 text-sm bg-white/60 p-2 rounded border border-stone-100">
            <span className="text-stone-500 font-medium">IP de Acesso:</span>
            <span className="font-bold font-mono text-stone-700">{data.ip}</span>
          </div>
        );
      case 'TENANT_SUSPENDED':
      case 'STORE_SUSPENDED':
      case 'TENANT_REACTIVATED':
      case 'STORE_REACTIVATED':
        return data.reason ? (
          <div className="mt-2 text-sm bg-white/60 p-2 rounded border border-stone-100">
            <span className="text-stone-500 font-medium mr-2">Motivo:</span> 
            <span className="font-semibold text-stone-900">{data.reason}</span>
          </div>
        ) : null;
      default:
        return (
          <div className="space-y-1.5 mt-2">
            {Object.entries(data).map(([key, value]) => (
              <p key={key} className="flex justify-between items-center bg-white/60 p-2 rounded border border-stone-100 text-sm">
                <span className="text-stone-500 font-medium capitalize">{key}</span> 
                <span className="font-bold text-stone-900 truncate max-w-[200px]">{String(value)}</span>
              </p>
            ))}
          </div>
        );
    }
  } catch (e) {
    return <p className="mt-2 text-sm text-stone-600 font-mono bg-stone-100 p-2 rounded">{metadataStr}</p>;
  }
};

export default function AuditoriaMaster() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch(`/api/master/audit-logs`);
      if (res.ok) setLogs(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction !== "ALL" && log.action !== filterAction && !(filterAction === 'SUSPENDED' && log.action.includes('SUSPENDED')) && !(filterAction === 'REACTIVATED' && log.action.includes('REACTIVATED'))) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const tenantName = log.tenant?.name?.toLowerCase() || '';
      const actorName = log.actorUser?.name?.toLowerCase() || '';
      if (!tenantName.includes(q) && !actorName.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Auditoria & Logs</h1>
          <p className="text-sm text-stone-500 mt-1">Linha do tempo imutável das ações administrativas do sistema.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Buscar por loja ou nome do administrador..." 
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64 shrink-0 flex items-center">
          <Filter className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none font-medium text-stone-700"
          >
            <option value="ALL">Todas as ações</option>
            <option value="IMPERSONATION_STARTED">Acessos à Conta</option>
            <option value="PLAN_CHANGED">Alterações de Plano</option>
            <option value="STORE_CREATED">Lojas Criadas</option>
            <option value="SUSPENDED">Suspensões</option>
            <option value="REACTIVATED">Reativações</option>
          </select>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
            <p className="font-medium">Carregando linha do tempo...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            <Activity className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="font-medium">Nenhuma atividade encontrada.</p>
            <p className="text-xs mt-1">Ajuste os filtros ou tente outra busca.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-stone-100 ml-4 md:ml-6 space-y-10 py-4">
            {filteredLogs.map((log) => {
              const info = getActionInfo(log.action);
              const Icon = info.icon;
              
              return (
                <div key={log.id} className="relative pl-8 md:pl-10 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full ${info.bg} ${info.border} border-4 border-white flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 ${info.color}`} />
                  </div>

                  {/* Log Card */}
                  <div className="bg-stone-50/50 hover:bg-stone-50 border border-stone-100 hover:border-stone-200 rounded-2xl p-5 transition-all shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-stone-900 flex items-center gap-2">
                          {info.label}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${info.bg} ${info.color}`}>
                            {log.action}
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Context Info */}
                      <div className="space-y-3 border-r-0 md:border-r border-stone-200 pr-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1 flex items-center gap-1"><Store className="w-3 h-3" /> Loja Afetada</span>
                          {log.tenant ? (
                            <Link href={`/master/lojas`} className="text-brand-600 font-semibold hover:underline flex items-center gap-2 text-sm">
                              {log.tenant.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-mono text-stone-500">{log.tenantId || '-'}</span>
                          )}
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Autor da Ação</span>
                          {log.actorUser ? (
                            <div className="text-sm text-stone-700 font-medium">
                              {log.actorUser.name} <span className="text-stone-400 font-normal">({log.actorUser.email})</span>
                            </div>
                          ) : (
                            <span className="text-sm font-mono text-stone-500">{log.actorUserId || 'Sistema Automático'}</span>
                          )}
                        </div>
                      </div>

                      {/* Metadata Details */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1 flex items-center gap-1">Detalhes do Evento</span>
                        {log.metadata && log.metadata !== "{}" && log.metadata !== "null" ? (
                          <div className="text-stone-700 text-sm">
                            {formatLogMetadata(log.action, log.metadata)}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-stone-400 italic bg-white/50 p-2 rounded border border-stone-100">
                            Nenhum detalhe adicional.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
