import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

import { useSettingsStore } from '../../settings/stores/settingsStore';

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

interface AudioSource {
  element: AudioElement;
  buffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  isLooping: boolean;
  activeScheduledCount: number;
  scheduledNodes: { node: AudioBufferSourceNode; start: number; stop: number }[];
}

export interface PlaybackContext {
  soundSetId: number;
  moodId: number;
  timelineId?: number;
}

interface AudioEngineState {
  audioContext: AudioContext | null;
  globalGainNode: GainNode | null;
  discordDestinationNode: MediaStreamAudioDestinationNode | null;
  channelNodes: Map<number, GainNode>;
  sources: Map<number, AudioSource>;
  isInitialized: boolean;
  globalVolume: number;
  selectedElementId: number | null;
  stateSyncInterval: number | null;

  initAudioContext: () => Promise<void>;
  loadAudioFile: (element: AudioElement, fileData: ArrayBuffer) => Promise<void>;
  play: (elementId: number) => Promise<void>;
  pause: (elementId: number) => void;
  stop: (elementId: number) => void;
  stopAll: () => void;
  toggleLoop: (elementId: number) => void;
  setVolume: (elementId: number, volume: number) => void;
  setChannelVolume: (channelId: number, volume: number) => void;
  setGlobalVolume: (volume: number) => void;
  setSelectedElementId: (id: number | null) => void;
  removeSource: (elementId: number) => void;
  activeTimelineLoopTimeout: number | null;
  isTimelinePlaying: boolean;
  isTimelinePaused: boolean;
  timelineStartTimeContext: number | null;
  timelineDurationMs: number;
  isTimelineLoopEnabled: boolean;
  activePlaybackContext: PlaybackContext | null;

  setOutputDevice: (deviceId: string) => Promise<void>;
  cleanup: () => void;
  pauseTimeline: () => Promise<void>;
  resumeTimeline: () => Promise<void>;
  setTimelineLoopEnabled: (isEnabled: boolean) => void;
  crossfadeToTimeline: (
    timelineElements: { audio_element_id: number; start_time_ms: number; duration_ms: number }[],
    isLooping?: boolean,
    context?: PlaybackContext
  ) => void;
  playScheduled: (
    elementId: number,
    delayMs: number,
    playDurationMs: number,
    fadeInDuration?: number
  ) => Promise<void>;
}

