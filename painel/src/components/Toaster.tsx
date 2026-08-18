/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { useToastStore } from "@/store/toastStore";
import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // @ts-ignore - necessary for hydration
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto w-full animate-in slide-in-from-bottom-5 fade-in duration-300 bg-stone-900 text-white px-5 py-3.5 rounded-full shadow-2xl shadow-stone-900/20 flex items-center gap-3"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-brand-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {toast.type === 'info' && <Info className="w-4 h-4" />}
          </div>
          <span className="font-bold text-sm flex-1">{toast.message}</span>
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-stone-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
