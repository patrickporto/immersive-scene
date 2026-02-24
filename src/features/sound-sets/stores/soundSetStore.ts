import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface SoundSet {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Mood {
  id: number;
  sound_set_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface AudioElement {
  id: number;
  mood_id: number;
  file_path: string;
  file_name: string;
  channel_type: 'music' | 'ambient' | 'effects' | 'creatures' | 'voice';
  volume_db: number;
  created_at: string;
}

interface SoundSetState {
  soundSets: SoundSet[];
  moods: Mood[];
  audioElements: AudioElement[];
  selectedSoundSet: SoundSet | null;
  selectedMood: Mood | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSoundSets: () => Promise<void>;
  createSoundSet: (name: string, description: string) => Promise<void>;
  deleteSoundSet: (id: number) => Promise<void>;
  selectSoundSet: (soundSet: SoundSet | null) => void;

  loadMoods: (soundSetId: number) => Promise<void>;
  createMood: (soundSetId: number, name: string, description: string) => Promise<void>;
  selectMood: (mood: Mood | null) => void;

  loadAudioElements: (moodId: number) => Promise<void>;
  createAudioElement: (
    moodId: number,
    filePath: string,
    fileName: string,
    channelType: AudioElement['channel_type']
  ) => Promise<void>;
  deleteAudioElement: (id: number) => Promise<void>;

  clearError: () => void;
}

export const useSoundSetStore = create<SoundSetState>((set, get) => ({
  soundSets: [],
  moods: [],
  audioElements: [],
  selectedSoundSet: null,
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
        moods: state.selectedSoundSet?.id === id ? [] : state.moods,
        selectedMood: state.selectedSoundSet?.id === id ? null : state.selectedMood,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectSoundSet: soundSet => {
    set({ selectedSoundSet: soundSet, moods: [], selectedMood: null, audioElements: [] });
    if (soundSet) {
      get().loadMoods(soundSet.id);
    }
  },

  loadMoods: async soundSetId => {
    set({ isLoading: true, error: null });
    try {
      const moods = await invoke<Mood[]>('get_moods', { soundSetId });
      set({ moods, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createMood: async (soundSetId, name, description) => {
    set({ isLoading: true, error: null });
    try {
      const newMood = await invoke<Mood>('create_mood', {
        soundSetId,
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

  selectMood: mood => {
    set({ selectedMood: mood, audioElements: [] });
    if (mood) {
      get().loadAudioElements(mood.id);
    }
  },

  loadAudioElements: async moodId => {
    set({ isLoading: true, error: null });
    try {
      const audioElements = await invoke<AudioElement[]>('get_audio_elements', { moodId });
      set({ audioElements, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createAudioElement: async (moodId, filePath, fileName, channelType) => {
    set({ isLoading: true, error: null });
    try {
      const newElement = await invoke<AudioElement>('create_audio_element', {
        moodId,
        filePath,
        fileName,
        channelType,
      });
      set(state => ({
        audioElements: [newElement, ...state.audioElements],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
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

  clearError: () => set({ error: null }),
}));
