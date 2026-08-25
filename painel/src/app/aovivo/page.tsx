"use client";
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function AoVivoPage() {
  const [faturamento, setFaturamento] = useState(0);
  const [pedidosTotais, setPedidosTotais] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const fetchOrders = () => {
      apiFetch('/api/orders')
        .then(res => res.json())
        .then((data: any[]) => {
          if (!isMounted) return;
          setPedidosTotais(data.length);
          const totalFaturamento = data.reduce((acc, order) => acc + order.total, 0);
          
          // Sound trigger for new orders when polling
          setPedidosTotais(prev => {
            if (data.length > prev && prev > 0) {
              setPulse(true);
              setTimeout(() => setPulse(false), 800);
              try {
                const w = window as any;
                if (!w.__audioInstance) {
                  w.__audioInstance = new Audio('/notification.mp3');
                  w.__audioInstance.volume = 1.0;
                }
                w.__audioInstance.currentTime = 0;
                w.__audioInstance.play().catch(() => {});
              } catch(e) {}
            }
            return data.length;
          });
          
          setFaturamento(totalFaturamento);
        })
        .catch(console.error);
    };

    // 1. Fetch initial values
    fetchOrders();

    // Fallback: Polling HTTP a cada 5 segundos (para Vercel)
    const interval = setInterval(fetchOrders, 5000);

    // 2. Listen for realtime orders
    let socket: any;
    let isMounted = true;
    import('socket.io-client').then(({ io }) => {
      if (!isMounted) return;
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      try {
        const authData = JSON.parse(localStorage.getItem('painel-auth-storage') || '{}');
        if (authData.state?.tenant?.id) {
          socket.emit('join_restaurant', authData.state.tenant.id);
        }
      } catch(e) {}
      
      socket.on('new_order', (dbOrder: any) => {
        setFaturamento(prev => prev + dbOrder.total);
        setPedidosTotais(prev => prev + 1);
        
        setPulse(true);
        setTimeout(() => setPulse(false), 800);
        
        // Play sound reliably
        try {
          const w = window as any;
          if (!w.__audioInstance) {
            w.__audioInstance = new Audio('/notification.mp3');
            w.__audioInstance.volume = 1.0;
          }
          w.__audioInstance.currentTime = 0;
          w.__audioInstance.play().catch((err: any) => {
            console.error('Autoplay do som bloqueado pelo navegador. Clique na tela em qualquer lugar para permitir:', err);
          });
        } catch(e) {
          console.error('Erro ao tocar som:', e);
        }
      });
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center z-[999999] overflow-hidden">
      
      {/* Botão flutuante Voltar */}
      <Link href="/" className="absolute top-8 left-8 text-stone-500 hover:text-white flex items-center justify-center w-12 h-12 bg-stone-900/50 hover:bg-stone-800 rounded-full transition-all z-10 border border-stone-800" title="Voltar">
        <ArrowLeft className="w-6 h-6" />
      </Link>

      {/* Indicador flutuante Tempo Real */}
      <div className="absolute top-8 right-8 flex items-center gap-2 px-5 py-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 z-10">
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        <span className="font-bold tracking-[0.2em] uppercase text-xs md:text-sm">Tempo Real</span>
      </div>

      {/* Container Principal centralizado */}
      <div className="flex flex-col items-center justify-center gap-8 md:gap-12 w-full max-w-5xl px-6 md:px-8 mx-auto z-0">
        
        <div className={`w-full bg-stone-900/50 rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 flex flex-col items-center justify-center border transition-all duration-500 shadow-2xl ${pulse ? 'border-brand-500/50 scale-105 shadow-brand-500/20' : 'border-stone-800'}`}>
          <h2 className="text-stone-400 font-bold text-xl md:text-3xl mb-2 md:mb-4 uppercase tracking-wider">Faturamento Hoje</h2>
          <div className={`font-black text-6xl md:text-9xl tracking-tighter transition-colors duration-500 flex flex-wrap justify-center items-baseline ${pulse ? 'text-brand-400' : 'text-white'}`}>
            <span className="text-3xl md:text-6xl text-stone-500 mr-2 md:mr-4">R$</span>
            {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(faturamento)}
          </div>
        </div>

        <div className={`w-full bg-stone-900/50 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-center border transition-all duration-500 shadow-xl ${pulse ? 'border-brand-500/50 scale-105 shadow-brand-500/20' : 'border-stone-800'}`}>
          <h2 className="text-stone-400 font-bold text-lg md:text-2xl mb-1 md:mb-2 uppercase tracking-wider">Total de Pedidos</h2>
          <div className={`font-black text-7xl md:text-8xl tracking-tighter transition-colors duration-500 ${pulse ? 'text-brand-400' : 'text-white'}`}>
            {pedidosTotais}
          </div>
        </div>

      </div>
    </div>
  );
}
