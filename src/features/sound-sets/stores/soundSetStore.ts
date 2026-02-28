import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SoundSet {
  id: number;
  name: string;
  description: string;
  is_enabled: boolean;
  created_at: string;
}

export interface Mood {
  id: number;
  sound_set_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface AudioChannel {
  id: number;
  sound_set_id: number;
  name: string;
  icon: string;
  volume: number;
  order_index: number;
  created_at: string;
}

export interface AudioElement {
  id: number;
  sound_set_id: number | null;
  channel_id: number | null;
  file_path: string;
  file_name: string;
  channel_type: string;
  volume_db: number;
  created_at: string;
}

interface SoundSetState {
  soundSets: SoundSet[];
  moods: Mood[];
  audioElements: AudioElement[];
  channels: AudioChannel[];
  selectedSoundSet: SoundSet | null;
  selectedSoundSetIds: number[];
  selectedMood: Mood | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSoundSets: () => Promise<void>;
  createSoundSet: (name: string, description: string) => Promise<void>;
  deleteSoundSet: (id: number) => Promise<void>;
  selectSoundSet: (soundSet: SoundSet | null) => void;
  toggleSoundSetSelection: (id: number) => void;
  toggleSoundSetEnabled: (id: number, isEnabled: boolean) => Promise<void>;

  loadMoods: () => Promise<void>;
  createMood: (name: string, description: string) => Promise<void>;
  deleteMood: (id: number) => Promise<void>;
  selectMood: (mood: Mood | null) => void;

  loadAudioElements: () => Promise<void>;
  createAudioElement: (
    soundSetId: number,
    filePath: string,
    fileName: string,
    channelType: string,
    channelId: number | null
  ) => Promise<AudioElement>;
  deleteAudioElement: (id: number) => Promise<void>;
  updateAudioElementChannel: (id: number, channelType: string) => Promise<void>;
  updateAudioElementChannelId: (id: number, channelId: number | null) => Promise<void>;

  loadChannels: (soundSetId: number) => Promise<void>;
  createChannel: (soundSetId: number, name: string, icon: string, volume: number) => Promise<void>;
  updateChannel: (id: number, name: string, icon: string, volume: number) => Promise<void>;
  deleteChannel: (id: number) => Promise<void>;
  reorderChannels: (id: number, orderIndex: number) => Promise<void>;
  seedDefaultChannels: (soundSetId: number) => Promise<void>;

  exportSoundSet: (id: number, destinationPath: string) => Promise<void>;
  importSoundSet: (sourcePath: string) => Promise<void>;

