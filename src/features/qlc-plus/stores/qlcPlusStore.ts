import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface QlcFunction {
  id: string;
  name: string;
  function_type: string;
  supports_toggle: boolean;
  supports_parameter: boolean;
  parameter_name: string | null;
  parameter_min: number | null;
  parameter_max: number | null;
}

type CommandStatus = 'idle' | 'pending' | 'success' | 'error';

interface QlcPlusState {
  functions: QlcFunction[];
  statuses: Record<string, CommandStatus>;
  statusMessages: Record<string, string>;
  isLoading: boolean;
  error: string | null;

  loadFunctions: () => Promise<void>;
  triggerFunction: (functionId: string, action?: 'start' | 'toggle' | 'flash') => Promise<void>;
  stopFunction: (functionId: string) => Promise<void>;
  setFunctionParameter: (functionId: string, parameterName: string, value: number) => Promise<void>;
  sendPanic: () => Promise<void>;
  clearError: () => void;
}

/**
 * @description QLC+ store that manages function catalog and command actions.
 * @returns Zustand state with QLC+ catalog and controls.
 */
export const useQlcPlusStore = create<QlcPlusState>((set, get) => ({
  functions: [],
  statuses: {},
  statusMessages: {},
  isLoading: false,
  error: null,

  loadFunctions: async () => {
    set({ isLoading: true, error: null });
    try {
      const functions = await invoke<QlcFunction[]>('qlc_list_functions');
      set({ functions, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  triggerFunction: async (functionId, action = 'start') => {
    const { statuses, statusMessages } = get();
    set({
      statuses: { ...statuses, [functionId]: 'pending' },
      statusMessages: { ...statusMessages, [functionId]: `Sending ${action}...` },
    });

    try {
      await invoke('qlc_trigger_function', { functionId, action });
      set(state => ({
        statuses: { ...state.statuses, [functionId]: 'success' },
        statusMessages: { ...state.statusMessages, [functionId]: `${action} sent` },
      }));
    } catch (error) {
      set(state => ({
        statuses: { ...state.statuses, [functionId]: 'error' },
        statusMessages: { ...state.statusMessages, [functionId]: String(error) },
      }));
    }
  },

  stopFunction: async functionId => {
    const { statuses, statusMessages } = get();
    set({
      statuses: { ...statuses, [functionId]: 'pending' },
      statusMessages: { ...statusMessages, [functionId]: 'Stopping...' },
    });

    try {
      await invoke('qlc_stop_function', { functionId });
      set(state => ({
        statuses: { ...state.statuses, [functionId]: 'success' },
        statusMessages: { ...state.statusMessages, [functionId]: 'Stopped' },
      }));
    } catch (error) {
      set(state => ({
        statuses: { ...state.statuses, [functionId]: 'error' },
        statusMessages: { ...state.statusMessages, [functionId]: String(error) },
      }));
    }
  },

  setFunctionParameter: async (functionId, parameterName, value) => {
    const { statuses, statusMessages } = get();
    set({
      statuses: { ...statuses, [functionId]: 'pending' },
      statusMessages: { ...statusMessages, [functionId]: `${parameterName}: ${value.toFixed(0)}` },
    });

    try {
      await invoke('qlc_set_function_parameter', { functionId, parameterName, value });
      set(state => ({
        statuses: { ...state.statuses, [functionId]: 'success' },
        statusMessages: {
          ...state.statusMessages,
          [functionId]: `${parameterName} applied (${value.toFixed(0)})`,
        },
      }));
    } catch (error) {
      set(state => ({
        statuses: { ...state.statuses, [functionId]: 'error' },
        statusMessages: { ...state.statusMessages, [functionId]: String(error) },
      }));
    }
  },

  sendPanic: async () => {
    set({ error: null });
    try {
      await invoke('qlc_panic');
    } catch (error) {
      set({ error: String(error) });
    }
  },

  clearError: () => set({ error: null }),
}));
