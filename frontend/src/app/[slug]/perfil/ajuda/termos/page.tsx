/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function TermosPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="flex-1 flex flex-col bg-stone-50 min-h-screen">
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100 shadow-sm">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Termos e Políticas</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
          <div className="prose prose-stone prose-sm max-w-none">
            <h2 className="text-xl font-black text-stone-900 mb-4">Termos de Uso do PixelFood</h2>
            <p className="text-stone-500 mb-6">Última atualização: Julho de 2026</p>

            <h3 className="font-bold text-stone-800 text-lg mb-2">1. Aceitação dos Termos</h3>
            <p className="text-stone-600 mb-6 leading-relaxed">
              Ao acessar e utilizar o aplicativo PixelFood, você concorda em cumprir e ser regido por estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
            </p>

            <h3 className="font-bold text-stone-800 text-lg mb-2">2. Uso do Serviço</h3>
            <p className="text-stone-600 mb-6 leading-relaxed">
              O PixelFood é uma plataforma de delivery de alimentos. Nós nos esforçamos para garantir que todas as descrições de produtos, preços e disponibilidades sejam precisas, mas erros podem ocorrer. Reservamo-nos o direito de cancelar pedidos caso haja erro no sistema ou falta de ingredientes.
            </p>

            <h3 className="font-bold text-stone-800 text-lg mb-2">3. Política de Privacidade</h3>
            <p className="text-stone-600 mb-6 leading-relaxed">
              Nós valorizamos muito a sua privacidade. Suas informações pessoais (nome, endereço, dados de pagamento) são coletadas apenas para o propósito de processar seus pedidos e melhorar sua experiência. Não vendemos ou compartilhamos seus dados com terceiros sem sua autorização.
            </p>

            <h3 className="font-bold text-stone-800 text-lg mb-2">4. Prazos e Entregas</h3>
            <p className="text-stone-600 mb-6 leading-relaxed">
              O tempo estimado de entrega é apenas uma previsão. Fatores externos como clima, trânsito e alta demanda podem afetar o tempo real. Faremos o possível para comunicar qualquer atraso significativo.
            </p>

            <h3 className="font-bold text-stone-800 text-lg mb-2">5. Cancelamentos e Reembolsos</h3>
            <p className="text-stone-600 leading-relaxed">
              Pedidos podem ser cancelados gratuitamente antes do restaurante iniciar o preparo. Após o início do preparo, cancelamentos estão sujeitos a avaliação da equipe de suporte. Reembolsos para pagamentos online podem levar até duas faturas para constar no cartão de crédito.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
