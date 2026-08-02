/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  street: string;
  number: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  lat?: number;
  lon?: number;
}

interface UserState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userPhoto: string;
  address: Address | null;
  setAddress: (address: Address) => void;
  clearAddress: () => void;
  login: (data: { id: string, name: string, email: string, phone: string, token: string }) => void;
  setPhone: (phone: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      userId: "",
      userName: "",
      userEmail: "",
      userPhone: "",
      userPhoto: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      address: null,
      setAddress: (address) => set({ address }),
      clearAddress: () => set({ address: null }),
      login: (data) => set({ isAuthenticated: true, userId: data.id, userName: data.name, userEmail: data.email, userPhone: data.phone, token: data.token }),
      setPhone: (phone) => set({ userPhone: phone }),
      logout: () => set({ isAuthenticated: false, token: null, userId: "", userName: "", userEmail: "", userPhone: "" }),
    }),
    {
      name: 'pixelfood-user',
    }
  )
);
