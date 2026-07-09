import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'Super Admin' | 'Investigator' | 'Supervisor' | null;

interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      user: null,
      login: (user) => set({ isAuthenticated: true, role: user.role, user }),
      logout: () => set({ isAuthenticated: false, role: null, user: null }),
    }),
    {
      name: 'rakshak-auth-store',
    }
  )
);
