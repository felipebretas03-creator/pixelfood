"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { showToast } from '@/store/toastStore';

export default function ComunicadosMaster() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Deseja enviar este comunicado para a segmentação: ${targetAudience}?`)) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`/api/master/communications`, {
        method: 'POST',
        body: JSON.stringify({ title, message, targetAudience })
      });
      if (res.ok) {
        showToast("Comunicado enfileirado com sucesso para disparo por e-mail!", 'success');
        setTitle("");
        setMessage("");
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao enviar comunicado.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Comunicados (Broadcast)</h1>
        <p className="text-sm text-stone-500 mt-1">Envie comunicados em massa para as bases segmentadas de lojistas.</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <form onSubmit={handleSend} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Público Alvo</label>
            <select 
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-stone-700"
            >
              <option value="ALL">Todas as Lojas</option>
              <option value="ACTIVE">Lojas Ativas</option>
              <option value="TRIALING">Lojas em Trial</option>
              <option value="PAST_DUE">Lojas Inadimplentes</option>
              <option value="SUSPENDED">Lojas Suspensas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Título do Comunicado / Assunto do E-mail</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              placeholder="Ex: Atualização importante nos Termos de Uso"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Mensagem HTML</label>
            <textarea 
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 h-48 font-mono text-sm"
              placeholder="<p>Olá Lojista, gostaríamos de informar que...</p>"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'Enviando...' : 'Disparar Comunicado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
