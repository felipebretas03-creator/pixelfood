"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Lock, Loader2, X, Printer, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { printFechamentoReceipt } from '@/lib/printer';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [data, setData] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    chartData: [],
    recentOrders: []
  });
  const [isClosing, setIsClosing] = useState(false);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [closureData, setClosureData] = useState<any>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const { tenant } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (tenant?.isMaster) {
      router.push('/master');
    }
  }, [tenant, router]);

  const fetchDashboard = () => {
    apiFetch('/api/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          console.error('API Error:', json.error);
          return;
        }
        setData(json);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboard();

    let socket: any;
    let isMounted = true;
    import('socket.io-client').then(({ io }) => {
      if (!isMounted) return;
      socket = io('');
      socket.on('new_order', () => {
        // Play notification sound
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
        
        // Refresh dashboard data
        fetchDashboard();
      });
    });

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, []);

  const handleCloseRegister = async () => {
    setIsClosing(true);
    try {
      const response = await apiFetch('/api/dashboard/fechamento');
      const json = await response.json();
      
      // Busca o nome do restaurante atual para o cabeçalho do cupom
      let storeName = 'Restaurante';
      try {
        const settingsRes = await apiFetch('/api/settings');
        const settingsJson = await settingsRes.json();
        if (settingsJson && settingsJson.storeName) storeName = settingsJson.storeName;
      } catch(e) {}

      setClosureData({ ...json, storeName });
      setIsClosureModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar dados do caixa:', error);
      alert('Houve um erro ao buscar os dados de fechamento.');
    } finally {
      setIsClosing(false);
    }
  };

  const confirmClosure = () => {
    // Em um sistema real, aqui você faria um POST /api/dashboard/fechar 
    // para registrar no banco que o caixa foi fechado e resetar os totais para amanhã.
    setIsClosureModalOpen(false);
    setClosureData(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  if (tenant?.isMaster) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Visão Geral</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-stone-500 hidden sm:block">Últimos 30 dias</div>
          <button 
            onClick={handleCloseRegister}
            disabled={isClosing}
            className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full font-bold shadow-sm hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Fechar Caixa
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="text-stone-500 font-medium mb-2">Faturamento Bruto</h3>
          <p className="text-3xl font-bold text-stone-900">
            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.totalRevenue || 0)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="text-stone-500 font-medium mb-2">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-stone-900">
            {data.totalOrders || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="text-stone-500 font-medium mb-2">Ticket Médio</h3>
          <p className="text-3xl font-bold text-stone-900">
            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.averageTicket || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 lg:col-span-2">
          <h3 className="font-bold text-stone-900 mb-6">Faturamento por Dia</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
                />
                <Bar dataKey="vendas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pedidos Recentes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-900">Pedidos Recentes</h3>
            <Link href="/pedidos" className="text-brand-500 hover:text-brand-600 text-sm font-semibold flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex flex-col gap-4 flex-1">
            {data.recentOrders?.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-4">Nenhum pedido recente.</p>
            )}
            {data.recentOrders?.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between pb-4 border-b border-stone-50 last:border-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-stone-900">{order.orderNumber}</span>
                    <span className="text-xs text-stone-500 font-medium px-2 py-0.5 bg-stone-100 rounded-full">
                      {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.total)}</p>
                  <p className={`text-xs font-semibold mt-1 ${
                    order.status === 'PENDING' ? 'text-blue-500' :
                    order.status === 'PREPARING' ? 'text-amber-500' :
                    order.status === 'IN_TRANSIT' ? 'text-purple-500' : 
                    order.status === 'DELIVERED' ? 'text-green-500' : 'text-stone-500'
                  }`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Fechamento de Caixa */}
      {isClosureModalOpen && closureData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-500" /> Fechamento de Caixa
              </h2>
              <button onClick={() => setIsClosureModalOpen(false)} className="text-stone-400 hover:text-stone-600 p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-stone-500 font-medium text-sm">Faturamento Total do Dia</p>
                <p className="text-4xl font-black text-brand-500 tracking-tight mt-1">
                  R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(closureData.totalRevenue)}
                </p>
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600 font-medium">Quantidade de Pedidos</span>
                  <span className="font-bold text-stone-900 text-base">{closureData.totalOrders}</span>
                </div>
                
                <div className="h-px bg-stone-200/60 w-full" />
                
                <div className="space-y-3">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Por Meio de Pagamento</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">PIX</span>
                    <span className="font-bold text-stone-900">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(closureData.byMethod.pix)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Dinheiro</span>
                    <span className="font-bold text-stone-900">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(closureData.byMethod.cash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Cartão</span>
                    <span className="font-bold text-stone-900">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(closureData.byMethod.card)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => printFechamentoReceipt(closureData)}
                  className="flex-1 bg-stone-100 text-stone-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir
                </button>
                <button 
                  onClick={confirmClosure}
                  className="flex-[2] bg-brand-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/30"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Fechamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-stone-900/20 flex items-center gap-3">
            <div className="bg-emerald-500/20 p-1.5 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="font-bold text-sm tracking-wide">Caixa fechado com sucesso!</p>
          </div>
        </div>
      )}
    </div>
  );
}
