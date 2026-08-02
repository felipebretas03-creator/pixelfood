/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { ArrowLeft, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function FavoritosPage() {
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
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Favoritos</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full my-auto">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Nenhum favorito ainda</h2>
        <p className="text-stone-500 mb-8 max-w-sm">
          Você ainda não favoritou nenhum produto. Volte ao cardápio e adicione os pratos que mais gostar!
        </p>
        <Link href={`/${slug}/`} className="bg-brand-500 text-white rounded-full py-4 px-8 font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-600 active:scale-95 transition-all">
          Ver Cardápio
        </Link>
      </div>
    </main>
  );
}
