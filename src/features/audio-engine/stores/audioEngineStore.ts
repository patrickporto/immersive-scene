import { create } from 'zustand';

export interface AudioElement {
  id: number;
  mood_id: number;
  file_path: string;
  file_name: string;
  channel_type: 'music' | 'ambient' | 'effects' | 'creatures' | 'voice';
  volume_db: number;
  created_at: string;
}

interface AudioSource {
  element: AudioElement;
  buffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  isLooping: boolean;
}

interface AudioEngineState {
  audioContext: AudioContext | null;
  sources: Map<number, AudioSource>;
  isInitialized: boolean;
  globalVolume: number;
  selectedElementId: number | null;

  initAudioContext: () => Promise<void>;
  loadAudioFile: (element: AudioElement, fileData: ArrayBuffer) => Promise<void>;
  play: (elementId: number) => Promise<void>;
  pause: (elementId: number) => void;
  stop: (elementId: number) => void;
  stopAll: () => void;
  toggleLoop: (elementId: number) => void;
  setVolume: (elementId: number, volume: number) => void;
  setGlobalVolume: (volume: number) => void;
  setSelectedElementId: (id: number | null) => void;
  removeSource: (elementId: number) => void;
  cleanup: () => void;
}

export const useAudioEngineStore = create<AudioEngineState>((set, get) => ({
  audioContext: null,
  sources: new Map(),
  isInitialized: false,
  globalVolume: 1.0,
  selectedElementId: null,

  setSelectedElementId: id => set({ selectedElementId: id }),

  initAudioContext: async () => {
    if (get().audioContext) return;

    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    set({ audioContext, isInitialized: true });
  },

  loadAudioFile: async (element, fileData) => {
    const { audioContext, sources } = get();
    if (!audioContext) return;

    try {
      const audioBuffer = await audioContext.decodeAudioData(fileData);

      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0.8;

      const source: AudioSource = {
        element,
        buffer: audioBuffer,
        sourceNode: null,
        gainNode,
        isPlaying: false,
        isLooping: true, // Default to looping for ambient/background
      };

      sources.set(element.id, source);
      set({ sources: new Map(sources) });
    } catch (error) {
      console.error('Error loading audio file:', error);
    }
  },

  play: async elementId => {
    console.log(`[AudioEngine] Attempting to play element: ${elementId}`);
    const { audioContext, sources } = get();
    if (!audioContext) {
      console.error('[AudioEngine] Cannot play: audioContext is missing');
      return;
    }

    if (audioContext.state === 'suspended') {
      console.log('[AudioEngine] Resuming suspended audioContext');
      await audioContext.resume();
    }

    const source = sources.get(elementId);
    if (!source) {
      console.error(`[AudioEngine] Cannot play: source ${elementId} not found in store`);
      return;
    }

    if (!source.buffer) {
      console.error(`[AudioEngine] Cannot play: source ${elementId} has a null audio buffer`);
      return;
    }

    if (source.sourceNode) {
      try {
        console.log(`[AudioEngine] Stopping existing source node for ${elementId}`);
        source.sourceNode.stop();
      } catch (e) {
        console.warn(`[AudioEngine] Could not stop existing node:`, e);
      }
    }

    try {
      console.log(`[AudioEngine] Creating new BufferSource for ${elementId}`);
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = source.buffer;
      sourceNode.loop = source.isLooping;
      sourceNode.connect(source.gainNode);

      console.log(`[AudioEngine] Starting source node for ${elementId}...`);
      sourceNode.start();

      source.sourceNode = sourceNode;
      source.isPlaying = true;

      sourceNode.onended = () => {
        console.log(`[AudioEngine] Track ended for ${elementId} (loop=${sourceNode.loop})`);
        if (!sourceNode.loop) {
          source.isPlaying = false;
          source.sourceNode = null;
          set({ sources: new Map(sources) });
        }
      };

      set({ sources: new Map(sources) });
      console.log(`[AudioEngine] Successfully started playback for ${elementId}`);
    } catch (e) {
      console.error(`[AudioEngine] Fatal error during playback for ${elementId}:`, e);
    }
  },

  pause: elementId => {
    const { sources } = get();
    const source = sources.get(elementId);
    if (source?.sourceNode) {
      try {
        source.sourceNode.stop();
        source.isPlaying = false;
        source.sourceNode = null;
        set({ sources: new Map(sources) });
      } catch {
        // Ignore errors
      }
    }
  },

  stop: elementId => {
    const { sources } = get();
    const source = sources.get(elementId);
    if (source?.sourceNode) {
      try {
        source.sourceNode.stop();
      } catch {
        // Ignore
      }
      source.sourceNode = null;
      source.isPlaying = false;
      set({ sources: new Map(sources) });
    }
  },

  stopAll: () => {
    const { sources } = get();
    sources.forEach(source => {
      if (source.sourceNode) {
        try {
          source.sourceNode.stop();
        } catch {
          // Ignore
        }
        source.sourceNode = null;
        source.isPlaying = false;
      }
    });
    set({ sources: new Map(sources) });
  },

  toggleLoop: elementId => {
    const { sources } = get();
    const source = sources.get(elementId);
    if (source) {
      source.isLooping = !source.isLooping;
      if (source.sourceNode) {
        source.sourceNode.loop = source.isLooping;
      }
      set({ sources: new Map(sources) });
    }
  },

  setVolume: (elementId, volume) => {
    const { sources } = get();
    const source = sources.get(elementId);
    if (source?.gainNode) {
      source.gainNode.gain.value = volume;
    }
  },

  setGlobalVolume: volume => {
    set({ globalVolume: volume });
    const { sources } = get();
    sources.forEach(source => {
      if (source.gainNode) {
        source.gainNode.gain.value = volume;
      }
    });
  },

  removeSource: elementId => {
    const { sources } = get();
    const source = sources.get(elementId);
    if (source?.sourceNode) {
      try {
        source.sourceNode.stop();
      } catch {
        // Ignore
      }
    }
    sources.delete(elementId);
    set({ sources: new Map(sources) });
  },

  cleanup: () => {
    const { audioContext, sources } = get();

    sources.forEach(source => {
      if (source.sourceNode) {
        try {
          source.sourceNode.stop();
        } catch {
          // Ignore
        }
      }
      source.gainNode?.disconnect();
    });

    audioContext?.close();
    set({ audioContext: null, sources: new Map(), isInitialized: false });
  },
}));
