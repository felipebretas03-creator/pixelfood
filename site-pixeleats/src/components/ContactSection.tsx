"use client";

import { useState } from "react";
import { Clock, MessageCircle, Mail, Instagram } from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    contact: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getMessageBody = () => {
    return `Olá! Meu nome é ${formData.name || "..."} da empresa ${formData.company || "..."}.
    
Contato: ${formData.contact || "Não informado"}

Mensagem:
${formData.message || "..."}`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getMessageBody());
    window.open(`https://wa.me/5511999999999?text=${text}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Contato de Parceria - ${formData.company || formData.name || "Pixeleats"}`);
    const body = encodeURIComponent(getMessageBody());
    window.open(`mailto:contato@pixeleats.com.br?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <section id="contato" className="py-24 bg-brand-50/50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left Column */}
          <div className="flex flex-col items-start">
            <div className="bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 mb-8">
              <Clock className="w-4 h-4" />
              Resposta em até 24h
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display text-stone-800 leading-tight mb-10 max-w-md">
              Transforme o delivery do seu restaurante hoje. Sem compromisso: nos escreva e descubra como a Pixeleats pode ajudar.
            </h2>
            
            <div className="flex flex-wrap gap-4">
              <a 
                href="#planos" 
                className="bg-brand-900 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-brand-800 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <MessageCircle className="w-5 h-5" />
                Quero conhecer
              </a>
              <a 
                href="https://instagram.com/pixeleats" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white text-stone-700 border border-stone-200 px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-stone-50 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                Ver no Instagram
              </a>
            </div>
          </div>

          {/* Right Column (Form Card) */}
          <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Nome *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className="w-full bg-transparent border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Restaurante / Empresa</label>
                <input 
                  type="text" 
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome do restaurante"
                  className="w-full bg-transparent border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-stone-600 mb-1">E-mail ou WhatsApp</label>
              <input 
                type="text" 
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Como prefere que eu te responda?"
                className="w-full bg-transparent border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>

            <div className="mb-8">
              <label className="block text-xs font-medium text-stone-600 mb-1">Mensagem *</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Conte o seu objetivo, o formato desejado e prazos, se já tiver."
                rows={4}
                className="w-full bg-transparent border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <button 
                onClick={handleWhatsApp}
                className="flex-1 bg-brand-900 text-white rounded-full py-3.5 flex items-center justify-center gap-2 font-medium hover:bg-brand-800 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar pelo WhatsApp
              </button>
              <button 
                onClick={handleEmail}
                className="flex-1 bg-white text-brand-900 border border-brand-200 rounded-full py-3.5 flex items-center justify-center gap-2 font-medium hover:bg-brand-50 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Enviar por e-mail
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit">
                <Clock className="w-3.5 h-3.5" />
                Resposta em até 24h
              </div>
              <p className="text-[11px] text-stone-500">
                Seus dados não são armazenados — abrem direto no app escolhido.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
