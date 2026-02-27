// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppVersionAndUpdates } from './useAppVersionAndUpdates';

const getVersionMock = vi.fn();

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: () => getVersionMock(),
}));

describe('useAppVersionAndUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVersionMock.mockResolvedValue('0.1.0');
  });

  it('loads current version on mount', async () => {
    const { result } = renderHook(() => useAppVersionAndUpdates());

    await waitFor(() => {
      expect(result.current.currentVersion).toBe('0.1.0');
    });

    expect(result.current.currentVersion).toBe('0.1.0');
  });

  it('reports update available when GitHub tag is newer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ tag_name: 'v0.2.0' }),
      })
    );

    const { result } = renderHook(() => useAppVersionAndUpdates());

    await waitFor(() => {
      expect(result.current.currentVersion).toBe('0.1.0');
    });

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.status).toBe('update-available');
    expect(result.current.latestVersion).toBe('v0.2.0');
  });

  it('reports up-to-date when versions match', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ tag_name: 'v0.1.0' }),
      })
    );

    const { result } = renderHook(() => useAppVersionAndUpdates());

    await waitFor(() => {
      expect(result.current.currentVersion).toBe('0.1.0');
    });

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.status).toBe('up-to-date');
  });

  it('reports error state when request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const { result } = renderHook(() => useAppVersionAndUpdates());

    await waitFor(() => {
      expect(result.current.currentVersion).toBe('0.1.0');
    });

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toContain('network down');
  });
});
