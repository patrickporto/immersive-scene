import { invoke } from '@tauri-apps/api/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useTimelineStore } from './timelineStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('timelineStore', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      timelines: [],
      tracks: [],
      elements: [],
      selectedTimelineId: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('createTimelineTrack adds a new track', async () => {
    const mockTrack = { id: 1, timeline_id: 1, name: 'Track 1', order_index: 0, created_at: '' };
    vi.mocked(invoke).mockResolvedValueOnce(mockTrack);

    await useTimelineStore.getState().createTimelineTrack(1, 'Track 1');

    const state = useTimelineStore.getState();
    expect(state.tracks).toHaveLength(1);
    expect(state.tracks[0].name).toBe('Track 1');
    expect(invoke).toHaveBeenCalledWith('create_timeline_track', {
      timelineId: 1,
      name: 'Track 1',
    });
  });

  it('addElementToTrack adds a new element with duration', async () => {
    const mockElement = {
      id: 10,
      track_id: 1,
      audio_element_id: 5,
      start_time_ms: 1000,
      duration_ms: 5000,
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockElement);

    await useTimelineStore.getState().addElementToTrack(1, 5, 1000, 5000);

    const state = useTimelineStore.getState();
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0].start_time_ms).toBe(1000);
    expect(state.elements[0].duration_ms).toBe(5000);
  });
});