export const useAudioEngineStore = create<AudioEngineState>((set, get) => ({
  audioContext: null,
  globalGainNode: null,
  discordDestinationNode: null,
  channelNodes: new Map(),
  sources: new Map(),
  isInitialized: false,
  globalVolume: 1.0,
  selectedElementId: null,
  stateSyncInterval: null,
  activeTimelineLoopTimeout: null,
  isTimelinePlaying: false,
  isTimelinePaused: false,
  timelineStartTimeContext: null,
  timelineDurationMs: 60000,
  isTimelineLoopEnabled: false,
  activePlaybackContext: null,

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

    const { output_device_id } = useSettingsStore.getState().settings;
    if (output_device_id && typeof (audioContext as any).setSinkId === 'function') {
      try {
        await (audioContext as any).setSinkId(output_device_id);
      } catch (e) {
        console.warn('Could not set initial audio output device:', e);
      }
    }

    const globalGainNode = audioContext.createGain();
    globalGainNode.connect(audioContext.destination);
    globalGainNode.gain.value = get().globalVolume;

    let discordDestinationNode: MediaStreamAudioDestinationNode | null = null;
    if (typeof audioContext.createMediaStreamDestination === 'function') {
      discordDestinationNode = audioContext.createMediaStreamDestination();
      globalGainNode.connect(discordDestinationNode);
      // Stub: in a real implemention, we would attach a ScriptProcessorNode or AudioWorkletNode
      // to discordDestinationNode.stream to get PCM chunks to send over Tauri.
    }

    const stateSyncInterval = window.setInterval(() => {
      const { sources, audioContext: ctx } = get();
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      let changed = false;

      sources.forEach(source => {
        // Filter out completed scheduled nodes
        const initialCount = source.scheduledNodes.length;
        source.scheduledNodes = source.scheduledNodes.filter(sn => now < sn.stop);

        const isScheduledPlaying = source.scheduledNodes.some(
          sn => now >= sn.start && now < sn.stop
        );

        const shouldBePlaying = isScheduledPlaying || source.sourceNode !== null;

        if (source.isPlaying !== shouldBePlaying || source.scheduledNodes.length !== initialCount) {
          source.isPlaying = shouldBePlaying;
          source.activeScheduledCount = source.scheduledNodes.length;
          changed = true;
        }
      });

      if (changed) {
        set({ sources: new Map(sources) });
      }
    }, 50);

    set({ audioContext, isInitialized: true, stateSyncInterval, globalGainNode, discordDestinationNode });
  },

  loadAudioFile: async (element, fileData) => {
    const { audioContext, sources, channelNodes, globalGainNode } = get();
    if (!audioContext || !globalGainNode) return;

    try {
      const audioBuffer = await audioContext.decodeAudioData(fileData);

      const gainNode = audioContext.createGain();

      let targetNode: GainNode = globalGainNode;
      if (element.channel_id) {
        let channelNode = channelNodes.get(element.channel_id);
        if (!channelNode) {
          channelNode = audioContext.createGain();
          channelNode.connect(globalGainNode);
          channelNodes.set(element.channel_id, channelNode);
          set({ channelNodes: new Map(channelNodes) });
        }
        targetNode = channelNode;
      }

      gainNode.connect(targetNode);
      gainNode.gain.value = 0.8;

      const source: AudioSource = {
        element,
        buffer: audioBuffer,
        sourceNode: null,
        gainNode,
        isPlaying: false,
        isLooping: false, // Default to false globally
        activeScheduledCount: 0,
        scheduledNodes: [],
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
          source.isPlaying = source.activeScheduledCount > 0;
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
        source.sourceNode = null;
        source.isPlaying = source.activeScheduledCount > 0;
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
      source.isPlaying = source.activeScheduledCount > 0;
      set({ sources: new Map(sources) });
    }
  },

  stopAll: () => {
    const { sources, activeTimelineLoopTimeout, audioContext } = get();
    if (activeTimelineLoopTimeout !== null) {
      clearTimeout(activeTimelineLoopTimeout);
      set({ activeTimelineLoopTimeout: null });
    }

    if (audioContext?.state === 'suspended') {
      audioContext.resume().catch(console.error);
    }

    sources.forEach(source => {
      if (source.sourceNode) {
        try {
          source.sourceNode.stop();
        } catch {
          // Ignore
        }
      }
      source.scheduledNodes.forEach(sn => {
        try {
          sn.node.stop();
        } catch {
          // Ignore
        }
      });
      source.scheduledNodes = [];
      source.sourceNode = null;
      source.isPlaying = false;
      source.activeScheduledCount = 0;
    });
    set({
      sources: new Map(sources),
      isTimelinePlaying: false,
      isTimelinePaused: false,
      timelineStartTimeContext: null,
      isTimelineLoopEnabled: false,
      activePlaybackContext: null,
    });
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
    const { globalGainNode } = get();
    if (globalGainNode) {
      globalGainNode.gain.value = volume;
    }
  },

  setOutputDevice: async deviceId => {
    const { audioContext } = get();

    const prevDeviceId = useSettingsStore.getState().settings.output_device_id;

    if (deviceId === 'discord') {
      try {
        const { discord_bot_token, discord_guild_id, discord_channel_id } = useSettingsStore.getState().settings;
        if (discord_bot_token && discord_guild_id && discord_channel_id) {
          await invoke('discord_connect', {
            token: discord_bot_token,
            guildId: discord_guild_id,
            channelId: discord_channel_id
          });
        } else {
          console.warn('Discord not fully configured');
        }
      } catch (err) {
        console.error('Failed to connect to Discord:', err);
      }
      return;
    } else if (prevDeviceId === 'discord') {
      invoke('discord_disconnect').catch(console.error);
    }

    if (audioContext && typeof (audioContext as any).setSinkId === 'function') {
      try {
        await (audioContext as any).setSinkId(deviceId);
      } catch (err) {
        console.error('Failed to set output device:', err);
      }
    }
  },

  setChannelVolume: (channelId, volume) => {
    const { channelNodes, audioContext, globalGainNode } = get();
    if (!audioContext || !globalGainNode) return;

    let channelNode = channelNodes.get(channelId);
    if (!channelNode) {
      channelNode = audioContext.createGain();
      channelNode.connect(globalGainNode);
      channelNodes.set(channelId, channelNode);
      set({ channelNodes: new Map(channelNodes) });
    }
    channelNode.gain.value = volume;
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
    const { audioContext, sources, activeTimelineLoopTimeout, globalGainNode, channelNodes } =
      get();

    if (activeTimelineLoopTimeout !== null) {
      clearTimeout(activeTimelineLoopTimeout);
    }

    sources.forEach(source => {
      if (source.sourceNode) {
        try {
          source.sourceNode.stop();
        } catch {
          // Ignore
        }
      }
      source.scheduledNodes.forEach(sn => {
        try {
          sn.node.stop();
        } catch {
          // Ignore
        }
      });
      source.scheduledNodes = [];
      source.gainNode?.disconnect();
    });

    channelNodes.forEach(node => node.disconnect());
    globalGainNode?.disconnect();

    const { stateSyncInterval } = get();
    if (stateSyncInterval !== null) {
      clearInterval(stateSyncInterval);
    }

    audioContext?.close();
    set({
      audioContext: null,
      globalGainNode: null,
      channelNodes: new Map(),
      sources: new Map(),
      isInitialized: false,
      stateSyncInterval: null,
      activeTimelineLoopTimeout: null,
      isTimelinePlaying: false,
      isTimelinePaused: false,
      timelineStartTimeContext: null,
      isTimelineLoopEnabled: false,
      activePlaybackContext: null,
    });
  },

  pauseTimeline: async () => {
    const { audioContext, isTimelinePlaying, isTimelinePaused } = get();
    if (audioContext && isTimelinePlaying && !isTimelinePaused) {
      await audioContext.suspend();
      set({ isTimelinePaused: true, isTimelinePlaying: true });
    }
  },

  resumeTimeline: async () => {
    const { audioContext, isTimelinePlaying, isTimelinePaused } = get();
    if (audioContext && isTimelinePlaying && isTimelinePaused) {
      await audioContext.resume();
      set({ isTimelinePaused: false, isTimelinePlaying: true });
    }
  },

  setTimelineLoopEnabled: isEnabled => {
    const {
      activeTimelineLoopTimeout,
      isTimelinePlaying,
      audioContext,
      timelineStartTimeContext,
      timelineDurationMs,
    } = get();

    if (activeTimelineLoopTimeout !== null) {
      clearTimeout(activeTimelineLoopTimeout);
    }

    if (!isEnabled && isTimelinePlaying && audioContext && timelineStartTimeContext !== null) {
      const elapsedMs = Math.max(0, (audioContext.currentTime - timelineStartTimeContext) * 1000);
      const remainingMs = Math.max(0, timelineDurationMs - elapsedMs);

      const timeoutId = setTimeout(() => {
        set({
          isTimelinePlaying: false,
          timelineStartTimeContext: null,
          activeTimelineLoopTimeout: null,
        });
      }, remainingMs);

      set({
        isTimelineLoopEnabled: false,
        activeTimelineLoopTimeout: timeoutId as unknown as number,
      });
      return;
    }

    set({
      isTimelineLoopEnabled: isEnabled,
      activeTimelineLoopTimeout: null,
    });
  },

  playScheduled: async (elementId, delayMs, playDurationMs, fadeInDuration = 0) => {
    const { audioContext, sources } = get();
    if (!audioContext || audioContext.state === 'suspended') return;

    const source = sources.get(elementId);
    if (!source || !source.buffer) return;

    try {
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = source.buffer;
      sourceNode.loop = source.isLooping;
      sourceNode.connect(source.gainNode);

      const startTime = audioContext.currentTime + delayMs / 1000;
      const stopTime = startTime + playDurationMs / 1000;

      if (fadeInDuration > 0) {
        source.gainNode.gain.setValueAtTime(0, startTime);
        source.gainNode.gain.linearRampToValueAtTime(1, startTime + fadeInDuration);
      } else {
        source.gainNode.gain.value = 1;
      }

      // Schedule start and precise stop
      sourceNode.start(startTime);
      sourceNode.stop(stopTime);

      source.scheduledNodes.push({
        node: sourceNode,
        start: startTime,
        stop: stopTime,
      });

      // isPlaying and activeScheduledCount are now handled by the stateSyncInterval

      set({ sources: new Map(sources) });
    } catch (e) {
      console.error(`[AudioEngine] Failed to schedule timeline element ${elementId}:`, e);
    }
  },

  crossfadeToTimeline: (timelineElements, isLooping = false, context) => {
    const { audioContext, sources, playScheduled, activeTimelineLoopTimeout, isTimelinePaused } =
      get();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(console.error);
    }
    if (isTimelinePaused) {
      set({ isTimelinePaused: false });
    }

    if (activeTimelineLoopTimeout !== null) {
      clearTimeout(activeTimelineLoopTimeout);
      set({ activeTimelineLoopTimeout: null });
    }

    set({ isTimelineLoopEnabled: isLooping });

    const now = audioContext.currentTime;
    const fadeOutDuration = 2.0; // 2 seconds crossfade

    let maxEndMs = 0;
    timelineElements.forEach(te => {
      const endMs = te.start_time_ms + te.duration_ms;
      if (endMs > maxEndMs) maxEndMs = endMs;
    });

    // Ensure we track a default duration even if empty
    if (maxEndMs === 0) maxEndMs = 60000;

    // Fade out all currently playing
    sources.forEach(source => {
      // Cancel strictly future nodes to avoid them playing when gain goes back up
      source.scheduledNodes = source.scheduledNodes.filter(sn => {
        if (sn.start > now) {
          try {
            sn.node.stop();
          } catch {
            // ignore
          }
          return false;
        }
        return true;
      });

      if (source.isPlaying && source.gainNode) {
        source.gainNode.gain.cancelScheduledValues(now);
        source.gainNode.gain.setValueAtTime(source.gainNode.gain.value, now);
        source.gainNode.gain.linearRampToValueAtTime(0, now + fadeOutDuration);

        setTimeout(() => {
          const currentSource = get().sources.get(source.element.id);
          if (currentSource) {
            if (currentSource.sourceNode) {
              try {
                currentSource.sourceNode.stop();
              } catch {
                // ignore
              }
              currentSource.sourceNode = null;
            }
            // State sync interval handles activeScheduledCount
            set({ sources: new Map(get().sources) });
          }
        }, fadeOutDuration * 1000);
      }
    });

    const scheduleTimelineChunk = () => {
      timelineElements.forEach(te => {
        // if element starts within the crossfade window, fade it in
        const fadeIn = te.start_time_ms < fadeOutDuration * 1000 ? fadeOutDuration : 0;
        playScheduled(te.audio_element_id, te.start_time_ms, te.duration_ms, fadeIn).catch(
          console.error
        );
      });

      const currentContextTime = get().audioContext?.currentTime || 0;
      set({
        isTimelinePlaying: true,
        timelineStartTimeContext: currentContextTime,
        timelineDurationMs: maxEndMs,
        ...(context ? { activePlaybackContext: context } : {}),
      });

      if (get().isTimelineLoopEnabled && maxEndMs > 0) {
        const timeoutId = setTimeout(scheduleTimelineChunk, maxEndMs);
        set({ activeTimelineLoopTimeout: timeoutId as unknown as number });
      } else if (!get().isTimelineLoopEnabled && maxEndMs > 0) {
        // Automatically stop the timeline once it reaches the end if not looping
        const timeoutId = setTimeout(() => {
          set({ isTimelinePlaying: false, timelineStartTimeContext: null });
        }, maxEndMs);
        set({ activeTimelineLoopTimeout: timeoutId as unknown as number });
      }
    };

    // Schedule new timeline elements with fade in if they start at 0
    setTimeout(scheduleTimelineChunk, 100); // slight delay to let audio buffer catch up
  },
}));
