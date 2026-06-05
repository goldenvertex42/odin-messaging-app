import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserSearch } from './useUserSearch'; // Adjust the relative path if needed

// Intercept window.setTimeout globally to force the 300ms debounce loop to execute instantly
const nativeTimeout = window.setTimeout;
const mockTimeout = (callback, ms) => {
  return nativeTimeout(callback, ms === 300 ? 0 : ms);
};

describe('useUserSearch Custom Hook - Integration Suite', () => {
  const mockToken = 'mock-valid-jwt-token';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.setTimeout = mockTimeout; // Fast-track debounce macro-tasks
    localStorage.setItem('token', mockToken);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    window.setTimeout = nativeTimeout; // Restore native system clocks safely
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('initializes with empty suggestions and false searching flag under empty inputs', () => {
    const { result } = renderHook(() => useUserSearch(''));

    expect(result.current.isSearching).toBe(false);
    expect(result.current.suggestions).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('enters an immediate searching phase while the debounce timer evaluates', () => {
    // Leave the fetch promise unresolved to lock the hook in its transitional loading layout state
    fetch.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useUserSearch('odin'));

    expect(result.current.isSearching).toBe(true);
    expect(result.current.suggestions).toEqual([]);
  });

  test('hydrates suggestions array natively when backend serves an array data envelope', async () => {
    const mockPayloadArray = [
      { id: 'u1', username: 'alice_dev', displayName: 'Alice' },
      { id: 'u2', username: 'alex_code', displayName: 'Alex' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPayloadArray })
    });

    const { result } = renderHook(() => useUserSearch('al'));

    // Wait for the instant debounce call and network micro-task resolution loop to settle
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(result.current.suggestions).toEqual(mockPayloadArray);
    expect(fetch).toHaveBeenCalledWith('/api/profile/search?query=al', expect.objectContaining({
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    }));
  });

  test('gracefully wraps individual object responses inside a local list array fallback wrapper', async () => {
    const mockSingleUser = { id: 'u3', username: 'bob_builder' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSingleUser })
    });

    const { result } = renderHook(() => useUserSearch('bob'));

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    // Asserts object compatibility handler converts single row payloads into safe map arrays
    expect(result.current.suggestions).toEqual([mockSingleUser]);
  });

  test('resets searching indicators and drops suggestions back to empty brackets upon network failure errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const { result } = renderHook(() => useUserSearch('unknown_ghost'));

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(result.current.suggestions).toEqual([]);
  });

  test('re-triggers the debounced network pipeline sequentially when updating search text properties', async () => {
    const initialPayload = [{ id: 'u1', username: 'alice_dev' }];
    const secondaryPayload = [{ id: 'u2', username: 'bob_builder' }];

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: initialPayload }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: secondaryPayload }) });

    const { result, rerender } = renderHook(({ input }) => useUserSearch(input), {
      initialProps: { input: 'alice' }
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(initialPayload);
    });

    // Trigger input mutation re-render execution block
    rerender({ input: 'bob' });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(secondaryPayload);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
