/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft, Save, User, Mail, Phone, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useToastStore } from "@/store/toastStore";
import { useState, useEffect } from "react";

export default function MeusDadosPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const { userName, userEmail, userPhone, isAuthenticated, setPhone: setStorePhone } = useUserStore();
  const addToast = useToastStore((state) => state.addToast);
  const [mounted, setMounted] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setMounted(true);
    if (userName) setName(userName);
    if (userEmail) setEmail(userEmail);
    if (userPhone) setPhone(userPhone);
  }, [userName, userEmail, userPhone]);

  if (!mounted) return null;
  
  if (!isAuthenticated) {
    router.push(`/${slug}/login`);
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) {
      setStorePhone(phone);
      try {
        await import('@/lib/api').then(({ apiFetch }) => {
          apiFetch('http://127.0.0.1:4000/api/customer/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
          });
        });
      } catch (e) {
        console.error(e);
      }
    }
    addToast("Dados atualizados com sucesso!");
    router.back();
  };

  return (
    <main className="flex-1 flex flex-col bg-stone-50 min-h-screen">
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Meus Dados</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center mb-8 pt-4">
          <div className="w-24 h-24 rounded-full bg-stone-200 mb-3 overflow-hidden border-4 border-white shadow-md relative group cursor-pointer">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold">Alterar</span>
            </div>
          </div>
          <p className="text-sm font-medium text-brand-500 cursor-pointer hover:underline">Alterar foto</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">Nome Completo</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400"><User className="w-5 h-5" /></div>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 border border-stone-200 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">E-mail</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400"><Mail className="w-5 h-5" /></div>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 border border-stone-200 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">Celular</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400"><Phone className="w-5 h-5" /></div>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 border border-stone-200 transition-all font-medium"
              />
            </div>
          </div>

          <div className="h-px bg-stone-100 my-2" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">Nova Senha</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400"><Lock className="w-5 h-5" /></div>
              <input 
                type="password" 
                placeholder="Deixe em branco para não alterar"
                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 border border-stone-200 transition-all font-medium placeholder-stone-400"
              />
            </div>
          </div>

          <button type="submit" className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-500 text-white rounded-xl py-4 font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-600 active:scale-[0.98] transition-all">
            <Save className="w-5 h-5" />
            Salvar Alterações
          </button>
        </form>
      </div>
    </main>
  );
}
