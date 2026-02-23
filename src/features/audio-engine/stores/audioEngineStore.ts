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

  initAudioContext: () => Promise<void>;
  loadAudioFile: (element: AudioElement, fileData: ArrayBuffer) => Promise<void>;
  play: (elementId: number) => void;
  pause: (elementId: number) => void;
  stop: (elementId: number) => void;
  stopAll: () => void;
  toggleLoop: (elementId: number) => void;
  setVolume: (elementId: number, volume: number) => void;
  setGlobalVolume: (volume: number) => void;
  removeSource: (elementId: number) => void;
  cleanup: () => void;
}

export const useAudioEngineStore = create<AudioEngineState>((set, get) => ({
  audioContext: null,
  sources: new Map(),
  isInitialized: false,
  globalVolume: 1.0,

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

  play: elementId => {
    const { audioContext, sources } = get();
    if (!audioContext) return;

    const source = sources.get(elementId);
    if (!source || !source.buffer) return;

    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
      } catch {
        // Ignore if already stopped
      }
    }

    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = source.buffer;
    sourceNode.loop = source.isLooping;
    sourceNode.connect(source.gainNode);
    sourceNode.start();

    source.sourceNode = sourceNode;
    source.isPlaying = true;

    sourceNode.onended = () => {
      if (!sourceNode.loop) {
        source.isPlaying = false;
        source.sourceNode = null;
        set({ sources: new Map(sources) });
      }
    };

    set({ sources: new Map(sources) });
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