  clearError: () => void;
}

export const useSoundSetStore = create<SoundSetState>()(
  persist(
    (set, get) => ({
      soundSets: [],
      moods: [],
      audioElements: [],
      channels: [],
      selectedSoundSet: null,
      selectedSoundSetIds: [],
      selectedMood: null,
      isLoading: false,
      error: null,

      loadSoundSets: async () => {
        console.log('Store: Loading soundsets...');
        set({ isLoading: true, error: null });
        try {
          const soundSets = await invoke<SoundSet[]>('get_sound_sets');
          console.log('Store: Loaded', soundSets.length, 'soundsets');
          set({ soundSets, isLoading: false });

          // Load global assets
          get().loadMoods();
        } catch (error) {
          console.error('Store: Failed to load soundsets:', error);
          set({ error: String(error), isLoading: false });
        }
      },

      createSoundSet: async (name, description) => {
        set({ isLoading: true, error: null });
        try {
          const newSoundSet = await invoke<SoundSet>('create_sound_set', {
            name,
            description,
          });
          set(state => ({
            soundSets: [newSoundSet, ...state.soundSets],
            isLoading: false,
          }));
          await get().seedDefaultChannels(newSoundSet.id);
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      deleteSoundSet: async id => {
        set({ isLoading: true, error: null });
        try {
          await invoke('delete_sound_set', { id });
          set(state => ({
            soundSets: state.soundSets.filter(ss => ss.id !== id),
            selectedSoundSet: state.selectedSoundSet?.id === id ? null : state.selectedSoundSet,
            selectedSoundSetIds: state.selectedSoundSetIds.filter(selectedId => selectedId !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      toggleSoundSetEnabled: async (id, isEnabled) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('update_sound_set_enabled', { id, isEnabled });
          set(state => ({
            soundSets: state.soundSets.map(ss =>
              ss.id === id ? { ...ss, is_enabled: isEnabled } : ss
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      selectSoundSet: soundSet => {
        if (!soundSet) {
          set({
            selectedSoundSet: null,
            selectedSoundSetIds: [],
            audioElements: [],
            channels: [],
          });
          return;
        }

        set(state => {
          const isAlreadyVisible = state.selectedSoundSetIds.includes(soundSet.id);
          return {
            selectedSoundSet: soundSet,
            selectedSoundSetIds: isAlreadyVisible
              ? state.selectedSoundSetIds
              : [...state.selectedSoundSetIds, soundSet.id],
          };
        });

        // Always refresh elements and primary channels
        get().loadAudioElements();
        get().loadChannels(soundSet.id);
      },

      toggleSoundSetSelection: id => {
        set(state => {
          const isVisible = state.selectedSoundSetIds.includes(id);
          const nextIds = isVisible
            ? state.selectedSoundSetIds.filter(selectedId => selectedId !== id)
            : [...state.selectedSoundSetIds, id];

          return {
            selectedSoundSetIds: nextIds,
            // If we unselect the primary one, clear it or pick another from visible?
            // Let's keep it simple: unselecting doesn't necessarily deselect primary unless we want to.
          };
        });
        get().loadAudioElements();
      },

      loadMoods: async () => {
        set({ isLoading: true, error: null });
        try {
          const moods = await invoke<Mood[]>('get_moods');
          set({ moods, isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      createMood: async (name, description) => {
        set({ isLoading: true, error: null });
        try {
          const newMood = await invoke<Mood>('create_mood', {
            name,
            description,
          });
          set(state => ({
            moods: [newMood, ...state.moods],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      deleteMood: async id => {
        set({ isLoading: true, error: null });
        try {
          await invoke('delete_mood', { id });
          set(state => ({
            moods: state.moods.filter(m => m.id !== id),
            selectedMood: state.selectedMood?.id === id ? null : state.selectedMood,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      selectMood: mood => {
        set({ selectedMood: mood });
      },

      loadAudioElements: async () => {
        set({ isLoading: true, error: null });
        try {
          const audioElements = await invoke<AudioElement[]>('get_all_available_audio_elements');
          set({ audioElements, isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      createAudioElement: async (soundSetId, filePath, fileName, channelType, channelId) => {
        set({ isLoading: true, error: null });
        try {
          const newElement = await invoke<AudioElement>('create_audio_element', {
            soundSetId,
            filePath,
            fileName,
            channelType,
            channelId,
          });
          set(state => ({
            audioElements: [newElement, ...state.audioElements],
            isLoading: false,
          }));

          return newElement;
        } catch (error) {
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      deleteAudioElement: async id => {
        set({ isLoading: true, error: null });
        try {
          await invoke('delete_audio_element', { id });
          set(state => ({
            audioElements: state.audioElements.filter(el => el.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      updateAudioElementChannel: async (id, channelType) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('update_audio_element_channel', { id, channelType });
          set(state => ({
            audioElements: state.audioElements.map(el =>
              el.id === id ? { ...el, channel_type: channelType } : el
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      updateAudioElementChannelId: async (id, channelId) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('update_audio_element_channel_id', { id, channelId });
          set(state => ({
            audioElements: state.audioElements.map(el =>
              el.id === id ? { ...el, channel_id: channelId } : el
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      loadChannels: async soundSetId => {
        set({ isLoading: true, error: null });
        try {
          const channels = await invoke<AudioChannel[]>('get_audio_channels', { soundSetId });
          set({ channels, isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      createChannel: async (soundSetId, name, icon, volume) => {
        set({ isLoading: true, error: null });
        try {
          const newChannel = await invoke<AudioChannel>('create_audio_channel', {
            soundSetId,
            name,
            icon,
            volume,
          });
          set(state => ({
            channels: [...state.channels, newChannel].sort((a, b) => a.order_index - b.order_index),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      updateChannel: async (id, name, icon, volume) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('update_audio_channel', { id, name, icon, volume });
          set(state => ({
            channels: state.channels.map(ch => (ch.id === id ? { ...ch, name, icon, volume } : ch)),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      deleteChannel: async id => {
        set({ isLoading: true, error: null });
        try {
          await invoke('delete_audio_channel', { id });
          set(state => ({
            channels: state.channels.filter(ch => ch.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      reorderChannels: async (id, orderIndex) => {
        try {
          await invoke('reorder_audio_channels', { id, orderIndex });
          const { selectedSoundSet } = get();
          if (selectedSoundSet) {
            await get().loadChannels(selectedSoundSet.id);
          }
        } catch (error) {
          set({ error: String(error) });
        }
      },

      seedDefaultChannels: async soundSetId => {
        try {
          const channels = await invoke<AudioChannel[]>('seed_default_channels', { soundSetId });
          set({ channels });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      exportSoundSet: async (id, destinationPath) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('export_sound_set', { soundSetId: id, destinationPath });
          set({ isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      importSoundSet: async sourcePath => {
        set({ isLoading: true, error: null });
        try {
          await invoke('import_sound_set', { sourcePath });
          await get().loadSoundSets();
          set({ isLoading: false });
        } catch (error) {
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sound-set-storage',
      partialize: state => ({
        selectedSoundSetIds: state.selectedSoundSetIds,
        selectedSoundSet: state.selectedSoundSet,
        selectedMood: state.selectedMood,
      }),
    }
  )
);
