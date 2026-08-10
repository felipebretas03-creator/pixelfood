"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Activity, Loader2, Search } from "lucide-react";

export default function AuditoriaMaster() {
  const translateAction = (action: string) => {
    switch (action) {
      case 'IMPERSONATION_STARTED': return 'Acesso à conta da Loja';
      case 'STORE_CREATED': return 'Criação de nova Loja';
      case 'PLAN_CHANGED': return 'Alteração de Plano';
      case 'COMMUNICATION_SENT': return 'Envio de Comunicado em Massa';
      case 'TENANT_SUSPENDED': return 'Suspensão de Loja';
      case 'TENANT_REACTIVATED': return 'Reativação de Loja';
      case 'TENANT_CANCELED': return 'Cancelamento de Assinatura';
      default: return action;
    }
  };
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch(`http://localhost:4000/api/master/audit-logs`);
      if (res.ok) setLogs(await res.json());
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
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Auditoria</h1>
          <p className="text-sm text-stone-500 mt-1">Histórico imutável de ações administrativas da plataforma.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Ator (Quem fez)</th>
                <th className="px-6 py-4">Loja Afetada</th>
                <th className="px-6 py-4">Metadados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    Nenhum log de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-stone-900 block">
                        {translateAction(log.action)}
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {log.actorUser ? (
                        <div>
                          <div className="font-semibold">{log.actorUser.name}</div>
                          <div className="text-xs text-stone-400">{log.actorUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-stone-400">{log.actorUserId || 'Sistema'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {log.tenant ? (
                        <div className="font-semibold text-brand-600">{log.tenant.name}</div>
                      ) : (
                        <span className="text-xs font-mono text-stone-400">{log.tenantId || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.metadata ? (
                        <pre className="text-[10px] bg-stone-100 p-2 rounded max-w-xs overflow-auto text-stone-600 border border-stone-200">
                          {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                        </pre>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
