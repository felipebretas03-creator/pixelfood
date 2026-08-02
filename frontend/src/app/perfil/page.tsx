/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { User, MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, FileText, Ticket, Award, Heart } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { BottomNavigation } from "@/components/BottomNavigation";
import { NotificationsModal } from "@/components/NotificationsModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const router = useRouter();
  const { userName, userPhoto, isAuthenticated, logout } = useUserStore();
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-white p-6 min-h-screen text-center pb-24">
        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6 text-brand-500">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Acesse seu Perfil</h2>
        <p className="text-stone-500 mb-8 font-medium">Faça login ou crie uma conta grátis para ver seus pedidos e gerenciar sua conta.</p>
        
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Link href="/login" className="w-full bg-brand-500 text-white rounded-full py-4 font-bold shadow-lg shadow-brand-500/30 active:scale-[0.98] transition-all">
            Fazer Login
          </Link>
          <Link href="/cadastro" className="w-full bg-stone-100 text-stone-900 rounded-full py-4 font-bold active:scale-[0.98] transition-all hover:bg-stone-200">
            Criar Conta
          </Link>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  const accountItems = [
    { icon: User, label: "Meus Dados", href: "/perfil/dados" },
    { icon: MapPin, label: "Endereços", href: "/perfil/enderecos" },
  ];

  const activityItems = [
    { icon: FileText, label: "Histórico de Pedidos", href: "/pedidos" },
    { icon: Ticket, label: "Cupons", href: "/perfil/cupons" },
    { icon: Award, label: "Fidelidade", href: "/perfil/fidelidade" },
    { icon: Heart, label: "Favoritos", href: "/perfil/favoritos" },
  ];

  const generalItems = [
    { icon: Bell, label: "Notificações", href: "#" },
    { icon: HelpCircle, label: "Ajuda e Suporte", href: "/perfil/ajuda" },
  ];

  return (
    <main className="flex-1 flex flex-col pb-32 bg-white min-h-screen">
      {/* Header */}
      <header className="px-6 py-6 flex items-center bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-stone-900">Meu Perfil</h1>
      </header>

      {/* Profile Info */}
      <div className="flex flex-col items-center mt-2 mb-8">
        <div className="w-28 h-28 rounded-full overflow-hidden bg-stone-100 mb-4 border-4 border-white shadow-lg">
          <img src={userPhoto || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">{userName || "Usuário"}</h2>
        <p className="text-stone-500 font-medium">Membro desde 2023</p>
      </div>

      <div className="px-6 flex flex-col gap-6">
        {/* Minha Conta */}
        <div>
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 ml-2">Minha Conta</h3>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
            {accountItems.map((item, index) => (
              <Link href={item.href} key={index} className="flex items-center justify-between p-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-stone-800">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Atividade */}
        <div>
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 ml-2">Atividade</h3>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
            {activityItems.map((item, index) => (
              <Link href={item.href} key={index} className="flex items-center justify-between p-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-stone-800">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Geral */}
        <div>
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 ml-2">Geral</h3>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
            <button onClick={() => setIsNotificationsModalOpen(true)} className="w-full flex items-center justify-between p-4 border-b border-stone-50 hover:bg-stone-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="font-bold text-stone-800">Notificações</span>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300" />
            </button>
            <Link href="/perfil/ajuda" className="w-full flex items-center justify-between p-4 border-b border-stone-50 hover:bg-stone-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-bold text-stone-800">Ajuda e Suporte</span>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300" />
            </Link>
            
            <button onClick={() => { logout(); router.push("/"); }} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-bold text-red-500">Sair da Conta</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />

      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
      />
    </main>
  );
}
