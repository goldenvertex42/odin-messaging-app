import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useFriendsData from './useFriendsData';
import { customFetch } from '../../utils/api/api';

// 1. Mock out the specific customFetch module that the hook utilizes internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('useFriendsData Hook Engine Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Ensure token exists on every cycle sandbox paint
    localStorage.setItem('token', 'mock_jwt_pass_token');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper helper to generate responsive, parallel customFetch mock profiles
  const setupMockEndpoints = (friendsPayload, requestsPayload, patchOk = true) => {
    customFetch.mockImplementation((url, options) => {
      if (url === '/api/friends') {
        return Promise.resolve({
          ok: true,
          json: async () => friendsPayload
        });
      }
      if (url === '/api/friends/requests') {
        return Promise.resolve({
          ok: true,
          json: async () => requestsPayload
        });
      }
      if (url.startsWith('/api/friends/requests/')) {
        return Promise.resolve({
          ok: patchOk
        });
      }
      return Promise.reject(new Error(`Unhandled mock endpoint: ${url}`));
    });
  };

  it('should initialize with default states and fetch arrays correctly', async () => {
    const mockFriends = [
      { id: 'u2', username: 'charlie', displayName: 'Charlie' },
      { id: 'u1', username: 'alice', displayName: 'Alice' }
    ];
    const mockRequests = [
      { id: 'r1', sender: { username: 'bob' } }
    ];

    setupMockEndpoints(mockFriends, mockRequests);

    const { result } = renderHook(() => useFriendsData());

    // Expect loading state to trigger initially
    expect(result.current.loading).toBe(true);

    // Wait for resolution and verify alphabetic sorting logic (Alice before Charlie)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toHaveLength(2);
    expect(result.current.friends[0].displayName).toBe('Alice');
    expect(result.current.friends[1].displayName).toBe('Charlie');
    expect(result.current.requests).toHaveLength(1);
  });

  it('should gracefully handle empty arrays and backend extraction envelopes', async () => {
    // Mock standard data payload wrapper envelopes { data: [...] }
    setupMockEndpoints({ data: [] }, { data: [] });

    const { result } = renderHook(() => useFriendsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Confirm safe fallback parsing
    expect(result.current.friends).toEqual([]);
    expect(result.current.requests).toEqual([]);
  });

  it('should remove request and sort added friend locally when ACCEPTED', async () => {
    const initialFriends = [{ id: 'u1', username: 'alice', displayName: 'Alice' }];
    const initialRequests = [{ id: 'req_123', sender: { username: 'bob' } }];
    const targetFriend = { id: 'u3', username: 'bob', displayName: 'Bob' };

    setupMockEndpoints(initialFriends, initialRequests, true);

    const { result } = renderHook(() => useFriendsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Execute state mutation handler
    await act(async () => {
      await result.current.processRequest('req_123', targetFriend, 'ACCEPTED');
    });

    // Check request removal and correct sorting insertion order
    expect(result.current.requests).toHaveLength(0);
    expect(result.current.friends).toHaveLength(2);
    expect(result.current.friends[0].displayName).toBe('Alice');
    expect(result.current.friends[1].displayName).toBe('Bob');
  });

  it('should remove request without modifying friends array when REJECTED', async () => {
    const initialFriends = [{ id: 'u1', username: 'alice', displayName: 'Alice' }];
    const initialRequests = [{ id: 'req_123', sender: { username: 'bob' } }];

    setupMockEndpoints(initialFriends, initialRequests, true);

    const { result } = renderHook(() => useFriendsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.processRequest('req_123', null, 'REJECTED');
    });

    expect(result.current.requests).toHaveLength(0);
    expect(result.current.friends).toHaveLength(1); // Unmodified
  });
});
