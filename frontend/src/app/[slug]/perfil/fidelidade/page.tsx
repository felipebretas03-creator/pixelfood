/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft, Award, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function FidelidadePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, userId } = useUserStore();
  
  const [loyalty, setLoyalty] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const fetchData = async () => {
      try {
        const [loyaltyRes, customerRes] = await Promise.all([
          apiFetch('http://127.0.0.1:4000/api/loyalty'),
          isAuthenticated && userId ? apiFetch(`http://127.0.0.1:4000/api/customers/${userId}`) : Promise.resolve(null)
        ]);

        if (loyaltyRes.ok) {
          const lData = await loyaltyRes.json();
          setLoyalty(lData);
        }
        
        if (customerRes && customerRes.ok) {
          const cData = await customerRes.json();
          setCustomer(cData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, userId]);

  if (!mounted) return null;

  return (
    <main className="flex-1 flex flex-col bg-stone-50 min-h-screen">
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Fidelidade</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col items-center">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : loyalty && loyalty.active ? (
          <>
            <div className="w-full bg-stone-900 text-white rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl mb-8 mt-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl" />
              
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-amber-900 mb-4 shadow-lg">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black mb-1">Programa de Fidelidade</h2>
              <p className="text-stone-400 text-center font-medium mb-6 max-w-[250px]">
                Acumule {loyalty.pointsPerReal} ponto(s) a cada R$ 1,00 gasto e troque por {loyalty.rewardType === 'PRODUCT' ? 'prêmios' : 'desconto'}.
              </p>

              <div className="flex items-center gap-3">
                <div className="text-4xl font-black text-amber-400">
                  {isAuthenticated ? (customer?.loyaltyPts || 0) : '0'}
                </div>
                <div className="text-left leading-tight text-stone-300 text-sm font-bold">
                  Pontos<br/>Disponíveis
                </div>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="w-full bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center text-center">
                <Lock className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-stone-900 mb-2">Faça login para participar</h3>
                <p className="text-sm text-stone-600 mb-4">Você precisa estar logado para acumular e resgatar pontos.</p>
                <Link href={`/${slug}/login`} className="bg-amber-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-amber-600 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Entrar na Conta
                </Link>
              </div>
            ) : (
              <>
                <h3 className="w-full font-bold text-stone-900 mb-4 text-lg">Prêmios disponíveis</h3>
                
                <div className="w-full flex flex-col gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      {loyalty.rewardType === 'PRODUCT' ? (
                        <span className="font-bold text-stone-900">{loyalty.rewardText || 'Prêmio especial'}</span>
                      ) : (
                        <span className="font-bold text-stone-900">Desconto de R$ {loyalty.rewardValue.toFixed(2).replace('.', ',')}</span>
                      )}
                      <span className="text-sm text-stone-500">Na sua próxima compra</span>
                    </div>
                    <button 
                      className={`font-bold px-4 py-2 rounded-xl text-sm transition-colors ${
                        (customer?.loyaltyPts || 0) >= loyalty.pointsToReward
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      }`}
                      disabled={(customer?.loyaltyPts || 0) < loyalty.pointsToReward}
                    >
                      Resgatar ({loyalty.pointsToReward} pts)
                    </button>
                  </div>
                </div>
                
                {(customer?.loyaltyPts || 0) < loyalty.pointsToReward && (
                  <p className="w-full text-center text-stone-500 text-sm font-medium mt-6">
                    Faltam {loyalty.pointsToReward - (customer?.loyaltyPts || 0)} pontos para o próximo resgate.
                  </p>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Award className="w-16 h-16 text-stone-300 mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Programa Inativo</h2>
            <p className="text-stone-500 font-medium max-w-sm">
              O programa de fidelidade não está ativo no momento. Fique de olho nas novidades!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
