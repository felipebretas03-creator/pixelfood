"use client";
import { apiFetch } from '@/lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import React, { useState } from "react";
import { ArrowLeft, Star, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function RestaurantPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  
  const { id } = React.use(props.params); // Use the params hook in Next.js 15
  const [product, setProduct] = useState<any>(null);

  React.useEffect(() => {
    apiFetch(`http://127.0.0.1:4000/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct({
          ...data,
          rating: 4.8,
          reviews: 4200,
          restaurantId: "1"
        });
      })
      .catch(console.error);
  }, [id]);

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      restaurantId: product.restaurantId,
      name: product.name,
      price: product.price,
      quantity,
    });
    router.push("/carrinho");
  };

  return (
    <main className="flex-1 flex flex-col bg-white min-h-screen relative pb-32">
      {/* Floating Back Button */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-12 left-6 z-20 w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-stone-900 border border-white/20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Header Image */}
      <div className="w-full h-80 relative bg-stone-200">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-6 bg-white relative -mt-8 rounded-t-[32px]">
        {/* Title & Badge */}
        <div className="flex justify-between items-start mb-2 mt-4">
          <h1 className="text-3xl font-bold text-stone-900 leading-tight w-3/4">{product.name}</h1>
        </div>

        {/* Rating & Distance */}
        <div className="flex items-center gap-4 border-b border-stone-100 pb-6 mb-6 mt-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-brand-500 fill-brand-500" />
            <span className="font-bold text-lg text-stone-900">{product.rating}</span>
            <span className="text-stone-400 font-medium text-sm">({(product.reviews / 1000).toFixed(1)}k avaliações)</span>
          </div>
        </div>

        {/* Description */}
        <h2 className="text-xl font-bold mb-3">Descrição</h2>
        <p className="text-stone-500 leading-relaxed font-medium text-[15px]">
          {product.description}
        </p>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between mt-10 p-4 rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <span className="text-stone-500 font-medium ml-2">Preço Total</span>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center bg-white text-stone-900 shadow-sm"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-bold text-xl min-w-[1.5rem] text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Add to Cart Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t border-stone-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={handleAddToCart}
          className="w-full bg-brand-500 text-white rounded-full py-4 px-6 flex items-center justify-between shadow-lg shadow-brand-500/30 transition-transform active:scale-[0.98]"
        >
          <span className="text-base font-bold">Adicionar ao Carrinho</span>
          <span className="text-base font-bold">R$ {(product.price * quantity).toFixed(2).replace('.', ',')}</span>
        </button>
      </div>
    </main>
  );
}
