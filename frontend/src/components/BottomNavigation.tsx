/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ShoppingBag, Home, FileText, User } from "lucide-react";
import { useState, useEffect } from "react";

import { useCartStore } from "@/store/cartStore";

export function BottomNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string;
  const items = useCartStore(state => state.items);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  // Hide BottomNavigation on specific checkout/tracking flows
  if (pathname === `/${slug}/carrinho` || pathname === `/${slug}/login` || pathname === `/${slug}/cadastro` || (pathname.startsWith(`/${slug}/pedidos/`) && pathname !== `/${slug}/pedidos`)) {
    return null;
  }

  return (
    <nav className="fixed lg:hidden bottom-0 left-0 w-full bg-white border-t border-stone-100 px-2 py-2 pb-[env(safe-area-inset-bottom,1rem)] flex justify-around items-center z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <Link href={`/${slug}`} className={`flex flex-col items-center justify-center min-w-[70px] gap-1 transition-colors ${isActive(`/${slug}`) ? "text-brand-500" : "text-stone-400 hover:text-stone-900"}`}>
        <Home className="w-[22px] h-[22px]" strokeWidth={isActive(`/${slug}`) ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">Início</span>
      </Link>
      
      <Link href={`/${slug}/pedidos`} className={`flex flex-col items-center justify-center min-w-[70px] gap-1 transition-colors ${isActive(`/${slug}/pedidos`) || pathname.startsWith(`/${slug}/pedidos/`) ? "text-brand-500" : "text-stone-400 hover:text-stone-900"}`}>
        <FileText className="w-[22px] h-[22px]" strokeWidth={isActive(`/${slug}/pedidos`) || pathname.startsWith(`/${slug}/pedidos/`) ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">Pedidos</span>
      </Link>
      
      <Link href={`/${slug}/carrinho`} className={`flex flex-col items-center justify-center min-w-[70px] gap-1 transition-colors relative ${isActive(`/${slug}/carrinho`) ? "text-brand-500" : "text-stone-400 hover:text-stone-900"}`}>
        {mounted && itemCount > 0 && (
          <div className="absolute top-0 right-[20px] w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
        <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={isActive(`/${slug}/carrinho`) ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">Carrinho</span>
      </Link>
      
      <Link href={`/${slug}/perfil`} className={`flex flex-col items-center justify-center min-w-[70px] gap-1 transition-colors ${isActive(`/${slug}/perfil`) ? "text-brand-500" : "text-stone-400 hover:text-stone-900"}`}>
        <User className="w-[22px] h-[22px]" strokeWidth={isActive(`/${slug}/perfil`) ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">Perfil</span>
      </Link>
    </nav>
  );
}
