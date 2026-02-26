import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

import { AudioElement } from './soundSetStore';

interface GlobalOneShotState {
  globalOneShots: AudioElement[];
  isLoading: boolean;
  error: string | null;

  loadGlobalOneShots: () => Promise<void>;
  createGlobalOneShot: (
    filePath: string,
    fileName: string,
    channelType: string
  ) => Promise<AudioElement>;
  deleteGlobalOneShot: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useGlobalOneShotStore = create<GlobalOneShotState>(set => ({
  globalOneShots: [],
  isLoading: false,
  error: null,

  loadGlobalOneShots: async () => {
    set({ isLoading: true, error: null });
    try {
      const globalOneShots = await invoke<AudioElement[]>('get_global_oneshots');
      set({ globalOneShots, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createGlobalOneShot: async (filePath: string, fileName: string, channelType: string) => {
    set({ isLoading: true, error: null });
    try {
      const newOneShot = await invoke<AudioElement>('create_global_oneshot', {
        filePath,
        fileName,
        channelType,
      });
      set(state => ({
        globalOneShots: [newOneShot, ...state.globalOneShots],
        isLoading: false,
      }));

      return newOneShot;
    } catch (error) {
      const message = String(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteGlobalOneShot: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_global_oneshot', { id });
      set(state => ({
        globalOneShots: state.globalOneShots.filter(shot => shot.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
