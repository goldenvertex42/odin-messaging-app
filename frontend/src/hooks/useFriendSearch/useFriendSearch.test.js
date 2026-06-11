import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFriendSearch } from './useFriendSearch';
import { customFetch } from '../../utils/api/api';

// 1. Mock the specific customFetch module that the hook utilizes internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

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
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-valid-jwt');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should filter suggestions dynamically based on partial match inputs case-insensitively', async () => {
    // 1. Setup customFetch to return a simulated response object structure
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriendsData
    });

    const { result, rerender } = renderHook(
      ({ isOpen, input, participants }) => useFriendSearch(isOpen, input, participants),
      { initialProps: { isOpen: true, input: 'ALICE', participants: [] } }
    );

    // 2. Wait for the hook to finish processing its initial fetch lifecycle and dynamic filtering
    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });
    expect(result.current.suggestions[0].username).toBe('alice_dev');

    // 3. Trigger re-render with a new mutated input search term string
    rerender({ isOpen: true, input: 'bo', participants: [] });

    // 4. Verify client-side state machine recalculates suggestions instantly without dropping frames
    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });
    expect(result.current.suggestions[0].username).toBe('bob_builder');

    // Ensure the underlying customFetch wrapper endpoint was hit exactly once on modal open
    expect(customFetch).toHaveBeenCalledTimes(1);
  });

  test('should skip users who are already added as active chips in participants', async () => {
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriendsData
    });

    const { result } = renderHook(
      ({ isOpen, input, participants }) => useFriendSearch(isOpen, input, participants),
      { initialProps: { isOpen: true, input: 'bo', participants: ['bob_builder'] } }
    );

    // Since 'bob_builder' is explicitly listed in the tracking array, suggestions must return empty
    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(0);
    });
  });
});
