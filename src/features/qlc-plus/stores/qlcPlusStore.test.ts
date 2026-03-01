import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQlcPlusStore } from './qlcPlusStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('qlcPlusStore', () => {
  beforeEach(() => {
    useQlcPlusStore.setState({
      functions: [],
      statuses: {},
      statusMessages: {},
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('loads QLC+ functions', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([
      {
        id: 'f-1',
        name: 'Lightning Strike',
        function_type: 'scene',
        supports_toggle: true,
        supports_parameter: false,
        parameter_name: null,
        parameter_min: null,
        parameter_max: null,
      },
    ]);

    await useQlcPlusStore.getState().loadFunctions();

    const state = useQlcPlusStore.getState();
    expect(state.functions).toHaveLength(1);
    expect(state.functions[0].id).toBe('f-1');
    expect(invoke).toHaveBeenCalledWith('qlc_list_functions');
  });

  it('marks function command as success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({ success: true });

    await useQlcPlusStore.getState().triggerFunction('f-2', 'start');

    const state = useQlcPlusStore.getState();
    expect(state.statuses['f-2']).toBe('success');
    expect(state.statusMessages['f-2']).toContain('start');
  });

  it('marks function command as error', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('endpoint down'));

    await useQlcPlusStore.getState().stopFunction('f-3');

    const state = useQlcPlusStore.getState();
    expect(state.statuses['f-3']).toBe('error');
    expect(state.statusMessages['f-3']).toContain('endpoint down');
  });
});
