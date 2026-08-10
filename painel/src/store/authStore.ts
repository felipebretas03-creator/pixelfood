import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantAuth {
  id: string;
  slug: string;
  name: string;
  email: string;
  isMaster?: boolean;
}

interface AuthState {
  tenant: TenantAuth | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: { tenant: TenantAuth, token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tenant: null,
      token: null,
      isAuthenticated: false,
      login: ({ tenant, token }) => set({ tenant, token, isAuthenticated: true }),
      logout: () => set({ tenant: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'painel-auth-storage',
    }
  )
);
