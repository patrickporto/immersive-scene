import { invoke } from '@tauri-apps/api/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSoundSetStore } from './soundSetStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('soundSetStore', () => {
  beforeEach(() => {
    useSoundSetStore.setState({
      soundSets: [],
      moods: [],
      audioElements: [],
      channels: [],
      selectedSoundSet: null,
      selectedMood: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Audio Channels', () => {
    it('createChannel adds a new channel', async () => {
      const mockChannel = {
        id: 1,
        sound_set_id: 1,
        name: 'Music',
        icon: 'music',
        volume: 0.8,
        order_index: 0,
        created_at: '',
      };
      vi.mocked(invoke).mockResolvedValueOnce(mockChannel);

      await useSoundSetStore.getState().createChannel(1, 'Music', 'music', 0.8);

      const state = useSoundSetStore.getState();
      expect(state.channels).toHaveLength(1);
      expect(state.channels[0].name).toBe('Music');
      expect(invoke).toHaveBeenCalledWith('create_audio_channel', {
        soundSetId: 1,
        name: 'Music',
        icon: 'music',
        volume: 0.8,
      });
    });

    it('updateChannel updates existing channel properties', async () => {
      useSoundSetStore.setState({
        channels: [
          {
            id: 1,
            sound_set_id: 1,
            name: 'Old',
            icon: 'music',
            volume: 0.5,
            order_index: 0,
            created_at: '',
          },
        ],
      });

      vi.mocked(invoke).mockResolvedValueOnce(null);

      await useSoundSetStore.getState().updateChannel(1, 'New', 'ambient', 1.0);

      const state = useSoundSetStore.getState();
      expect(state.channels[0].name).toBe('New');
      expect(state.channels[0].icon).toBe('ambient');
      expect(state.channels[0].volume).toBe(1.0);
      expect(invoke).toHaveBeenCalledWith('update_audio_channel', {
        id: 1,
        name: 'New',
        icon: 'ambient',
        volume: 1.0,
      });
    });

    it('deleteChannel removes a channel', async () => {
      useSoundSetStore.setState({
        channels: [
          {
            id: 1,
            sound_set_id: 1,
            name: 'To Delete',
            icon: 'music',
            volume: 0.5,
            order_index: 0,
            created_at: '',
          },
        ],
      });

      vi.mocked(invoke).mockResolvedValueOnce(null);

      await useSoundSetStore.getState().deleteChannel(1);

      const state = useSoundSetStore.getState();
      expect(state.channels).toHaveLength(0);
      expect(invoke).toHaveBeenCalledWith('delete_audio_channel', { id: 1 });
    });

    it('updateAudioElementChannelId updates element channel link', async () => {
      useSoundSetStore.setState({
        audioElements: [
          {
            id: 10,
            sound_set_id: 1,
            channel_id: null,
            file_path: 'test.mp3',
            file_name: 'test.mp3',
            channel_type: 'ambient',
            volume_db: 0,
            created_at: '',
          },
        ],
      });

      vi.mocked(invoke).mockResolvedValueOnce(null);

      await useSoundSetStore.getState().updateAudioElementChannelId(10, 5);

      const state = useSoundSetStore.getState();
      expect(state.audioElements[0].channel_id).toBe(5);
      expect(invoke).toHaveBeenCalledWith('update_audio_element_channel_id', {
        id: 10,
        channelId: 5,
      });
    });
  });

  describe('SoundSet Activation', () => {
    it('toggleSoundSetEnabled updates the state and calls the backend', async () => {
      useSoundSetStore.setState({
        soundSets: [{ id: 1, name: 'S1', description: 'D1', is_enabled: true, created_at: '' }],
      });

      vi.mocked(invoke).mockResolvedValueOnce(null);

      await useSoundSetStore.getState().toggleSoundSetEnabled(1, false);

      const state = useSoundSetStore.getState();
      expect(state.soundSets[0].is_enabled).toBe(false);
      expect(invoke).toHaveBeenCalledWith('update_sound_set_enabled', { id: 1, isEnabled: false });
    });
  });

  describe('Global Moods', () => {
    it('loadMoods fetches all moods without soundSetId', async () => {
      const mockMoods = [{ id: 10, name: 'M1', description: 'D1', created_at: '' }];
      vi.mocked(invoke).mockResolvedValueOnce(mockMoods);

      await useSoundSetStore.getState().loadMoods();

      const state = useSoundSetStore.getState();
      expect(state.moods).toHaveLength(1);
      expect(state.moods[0].name).toBe('M1');
      expect(invoke).toHaveBeenCalledWith('get_moods');
    });

    it('createMood calls backend without soundSetId', async () => {
      const mockMood = { id: 11, name: 'New Mood', description: 'New Desc', created_at: '' };
      vi.mocked(invoke).mockResolvedValueOnce(mockMood);

      await useSoundSetStore.getState().createMood('New Mood', 'New Desc');

      const state = useSoundSetStore.getState();
      expect(state.moods).toHaveLength(1);
      expect(state.moods[0].name).toBe('New Mood');
      expect(invoke).toHaveBeenCalledWith('create_mood', {
        name: 'New Mood',
        description: 'New Desc',
      });
    });
  });
});
