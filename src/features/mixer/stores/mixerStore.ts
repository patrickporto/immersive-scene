import { create } from 'zustand';

export type ChannelType = 'music' | 'ambient' | 'effects' | 'creatures' | 'voice';

interface ChannelState {
  volume: number; // 0-100
  volumeDb: number; // -60 to +12 dB
  muted: boolean;
  solo: boolean;
}

interface MixerState {
  channels: Record<ChannelType, ChannelState>;
  masterVolume: number;
  masterMuted: boolean;
  isPlaying: boolean;

  // Actions
  setChannelVolume: (channel: ChannelType, volume: number) => void;
  setChannelVolumeDb: (channel: ChannelType, db: number) => void;
  toggleChannelMute: (channel: ChannelType) => void;
  toggleChannelSolo: (channel: ChannelType) => void;
  setMasterVolume: (volume: number) => void;
  toggleMasterMute: () => void;
  setIsPlaying: (playing: boolean) => void;
  resetMixer: () => void;
}

const defaultChannelState: ChannelState = {
  volume: 80,
  volumeDb: 0,
  muted: false,
  solo: false,
};

const initialChannels: Record<ChannelType, ChannelState> = {
  music: { ...defaultChannelState },
  ambient: { ...defaultChannelState },
  effects: { ...defaultChannelState },
  creatures: { ...defaultChannelState },
  voice: { ...defaultChannelState },
};

export const useMixerStore = create<MixerState>(set => ({
  channels: initialChannels,
  masterVolume: 100,
  masterMuted: false,
  isPlaying: false,

  setChannelVolume: (channel, volume) => {
    set(state => ({
      channels: {
        ...state.channels,
        [channel]: {
          ...state.channels[channel],
          volume,
        },
      },
    }));
  },

  setChannelVolumeDb: (channel, db) => {
    set(state => ({
      channels: {
        ...state.channels,
        [channel]: {
          ...state.channels[channel],
          volumeDb: db,
        },
      },
    }));
  },

  toggleChannelMute: channel => {
    set(state => ({
      channels: {
        ...state.channels,
        [channel]: {
          ...state.channels[channel],
          muted: !state.channels[channel].muted,
        },
      },
    }));
  },

  toggleChannelSolo: channel => {
    set(state => ({
      channels: {
        ...state.channels,
        [channel]: {
          ...state.channels[channel],
          solo: !state.channels[channel].solo,
        },
      },
    }));
  },

  setMasterVolume: volume => {
    set({ masterVolume: volume });
  },

  toggleMasterMute: () => {
    set(state => ({ masterMuted: !state.masterMuted }));
  },

  setIsPlaying: playing => {
    set({ isPlaying: playing });
  },

  resetMixer: () => {
    set({
      channels: initialChannels,
      masterVolume: 100,
      masterMuted: false,
      isPlaying: false,
    });
  },
}));
