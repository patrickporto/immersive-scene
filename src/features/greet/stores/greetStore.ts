import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

interface GreetState {
  name: string;
  greetMsg: string;
  isLoading: boolean;
  setName: (name: string) => void;
  greet: () => Promise<void>;
}

export const useGreetStore = create<GreetState>((set, get) => ({
  name: '',
  greetMsg: '',
  isLoading: false,
  setName: (name: string) => set({ name }),
  greet: async () => {
    set({ isLoading: true });
    try {
      const { name } = get();
      const message = await invoke<string>('greet', { name });
      set({ greetMsg: message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
