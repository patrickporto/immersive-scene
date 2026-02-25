import { create } from 'zustand';

export interface AudioElement {
  id: number;
  sound_set_id: number;
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
  crossfadeToTimeline: (
    timelineElements: { audio_element_id: number; start_time_ms: number }[]
  ) => void;
  playScheduled: (elementId: number, delayMs: number, fadeInDuration?: number) => Promise<void>;
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
        isLooping: false, // Default to false globally
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

  playScheduled: async (elementId, delayMs, fadeInDuration = 0) => {
    const { audioContext, sources } = get();
    if (!audioContext || audioContext.state === 'suspended') return;

    const source = sources.get(elementId);
    if (!source || !source.buffer) return;

    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
      } catch {
        // ignore
      }
    }

    try {
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = source.buffer;
      sourceNode.loop = source.isLooping;
      sourceNode.connect(source.gainNode);

      const startTime = audioContext.currentTime + delayMs / 1000;

      if (fadeInDuration > 0) {
        source.gainNode.gain.setValueAtTime(0, startTime);
        source.gainNode.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
      } else {
        source.gainNode.gain.value = 1;
      }

      sourceNode.start(startTime);
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
    } catch (e) {
      console.error(`[AudioEngine] Failed to schedule timeline element ${elementId}:`, e);
    }
  },

  crossfadeToTimeline: timelineElements => {
    const { audioContext, sources, playScheduled } = get();
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const fadeOutDuration = 2.0; // 2 seconds crossfade

    // Fade out all currently playing
    sources.forEach(source => {
      if (source.isPlaying && source.gainNode) {
        source.gainNode.gain.cancelScheduledValues(now);
        source.gainNode.gain.setValueAtTime(source.gainNode.gain.value, now);
        source.gainNode.gain.linearRampToValueAtTime(0, now + fadeOutDuration);

        setTimeout(() => {
          if (source.sourceNode) {
            try {
              source.sourceNode.stop();
            } catch {
              // ignore
            }
            source.isPlaying = false;
            source.sourceNode = null;
          }
        }, fadeOutDuration * 1000);
      }
    });

    // Schedule new timeline elements with fade in if they start at 0
    setTimeout(() => {
      timelineElements.forEach(te => {
        // if element starts within the crossfade window, fade it in
        const fadeIn = te.start_time_ms < fadeOutDuration * 1000 ? fadeOutDuration : 0;
        playScheduled(te.audio_element_id, te.start_time_ms, fadeIn);
      });
    }, 100); // slight delay to let audio buffer catch up
  },
}));
