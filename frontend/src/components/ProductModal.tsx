/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { useState, useEffect } from "react";
import { X, Star, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";

export function ProductModal({ product, onClose, isStoreOpen = true }: any) {
  const addItem = useCartStore((state: any) => state.addItem);
  const addToast = useToastStore((state: any) => state.addToast);
  const [quantity, setQuantity] = useState(1);
  const [isFlying, setIsFlying] = useState(false);
  const [flyStyle, setFlyStyle] = useState<any>({});
  const [hideModal, setHideModal] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [observation, setObservation] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any[]>>({});

  // Reseta a quantidade sempre que abrir um novo produto
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setObservation('');
      setSelectedOptions({});
      setIsFlying(false);
      setHideModal(false);
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [product]);

  if (!product) return null;

  let finalPrice = product.price;
  if (product.modifiers) {
    Object.values(selectedOptions).forEach((opts: any[]) => {
      opts.forEach((opt: any) => {
        if (opt.price) {
          finalPrice += opt.price;
        }
      });
    });
  }

  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAddToCart = () => {
    setHideModal(true);
    // Configura a posição inicial da imagem voadora (meio da tela)
    setIsFlying(true);
    setFlyStyle({
      top: "40%",
      left: "50%",
      transform: "translate(-50%, -50%) scale(1)",
      opacity: 1,
    });

    const isDesktop = window.innerWidth >= 1024;

    // No frame seguinte, move para o ícone do carrinho
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyStyle({
          top: isDesktop ? "3%" : "95%",
          left: isDesktop ? "85%" : "62.5%",
          transform: "translate(-50%, -50%) scale(0.1)",
          opacity: 0,
        });
      });
    });

    // Calcula opcoes pra salvar no carrinho
    const optionsList = Object.values(selectedOptions).flat().map(o => o.name);

    // Aguarda a animação terminar para adicionar ao estado e fechar
    setTimeout(() => {
      addItem({
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        restaurantId: product.restaurantId,
        name: product.name,
        price: finalPrice,
        quantity,
        options: optionsList.length > 0 ? optionsList : undefined,
        observation: observation.trim() || undefined
      });
      addToast("Produto adicionado ao carrinho!");
      setIsFlying(false);
      onClose();
    }, 600);
  };

  return (
    <div style={{ zIndex: 99999 }} className="fixed inset-0 flex items-end justify-center">
      {/* Imagem Voadora da Animação */}
      {isFlying && (
        <img 
          src={product.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300'} 
          alt="Voando" 
          className="fixed w-48 h-48 rounded-2xl object-cover shadow-2xl z-[999999] pointer-events-none"
          style={{
            ...flyStyle,
            transition: "all 600ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />
      )}

      {/* Backdrop */}
      {!hideModal && (
        <div 
          className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
          onClick={handleClose}
        />
      )}

      {/* Bottom Sheet Modal */}
      {!hideModal && (
        <div className={`w-full bg-white rounded-t-[40px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] transition-transform duration-300 ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900 border border-stone-200 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="overflow-y-auto hide-scrollbar pb-32">
            {/* Header Image */}
            <div className="w-full h-64 relative bg-stone-100 rounded-t-[40px] overflow-hidden">
              <img src={product.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300'} alt={product.name} className="w-full h-full object-cover" />
            </div>

          {/* Content */}
          <div className="px-6 mt-6">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-bold text-stone-900 leading-tight w-4/5">{product.name}</h1>
            </div>

            <div className="flex items-center gap-4 border-b border-stone-100 pb-5 mb-5 mt-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-brand-500 fill-brand-500" />
                <span className="font-bold text-lg text-stone-900">{product.rating}</span>
                <span className="text-stone-400 font-medium text-sm">({(product.reviews / 1000).toFixed(1)}k avaliações)</span>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-3">Descrição</h2>
            <p className="text-stone-500 leading-relaxed font-medium text-sm mb-6 break-all break-words">
              {product.description}
            </p>

            {/* Modifiers / Opções */}
            {product.modifiers && product.modifiers.map((mod: any) => (
              <div key={mod.id} className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-stone-900">{mod.name}</h3>
                    <p className="text-xs text-stone-500">
                      {mod.min > 0 && mod.max === 1 ? 'Escolha 1 opção' : 
                       mod.min === 0 ? `Escolha até ${mod.max} opções` : 
                       `Escolha de ${mod.min} a ${mod.max} opções`}
                    </p>
                  </div>
                  {mod.min > 0 && (
                    <span className="bg-stone-100 text-stone-600 text-[10px] uppercase font-bold px-2 py-1 rounded">Obrigatório</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-0 border border-stone-100 rounded-2xl overflow-hidden">
                  {mod.options.map((opt: any) => {
                    const isSelected = selectedOptions[mod.id]?.find(o => o.id === opt.id);
                    
                    return (
                      <label 
                        key={opt.id} 
                        className={`flex items-center justify-between p-4 border-b border-stone-50 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-brand-50/30' : 'hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${mod.max === 1 ? 'rounded-full' : 'rounded-md'} ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-stone-300 bg-white'}`}>
                            {isSelected && <div className={`bg-white ${mod.max === 1 ? 'w-2 h-2 rounded-full' : 'w-2.5 h-2.5'}`} style={mod.max > 1 ? { clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)'} : {}} />}
                          </div>
                          <span className={`font-medium ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>{opt.name}</span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-stone-500 text-sm font-medium">+ R$ {opt.price.toFixed(2).replace('.', ',')}</span>
                        )}
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={!!isSelected}
                          onChange={() => {
                            setSelectedOptions(prev => {
                              const current = prev[mod.id] || [];
                              if (mod.max === 1) {
                                return { ...prev, [mod.id]: [opt] };
                              } else {
                                if (isSelected) {
                                  return { ...prev, [mod.id]: current.filter(o => o.id !== opt.id) };
                                } else if (current.length < mod.max) {
                                  return { ...prev, [mod.id]: [...current, opt] };
                                }
                                return prev;
                              }
                            });
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Observations */}
            <div className="mt-6 mb-4">
              <h2 className="text-sm font-bold text-stone-900 mb-2 uppercase tracking-wide">Observações</h2>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: Tirar cebola, maionese à parte..."
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all resize-none h-20 placeholder:text-stone-400"
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mt-8 p-4 rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
              <span className="text-stone-500 font-medium ml-2">Quantidade</span>
              <div className="flex items-center gap-4 bg-stone-100 rounded-full p-1 border border-stone-200 shadow-inner">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-stone-50 active:scale-95 text-stone-600 transition-all"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-black text-lg w-4 text-center text-stone-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-stone-50 active:scale-95 text-brand-500 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isStoreOpen ? (
              <button onClick={handleAddToCart} className="w-full bg-brand-500 text-white rounded-full flex items-center justify-between px-6 py-4 font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-600 active:scale-[0.98] transition-all">
                <span className="text-base">Adicionar ao Carrinho</span>
                <span className="text-base">R$ {(finalPrice * quantity).toFixed(2).replace('.', ',')}</span>
              </button>
            ) : (
              <button disabled className="w-full bg-stone-300 text-stone-500 rounded-full flex items-center justify-center px-6 py-4 font-bold cursor-not-allowed">
                <span className="text-base">Loja Fechada</span>
              </button>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
