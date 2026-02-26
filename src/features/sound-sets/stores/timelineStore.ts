import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface Timeline {
  id: number;
  mood_id: number;
  name: string;
  order_index: number;
  is_looping: boolean;
  created_at: string;
}

export interface TimelineTrack {
  id: number;
  timeline_id: number;
  name: string;
  order_index: number;
  created_at: string;
}

export interface TimelineElement {
  id: number;
  track_id: number;
  audio_element_id: number;
  start_time_ms: number;
  duration_ms: number;
}

interface TimelineElementLike {
  id: number;
  track_id?: number;
  audio_element_id?: number;
  start_time_ms?: number;
  duration_ms?: number;
  trackId?: number;
  audioElementId?: number;
  startTimeMs?: number;
  durationMs?: number;
}

const normalizeTimelineElement = (element: TimelineElementLike): TimelineElement => ({
  id: Number(element.id) || 0,
  track_id: Number(element.track_id ?? element.trackId) || 0,
  audio_element_id: Number(element.audio_element_id ?? element.audioElementId) || 0,
  start_time_ms: Number(element.start_time_ms ?? element.startTimeMs) || 0,
  duration_ms: Number(element.duration_ms ?? element.durationMs) || 0,
});

interface TimelineState {
  timelines: Timeline[];
  tracks: TimelineTrack[];
  elements: TimelineElement[];
  selectedTimelineId: number | null;
  isLoading: boolean;
  error: string | null;

  loadTimelines: (moodId: number) => Promise<void>;
  createTimeline: (moodId: number, name: string) => Promise<void>;
  deleteTimeline: (id: number) => Promise<void>;
  selectTimeline: (id: number | null) => void;
  toggleTimelineLoop: (id: number, isLooping: boolean) => Promise<void>;

  loadTimelineTracks: (timelineId: number) => Promise<void>;
  createTimelineTrack: (timelineId: number, name: string) => Promise<void>;
  deleteTimelineTrack: (id: number) => Promise<void>;
  updateTimelineTrackOrder: (id: number, orderIndex: number) => Promise<void>;

  loadTrackElements: (trackId: number) => Promise<void>;
  addElementToTrack: (
    trackId: number,
    audioElementId: number,
    startTimeMs: number,
    durationMs: number
  ) => Promise<void>;
  updateElementTimeAndDuration: (
    id: number,
    startTimeMs: number,
    durationMs: number
  ) => Promise<void>;
  deleteTimelineElement: (id: number) => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelines: [],
  tracks: [],
  elements: [],
  selectedTimelineId: null,
  isLoading: false,
  error: null,

  loadTimelines: async moodId => {
    set({ isLoading: true, error: null });
    try {
      const timelines = await invoke<Timeline[]>('get_timelines', { moodId });
      set({ timelines, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createTimeline: async (moodId, name) => {
    set({ isLoading: true, error: null });
    try {
      const newTimeline = await invoke<Timeline>('create_timeline', { moodId, name });
      set(state => ({
        timelines: [...state.timelines, newTimeline],
        isLoading: false,
      }));
      // Automatically create a default track for new timelines
      await get().createTimelineTrack(newTimeline.id, 'Track 1');
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  deleteTimeline: async id => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_timeline', { id });
      set(state => ({
        timelines: state.timelines.filter(t => t.id !== id),
        selectedTimelineId: state.selectedTimelineId === id ? null : state.selectedTimelineId,
        tracks: state.selectedTimelineId === id ? [] : state.tracks,
        elements: state.selectedTimelineId === id ? [] : state.elements,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectTimeline: async id => {
    set({ selectedTimelineId: id, tracks: [], elements: [] });
    if (id !== null) {
      await get().loadTimelineTracks(id);
      // Load elements for all tracks in this timeline
      const currentTracks = get().tracks;
      for (const track of currentTracks) {
        await get().loadTrackElements(track.id);
      }
    }
  },

  toggleTimelineLoop: async (id, isLooping) => {
    try {
      await invoke('update_timeline_loop', { id, isLooping });
      set(state => ({
        timelines: state.timelines.map(t => (t.id === id ? { ...t, is_looping: isLooping } : t)),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  loadTimelineTracks: async timelineId => {
    set({ isLoading: true, error: null });
    try {
      const tracks = await invoke<TimelineTrack[]>('get_timeline_tracks', { timelineId });
      set({ tracks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createTimelineTrack: async (timelineId, name) => {
    set({ isLoading: true, error: null });
    try {
      const newTrack = await invoke<TimelineTrack>('create_timeline_track', { timelineId, name });
      set(state => ({
        tracks: [...state.tracks, newTrack],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  deleteTimelineTrack: async id => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_timeline_track', { id });
      set(state => ({
        tracks: state.tracks.filter(t => t.id !== id),
        elements: state.elements.filter(e => e.track_id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  updateTimelineTrackOrder: async (id, orderIndex) => {
    try {
      await invoke('update_timeline_track_order', { id, orderIndex });
      set(state => ({
        tracks: state.tracks.map(t => (t.id === id ? { ...t, order_index: orderIndex } : t)),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  loadTrackElements: async trackId => {
    set({ isLoading: true, error: null });
    try {
      const trackElements = await invoke<TimelineElementLike[]>('get_track_elements', { trackId });
      const normalizedTrackElements = trackElements.map(normalizeTimelineElement);
      set(state => {
        // Remove old elements for this track to prevent duplicates
        const filtered = state.elements.filter(e => e.track_id !== trackId);
        return { elements: [...filtered, ...normalizedTrackElements], isLoading: false };
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addElementToTrack: async (trackId, audioElementId, startTimeMs, durationMs) => {
    set({ isLoading: true, error: null });
    try {
      const rawNewElement = await invoke<TimelineElementLike>('add_element_to_track', {
        trackId,
        audioElementId,
        startTimeMs,
        durationMs,
      });
      const newElement = normalizeTimelineElement(rawNewElement);
      set(state => ({
        elements: [...state.elements, newElement],
        isLoading: false,
      }));
    } catch (error) {
      const message = String(error);
      set({ error: message, isLoading: false });
      if (error instanceof Error) {
        throw error;
      }
      const wrappedError = new Error(message) as Error & { cause?: unknown };
      wrappedError.cause = error;
      throw wrappedError;
    }
  },

  updateElementTimeAndDuration: async (id, startTimeMs, durationMs) => {
    set({ error: null });
    try {
      await invoke('update_element_time_and_duration', { id, startTimeMs, durationMs });
      set(state => ({
        elements: state.elements.map(el =>
          el.id === id ? { ...el, start_time_ms: startTimeMs, duration_ms: durationMs } : el
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  deleteTimelineElement: async id => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_timeline_element', { id });
      set(state => ({
        elements: state.elements.filter(el => el.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
}));
