import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface AppSettings {
  audio_file_strategy: 'reference' | 'copy';
  library_path: string;
  output_device_id: string;
  discord_bot_token: string;
  discord_guild_id: string;
  discord_channel_id: string;
  qlc_endpoint: string;
  qlc_transport: 'rest';
  qlc_auth_mode: 'none' | 'token';
  qlc_auth_token: string;
  qlc_request_timeout_ms: number;
  qlc_reconnect_policy: 'off' | 'retry-once' | 'auto';
  qlc_stop_behavior: 'stop-run-cues' | 'panic';
  qlc_enabled: boolean;
}

export interface QlcHealthStatus {
  healthy: boolean;
  api_compatible: boolean;
  checked_at: string;
  message: string;
  error_code: string | null;
  version: string | null;
}

interface SettingsState {
  settings: AppSettings;
  qlcHealth: QlcHealthStatus | null;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  testQlcConnection: () => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  settings: {
    audio_file_strategy: 'reference',
    library_path: '',
    output_device_id: '',
    discord_bot_token: '',
    discord_guild_id: '',
    discord_channel_id: '',
    qlc_endpoint: '',
    qlc_transport: 'rest',
    qlc_auth_mode: 'none',
    qlc_auth_token: '',
    qlc_request_timeout_ms: 5000,
    qlc_reconnect_policy: 'retry-once',
    qlc_stop_behavior: 'stop-run-cues',
    qlc_enabled: false,
  },
  qlcHealth: null,
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

  testQlcConnection: async () => {
    set({ isLoading: true, error: null });
    try {
      const qlcHealth = await invoke<QlcHealthStatus>('qlc_health_check');
      set({ qlcHealth, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
