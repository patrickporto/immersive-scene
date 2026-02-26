import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface AppSettings {
  audio_file_strategy: 'reference' | 'copy';
  library_path: string;
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  settings: {
    audio_file_strategy: 'reference',
    library_path: '',
  },
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await invoke<AppSettings>('get_app_settings');
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  updateSettings: async (settings: AppSettings) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('update_app_settings', { settings });
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
