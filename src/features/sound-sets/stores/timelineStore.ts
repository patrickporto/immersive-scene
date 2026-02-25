import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface Timeline {
  id: number;
  mood_id: number;
  name: string;
  order_index: number;
  created_at: string;
}

export interface TimelineElement {
  id: number;
  timeline_id: number;
  audio_element_id: number;
  start_time_ms: number;
}

interface TimelineState {
  timelines: Timeline[];
  elements: TimelineElement[];
  selectedTimelineId: number | null;
  isLoading: boolean;
  error: string | null;

  loadTimelines: (moodId: number) => Promise<void>;
  createTimeline: (moodId: number, name: string) => Promise<void>;
  deleteTimeline: (id: number) => Promise<void>;
  selectTimeline: (id: number | null) => void;

  loadTimelineElements: (timelineId: number) => Promise<void>;
  addElementToTimeline: (
    timelineId: number,
    audioElementId: number,
    startTimeMs: number
  ) => Promise<void>;
  updateTimelineElementTime: (id: number, startTimeMs: number) => Promise<void>;
  deleteTimelineElement: (id: number) => Promise<void>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelines: [],
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
        elements: state.selectedTimelineId === id ? [] : state.elements,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectTimeline: id => {
    set({ selectedTimelineId: id, elements: [] });
    if (id !== null) {
      get().loadTimelineElements(id);
    }
  },

  loadTimelineElements: async timelineId => {
    set({ isLoading: true, error: null });
    try {
      const elements = await invoke<TimelineElement[]>('get_timeline_elements', { timelineId });
      set({ elements, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addElementToTimeline: async (timelineId, audioElementId, startTimeMs) => {
    set({ isLoading: true, error: null });
    try {
      const newElement = await invoke<TimelineElement>('add_element_to_timeline', {
        timelineId,
        audioElementId,
        startTimeMs,
      });
      set(state => ({
        elements: [...state.elements, newElement],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  updateTimelineElementTime: async (id, startTimeMs) => {
    set({ error: null });
    try {
      await invoke('update_timeline_element_time', { id, startTimeMs });
      set(state => ({
        elements: state.elements.map(el =>
          el.id === id ? { ...el, start_time_ms: startTimeMs } : el
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
