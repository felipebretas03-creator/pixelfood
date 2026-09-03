"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Como funciona o teste grátis de 7 dias?",
    answer: "Você cria sua conta e ganha acesso imediato a todas as funcionalidades do Painel, incluindo cardápio digital, gestão de delivery e campanhas de marketing. Nenhuma cobrança será feita na hora do cadastro. Após os 7 dias, enviaremos a cobrança da primeira mensalidade."
  },
  {
    question: "Preciso cadastrar o cartão de crédito para iniciar o teste?",
    answer: "Não! Você começa o seu teste na mesma hora sem precisar inserir dados de pagamento. O link de pagamento (com opção de Cartão, Pix ou Boleto) só será enviado ao final dos 7 dias."
  },
  {
    question: "A Pixeleats cobra alguma taxa sobre os pedidos?",
    answer: "Zero! Nós não cobramos nenhuma taxa ou comissão sobre as suas vendas. Todo o lucro do seu restaurante é 100% seu. Você paga apenas o valor fixo da assinatura."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Sim. Não exigimos tempo mínimo de fidelidade e não cobramos multa rescisória. Se desejar parar de usar a plataforma, basta cancelar sua assinatura direto no painel."
  },
  {
    question: "Como o meu cliente faz o pedido?",
    answer: "Você terá um Cardápio Digital exclusivo com um link próprio. Pode enviar esse link para os seus clientes via WhatsApp, colocar na bio do Instagram ou usar em QR Codes nas mesas do seu restaurante."
  },
  {
    question: "Preciso baixar algum aplicativo?",
    answer: "Não é necessário baixar nada. A plataforma da Pixeleats funciona perfeitamente direto no navegador do computador, tablet ou celular, tanto para você gerenciar o negócio, quanto para o seu cliente pedir."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-stone-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-brand-600 font-semibold tracking-wide uppercase text-sm mb-3">Dúvidas Frequentes</h2>
          <h3 className="text-3xl md:text-4xl font-bold font-display text-stone-950 mb-6">Ainda tem dúvidas?</h3>
          <p className="text-stone-600 text-lg">Separamos as perguntas mais comuns dos nossos parceiros para te ajudar.</p>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`bg-white border rounded-2xl overflow-hidden transition-colors ${isOpen ? 'border-brand-200 shadow-sm' : 'border-stone-200 hover:border-brand-100'}`}
              >
                <button
                  onClick={() => toggleOpen(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-bold text-stone-800">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-brand-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                >
                  <p className="text-stone-600">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
