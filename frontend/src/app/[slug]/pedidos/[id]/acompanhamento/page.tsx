/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { MapPin, Phone, MessageCircle, ArrowLeft, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function AcompanhamentoPage() {
  const routerParams = useParams();
  const slug = routerParams?.slug as string;

  const router = useRouter();

  return (
    <main className="flex flex-col h-screen bg-stone-100 relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={() => router.push(`/${slug}`)}
        className="absolute top-12 left-6 z-20 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-stone-900 border border-stone-100"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Fake Map Background */}
      <div className="absolute inset-0 z-0 bg-emerald-50">
        <div className="w-full h-full opacity-30" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
        {/* Fake Route Line */}
        <div className="absolute top-1/3 left-1/4 w-1/2 h-1/3 border-t-4 border-l-4 border-brand-500 rounded-tl-[40px] border-dashed opacity-50"></div>
        {/* Fake Pins */}
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-brand-500 rounded-full border-4 border-white shadow-md transform -translate-x-2 -translate-y-2"></div>
        <div className="absolute top-[66%] left-[75%] w-6 h-6 bg-stone-900 rounded-full border-4 border-white shadow-md transform -translate-x-3 -translate-y-3 flex items-center justify-center text-white text-[10px]">🏠</div>
      </div>

      {/* Driver Info Floating Card */}
      <div className="absolute bottom-8 left-6 right-6 bg-white rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20">
        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-stone-100 rounded-full overflow-hidden border border-stone-100 relative">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704a" alt="Driver" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Rayford Chenail</h3>
              <p className="text-stone-400 font-medium text-sm">Entregador</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-stone-100 px-2.5 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-brand-500 fill-brand-500" />
            <span className="font-bold text-sm text-stone-900">4.9</span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-stone-50 rounded-2xl p-3">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
            <div className="flex flex-col">
               <span className="text-xs text-stone-400 font-medium">Tempo Estimado</span>
               <span className="font-bold text-stone-900 text-sm">15-20 Minutos</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-5">
          <button className="flex-1 bg-white border border-brand-500 text-brand-500 rounded-full py-3.5 flex items-center justify-center font-bold gap-2">
            <MessageCircle className="w-5 h-5" />
            Mensagem
          </button>
          <button className="flex-1 bg-brand-500 text-white rounded-full py-3.5 flex items-center justify-center font-bold gap-2 shadow-md shadow-brand-500/30">
            <Phone className="w-5 h-5" />
            Ligar
          </button>
        </div>
      </div>
    </main>
  );
}
