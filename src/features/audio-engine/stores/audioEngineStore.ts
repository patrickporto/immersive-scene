import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

import { useSettingsStore } from '../../settings/stores/settingsStore';
import { useElementGroupStore } from '../../sound-sets/stores/elementGroupStore';

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

interface DeviceAudioContext extends AudioContext {
  setSinkId?: (deviceId: string) => Promise<void>;
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

type TransportIntent = 'start' | 'pause' | 'stop';

interface TransportCommand {
  sequence: number;
  intent: TransportIntent;
  elementId: number;
  enqueuedAtMs: number;
}

interface TransportLatencySamples {
  start: number[];
  pause: number[];
  stop: number[];
}

interface AudioEngineState {
  audioContext: AudioContext | null;
  globalGainNode: GainNode | null;
  discordDestinationNode: MediaStreamAudioDestinationNode | null;
  discordCaptureNode: AudioWorkletNode | null;
  discordSilentGainNode: GainNode | null;
  discordConnectionCheckInterval: number | null;
  channelNodes: Map<number, GainNode>;
  sources: Map<number, AudioSource>;
  isInitialized: boolean;
  globalVolume: number;
  selectedElementId: number | null;
  stateSyncInterval: number | null;
  lastPlayedGroupElement: Map<number, number>;

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
  activeTrackTimeouts: Map<number, number>;
  isTimelinePlaying: boolean;
  isTimelinePaused: boolean;
  timelineStartTimeContext: number | null;
  timelinePauseTimeContext: number | null;
  timelineDurationMs: number;
  isTimelineLoopEnabled: boolean;
  activePlaybackContext: PlaybackContext | null;
  transportCommandQueue: TransportCommand[];
  nextTransportSequence: number;
  isTransportProcessingScheduled: boolean;
  transportLastAppliedByElement: Map<number, number>;
  transportLatencySamples: TransportLatencySamples;
  transportQueueHighWatermark: number;

