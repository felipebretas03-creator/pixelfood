/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft, MessageCircle, HelpCircle, FileText, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AjudaPage() {
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
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Ajuda</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-brand-500 rounded-3xl p-6 text-white flex flex-col items-center text-center shadow-lg shadow-brand-500/20 mt-2">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Como podemos te ajudar?</h2>
          <p className="text-brand-100 text-sm mb-6 max-w-[250px]">
            Nossa equipe está pronta para tirar suas dúvidas e resolver qualquer problema.
          </p>
          <button className="bg-white text-brand-500 font-bold py-3 w-full rounded-xl active:scale-95 transition-transform hover:bg-stone-50 shadow-sm">
            Falar no WhatsApp
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
          <Link href={`/${slug}/perfil/ajuda/faq`} className="w-full flex items-center justify-between p-4 border-b border-stone-50 hover:bg-stone-50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="font-bold text-stone-800">Dúvidas Frequentes</span>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </Link>

          <Link href={`/${slug}/perfil/ajuda/termos`} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-stone-800">Termos e Políticas</span>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300" />
          </Link>
        </div>
      </div>
    </main>
  );
}
