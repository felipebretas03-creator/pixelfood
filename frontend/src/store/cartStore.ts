/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique cart id
  productId?: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  options?: string[];
  observation?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => set((state) => {
        // Find existing item with exact same configuration
        const existingItemIndex = state.items.findIndex(item => 
          item.productId === newItem.productId && 
          item.observation === newItem.observation &&
          JSON.stringify(item.options) === JSON.stringify(newItem.options)
        );
        if (existingItemIndex > -1) {
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity += newItem.quantity;
          return { items: newItems };
        }
        return { items: [...state.items, newItem] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter(item => item.id !== id) };
        }
        return {
          items: state.items.map(item => item.id === id ? { ...item, quantity } : item)
        };
      }),
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'pixelfood-cart',
    }
  )
);
