import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RestaurantAuth {
  id: string;
  slug: string;
  name: string;
  email: string;
}

interface AuthState {
  restaurant: RestaurantAuth | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: { restaurant: RestaurantAuth, token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      restaurant: null,
      token: null,
      isAuthenticated: false,
      login: ({ restaurant, token }) => set({ restaurant, token, isAuthenticated: true }),
      logout: () => set({ restaurant: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'painel-auth-storage',
    }
  )
);
