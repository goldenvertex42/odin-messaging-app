import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFriendSearch } from './useFriendSearch';

describe('useFriendSearch Hook Suite', () => {
  // Mock foundational friends dataset matching your API structure
  const mockFriendsData = {
    success: true,
    data: [
      { id: '1', username: 'alice_dev', displayName: 'Alice' },
      { id: '2', username: 'bob_builder', displayName: 'Bob' },
      { id: '3', username: 'charlie_brown', displayName: 'Charlie' }
    ]
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('should filter suggestions dynamically based on partial match inputs case-insensitively', async () => {
    // Seed the single foundational /api/friends fetch request on mount
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriendsData
    });

    const { result, rerender } = renderHook(
      ({ isOpen, input, participants }) => useFriendSearch(isOpen, input, participants),
      {
        initialProps: { isOpen: true, input: 'ALICE', participants: [] }
      }
    );

    // 1. Wait for fetch to resolve and filter down to 'alice_dev'
    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });
    expect(result.current.suggestions[0].username).toBe('alice_dev');

    // 2. Trigger re-render with a new search term mutation
    rerender({ isOpen: true, input: 'bo', participants: [] });

    // 3. Verify client-side filtering updates without triggering a new network request
    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });
    expect(result.current.suggestions[0].username).toBe('bob_builder');
    
    // Ensure the network endpoint was only hit exactly once on mount
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('should skip users who are already added as active chips in participants', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriendsData
    });

    const { result } = renderHook(
      ({ isOpen, input, participants }) => useFriendSearch(isOpen, input, participants),
      {
        initialProps: { isOpen: true, input: 'bo', participants: ['bob_builder'] }
      }
    );

    // Since 'bob_builder' is a participant chip, the filtered array should result in 0 suggestions
    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(0);
    });
  });
});

