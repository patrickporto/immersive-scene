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
});
