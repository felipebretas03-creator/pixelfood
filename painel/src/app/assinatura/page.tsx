"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { ShieldCheck, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AssinaturaPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiFetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlans(data);
          if (data.length > 0) setSelectedPlanId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCheckout = async () => {
    if (!selectedPlanId) return;
    setIsProcessing(true);
    try {
      const res = await apiFetch(`/api/subscription/checkout?planId=${selectedPlanId}`);
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || "Não foi possível processar a assinatura.");
        setIsProcessing(false);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com o servidor.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto items-center text-center mt-12">
      <div className="flex flex-col gap-3 items-center">
        <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">Escolha seu plano</h1>
        <p className="text-stone-500 font-medium text-lg max-w-lg">
          Para continuar utilizando o painel do seu restaurante e recebendo pedidos, escolha um plano e efetue o pagamento da assinatura via Asaas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-6">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative bg-white rounded-3xl p-6 border-2 cursor-pointer transition-all duration-200 text-left ${
                isSelected ? "border-brand-500 shadow-xl shadow-brand-500/10 ring-4 ring-brand-500/20 scale-[1.02]" : "border-stone-200 hover:border-brand-300 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black text-stone-900">{plan.name}</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-brand-500 bg-brand-500 text-white" : "border-stone-300"}`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-stone-900">
                  R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-stone-500 font-medium">/{plan.billingCycle === 'YEARLY' ? 'ano' : 'mês'}</span>
              </div>

              {plan.features && (
                <ul className="flex flex-col gap-3">
                  {plan.features.split(',').map((feat: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-stone-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{feat.trim()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full max-w-sm flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Iniciando Teste...
          </>
        ) : (
          <>
            <CreditCard className="w-6 h-6" />
            Começar Teste Grátis de 7 Dias
          </>
        )}
      </button>
      
      <p className="text-stone-400 text-sm font-medium mt-2">Você não precisa inserir o cartão de crédito agora. A cobrança será enviada após os 7 dias.</p>
    </div>
  );
}
