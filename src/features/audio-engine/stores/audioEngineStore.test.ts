import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAudioEngineStore } from './audioEngineStore';

describe('audioEngineStore scheduling', () => {
  let playScheduledMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    playScheduledMock = vi.fn().mockResolvedValue(undefined);
    useAudioEngineStore.setState({
      audioContext: { currentTime: 0, state: 'running' } as unknown as AudioContext,
      sources: new Map(),
      activeTrackTimeouts: new Map(),
      playScheduled: playScheduledMock as unknown as (
        elementId: number,
        delayMs: number,
        playDurationMs: number,
        fadeInDuration?: number
      ) => Promise<void>,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('crossfadeToTimeline schedules all elements and calculates loop timeout accurately', () => {
    const timelineElements = [
      {
        track_id: 1,
        audio_element_id: 1,
        element_group_id: null,
        start_time_ms: 0,
        duration_ms: 2000,
      },
      {
        track_id: 1,
        audio_element_id: 2,
        element_group_id: null,
        start_time_ms: 3000,
        duration_ms: 1500,
      },
    ]; // maxEndMs should be 4500
    const tracks = [{ id: 1, is_looping: false }];

    useAudioEngineStore.getState().crossfadeToTimeline(timelineElements, tracks, true);

    // Fast forward setTimeout(scheduleTimelineChunk, 100)
    vi.advanceTimersByTime(100);

    expect(playScheduledMock).toHaveBeenCalledTimes(2);
    expect(playScheduledMock).toHaveBeenCalledWith(1, 0, 2000, 2);
    expect(playScheduledMock).toHaveBeenCalledWith(2, 3000, 1500, 0);

    // It should have set active track timeouts
    const state = useAudioEngineStore.getState();
    expect(state.activeTrackTimeouts.size).toBeGreaterThan(0);

    playScheduledMock.mockClear();

    // Advance by maxEndMs (4500)
    vi.advanceTimersByTime(4500);

    // Should have scheduled the identical chunk again
    expect(playScheduledMock).toHaveBeenCalledTimes(2);
  });

  it('crossfadeToTimeline evaluates and sets activePlaybackContext state', () => {
    const timelineElements = [
      {
        track_id: 1,
        audio_element_id: 1,
        element_group_id: null,
        start_time_ms: 0,
        duration_ms: 2000,
      },
    ];
    const tracks = [{ id: 1, is_looping: false }];
    const context = { soundSetId: 10, moodId: 20, timelineId: 30 };

    useAudioEngineStore.getState().crossfadeToTimeline(timelineElements, tracks, false, context);

    // Fast forward setTimeout
    vi.advanceTimersByTime(100);

    const state = useAudioEngineStore.getState();
    expect(state.activePlaybackContext).toEqual(context);
    expect(state.isTimelinePlaying).toBe(true);
  });
});