  setOutputDevice: (deviceId: string) => Promise<void>;
  cleanup: () => void;
  processTransportQueue: () => Promise<void>;
  pauseTimeline: () => Promise<void>;
  resumeTimeline: () => Promise<void>;
  setTimelineLoopEnabled: (isEnabled: boolean) => void;
  crossfadeToTimeline: (
    timelineElements: {
      track_id: number;
      audio_element_id: number | null;
      element_group_id: number | null;
      start_time_ms: number;
      duration_ms: number;
    }[],
    tracks: { id: number; is_looping: boolean }[],
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
  discordCaptureNode: null,
  discordSilentGainNode: null,
  discordConnectionCheckInterval: null,
  channelNodes: new Map(),
  sources: new Map(),
  isInitialized: false,
  globalVolume: 1.0,
  selectedElementId: null,
  stateSyncInterval: null,
  lastPlayedGroupElement: new Map(),
  activeTrackTimeouts: new Map(),
  isTimelinePlaying: false,
  isTimelinePaused: false,
  timelineStartTimeContext: null,
  timelinePauseTimeContext: null,
  timelineDurationMs: 60000,
  isTimelineLoopEnabled: false,
  activePlaybackContext: null,
  transportCommandQueue: [],
  nextTransportSequence: 0,
  isTransportProcessingScheduled: false,
  transportLastAppliedByElement: new Map(),
  transportLatencySamples: { start: [], pause: [], stop: [] },
  transportQueueHighWatermark: 0,

  setSelectedElementId: id => set({ selectedElementId: id }),

  initAudioContext: async () => {
    if (get().audioContext) return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const audioContext = new AudioContextCtor({ sampleRate: 48000 });

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const { output_device_id } = useSettingsStore.getState().settings;
    const ctx = audioContext as DeviceAudioContext;

    if (output_device_id && output_device_id !== 'discord' && typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(output_device_id);
      } catch (e) {
        console.warn('Could not set initial audio output device:', e);
      }
    }

    const globalGainNode = audioContext.createGain();
    globalGainNode.gain.value = get().globalVolume;

    let discordDestinationNode: MediaStreamAudioDestinationNode | null = null;
    let discordCaptureNode: AudioWorkletNode | null = null;
    let discordSilentGainNode: GainNode | null = null;

    if (typeof audioContext.createMediaStreamDestination === 'function') {
      discordDestinationNode = audioContext.createMediaStreamDestination();

      await audioContext.audioWorklet.addModule('/worklets/discord-capture-processor.js');
      discordCaptureNode = new AudioWorkletNode(audioContext, 'discord-capture-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        channelCount: 2,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
      });

      discordSilentGainNode = audioContext.createGain();
      discordSilentGainNode.gain.value = 0;

      const MAX_DISCORD_PCM_QUEUE = 96;
      const DISCORD_PACE_INTERVAL_MS = 40;

      let discordSendInFlight = false;
      const discordPcmQueue: number[][] = [];
      let lastDiscordSendErrorAt = 0;

      const sendNextDiscordPacket = () => {
        if (discordSendInFlight) {
          return;
        }

        if (useSettingsStore.getState().settings.output_device_id !== 'discord') {
          discordPcmQueue.length = 0;
          return;
        }

        const nextPcm = discordPcmQueue.shift();
        if (!nextPcm) {
          return;
        }

        discordSendInFlight = true;
        invoke('discord_send_audio', { pcmData: nextPcm })
          .catch(err => {
            const message = String(err);
            const isTransientBridgeError =
              message.includes('Discord audio bridge is disconnected') ||
              message.includes('Discord audio bridge is not initialized') ||
              message.includes('Discord voice connection is not active');

            if (!isTransientBridgeError) {
              console.error('Failed to send audio to Discord:', err);
              return;
            }

            const now = Date.now();
            if (now - lastDiscordSendErrorAt > 3000) {
              console.warn('Discord stream is reconnecting...');
              lastDiscordSendErrorAt = now;
            }
          })
          .finally(() => {
            discordSendInFlight = false;
          });
      };

      const discordPaceInterval = window.setInterval(
        sendNextDiscordPacket,
        DISCORD_PACE_INTERVAL_MS
      );

      discordCaptureNode.port.onmessage = event => {
        if (useSettingsStore.getState().settings.output_device_id !== 'discord') {
          return;
        }

        const payload = event.data;
        if (!(payload instanceof ArrayBuffer)) {
          return;
        }

        const packet = Array.from(new Int16Array(payload));
        if (packet.length === 0) {
          return;
        }

        discordPcmQueue.push(packet);
        if (discordPcmQueue.length > MAX_DISCORD_PCM_QUEUE) {
          discordPcmQueue.shift();
        }
      };

      set({ discordConnectionCheckInterval: discordPaceInterval });
    }

    try {
      globalGainNode.disconnect();
    } catch {
      // Ignore: no connections yet
    }

