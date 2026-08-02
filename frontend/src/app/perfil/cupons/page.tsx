/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft, Ticket, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function CuponsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    apiFetch('http://127.0.0.1:4000/api/coupons')
      .then(res => res.json())
      .then(data => {
        setCoupons(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <main className="flex-1 flex flex-col bg-stone-50 min-h-screen">
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100">
        <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Meus Cupons</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Ticket className="w-5 h-5 text-brand-500" />
          </div>
          <input 
            type="text" 
            placeholder="Digite o código do cupom" 
            className="w-full pl-12 pr-24 py-4 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold uppercase text-stone-800"
          />
          <button className="absolute right-2 top-2 bottom-2 bg-stone-900 text-white px-4 rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors">
            Adicionar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : coupons.length > 0 ? (
          coupons.map((coupon: any) => (
            <div key={coupon.id} className={`bg-white p-5 rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex gap-4 relative overflow-hidden ${!coupon.active ? 'opacity-60' : ''}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${coupon.active ? 'bg-brand-500' : 'bg-stone-300'}`} />
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${coupon.active ? 'bg-brand-50 text-brand-500' : 'bg-stone-100 text-stone-400'}`}>
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-stone-900 text-lg">{coupon.code}</h3>
                <p className="text-sm text-stone-500 mt-1">
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}% de desconto` : 
                   coupon.type === 'FIXED' ? `R$ ${coupon.value.toFixed(2)} de desconto` : 
                   'Entrega Grátis'}
                </p>
                <p className={`text-xs font-bold mt-2 ${coupon.active ? 'text-brand-500' : 'text-stone-400'}`}>
                  {coupon.active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <Ticket className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Nenhum cupom disponível no momento.</p>
          </div>
        )}
      </div>
    </main>
  );
}
