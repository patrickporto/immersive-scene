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
      transportCommandQueue: [],
      nextTransportSequence: 0,
      isTransportProcessingScheduled: false,
      transportLastAppliedByElement: new Map(),
      transportLatencySamples: { start: [], pause: [], stop: [] },
      transportQueueHighWatermark: 0,
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

    // Non-looping tracks should not schedule additional chunks
    expect(playScheduledMock).toHaveBeenCalledTimes(0);
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

  it('coalesces rapid play-pause-play commands to latest state', async () => {
    const sourceNode = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      loop: false,
      onended: null,
      buffer: null,
    } as unknown as AudioBufferSourceNode;

    const createBufferSource = vi.fn(() => sourceNode);
    const gainNode = { gain: { value: 1 } } as unknown as GainNode;

    useAudioEngineStore.setState({
      audioContext: {
        state: 'running',
        createBufferSource,
        resume: vi.fn().mockResolvedValue(undefined),
      } as unknown as AudioContext,
      sources: new Map([
        [
          42,
          {
            element: {} as never,
            buffer: {} as AudioBuffer,
            sourceNode: null,
            gainNode,
            isPlaying: false,
            isLooping: false,
            activeScheduledCount: 0,
            scheduledNodes: [],
          },
        ],
      ]),
      transportCommandQueue: [],
      nextTransportSequence: 0,
      isTransportProcessingScheduled: false,
      transportLastAppliedByElement: new Map(),
      transportLatencySamples: { start: [], pause: [], stop: [] },
      transportQueueHighWatermark: 0,
    });

    void useAudioEngineStore.getState().play(42);
    useAudioEngineStore.getState().pause(42);
    void useAudioEngineStore.getState().play(42);

    await vi.runAllTimersAsync();

    const source = useAudioEngineStore.getState().sources.get(42);
    expect(createBufferSource).toHaveBeenCalledTimes(1);
    expect(source?.isPlaying).toBe(true);
  });

  it('keeps command queue bounded under rapid toggles', async () => {
    const gainNode = { gain: { value: 1 } } as unknown as GainNode;

    useAudioEngineStore.setState({
      audioContext: {
        state: 'running',
        createBufferSource: vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          loop: false,
          onended: null,
          buffer: null,
        })),
        resume: vi.fn().mockResolvedValue(undefined),
      } as unknown as AudioContext,
      sources: new Map([
        [
          7,
          {
            element: {} as never,
            buffer: {} as AudioBuffer,
            sourceNode: null,
            gainNode,
            isPlaying: false,
            isLooping: false,
            activeScheduledCount: 0,
            scheduledNodes: [],
          },
        ],
      ]),
      transportCommandQueue: [],
      nextTransportSequence: 0,
      isTransportProcessingScheduled: false,
      transportLastAppliedByElement: new Map(),
      transportLatencySamples: { start: [], pause: [], stop: [] },
      transportQueueHighWatermark: 0,
    });

    for (let i = 0; i < 300; i += 1) {
      void useAudioEngineStore.getState().play(7);
      useAudioEngineStore.getState().stop(7);
    }

    expect(useAudioEngineStore.getState().transportCommandQueue.length).toBeLessThanOrEqual(1);

    await vi.runAllTimersAsync();

    const state = useAudioEngineStore.getState();
    expect(state.transportCommandQueue).toHaveLength(0);
    expect(state.transportQueueHighWatermark).toBeLessThanOrEqual(1);
  });

  it('records transport latency samples within local control SLO', async () => {
    const sourceNode = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      loop: false,
      onended: null,
      buffer: null,
    } as unknown as AudioBufferSourceNode;

    useAudioEngineStore.setState({
      audioContext: {
        state: 'running',
        createBufferSource: vi.fn(() => sourceNode),
        resume: vi.fn().mockResolvedValue(undefined),
      } as unknown as AudioContext,
      sources: new Map([
        [
          9,
          {
            element: {} as never,
            buffer: {} as AudioBuffer,
            sourceNode: null,
            gainNode: { gain: { value: 1 } } as unknown as GainNode,
            isPlaying: false,
            isLooping: false,
            activeScheduledCount: 0,
            scheduledNodes: [],
          },
        ],
      ]),
      transportCommandQueue: [],
      nextTransportSequence: 0,
      isTransportProcessingScheduled: false,
      transportLastAppliedByElement: new Map(),
      transportLatencySamples: { start: [], pause: [], stop: [] },
      transportQueueHighWatermark: 0,
    });

    void useAudioEngineStore.getState().play(9);
    await vi.runAllTimersAsync();

    const startSamples = useAudioEngineStore.getState().transportLatencySamples.start;
    expect(startSamples.length).toBeGreaterThan(0);
    expect(startSamples[0]).toBeLessThan(100);
  });
});
