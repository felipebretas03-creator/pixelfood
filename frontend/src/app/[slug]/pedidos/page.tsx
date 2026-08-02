/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useOrderStore, Order, OrderStatus } from "@/store/orderStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function PedidosPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [mounted, setMounted] = useState(false);
  const orders = useOrderStore((state) => state.orders);
  const addItem = useCartStore((state) => state.addItem);

  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      addItem({
        id: item.id,
        restaurantId: "1",
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    });
    router.push(`/${slug}/carrinho`);
  };

  const activeOrders = orders.filter(o => ['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT'].includes(o.status));
  const historyOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return { text: 'Recebido', color: 'text-blue-500', bg: 'bg-blue-50', icon: Clock };
      case 'PREPARING': return { text: 'Preparando', color: 'text-orange-500', bg: 'bg-orange-50', icon: Package };
      case 'READY': return { text: 'Pronto', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 };
      case 'IN_TRANSIT': return { text: 'A caminho', color: 'text-brand-500', bg: 'bg-brand-50', icon: Package };
      case 'DELIVERED': return { text: 'Entregue', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 };
      case 'CANCELLED': return { text: 'Cancelado', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle };
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderOrderCard = (order: Order, isHistory: boolean) => {
    const StatusIcon = getStatusInfo(order.status).icon;
    const itemsSummary = order.items.length === 1 
      ? `1x ${order.items[0].name}`
      : `1x ${order.items[0].name} e mais ${order.items.length - 1} ${order.items.length - 1 === 1 ? 'item' : 'itens'}`;

    return (
      <div key={order.id} className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-100 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-stone-400 font-bold tracking-wider">{formatDate(order.date)}</span>
            <h3 className="font-bold text-stone-900 text-base mt-1">Pedido {order.orderNumber ? order.orderNumber.replace('ORD-', '#') : '#' + order.id.split('-')[1]}</h3>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wide ${getStatusInfo(order.status).bg} ${getStatusInfo(order.status).color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {getStatusInfo(order.status).text}
          </div>
        </div>

        <div className="flex flex-col gap-1 py-3 border-y border-stone-50 border-dashed">
          <p className="text-sm text-stone-600 font-medium">{itemsSummary}</p>
          <span className="font-bold text-stone-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
        </div>

        {isHistory ? (
          <button 
            onClick={() => handleReorder(order)}
            className="w-full bg-stone-100 text-stone-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Pedir Novamente
          </button>
        ) : (
          <Link 
            href={`/pedidos/${order.id}`}
            className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-transform"
          >
            Acompanhar Pedido
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col pb-24 bg-stone-50 min-h-screen">
      <header className="px-6 pt-12 pb-4 flex items-center bg-white sticky top-0 z-40 shadow-sm shadow-stone-100/50">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center bg-white shadow-sm active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5 text-stone-600" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-stone-900 pr-10">Meus Pedidos</h1>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-6 pb-2">
        <div className="bg-stone-200/50 p-1 rounded-2xl flex gap-1 relative">
          <button 
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${activeTab === 'ACTIVE' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
          >
            Em andamento
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${activeTab === 'HISTORY' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
          >
            Histórico
          </button>
        </div>
      </div>

      {/* Order List */}
      <div className="px-6 mt-4 flex flex-col gap-4">
        {mounted ? (
          activeTab === 'ACTIVE' ? (
            activeOrders.length > 0 ? (
              activeOrders.map(order => renderOrderCard(order, false))
            ) : (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Nenhum pedido ativo</h3>
                <p className="text-stone-500 text-sm">Você não possui pedidos em andamento no momento.</p>
                <Link href={`/${slug}/`} className="mt-6 font-bold text-brand-500 hover:underline">Fazer um pedido</Link>
              </div>
            )
          ) : (
            historyOrders.length > 0 ? (
              historyOrders.map(order => renderOrderCard(order, true))
            ) : (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-1">Seu histórico está vazio</h3>
                <p className="text-stone-500 text-sm">Faça seu primeiro pedido para aparecer aqui.</p>
              </div>
            )
          )
        ) : null}
      </div>
    </main>
  );
}
