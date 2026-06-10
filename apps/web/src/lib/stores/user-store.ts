import { create } from 'zustand';

interface UserState {
  preferences: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setPreferences: (prefs: Partial<UserState['preferences']>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  preferences: {
    theme: 'system',
    emailNotifications: true,
  },
  setTheme: (theme) =>
    set((state) => ({ preferences: { ...state.preferences, theme } })),
  setPreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
}));