    if (output_device_id === 'discord' && discordCaptureNode) {
      // When Discord is the output, capture audio via ScriptProcessorNode
      globalGainNode.connect(discordCaptureNode);
      discordCaptureNode.connect(discordSilentGainNode!);
      discordSilentGainNode!.connect(audioContext.destination);
    } else {
      // Normal audio output to speakers
      globalGainNode.connect(audioContext.destination);
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

    set({
      audioContext,
      isInitialized: true,
      stateSyncInterval,
      globalGainNode,
      discordDestinationNode,
      discordCaptureNode,
      discordSilentGainNode,
    });

    if (output_device_id === 'discord') {
      get().setOutputDevice('discord').catch(console.error);
    }
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

  processTransportQueue: async () => {
    const {
      transportCommandQueue,
      transportLastAppliedByElement,
      transportLatencySamples,
      audioContext,
      sources,
    } = get();

    if (transportCommandQueue.length === 0) {
      set({ isTransportProcessingScheduled: false });
      return;
    }

    set({ transportCommandQueue: [], isTransportProcessingScheduled: false });

    const nextAppliedMap = new Map(transportLastAppliedByElement);
    const nextLatencySamples: TransportLatencySamples = {
      start: [...transportLatencySamples.start],
      pause: [...transportLatencySamples.pause],
      stop: [...transportLatencySamples.stop],
    };

    const sortedCommands = [...transportCommandQueue].sort((a, b) => a.sequence - b.sequence);

    for (const command of sortedCommands) {
      const lastAppliedSequence = nextAppliedMap.get(command.elementId) ?? 0;
      if (command.sequence <= lastAppliedSequence) {
        continue;
      }

      const source = sources.get(command.elementId);
      if (!source) {
        nextAppliedMap.set(command.elementId, command.sequence);
        continue;
      }

      if (command.intent === 'start') {
        if (!audioContext) {
          nextAppliedMap.set(command.elementId, command.sequence);
          continue;
        }

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        if (!source.buffer) {
          nextAppliedMap.set(command.elementId, command.sequence);
          continue;
        }

        if (source.sourceNode) {
          try {
            source.sourceNode.stop();
          } catch {
            // Ignore
          }
        }

        try {
          const sourceNode = audioContext.createBufferSource();
          sourceNode.buffer = source.buffer;
          sourceNode.loop = source.isLooping;
          sourceNode.connect(source.gainNode);
          sourceNode.start();

          source.sourceNode = sourceNode;
          source.isPlaying = true;

          sourceNode.onended = () => {
            if (!sourceNode.loop) {
              source.isPlaying = source.activeScheduledCount > 0;
              source.sourceNode = null;
              set({ sources: new Map(get().sources) });
            }
          };
        } catch (error) {
          console.error(
            `[AudioEngine] Fatal error during playback for ${command.elementId}:`,
            error
          );
        }
      } else {
        if (source.sourceNode) {
          try {
            source.sourceNode.stop();
          } catch {
            // Ignore
          }
          source.sourceNode = null;
          source.isPlaying = source.activeScheduledCount > 0;
        }
      }

      const latencyMs = performance.now() - command.enqueuedAtMs;
      nextLatencySamples[command.intent].push(latencyMs);
      if (nextLatencySamples[command.intent].length > 120) {
        nextLatencySamples[command.intent].shift();
      }

      nextAppliedMap.set(command.elementId, command.sequence);
    }

    set({
      sources: new Map(sources),
      transportLastAppliedByElement: nextAppliedMap,
      transportLatencySamples: nextLatencySamples,
    });
  },

  play: async elementId => {
    const {
      transportCommandQueue,
      nextTransportSequence,
      isTransportProcessingScheduled,
      transportQueueHighWatermark,
    } = get();

    const sequence = nextTransportSequence + 1;
    const queue = transportCommandQueue.filter(command => command.elementId !== elementId);
    queue.push({
      sequence,
      elementId,
      intent: 'start',
      enqueuedAtMs: performance.now(),
    });

    set({
      transportCommandQueue: queue,
      nextTransportSequence: sequence,
      transportQueueHighWatermark: Math.max(transportQueueHighWatermark, queue.length),
    });

    if (!isTransportProcessingScheduled) {
      set({ isTransportProcessingScheduled: true });
      globalThis.setTimeout(() => {
        void get().processTransportQueue();
      }, 0);
    }
  },

  pause: elementId => {
    const {
      transportCommandQueue,
      nextTransportSequence,
      isTransportProcessingScheduled,
      transportQueueHighWatermark,
    } = get();

    const sequence = nextTransportSequence + 1;
    const queue = transportCommandQueue.filter(command => command.elementId !== elementId);
    queue.push({
      sequence,
      elementId,
      intent: 'pause',
      enqueuedAtMs: performance.now(),
    });

    set({
      transportCommandQueue: queue,
      nextTransportSequence: sequence,
      transportQueueHighWatermark: Math.max(transportQueueHighWatermark, queue.length),
    });

    if (!isTransportProcessingScheduled) {
      set({ isTransportProcessingScheduled: true });
      globalThis.setTimeout(() => {
        void get().processTransportQueue();
      }, 0);
    }
  },

  stop: elementId => {
    const {
      transportCommandQueue,
      nextTransportSequence,
      isTransportProcessingScheduled,
      transportQueueHighWatermark,
    } = get();

    const sequence = nextTransportSequence + 1;
    const queue = transportCommandQueue.filter(command => command.elementId !== elementId);
    queue.push({
      sequence,
      elementId,
      intent: 'stop',
      enqueuedAtMs: performance.now(),
    });

    set({
      transportCommandQueue: queue,
      nextTransportSequence: sequence,
      transportQueueHighWatermark: Math.max(transportQueueHighWatermark, queue.length),
    });

    if (!isTransportProcessingScheduled) {
      set({ isTransportProcessingScheduled: true });
      globalThis.setTimeout(() => {
        void get().processTransportQueue();
      }, 0);
    }
  },

  stopAll: () => {
    const { sources, activeTrackTimeouts } = get();
    activeTrackTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    set({ activeTrackTimeouts: new Map() });

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
      transportCommandQueue: [],
      isTransportProcessingScheduled: false,
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
    const {
      audioContext,
      globalGainNode,
      discordCaptureNode,
      discordSilentGainNode,
      discordConnectionCheckInterval,
    } = get();

    const prevDeviceId = useSettingsStore.getState().settings.output_device_id;

    if (globalGainNode && audioContext) {
      // Disconnect all existing outputs from globalGainNode
      try {
        globalGainNode.disconnect();
      } catch {
        // Ignore when there are no active connections
      }

      if (deviceId === 'discord' && discordCaptureNode && discordSilentGainNode) {
        // Discord mode: route audio through the ScriptProcessorNode for PCM capture.
        // The ScriptProcessorNode MUST have a path to audioContext.destination
        // for onaudioprocess to fire, so we route through a silent gain node.
        // Chain: globalGainNode → captureNode → silentGainNode(0) → destination
        globalGainNode.connect(discordCaptureNode);
        try {
          discordCaptureNode.disconnect();
        } catch {
          /* ignore */
        }
        discordCaptureNode.connect(discordSilentGainNode);
        try {
          discordSilentGainNode.disconnect();
        } catch {
          /* ignore */
        }
        discordSilentGainNode.connect(audioContext.destination);
      } else {
        // Normal mode: route directly to speakers
        globalGainNode.connect(audioContext.destination);
      }
    }

    if (deviceId === 'discord') {
      try {
        const { discord_bot_token, discord_guild_id, discord_channel_id } =
          useSettingsStore.getState().settings;
        if (discord_bot_token && discord_guild_id && discord_channel_id) {
          await invoke('discord_connect', {
            token: discord_bot_token,
            guildId: discord_guild_id,
            channelId: discord_channel_id,
          });
        } else {
          console.info('Discord output requires bot token, guild and voice channel configuration.');
        }
      } catch (err) {
        console.error('Failed to connect to Discord:', err);
        if (globalGainNode && audioContext) {
          try {
            globalGainNode.disconnect();
          } catch {
            // Ignore
          }
          globalGainNode.connect(audioContext.destination);
        }
      }
      return;
    } else if (prevDeviceId === 'discord') {
      invoke('discord_disconnect').catch(console.error);
      // Clear the Discord connection check interval when disconnecting
      if (discordConnectionCheckInterval !== null) {
        clearInterval(discordConnectionCheckInterval);
        set({ discordConnectionCheckInterval: null });
      }
    }

    interface DeviceAudioContext extends AudioContext {
      setSinkId?: (id: string) => Promise<void>;
    }

    const ctx = audioContext as DeviceAudioContext;
    if (ctx && typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(deviceId);
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
    const {
      audioContext,
      sources,
      activeTrackTimeouts,
      globalGainNode,
      channelNodes,
      discordCaptureNode,
      discordSilentGainNode,
      discordConnectionCheckInterval,
    } = get();

    activeTrackTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    set({ activeTrackTimeouts: new Map() });

    if (discordConnectionCheckInterval !== null) {
      clearInterval(discordConnectionCheckInterval);
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
    if (discordCaptureNode) {
      discordCaptureNode.port.onmessage = null;
      discordCaptureNode.disconnect();
    }
    discordSilentGainNode?.disconnect();
    globalGainNode?.disconnect();

    const { stateSyncInterval } = get();
    if (stateSyncInterval !== null) {
      clearInterval(stateSyncInterval);
    }

    audioContext?.close();
    set({
      audioContext: null,
      globalGainNode: null,
      discordDestinationNode: null,
      discordCaptureNode: null,
      discordSilentGainNode: null,
      discordConnectionCheckInterval: null,
      channelNodes: new Map(),
      sources: new Map(),
      isInitialized: false,
      stateSyncInterval: null,
      lastPlayedGroupElement: new Map(),
      activeTrackTimeouts: new Map(),
      isTimelinePlaying: false,
      isTimelinePaused: false,
      timelineStartTimeContext: null,
      isTimelineLoopEnabled: false,
      activePlaybackContext: null,
      transportCommandQueue: [],
      nextTransportSequence: 0,
      isTransportProcessingScheduled: false,
      transportLastAppliedByElement: new Map(),
      transportLatencySamples: { start: [], pause: [], stop: [] },
      transportQueueHighWatermark: 0,
    });
  },

  pauseTimeline: async () => {
    const {
      audioContext,
      isTimelinePlaying,
      isTimelinePaused,
      discordCaptureNode,
      discordSilentGainNode,
    } = get();
    if (audioContext && isTimelinePlaying && !isTimelinePaused) {
      try {
        // Disconnect Discord capture node before suspending to prevent UI blocking
        // The AudioWorkletNode processing can block suspend() when under heavy load
        if (discordCaptureNode && discordSilentGainNode) {
          try {
            discordCaptureNode.disconnect();
            discordSilentGainNode.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        }

        // Save the current audio context time when pausing
        const pauseTime = audioContext.currentTime;
        await audioContext.suspend();
        set({
          isTimelinePaused: true,
          isTimelinePlaying: true,
          timelinePauseTimeContext: pauseTime,
        });
      } catch (error) {
        console.error('Failed to pause timeline:', error);
      }
    }
  },

  resumeTimeline: async () => {
    const {
      audioContext,
      isTimelinePlaying,
      isTimelinePaused,
      globalGainNode,
      discordCaptureNode,
      discordSilentGainNode,
      timelineStartTimeContext,
      timelinePauseTimeContext,
    } = get();
    if (audioContext && isTimelinePlaying && isTimelinePaused) {
      try {
        await audioContext.resume();

        // Reconnect Discord capture node after resuming
        if (
          discordCaptureNode &&
          discordSilentGainNode &&
          globalGainNode &&
          useSettingsStore.getState().settings.output_device_id === 'discord'
        ) {
          try {
            globalGainNode.connect(discordCaptureNode);
            discordCaptureNode.connect(discordSilentGainNode);
            discordSilentGainNode.connect(audioContext.destination);
          } catch (e) {
            console.warn('Failed to reconnect Discord capture node:', e);
          }
        }

        // Adjust timeline start time to compensate for the paused duration
        // This ensures the timeline continues from where it left off
        let newStartTimeContext = timelineStartTimeContext;
        if (timelineStartTimeContext !== null && timelinePauseTimeContext !== null) {
          const pausedDuration = audioContext.currentTime - timelinePauseTimeContext;
          newStartTimeContext = timelineStartTimeContext + pausedDuration;
        }

        set({
          isTimelinePaused: false,
          isTimelinePlaying: true,
          timelineStartTimeContext: newStartTimeContext,
          timelinePauseTimeContext: null,
        });
      } catch (error) {
        console.error('Failed to resume timeline:', error);
      }
    }
  },

  setTimelineLoopEnabled: isEnabled => {
    // Since the backend handles is_looping on tracks automatically,
    // setting timeline loop enabled locally means we might want to kill the track timeouts
    // if it's disabled, but wait, crossfadeToTimeline will just be re-called when needed.
    // For now we just update the flag.
    set({
      isTimelineLoopEnabled: isEnabled,
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

  crossfadeToTimeline: (timelineElements, tracks, isLooping = false, context) => {
    const { audioContext, sources, playScheduled, activeTrackTimeouts, isTimelinePaused } = get();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(console.error);
    }
    if (isTimelinePaused) {
      set({ isTimelinePaused: false });
    }

    activeTrackTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    set({ activeTrackTimeouts: new Map(), isTimelineLoopEnabled: isLooping });

    const now = audioContext.currentTime;
    const fadeOutDuration = 2.0; // 2 seconds crossfade

    let maxEndMs = 0;
    const trackDurations = new Map<number, number>();
    const trackElements = new Map<number, typeof timelineElements>();

    timelineElements.forEach(te => {
      const endMs = te.start_time_ms + te.duration_ms;
      if (endMs > maxEndMs) maxEndMs = endMs;

      trackDurations.set(te.track_id, Math.max(trackDurations.get(te.track_id) || 0, endMs));
      if (!trackElements.has(te.track_id)) trackElements.set(te.track_id, []);
      trackElements.get(te.track_id)!.push(te);
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

    const scheduleTrackChunk = (
      trackId: number,
      durationMs: number,
      elements: typeof timelineElements,
      trackIsLooping: boolean,
      baseDelayMs: number = 0
    ) => {
      elements.forEach(te => {
        let elementIdToPlay = te.audio_element_id;

        if (te.element_group_id) {
          const members = useElementGroupStore.getState().groupMembers[te.element_group_id] || [];
          if (members.length > 0) {
            if (members.length === 1) {
              elementIdToPlay = members[0].audio_element_id;
            } else {
              const lastPlayed = get().lastPlayedGroupElement.get(te.element_group_id);
              const available = members.filter(m => m.audio_element_id !== lastPlayed);
              const pick = available[Math.floor(Math.random() * available.length)];
              elementIdToPlay = pick.audio_element_id;

              const newMap = new Map(get().lastPlayedGroupElement);
              newMap.set(te.element_group_id, elementIdToPlay);
              set({ lastPlayedGroupElement: newMap });
            }
          }
        }

        if (elementIdToPlay) {
          // if element starts within the crossfade window on the first loop, fade it in
          const isFirstLoop = baseDelayMs === 0;
          const fadeIn =
            isFirstLoop && te.start_time_ms < fadeOutDuration * 1000 ? fadeOutDuration : 0;
          playScheduled(
            elementIdToPlay,
            baseDelayMs + te.start_time_ms,
            te.duration_ms,
            fadeIn
          ).catch(console.error);
        }
      });

      if (trackIsLooping && durationMs > 0) {
        const timeoutId = setTimeout(() => {
          scheduleTrackChunk(trackId, durationMs, elements, trackIsLooping, 0);
        }, durationMs);

        const currentTimeouts = get().activeTrackTimeouts;
        currentTimeouts.set(trackId, timeoutId as unknown as number);
        set({ activeTrackTimeouts: new Map(currentTimeouts) });
      }
    };

    const currentContextTime = get().audioContext?.currentTime || 0;
    set({
      isTimelinePlaying: true,
      timelineStartTimeContext: currentContextTime,
      timelineDurationMs: maxEndMs,
      ...(context ? { activePlaybackContext: context } : {}),
    });

    // Schedule new timeline elements with fade in if they start at 0
    setTimeout(() => {
      tracks.forEach(track => {
        const elements = trackElements.get(track.id) || [];
        const durationMs = trackDurations.get(track.id) || 0;
        scheduleTrackChunk(track.id, durationMs, elements, track.is_looping, 0);
      });

      // If we need a global timeout to stop isTimelinePlaying (when no tracks are looping)
      const anyLooping = tracks.some(t => t.is_looping);
      if (!anyLooping && maxEndMs > 0) {
        const timeoutId = setTimeout(() => {
          set({
            isTimelinePlaying: false,
            timelineStartTimeContext: null,
            timelinePauseTimeContext: null,
          });
        }, maxEndMs);
        const ct = get().activeTrackTimeouts;
        ct.set(-1, timeoutId as unknown as number);
        set({ activeTrackTimeouts: new Map(ct) });
      }
    }, 100); // slight delay to let audio buffer catch up
  },
}));
