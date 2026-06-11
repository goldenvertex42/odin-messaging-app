import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserSearch } from './useUserSearch';
import { customFetch } from '../../utils/api/api';

// Mock the explicit customFetch module utilized by the hook architecture internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

// Retain the precise native timeout fast-tracking intercept pattern
const nativeTimeout = window.setTimeout;
const mockTimeout = (callback, ms) => {
  return nativeTimeout(callback, ms === 300 ? 0 : ms);
};

describe('useUserSearch Custom Hook - Fast-Tracked Debounce Suite', () => {
  const mockToken = 'mock-valid-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', mockToken);
    
    // Intercept timeouts globally to force the 300ms loop to settle instantly
    window.setTimeout = mockTimeout;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Clear default implementations to enforce clean isolation
    customFetch.mockReset();
  });

  afterEach(() => {
    // Safely restore native clocks to prevent macro-task leak side effects
    window.setTimeout = nativeTimeout;
    vi.restoreAllMocks();
  });

  test('initializes with empty suggestions and false searching flag under empty inputs', () => {
    const { result } = renderHook(() => useUserSearch(''));
    
    expect(result.current.isSearching).toBe(false);
    expect(result.current.suggestions).toEqual([]);
    expect(customFetch).not.toHaveBeenCalled();
  });

  test('enters an immediate searching phase while the debounce timer evaluates', () => {
    // Return an unresolved promise to lock the hook state
    customFetch.mockImplementationOnce(() => new Promise(() => {}));
    
    const { result } = renderHook(() => useUserSearch('odin'));
    
    expect(result.current.isSearching).toBe(true);
    expect(result.current.suggestions).toEqual([]);
  });

  test('hydrates suggestions array natively when backend serves an array data envelope', async () => {
    const mockPayloadArray = [
      { id: 'u1', username: 'alice_dev', displayName: 'Alice' },
      { id: 'u2', username: 'alex_code', displayName: 'Alex' }
    ];

    customFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: mockPayloadArray })
    }));

    // Wrap the hook creation inside an act block to flush the 0ms timeout macro-task cycle cleanly
    let hookInstance;
    act(() => {
      hookInstance = renderHook(() => useUserSearch('al'));
    });

    await waitFor(() => {
      expect(hookInstance.result.current.isSearching).toBe(false);
    });

    expect(hookInstance.result.current.suggestions).toEqual(mockPayloadArray);
  });

  test('gracefully wraps individual object responses inside a local list array fallback wrapper', async () => {
    const mockSingleUser = { id: 'u3', username: 'bob_builder' };

    customFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: mockSingleUser })
    }));

    let hookInstance;
    act(() => {
      hookInstance = renderHook(() => useUserSearch('bob'));
    });

    await waitFor(() => {
      expect(hookInstance.result.current.isSearching).toBe(false);
    });

    expect(hookInstance.result.current.suggestions).toEqual([mockSingleUser]);
  });

  test('resets searching indicators and drops suggestions back to empty brackets upon network failure errors', async () => {
    customFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 404
    }));

    let hookInstance;
    act(() => {
      hookInstance = renderHook(() => useUserSearch('unknown_ghost'));
    });

    await waitFor(() => {
      expect(hookInstance.result.current.isSearching).toBe(false);
    });

    expect(hookInstance.result.current.suggestions).toEqual([]);
  });

  test('re-triggers the debounced network pipeline sequentially when updating search text properties', async () => {
    const initialPayload = [{ id: 'u1', username: 'alice_dev' }];
    const secondaryPayload = [{ id: 'u2', username: 'bob_builder' }];

    // Strict URL pattern filtering completely stops mock cross-contamination leaks across renders
    customFetch.mockImplementation((url) => {
      if (url.includes('query=alice')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: initialPayload }) });
      }
      if (url.includes('query=bob')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: secondaryPayload }) });
      }
      return Promise.reject(new Error(`Unexpected query target: ${url}`));
    });

    let hookInstance;
    act(() => {
      hookInstance = renderHook(({ input }) => useUserSearch(input), {
        initialProps: { input: 'alice' }
      });
    });

    await waitFor(() => {
      expect(hookInstance.result.current.suggestions).toEqual(initialPayload);
    });

    // Fire the secondary text input state change update transition
    act(() => {
      hookInstance.rerender({ input: 'bob' });
    });

    await waitFor(() => {
      expect(hookInstance.result.current.suggestions).toEqual(secondaryPayload);
    });

    expect(customFetch).toHaveBeenCalledTimes(2);
  });
});
