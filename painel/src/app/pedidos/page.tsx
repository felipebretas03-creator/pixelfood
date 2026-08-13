"use client";
import { useState, useEffect, useRef } from 'react';
import { PackageOpen, Clock, Check, Bike, ArrowRight, Phone, MapPin, CreditCard, Printer } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { printOrderReceipt, PrintOrderData } from '@/lib/printer';

type OrderStatus = 'Novo' | 'Preparando' | 'Pronto' | 'Em Rota' | 'Finalizado';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  contact?: string;
  address?: string;
  paymentMethod?: string;
  items: string[];
  total: number;
  status: OrderStatus;
  time: string;
}

const mapStatusToFrontend = (dbStatus: string): OrderStatus => {
  switch (dbStatus) {
    case 'PENDING': return 'Novo';
    case 'PREPARING': return 'Preparando';
    case 'READY': return 'Pronto';
    case 'IN_TRANSIT': return 'Em Rota';
    case 'DELIVERED': return 'Finalizado';
    case 'CANCELLED': return 'Finalizado';
    default: return 'Novo';
  }
};

const mapFrontendToDb = (frontendStatus: OrderStatus): string => {
  switch (frontendStatus) {
    case 'Novo': return 'PENDING';
    case 'Preparando': return 'PREPARING';
    case 'Pronto': return 'READY';
    case 'Em Rota': return 'IN_TRANSIT';
    case 'Finalizado': return 'DELIVERED';
    default: return 'PENDING';
  }
};

const mockOrders: Order[] = [];

