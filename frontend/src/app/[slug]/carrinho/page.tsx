"use client";
import { apiFetch } from '@/lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import { useUserStore } from "@/store/userStore";
import { useToastStore } from "@/store/toastStore";
import { ArrowLeft, Minus, Plus, CreditCard, Banknote, QrCode, ShoppingCart, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { BottomNavigation } from "@/components/BottomNavigation";
import { AddressModal } from "@/components/AddressModal";

export default function CarrinhoPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const { items, updateQuantity, clearCart } = useCartStore();
  const addOrder = useOrderStore(state => state.addOrder);
  const addToast = useToastStore((state) => state.addToast);
  const { address, isAuthenticated, userName, userPhone, setPhone } = useUserStore();
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD_ONLINE' | 'CREDIT_CARD_OFFLINE' | 'CASH'>('PIX');
  const [needsChange, setNeedsChange] = useState<boolean>(false);
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [taxa, setTaxa] = useState<number>(0);
  
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const [cardModalOpen, setCardModalOpen] = useState(false);

  const [deliverySettings, setDeliverySettings] = useState<any>(null);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/settings').then(res => res.json()),
      apiFetch('/api/neighborhoods').then(res => res.json()).catch(() => [])
    ]).then(([settingsData, neighborhoodsData]) => {
      if (settingsData) {
        setDeliverySettings(settingsData);
      }
      if (Array.isArray(neighborhoodsData)) {
        setNeighborhoods(neighborhoodsData);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (deliverySettings?.mpPublicKey) {
      initMercadoPago(deliverySettings.mpPublicKey, { locale: 'pt-BR' });
    }
  }, [deliverySettings?.mpPublicKey]);

  useEffect(() => {
    if (!deliverySettings) return;

    if (deliverySettings.deliveryType === 'free') {
      setTaxa(0);
    } else if (deliverySettings.deliveryType === 'neighborhood') {
      if (address?.neighborhood) {
        // Find exact match (city and neighborhood)
        const exactMatch = neighborhoods.find(n => 
          n.neighborhood && 
          n.neighborhood.toLowerCase() === address.neighborhood?.toLowerCase() &&
          (!address.city || n.city.toLowerCase() === address.city.toLowerCase())
        );

        // Find city-wide match (neighborhood is empty)
        const cityMatch = neighborhoods.find(n => 
          !n.neighborhood &&
          (!address.city || n.city.toLowerCase() === address.city.toLowerCase())
        );
        
        if (exactMatch) {
          setTaxa(exactMatch.fee);
        } else if (cityMatch) {
          setTaxa(cityMatch.fee);
        } else {
          // Find max fee
          if (neighborhoods.length > 0) {
            const maxFee = Math.max(...neighborhoods.map(n => Number(n.fee)));
            setTaxa(maxFee);
          } else {
            setTaxa(Number(deliverySettings.deliveryFee) || 0);
          }
        }
      } else {
        setTaxa(0); // Before address is entered
      }
    } else {
      setTaxa(Number(deliverySettings.deliveryFee) || 0);
    }
  }, [deliverySettings, neighborhoods, address?.neighborhood, address?.city]);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const res = await apiFetch('/api/orders/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        addToast("Cupom aplicado com sucesso!");
      }
    } catch (e) {
      setCouponError('Erro ao validar cupom');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = total * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'FIXED') {
      discountAmount = appliedCoupon.value;
    } else if (appliedCoupon.type === 'DELIVERY') {
      // Free delivery
      discountAmount = taxa;
    }
  }

  const grandTotal = Math.max(0, total + taxa - discountAmount);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-white p-6 min-h-screen text-center pb-24">
        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6 text-brand-500">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Falta pouco!</h2>
        <p className="text-stone-500 mb-8 font-medium">Faça login ou crie uma conta grátis para ver seu carrinho e finalizar o pedido.</p>
        
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Link href={`/${slug}/login`} className="w-full bg-brand-500 text-white rounded-full py-4 font-bold shadow-lg shadow-brand-500/30 active:scale-[0.98] transition-all">
            Fazer Login
          </Link>
          <Link href={`/${slug}/cadastro`} className="w-full bg-stone-100 text-stone-900 rounded-full py-4 font-bold active:scale-[0.98] transition-all hover:bg-stone-200">
            Criar Conta
          </Link>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleCheckout = async () => {
    if (isCheckoutLoading) return;
    
    if (!address || !address.street || !address.number) {
      addToast("⚠️ Selecione um endereço de entrega para continuar.");
      setIsAddressModalOpen(true);
      return;
    }
    
    if (!userPhone || userPhone.length < 10) {
      addToast("⚠️ Informe um número de telefone válido.");
      return;
    }

    setIsCheckoutLoading(true);

    const orderData = {
      customerName: userName || "Cliente",
      customerPhone: userPhone,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountAmount,
      total: grandTotal,
      paymentMethod,
      needsChange,
      changeAmount: changeAmount ? parseFloat(changeAmount) : null,
      addressStreet: address?.street || "Rua Exemplo",
      addressNumber: address?.number || "123",
      addressCity: address?.city || "São Paulo",
      observation: observation.trim() || undefined,
      items: items.map(item => ({
        productId: item.productId || (item.id.startsWith('prod-') ? null : item.id),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        observation: item.observation,
        options: item.options
      }))
    };

    if (paymentMethod === 'CREDIT_CARD_ONLINE') {
      if (!deliverySettings?.mpPublicKey) {
        addToast("Loja não configurada para cartão online.");
        return;
      }
      setCardModalOpen(true);
      return; 
    }

    try {
      const endpoint = paymentMethod === 'PIX' ? '/api/checkout/pix' : '/api/orders';
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Erro ao processar pedido no servidor');
      }
      
      if (paymentMethod === 'PIX' && responseData.pix) {
        setPixData(responseData.pix);
        setPendingOrderId(responseData.order.id);
        setPixModalOpen(true);
        // Start polling order status
        const interval = setInterval(async () => {
          try {
            const checkRes = await apiFetch(`/api/orders/${responseData.order.id}`);
            const checkData = await checkRes.json();
            if (checkData.status !== 'PAYMENT_PENDING' && checkData.status !== 'CANCELLED') {
              clearInterval(interval);
              clearCart();
              addToast("Pagamento PIX confirmado!");
              router.push(`/pedidos/${responseData.order.id}`);
            }
          } catch(e) {}
        }, 3000);
      } else {
        clearCart();
        addToast("Pedido realizado com sucesso!");
        router.push(`/pedidos/${responseData.id || responseData.order?.id}`);
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro ao processar pedido");
      setIsCheckoutLoading(false);
    }
  };

  const onSubmitCard = (param: any) => {
    return new Promise<void>(async (resolve, reject) => {
      setIsCheckoutLoading(true);
      const orderData = {
        customerName: userName || "Cliente",
        customerPhone: userPhone,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount,
        total: grandTotal,
        paymentMethod,
        needsChange,
        changeAmount: null,
        addressStreet: address?.street || "Rua Exemplo",
        addressNumber: address?.number || "123",
        addressCity: address?.city || "São Paulo",
        observation: observation.trim() || undefined,
        items: items.map(item => ({
          productId: item.productId || (item.id.startsWith('prod-') ? null : item.id),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          observation: item.observation,
          options: item.options
        })),
        paymentData: param.formData // Token, installments, etc from MP Brick
      };

      try {
        const res = await apiFetch('/api/checkout/card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        const responseData = await res.json();
        
        if (!res.ok) {
          throw new Error(responseData.error || 'Erro ao processar cartão');
        }
        
        setCardModalOpen(false);
        clearCart();
        addToast("Pagamento aprovado!");
        router.push(`/pedidos/${responseData.order.id}`);
        resolve(); // Tells MP Brick that payment was successful
      } catch (err: any) {
        console.error("Payment error:", err);
        addToast(err.message || "Erro ao processar pagamento");
        setCardModalOpen(false); // Force close the modal on error
        reject(); // Tells MP Brick that payment failed
      } finally {
        setIsCheckoutLoading(false);
      }
    });
  };

  if (items.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen bg-white px-6">
        <div className="w-40 h-40 bg-stone-50 rounded-full flex items-center justify-center mb-6">
          <img src="https://illustrations.popsy.co/amber/surreal-hourglass.svg" alt="Empty Cart" className="w-24 h-24 opacity-60" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-stone-500 text-center mb-8">Adicione pratos deliciosos ao seu carrinho para continuar.</p>
        <Link href={`/${slug}/`} className="bg-brand-500 text-white rounded-full py-4 px-8 font-bold shadow-lg shadow-brand-500/30">
          Explorar Restaurantes
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pb-80 bg-white min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-50">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Meu Carrinho</h1>
      </header>

      {/* Item List */}
      <div className="px-6 py-6 flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="w-24 h-24 rounded-2xl bg-stone-100 flex-shrink-0 overflow-hidden">
               <img src="https://images.unsplash.com/photo-1512152272829-e3139592d56f?q=80&w=400&auto=format&fit=crop" alt="Comida" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex-1">
                <h3 className="font-bold text-stone-900 leading-tight mb-1">{item.name}</h3>
                <p className="text-brand-500 font-bold mb-2">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                
                {item.options && item.options.length > 0 && (
                  <p className="text-xs text-stone-500 mb-1 leading-relaxed">
                    <span className="font-semibold text-stone-700">Opções:</span> {item.options.join(', ')}
                  </p>
                )}
                
                {item.observation && (
                  <p className="text-xs text-stone-500 italic mb-2 line-clamp-2">
                    <span className="font-semibold text-stone-700">Obs:</span> {item.observation}
                  </p>
                )}
                
                <div className="flex items-center gap-3 bg-stone-50 rounded-full px-2 py-1 w-max mt-2">
                  <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))} className="w-7 h-7 flex items-center justify-center text-stone-600 bg-white rounded-full shadow-sm">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm min-w-[1rem] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-white bg-brand-500 rounded-full shadow-sm shadow-brand-500/20">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Endereço de Entrega */}
      <div className="px-6 pb-6">
        <h3 className="font-bold text-stone-900 mb-3">Endereço de Entrega</h3>
        <button 
          onClick={() => setIsAddressModalOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl active:scale-[0.98] transition-transform hover:border-brand-500 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left flex flex-col">
              {address && address.street ? (
                <>
                  <span className="font-bold text-stone-900">{address.street}, {address.number}</span>
                  <span className="text-xs text-stone-500">{address.neighborhood || 'Bairro'} - {address.city || 'Cidade'}</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-stone-900">Nenhum endereço</span>
                  <span className="text-xs text-brand-500 font-medium">Toque para adicionar</span>
                </>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-brand-500" />
        </button>
      </div>

      {/* Telefone */}
      <div className="px-6 pb-6">
        <h3 className="font-bold text-stone-900 mb-3">Seu Telefone</h3>
        <input
          type="tel"
          value={userPhone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onBlur={async () => {
            if (isAuthenticated && userPhone) {
              try {
                await apiFetch('/api/customer/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone: userPhone })
                });
              } catch (e) {
                console.error('Erro ao salvar telefone', e);
              }
            }
          }}
          placeholder="(11) 99999-9999"
          className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
        />
      </div>

      {/* Cupom */}
      <div className="px-6 pb-6">
        <h3 className="font-bold text-stone-900 mb-3">Cupom de Desconto</h3>
        {!appliedCoupon ? (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Ex: BEMVINDO10"
                className="flex-1 bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 outline-none focus:border-brand-500 uppercase"
              />
              <button 
                onClick={applyCoupon}
                className="bg-brand-500 text-white font-bold px-6 rounded-2xl active:scale-95 transition-transform"
              >
                Aplicar
              </button>
            </div>
            {couponError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{couponError}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-4">
            <div>
              <span className="text-green-600 font-bold text-sm block">Cupom Aplicado!</span>
              <span className="text-green-800 font-bold">{appliedCoupon.code}</span>
            </div>
            <button onClick={removeCoupon} className="text-stone-400 font-bold text-sm underline hover:text-stone-600">Remover</button>
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="px-6 pb-6">
        <h3 className="font-bold text-stone-900 mb-3">Observações da Entrega</h3>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Ex: Campainha quebrada, deixar na portaria, etc..."
          className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-sm text-stone-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none h-24"
        />
      </div>

      {/* Payment Methods */}
      <div className="px-6 pb-6">
        <h3 className="font-bold text-stone-900 mb-3">Forma de Pagamento</h3>
        <div className="flex flex-col gap-3">
          {/* PIX Option */}
          {deliverySettings?.acceptPix !== false && (
            <button 
              onClick={() => setPaymentMethod('PIX')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                paymentMethod === 'PIX' ? 'border-brand-500 bg-brand-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                paymentMethod === 'PIX' ? 'bg-brand-500 text-white' : 'bg-white text-stone-400'
              }`}>
                <QrCode className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-stone-900">PIX (Automático)</div>
                <div className="text-sm text-stone-500 font-medium">Aprovação imediata</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'PIX' ? 'border-brand-500' : 'border-stone-300'
              }`}>
                {paymentMethod === 'PIX' && <div className="w-3 h-3 bg-brand-500 rounded-full" />}
              </div>
            </button>
          )}

          {/* Credit Card Online Option */}
          {deliverySettings?.acceptCreditCardOnline !== false && deliverySettings?.mpPublicKey && (
            <button 
              onClick={() => setPaymentMethod('CREDIT_CARD_ONLINE')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                paymentMethod === 'CREDIT_CARD_ONLINE' ? 'border-brand-500 bg-brand-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                paymentMethod === 'CREDIT_CARD_ONLINE' ? 'bg-brand-500 text-white' : 'bg-white text-stone-400'
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-stone-900">Cartão de Crédito Online</div>
                <div className="text-sm text-stone-500 font-medium">Pague agora pelo app</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'CREDIT_CARD_ONLINE' ? 'border-brand-500' : 'border-stone-300'
              }`}>
                {paymentMethod === 'CREDIT_CARD_ONLINE' && <div className="w-3 h-3 bg-brand-500 rounded-full" />}
              </div>
            </button>
          )}

          {/* Credit Card Offline Option */}
          {deliverySettings?.acceptCardMachine !== false && (
            <button 
              onClick={() => setPaymentMethod('CREDIT_CARD_OFFLINE')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                paymentMethod === 'CREDIT_CARD_OFFLINE' ? 'border-brand-500 bg-brand-50' : 'border-stone-100 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                paymentMethod === 'CREDIT_CARD_OFFLINE' ? 'bg-brand-500 text-white' : 'bg-white text-stone-400'
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-stone-900">Cartão na Entrega</div>
                <div className="text-sm text-stone-500 font-medium">Levamos a maquininha</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'CREDIT_CARD_OFFLINE' ? 'border-brand-500' : 'border-stone-300'
              }`}>
                {paymentMethod === 'CREDIT_CARD_OFFLINE' && <div className="w-3 h-3 bg-brand-500 rounded-full" />}
              </div>
            </button>
          )}

          {/* Dinheiro */}
          {deliverySettings?.acceptCash !== false && (
            <div className={`flex flex-col gap-3 rounded-2xl border transition-all overflow-hidden ${paymentMethod === 'CASH' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-stone-200 bg-white'}`}>
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className="flex items-center gap-4 p-4 w-full"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'CASH' ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-stone-900">Dinheiro</h4>
                  <p className="text-xs text-stone-500">Pagamento na entrega</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CASH' ? 'border-brand-500' : 'border-stone-300'}`}>
                  {paymentMethod === 'CASH' && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                </div>
              </button>

              {/* Opções de troco (mostra apenas se selecionado) */}
              {paymentMethod === 'CASH' && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-3">
                    <span className="font-bold text-sm text-stone-800">Precisa de troco?</span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setNeedsChange(false); setChangeAmount(''); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${!needsChange ? 'bg-brand-500 text-white border-brand-500' : 'bg-stone-50 text-stone-600 border-stone-200'}`}
                      >
                        Não preciso
                      </button>
                      <button 
                        onClick={() => setNeedsChange(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${needsChange ? 'bg-brand-500 text-white border-brand-500' : 'bg-stone-50 text-stone-600 border-stone-200'}`}
                      >
                        Sim, preciso
                      </button>
                    </div>

                    {needsChange && (
                      <div className="mt-2 flex items-center gap-2 bg-stone-50 rounded-lg p-2 border border-stone-200">
                        <span className="text-stone-500 font-bold pl-2">R$</span>
                        <input 
                          type="number" 
                          placeholder="0,00"
                          value={changeAmount}
                          onChange={(e) => setChangeAmount(e.target.value)}
                          className="bg-transparent w-full outline-none text-stone-900 font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Floating Box */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-stone-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 p-6 pb-[env(safe-area-inset-bottom,1.5rem)]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-stone-500 font-medium text-sm">Subtotal</span>
          <span className="text-stone-900 font-bold text-sm">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-100">
          <span className="text-stone-500 font-medium text-sm">Taxa de Entrega</span>
          <span className="text-stone-900 font-bold text-sm">
            {taxa === 0 || (appliedCoupon && appliedCoupon.type === 'DELIVERY') ? 'Grátis' : `R$ ${taxa.toFixed(2).replace('.', ',')}`}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-100">
            <span className="text-brand-500 font-medium text-sm">Desconto ({appliedCoupon?.code})</span>
            <span className="text-brand-500 font-bold text-sm">- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-100 bg-stone-50/80 p-3 rounded-xl mt-2">
          <span className="text-stone-600 font-medium text-sm">Pagamento</span>
          <span className="text-stone-900 font-bold text-sm text-right">
            {paymentMethod === 'PIX' && 'Pix Automático'}
            {paymentMethod === 'CREDIT_CARD_OFFLINE' && 'Cartão na Entrega'}
            {paymentMethod === 'CREDIT_CARD_ONLINE' && 'Cartão Online'}
            {paymentMethod === 'CASH' && (
              <>Dinheiro {needsChange && changeAmount ? `(Troco p/ R$ ${changeAmount})` : "(Sem troco)"}</>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-stone-900 font-bold text-lg">Total</span>
          <span className="text-brand-500 font-bold text-2xl">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={isCheckoutLoading || deliverySettings?.isOpen === false}
          className={`w-full rounded-full py-4 px-6 flex items-center justify-center font-bold shadow-lg transition-transform active:scale-[0.98] ${(isCheckoutLoading || deliverySettings?.isOpen === false) ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none' : 'bg-brand-500 text-white shadow-brand-500/30'}`}
        >
          {isCheckoutLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
              <span>Processando...</span>
            </div>
          ) : deliverySettings?.isOpen === false ? (
            'Loja Fechada'
          ) : (
            'Fazer Pedido'
          )}
        </button>
      </div>

      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
      />

      {/* PIX Modal */}
      {pixModalOpen && pixData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4 text-brand-500">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 text-center mb-2">Pague com PIX</h3>
            <p className="text-stone-500 text-center text-sm font-medium mb-6">
              Escaneie o QR Code abaixo ou copie o código para finalizar seu pedido.
            </p>
            
            <div className="bg-stone-50 p-4 rounded-2xl w-full flex justify-center mb-6 border border-stone-100">
              <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 rounded-xl" />
            </div>

            <div className="w-full mb-6">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1 mb-2 block">PIX Copia e Cola</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={pixData.qrCode} 
                  readOnly 
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.qrCode);
                    addToast("Código copiado!");
                  }}
                  className="bg-stone-900 text-white px-4 rounded-xl font-bold hover:bg-stone-800 transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-brand-500 bg-brand-50 px-4 py-3 rounded-xl w-full justify-center">
              <div className="w-5 h-5 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
              <span className="font-bold text-sm">Aguardando pagamento...</span>
            </div>
            
            <button 
              onClick={() => {
                setPixModalOpen(false);
                setIsCheckoutLoading(false);
              }}
              className="mt-6 text-red-500 font-bold text-sm hover:text-red-700 transition-colors"
            >
              Cancelar Pedido
            </button>
          </div>
        </div>
      )}

      {/* Credit Card Modal (MP Brick) */}
      {cardModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md flex flex-col relative my-auto">
            <button 
              onClick={() => {
                setCardModalOpen(false);
                setIsCheckoutLoading(false);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-stone-900 mb-6 text-center">Pagamento Seguro</h3>
            <div className="min-h-[400px]">
              <Payment
                initialization={{ amount: grandTotal }}
                customization={{
                  paymentMethods: {
                    creditCard: 'all',
                    debitCard: 'all',
                  }
                }}
                onSubmit={onSubmitCard}
                onError={(err) => console.error(err)}
              />
            </div>
            {isCheckoutLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                  <p className="font-bold text-stone-700">Processando...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
