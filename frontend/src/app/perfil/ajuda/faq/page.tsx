/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FAQPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const faqs = [
    {
      question: "Como acompanho meu pedido?",
      answer: "Você pode acompanhar o status do seu pedido acessando a aba 'Pedidos' no menu inferior ou pelo menu flutuante no computador. Lá você verá atualizações em tempo real."
    },
    {
      question: "Quais as formas de pagamento aceitas?",
      answer: "Aceitamos PIX, cartões de crédito (Visa, Mastercard, Elo) e dinheiro (com opção de solicitar troco no momento da finalização do pedido)."
    },
    {
      question: "Como funciona o Clube Pixel (Fidelidade)?",
      answer: "A cada pedido finalizado você acumula pontos no Clube Pixel. Esses pontos podem ser trocados por sobremesas, bebidas ou descontos nos próximos pedidos. Acesse a aba Fidelidade para ver seus pontos e prêmios."
    },
    {
      question: "Meu pedido veio errado. O que faço?",
      answer: "Pedimos desculpas! Acesse a tela de 'Ajuda' e clique em 'Falar no WhatsApp' para conversar com nosso suporte. Resolveremos seu problema o mais rápido possível."
    },
    {
      question: "Posso cancelar um pedido?",
      answer: "Você pode cancelar o pedido em até 5 minutos após a confirmação. Depois disso, o restaurante já pode ter começado a preparar seu lanche. Caso precise cancelar após esse tempo, entre em contato pelo nosso WhatsApp."
    }
  ];

  if (!mounted) return null;

  return (
    <main className="flex-1 flex flex-col bg-stone-50 min-h-screen">
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100 shadow-sm">
        <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Dúvidas Frequentes</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
              >
                <span className="font-bold text-stone-800 pr-4">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-stone-500 text-sm leading-relaxed border-t border-stone-50 bg-stone-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