const COLUMNS: { title: string; status: OrderStatus; icon: React.ElementType; color: string; bgColor: string }[] = [
  { title: 'Novos', status: 'Novo', icon: PackageOpen, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-100' },
  { title: 'Na Cozinha', status: 'Preparando', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-100' },
  { title: 'Para Entregar', status: 'Pronto', icon: Check, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-100' },
  { title: 'Despachados', status: 'Em Rota', icon: Bike, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-100' },
];

export default function PedidosKanban() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [storeName, setStoreName] = useState('Restaurante');
  const autoPrintRef = useRef(false);
  const storeNameRef = useRef('Restaurante');

  // Mantém as refs sincronizadas para o socket acessar o valor atualizado
  useEffect(() => {
    autoPrintRef.current = autoPrint;
  }, [autoPrint]);

  useEffect(() => {
    storeNameRef.current = storeName;
  }, [storeName]);

  useEffect(() => {
    // 0. Fetch Settings for Store Name
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.storeName) {
          setStoreName(data.storeName);
        }
      })
      .catch(console.error);

    // 1. Fetch initial orders
    apiFetch('/api/orders')
      .then(res => res.json())
      .then((data: any[]) => {
        const formatted = data.map(dbOrder => ({
          id: dbOrder.id,
          orderNumber: `#${dbOrder.orderNumber}`,
          customer: dbOrder.customerNameSnapshot || 'Cliente',
          items: dbOrder.items.map((i: any) => {
            let str = `${i.quantity}x ${i.name}`;
            if (i.options && i.options.length > 0) {
              str += ` (+ ${i.options.map((opt: any) => `${opt.quantity}x ${opt.name}`).join(', ')})`;
            }
            if (i.observation) str += ` [Obs: ${i.observation}]`;
            return str;
          }),
          contact: dbOrder.customerPhoneSnapshot || dbOrder.customer?.phone || 'Sem contato',
          address: dbOrder.addressSnapshot || 'Retirada no Local',
          paymentMethod: dbOrder.paymentMethod === 'PIX_APP' || dbOrder.paymentMethod === 'MERCADO_PAGO_PIX' ? 'Pix' : dbOrder.paymentMethod === 'CASH' ? (dbOrder.changeForCents > 0 ? `Dinheiro (Troco para R$ ${((dbOrder.totalCents + dbOrder.changeForCents)/100).toFixed(2)})` : 'Dinheiro') : 'Cartão',
          total: dbOrder.totalCents / 100,
          status: mapStatusToFrontend(dbOrder.status),
          time: new Date(dbOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setOrders(formatted);
      })
      .catch(console.error);

    // 2. Listen for realtime orders
    let socket: any;
    let isMounted = true;
    import('socket.io-client').then(({ io }) => {
      if (!isMounted) return;
      socket = io('');
      socket.on('new_order', (dbOrder: any) => {
        const newOrder = {
          id: dbOrder.id,
          orderNumber: `#${dbOrder.orderNumber}`,
          customer: dbOrder.customerName,
          items: dbOrder.items.map((i: any) => {
            let str = `${i.quantity}x ${i.name}`;
            if (i.optionsData) {
              try {
                const options = JSON.parse(i.optionsData);
                if (options.length > 0) str += ` (+ ${options.join(', ')})`;
              } catch(e) {}
            }
            if (i.observation) str += ` [Obs: ${i.observation}]`;
            return str;
          }),
          contact: dbOrder.customer?.phone || 'Sem contato',
          address: dbOrder.addressStreet ? `${dbOrder.addressStreet}, ${dbOrder.addressNumber}${dbOrder.addressCity ? ' - ' + dbOrder.addressCity : ''}` : 'Retirada no Local',
          paymentMethod: dbOrder.paymentMethod === 'PIX' ? 'Pix' : dbOrder.paymentMethod === 'CASH' ? (dbOrder.needsChange ? `Dinheiro (Troco p/ ${dbOrder.changeAmount})` : 'Dinheiro') : 'Cartão',
          total: dbOrder.total,
          status: mapStatusToFrontend(dbOrder.status),
          time: new Date(dbOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        // Add to the top only if not already there
        setOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        
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

        // Imprime automaticamente se a opção estiver ligada
        if (autoPrintRef.current) {
          const printData: PrintOrderData = {
            orderNumber: dbOrder.orderNumber,
            customerName: dbOrder.customerName,
            phone: dbOrder.customer?.phone,
            address: dbOrder.addressStreet ? `${dbOrder.addressStreet}, ${dbOrder.addressNumber}${dbOrder.addressCity ? ' - ' + dbOrder.addressCity : ''}` : undefined,
            items: dbOrder.items.map((i: any) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              options: i.optionsData ? (() => { try { return JSON.parse(i.optionsData).join(', '); } catch { return undefined; } })() : undefined,
              observation: i.observation
            })),
            total: dbOrder.total,
            paymentMethod: dbOrder.paymentMethod === 'PIX' ? 'Pix' : dbOrder.paymentMethod === 'CASH' ? (dbOrder.needsChange ? `Dinheiro (Troco p/ ${dbOrder.changeAmount})` : 'Dinheiro') : 'Cartão',
            createdAt: new Date(dbOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            storeName: storeNameRef.current
          };
          printOrderReceipt(printData);
        }
      });

      socket.on('order_status_updated', (dbOrder: any) => {
        setOrders(prev => prev.map(o => 
          o.id === dbOrder.id 
            ? { ...o, status: mapStatusToFrontend(dbOrder.status) }
            : o
        ));
      });
    });

    return () => {
      isMounted = false;
      if (socket) {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.disconnect();
      }
    };
  }, []);

  const archivedOrders = orders.filter(o => o.status === 'Finalizado');

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o "drop"
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      // Otimisticamente atualiza a UI
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setDraggedOrderId(null);

      try {
        await apiFetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: mapFrontendToDb(newStatus) })
        });
      } catch (error) {
        console.error("Erro ao atualizar o status:", error);
      }
    }
  };

  const advanceStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const statusFlow: OrderStatus[] = ['Novo', 'Preparando', 'Pronto', 'Em Rota', 'Finalizado'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      
      // Otimisticamente atualiza a UI
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));

      try {
        await apiFetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: mapFrontendToDb(nextStatus) })
        });
      } catch (error) {
        console.error("Erro ao avançar o status:", error);
      }
    }
  };

  const handleManualPrint = (order: Order) => {
    // Para simplificar a reconstrução dos itens a partir das strings, passamos os textos diretos
    const printData: PrintOrderData = {
      orderNumber: order.orderNumber.replace('#', ''),
      customerName: order.customer,
      phone: order.contact !== 'Sem contato' ? order.contact : undefined,
      address: order.address !== 'Retirada no Local' ? order.address : undefined,
      items: order.items.map(itemStr => {
        const match = itemStr.match(/^(\d+)x\s(.+)$/);
        return {
          quantity: match ? parseInt(match[1]) : 1,
          name: match ? match[2] : itemStr,
          price: 0 // No frontend os itens já viraram string formatada, preço não fica detalhado por item
        };
      }),
      total: order.total,
      paymentMethod: order.paymentMethod || 'Cartão',
      createdAt: order.time,
      storeName: storeName
    };
    printOrderReceipt(printData);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Pedidos Ativos</h1>
          <p className="text-stone-500 font-medium mt-1">Acompanhe e gerencie a fila de produção.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setAutoPrint(!autoPrint)}
            className={`px-4 py-2.5 rounded-full font-bold shadow-sm transition-all flex items-center gap-2 text-sm border ${autoPrint ? 'bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-100' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
            title="Se ativado, os pedidos novos serão enviados para a impressora automaticamente"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Auto Print</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${autoPrint ? 'bg-brand-500' : 'bg-stone-300'}`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${autoPrint ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
          
          <button 
            onClick={() => setShowArchived(true)}
            className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-full font-bold shadow-sm hover:bg-stone-300 transition-all flex items-center gap-2 text-sm"
          >
            Ver Arquivados ({archivedOrders.length})
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter(o => o.status === col.status);
          
          return (
            <div 
              key={col.status} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className="flex-shrink-0 w-80 flex flex-col bg-stone-100/50 rounded-3xl p-4 border border-stone-200/60"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <col.icon className={`w-5 h-5 ${col.color}`} />
                  <h3 className="font-bold text-stone-900">{col.title}</h3>
                </div>
                <span className="bg-white text-stone-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto hide-scrollbar flex-1 pb-4">
                {colOrders.map(order => (
                  <div 
                    key={order.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onDragEnd={() => setDraggedOrderId(null)}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${col.bgColor} ${draggedOrderId === order.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-lg text-stone-900">{order.orderNumber}</span>
                      <div className="flex gap-2 items-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleManualPrint(order); }}
                          className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1 rounded-md transition-colors"
                          title="Imprimir Cupom"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-stone-500 bg-white px-2 py-1 rounded-md border border-stone-100">
                          {order.time}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3 space-y-1.5">
                      <p className="font-bold text-stone-800">{order.customer}</p>
                      <p className="text-xs text-stone-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-stone-400" /> {order.contact}</p>
                      <p className="text-xs text-stone-600 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-400" /> <span className="line-clamp-2">{order.address}</span></p>
                      <p className="text-xs text-stone-600 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-stone-400" /> {order.paymentMethod}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1 mb-4 pt-3 border-t border-stone-100">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-stone-600 line-clamp-1 flex items-center gap-2 before:w-1 before:h-1 before:bg-stone-300 before:rounded-full">
                          {item}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
                      <span className="font-bold text-stone-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      <button 
                        type="button"
                        onClick={() => advanceStatus(order.id, order.status)}
                        className={`flex items-center justify-center w-8 h-8 border rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all ${
                          col.status === 'Em Rota' 
                            ? 'bg-green-500 border-green-600 text-white hover:bg-green-600' 
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                        title={col.status === 'Em Rota' ? "Concluir pedido" : "Avançar pedido"}
                      >
                        {col.status === 'Em Rota' ? <Check className="w-4 h-4 pointer-events-none" /> : <ArrowRight className="w-4 h-4 pointer-events-none" />}
                      </button>
                    </div>
                  </div>
                ))}

                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-center px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-white/50">
                    <p className="text-sm font-medium text-stone-400">Nenhum pedido aqui</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showArchived && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-stone-900">Pedidos Finalizados (Arquivados)</h2>
              <button 
                onClick={() => setShowArchived(false)} 
                className="text-stone-400 hover:text-stone-900 font-bold bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-4 hide-scrollbar">
              {archivedOrders.length === 0 ? (
                <p className="text-center text-stone-500 py-12 font-medium">Nenhum pedido foi arquivado ainda.</p>
              ) : (
                archivedOrders.map(order => (
                  <div key={order.id} className="border border-stone-200 rounded-2xl p-4 flex justify-between items-center bg-stone-50/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-stone-900">{order.orderNumber}</span>
                        <span className="text-xs font-bold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-md">
                          {order.time}
                        </span>
                      </div>
                      <p className="text-stone-600 font-medium text-sm">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      <p className="text-xs font-bold text-green-600 mt-1 uppercase tracking-wider flex items-center gap-1 justify-end">
                        <Check className="w-3 h-3" />
                        Entregue
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
