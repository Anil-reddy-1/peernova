import { create } from 'zustand';

interface AuthUIStore {
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  redirectAfterAuth: string | null;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  setRedirectAfterAuth: (path: string) => void;
  clearRedirectAfterAuth: () => void;
}

export const useAuthUIStore = create<AuthUIStore>((set) => ({
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  redirectAfterAuth: null,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  setRedirectAfterAuth: (path: string) => set({ redirectAfterAuth: path }),
  clearRedirectAfterAuth: () => set({ redirectAfterAuth: null }),
}));
