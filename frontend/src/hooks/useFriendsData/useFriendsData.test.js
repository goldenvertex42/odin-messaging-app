import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useFriendsData from './useFriendsData';

describe('useFriendsData Hook Engine Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // Ensure token exists on every cycle sandbox paint
    localStorage.setItem('token', 'mock_jwt_pass_token');
  });

  it('should initialize with default states and fetch arrays correctly', async () => {
    const mockFriends = [
      { id: 'u2', username: 'charlie', displayName: 'Charlie' },
      { id: 'u1', username: 'alice', displayName: 'Alice' }
    ];
    const mockRequests = [
      { id: 'r1', sender: { username: 'bob' } }
    ];

    // Mock global fetch resolution vectors
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/friends') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFriends)
        });
      }
      if (url === '/api/friends/requests') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRequests)
        });
      }
    }));

    const { result } = renderHook(() => useFriendsData());

    // Expect loading state to trigger initially
    expect(result.current.loading).toBe(true);

    // Wait for resolution and verify alphabetic sorting logic (Alice before Charlie)
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.friends).toHaveLength(2);
    expect(result.current.friends[0].displayName).toBe('Alice');
    expect(result.current.friends[1].displayName).toBe('Charlie');
    expect(result.current.requests).toHaveLength(1);
  });

  it('should gracefully handle empty arrays and backend extraction envelopes', async () => {
    // Mock standard data payload wrapper envelopes { data: [...] }
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/friends') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });
      }
      if (url === '/api/friends/requests') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });
      }
    }));

    const { result } = renderHook(() => useFriendsData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Confirm safe fallback parsing
    expect(result.current.friends).toEqual([]);
    expect(result.current.requests).toEqual([]);
  });

  it('should remove request and sort added friend locally when ACCEPTED', async () => {
    const initialFriends = [{ id: 'u1', username: 'alice', displayName: 'Alice' }];
    const initialRequests = [{ id: 'req_123', sender: { username: 'bob' } }];
    const targetFriend = { id: 'u3', username: 'bob', displayName: 'Bob' };

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/friends') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(initialFriends) });
      }
      if (url === '/api/friends/requests') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(initialRequests) });
      }
      // Intercept patch route decision
      if (url === '/api/friends/requests/req_123') {
        return Promise.resolve({ ok: true });
      }
    }));

    const { result } = renderHook(() => useFriendsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

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

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/friends') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(initialFriends) });
      }
      if (url === '/api/friends/requests') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(initialRequests) });
      }
      if (url === '/api/friends/requests/req_123') {
        return Promise.resolve({ ok: true });
      }
    }));

    const { result } = renderHook(() => useFriendsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.processRequest('req_123', null, 'REJECTED');
    });

    expect(result.current.requests).toHaveLength(0);
    expect(result.current.friends).toHaveLength(1); // Unmodified
  });
});
