import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface ElementGroup {
  id: number;
  name: string;
  sound_set_id: number | null;
  created_at: string;
}

export interface ElementGroupMember {
  id: number;
  group_id: number;
  audio_element_id: number;
  order_index: number;
}

interface ElementGroupState {
  groups: ElementGroup[];
  groupMembers: Record<number, ElementGroupMember[]>;
  isLoading: boolean;
  error: string | null;

  loadGroups: (soundSetId?: number | null) => Promise<void>;
  createGroup: (name: string, soundSetId?: number | null) => Promise<ElementGroup | null>;
  renameGroup: (id: number, name: string) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;

  loadGroupMembers: (groupId: number) => Promise<void>;
  addElementToGroup: (groupId: number, audioElementId: number) => Promise<void>;
  removeElementFromGroup: (memberId: number, groupId: number) => Promise<void>;
}

export const useElementGroupStore = create<ElementGroupState>(set => ({
  groups: [],
  groupMembers: {},
  isLoading: false,
  error: null,

  loadGroups: async soundSetId => {
    set({ isLoading: true, error: null });
    try {
      const fetchedGroups = await invoke<ElementGroup[]>('get_element_groups', { soundSetId });
      set(state => {
        if (soundSetId) {
          const globals = state.groups.filter(g => g.sound_set_id === null);
          // Filter out any other soundSet's groups just to be clean, or keep them if you want
          return { groups: [...globals, ...fetchedGroups], isLoading: false };
        } else {
          const soundSetGroups = state.groups.filter(g => g.sound_set_id !== null);
          return { groups: [...soundSetGroups, ...fetchedGroups], isLoading: false };
        }
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createGroup: async (name, soundSetId) => {
    set({ isLoading: true, error: null });
    try {
      const newGroup = await invoke<ElementGroup>('create_element_group', { name, soundSetId });
      set(state => ({
        groups: [newGroup, ...state.groups],
        isLoading: false,
      }));
      return newGroup;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return null;
    }
  },

  renameGroup: async (id, name) => {
    try {
      await invoke('rename_element_group', { id, name });
      set(state => ({
        groups: state.groups.map(g => (g.id === id ? { ...g, name } : g)),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  deleteGroup: async id => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_element_group', { id });
      set(state => {
        const newMembers = { ...state.groupMembers };
        delete newMembers[id];
        return {
          groups: state.groups.filter(g => g.id !== id),
          groupMembers: newMembers,
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadGroupMembers: async groupId => {
    set({ isLoading: true, error: null });
    try {
      const members = await invoke<ElementGroupMember[]>('get_group_members', { groupId });
      set(state => ({
        groupMembers: {
          ...state.groupMembers,
          [groupId]: members,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addElementToGroup: async (groupId, audioElementId) => {
    set({ isLoading: true, error: null });
    try {
      const newMember = await invoke<ElementGroupMember>('add_element_to_group', {
        groupId,
        audioElementId,
      });
      set(state => {
        const currentMembers = state.groupMembers[groupId] || [];
        return {
          groupMembers: {
            ...state.groupMembers,
            [groupId]: [...currentMembers, newMember],
          },
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  removeElementFromGroup: async (memberId, groupId) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('remove_element_from_group', { id: memberId });
      set(state => {
        const currentMembers = state.groupMembers[groupId] || [];
        return {
          groupMembers: {
            ...state.groupMembers,
            [groupId]: currentMembers.filter(m => m.id !== memberId),
          },
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
}));
