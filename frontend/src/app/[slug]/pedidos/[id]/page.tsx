"use client";
import { apiFetch } from '@/lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useOrderStore, Order } from "@/store/orderStore";
import { ChevronLeft, MessageCircle, MapPin, Receipt, Clock, Package, CheckCircle2, ChevronRight, MessageSquare, XCircle, CreditCard, Banknote, QrCode } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const routerParams = useParams();
  const slug = routerParams?.slug as string;

  const resolvedParams = use(params);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  const orders = useOrderStore(state => state.orders);
  const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);
  const address = useUserStore(state => state.address);

  useEffect(() => {
    apiFetch(`/api/orders/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setOrder({
            id: data.id,
            tenantId: data.tenantId,
            orderNumber: data.orderNumber,
            date: data.createdAt,
            status: data.status,
            total: data.totalCents / 100,
            items: data.items.map((i: any) => ({
              ...i,
              price: i.priceCents / 100,
            })),
            paymentMethod: data.paymentMethod,
            needsChange: data.paymentMethod === 'CASH' && data.changeForCents > 0,
            changeAmount: data.paymentMethod === 'CASH' && data.changeForCents > 0 ? ((data.totalCents + data.changeForCents)/100).toFixed(2) : undefined,
            address: data.addressSnapshot ? {
              street: data.addressSnapshot,
              number: '',
              neighborhood: ''
            } : undefined,
            observation: data.notes
          } as any);
        }
      })
      .catch(console.error)
      .finally(() => setMounted(true));
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!order?.tenantId) return;

    let socket: any;
    import('socket.io-client').then(({ io }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log("Conectando Socket.io cliente na URL:", apiUrl);
      
      socket = io(apiUrl);
      
      socket.on('connect', () => {
        console.log("Socket cliente conectado!", socket.id);
        socket.emit('join_restaurant', order.tenantId);
      });

      socket.on('order_status_updated', (dbOrder: any) => {
        console.log("Evento order_status_updated recebido:", dbOrder);
        if (dbOrder.id === resolvedParams.id) {
          setOrder((prev: any) => prev ? { ...prev, status: dbOrder.status } : null);
          updateOrderStatus(dbOrder.id, dbOrder.status);
        }
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [order?.tenantId, resolvedParams.id]);

  if (!mounted || !order) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Status mapping for timeline
  const timelineSteps = [
    { key: 'CONFIRMED', label: 'Pedido Aceito', icon: CheckCircle2, completed: true },
    { key: 'PREPARING', label: 'Preparando', icon: Clock, completed: ['PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) },
    { key: 'IN_TRANSIT', label: 'A Caminho', icon: Package, completed: ['IN_TRANSIT', 'DELIVERED'].includes(order.status) },
    { key: 'DELIVERED', label: 'Entregue', icon: CheckCircle2, completed: order.status === 'DELIVERED' }
  ];

  const handleWhatsApp = () => {
    // Numero ficticio do restaurante
    const phone = "5511999999999";
    const msg = encodeURIComponent(`Olá! Gostaria de falar sobre o meu pedido ${(order as any).orderNumber || order.id}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleCancel = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancel = () => {
    updateOrderStatus(order.id, 'CANCELLED');
    setIsCancelModalOpen(false);
  };

  return (
    <main className="flex-1 flex flex-col pb-24 bg-stone-50 min-h-screen">
      <header className="px-6 pt-12 pb-4 flex items-center bg-white sticky top-0 z-40 shadow-sm shadow-stone-100/50">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center bg-white shadow-sm active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5 text-stone-600" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-stone-900 pr-10">Pedido {(order as any).orderNumber || `#${order.id.split('-')[1]}`}</h1>
      </header>

      {/* Date & Alert (If Cancelled) */}
      <div className="px-6 py-4">
        <p className="text-center text-sm font-medium text-stone-500 mb-2">Realizado em {formatDate(order.date)}</p>
        
        {order.status === 'CANCELLED' && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-red-600 text-lg mb-1">Pedido Cancelado</h3>
            <p className="text-sm text-red-500/80">Este pedido foi cancelado pelo restaurante.</p>
          </div>
        )}
      </div>

      {/* Timeline (Only if not cancelled) */}
      {order.status !== 'CANCELLED' && (
        <section className="px-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-100">
            <h2 className="font-bold text-stone-900 mb-5">Status da Entrega</h2>
            
            <div className="flex flex-col gap-0 relative">
              {/* Vertical line connector */}
              <div className="absolute left-[15px] top-[20px] bottom-[20px] w-0.5 bg-stone-100 z-0"></div>
              
              {timelineSteps.map((step, index) => {
                const Icon = step.icon;
                const isLastCompleted = step.completed && (!timelineSteps[index + 1]?.completed);
                return (
                  <div key={step.key} className="flex gap-4 relative z-10 pb-6 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      step.completed ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="pt-1.5 flex-1">
                      <h4 className={`text-sm font-bold ${step.completed ? 'text-stone-900' : 'text-stone-400'}`}>
                        {step.label}
                      </h4>
                      {isLastCompleted && order.status !== 'DELIVERED' && (
                        <p className="text-xs text-brand-500 font-medium mt-0.5 animate-pulse">Atualizado agora...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Delivery Address */}
      <section className="px-6 mb-6">
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-100 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-stone-900 mb-1">Endereço de Entrega</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              {order.address?.street ? (
                order.address.street
              ) : address ? (
                `${address.street || ''}, ${address.number || ''} - ${address.neighborhood || ''}`
              ) : (
                "Rua Exemplo, 123 - Centro"
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Payment Method */}
      {order.paymentMethod && (
        <section className="px-6 mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-100 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
              {(order.paymentMethod === 'PIX_APP' || order.paymentMethod === 'MERCADO_PAGO_PIX') && <QrCode className="w-5 h-5" />}
              {order.paymentMethod === 'CREDIT_CARD' && <CreditCard className="w-5 h-5" />}
              {order.paymentMethod === 'CASH' && <Banknote className="w-5 h-5" />}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-stone-900 mb-1">Forma de Pagamento</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {order.paymentMethod === 'PIX_APP' || order.paymentMethod === 'MERCADO_PAGO_PIX' ? 'Pix' : ''}
                {order.paymentMethod === 'CREDIT_CARD' && 'Cartão de Crédito'}
                {order.paymentMethod === 'CASH' && (
                  <>Dinheiro {order.needsChange && order.changeAmount ? `(Troco para R$ ${order.changeAmount.replace('.', ',')})` : "(Sem troco)"}</>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Order Summary */}
      <section className="px-6 mb-8">
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-100">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-50 border-dashed">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900">Resumo do Pedido</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {order.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600"><span className="font-bold text-stone-900">{item.quantity}x</span> {item.name}</span>
                  <span className="font-medium text-stone-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
                {item.observation && (
                  <span className="text-xs text-stone-500 italic pl-5">Obs: {item.observation}</span>
                )}
              </div>
            ))}
          </div>

          {order.observation && (
            <div className="mt-4 pt-4 border-t border-stone-50 border-dashed">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Observações do Cliente</span>
              <p className="text-sm text-stone-700 italic bg-stone-50 p-3 rounded-xl border border-stone-100">
                "{order.observation}"
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-stone-50 border-dashed flex justify-between items-center">
            <span className="font-bold text-stone-900">Total Pago</span>
            <span className="font-bold text-brand-500 text-lg">R$ {order.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </section>

      {/* Support Button */}
      <section className="px-6 pb-6 flex flex-col gap-3">
        <button 
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 active:scale-[0.98] transition-transform"
        >
          <MessageSquare className="w-5 h-5" />
          Falar com o Restaurante
        </button>

        {order.status === 'PENDING' && (
          <button 
            onClick={handleCancel}
            className="w-full bg-red-50 text-red-500 border border-red-100 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            <XCircle className="w-5 h-5" />
            Cancelar Pedido
          </button>
        )}
      </section>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 text-center mb-2">Cancelar Pedido?</h3>
            <p className="text-stone-500 text-center text-sm mb-6 leading-relaxed">
              Você tem certeza que deseja cancelar este pedido? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-[0.98] transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={confirmCancel}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-[0.98] transition-all"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
