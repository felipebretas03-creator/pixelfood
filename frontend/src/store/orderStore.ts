/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '@/lib/api';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  observation?: string;
}

export interface Order {
  id: string;
  tenantId?: string;
  orderNumber?: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  paymentMethod?: string;
  needsChange?: boolean;
  changeAmount?: string;
  address?: {
    street: string;
    number: string;
    neighborhood?: string;
    city: string;
  };
  observation?: string;
}

interface OrderState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  fetchOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),
      fetchOrders: async () => {
        try {
          const response = await apiFetch('/api/customer/orders');
          if (response.ok) {
            const data = await response.json();
            const mappedOrders = data.map((dbOrder: any) => ({
              id: dbOrder.id,
              tenantId: dbOrder.tenantId,
              orderNumber: dbOrder.orderNumber,
              date: dbOrder.createdAt,
              status: dbOrder.status,
              total: dbOrder.totalCents / 100,
              items: dbOrder.items.map((i: any) => ({
                ...i,
                price: i.priceCents / 100,
              })),
              paymentMethod: dbOrder.paymentMethod,
              needsChange: dbOrder.paymentMethod === 'CASH' && dbOrder.changeForCents > 0,
              changeAmount: dbOrder.paymentMethod === 'CASH' && dbOrder.changeForCents > 0 ? ((dbOrder.totalCents + dbOrder.changeForCents)/100).toFixed(2) : undefined,
              address: dbOrder.addressSnapshot ? {
                street: dbOrder.addressSnapshot,
                number: '',
                neighborhood: '',
                city: ''
              } : undefined,
              observation: dbOrder.notes
            }));
            set({ orders: mappedOrders });
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        }
      },
    }),
    {
      name: 'pixelfood-orders',
    }
  )
);
