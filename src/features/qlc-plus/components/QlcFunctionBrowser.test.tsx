// @vitest-environment jsdom
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QlcFunctionBrowser } from './QlcFunctionBrowser';
import { useQlcPlusStore } from '../stores/qlcPlusStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }: { children: (...args: unknown[]) => unknown }) =>
    children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }: { children: (...args: unknown[]) => unknown }) =>
    children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

describe('QlcFunctionBrowser', () => {
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

  it('renders fetched functions and allows start action', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce([
        {
          id: 'fx-01',
          name: 'Boss Reveal',
          function_type: 'scene',
          supports_toggle: true,
          supports_parameter: false,
          parameter_name: null,
          parameter_min: null,
          parameter_max: null,
        },
      ])
      .mockResolvedValueOnce({ success: true });

    render(<QlcFunctionBrowser />);

    await waitFor(() => {
      expect(screen.getByText('Boss Reveal')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('qlc_trigger_function', {
        functionId: 'fx-01',
        action: 'start',
      });
    });
  });
});
