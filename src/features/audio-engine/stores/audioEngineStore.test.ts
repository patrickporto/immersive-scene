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
      activeTimelineLoopTimeout: null,
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
      { audio_element_id: 1, start_time_ms: 0, duration_ms: 2000 },
      { audio_element_id: 2, start_time_ms: 3000, duration_ms: 1500 },
    ]; // maxEndMs should be 4500

    useAudioEngineStore.getState().crossfadeToTimeline(timelineElements, true);

    // Fast forward setTimeout(scheduleTimelineChunk, 100)
    vi.advanceTimersByTime(100);

    expect(playScheduledMock).toHaveBeenCalledTimes(2);
    expect(playScheduledMock).toHaveBeenCalledWith(1, 0, 2000, 2);
    expect(playScheduledMock).toHaveBeenCalledWith(2, 3000, 1500, 0);

    // It should have set a timeout for the next loop at maxEndMs (4500)
    const state = useAudioEngineStore.getState();
    expect(state.activeTimelineLoopTimeout).not.toBeNull();

    playScheduledMock.mockClear();

    // Advance by maxEndMs (4500)
    vi.advanceTimersByTime(4500);

    // Should have scheduled the identical chunk again
    expect(playScheduledMock).toHaveBeenCalledTimes(2);
  });

  it('crossfadeToTimeline evaluates and sets activePlaybackContext state', () => {
    const timelineElements = [{ audio_element_id: 1, start_time_ms: 0, duration_ms: 2000 }];
    const context = { soundSetId: 10, moodId: 20, timelineId: 30 };

    useAudioEngineStore.getState().crossfadeToTimeline(timelineElements, false, context);

    // Fast forward setTimeout
    vi.advanceTimersByTime(100);

    const state = useAudioEngineStore.getState();
    expect(state.activePlaybackContext).toEqual(context);
    expect(state.isTimelinePlaying).toBe(true);
  });
});
