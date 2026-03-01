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
    const mockTrack = {
      id: 1,
      timeline_id: 1,
      name: 'Track 1',
      order_index: 0,
      is_looping: false,
      created_at: '',
    };
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
      element_group_id: null,
      start_time_ms: 1000,
      duration_ms: 5000,
      is_available: true,
      cue_type: 'audio',
      qlc_function_id: null,
      qlc_action: null,
      qlc_param_name: null,
      qlc_param_value: null,
      cue_label: null,
      cue_notes: null,
      cue_tags: null,
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockElement);

    await useTimelineStore.getState().addElementToTrack(1, 5, null, 1000, 5000);

    const state = useTimelineStore.getState();
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0].start_time_ms).toBe(1000);
    expect(state.elements[0].duration_ms).toBe(5000);
  });

  it('addElementToTrack forwards QLC cue metadata', async () => {
    const mockElement = {
      id: 11,
      track_id: 1,
      audio_element_id: null,
      element_group_id: null,
      start_time_ms: 2500,
      duration_ms: 1000,
      is_available: true,
      cue_type: 'qlc',
      qlc_function_id: 'qlc-1',
      qlc_action: 'start',
      qlc_param_name: null,
      qlc_param_value: null,
      cue_label: 'Storm',
      cue_notes: 'Boss intro',
      cue_tags: 'boss',
    };

    vi.mocked(invoke).mockResolvedValueOnce(mockElement);

    await useTimelineStore.getState().addElementToTrack(1, null, null, 2500, 1000, {
      cueType: 'qlc',
      qlcFunctionId: 'qlc-1',
      qlcAction: 'start',
      cueLabel: 'Storm',
      cueNotes: 'Boss intro',
      cueTags: 'boss',
    });

    expect(invoke).toHaveBeenCalledWith('add_element_to_track', {
      trackId: 1,
      audioElementId: null,
      elementGroupId: null,
      startTimeMs: 2500,
      durationMs: 1000,
      cueType: 'qlc',
      qlcFunctionId: 'qlc-1',
      qlcAction: 'start',
      qlcParamName: undefined,
      qlcParamValue: undefined,
      cueLabel: 'Storm',
      cueNotes: 'Boss intro',
      cueTags: 'boss',
    });
  });
});
