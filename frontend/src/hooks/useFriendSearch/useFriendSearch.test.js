// frontend/src/hooks/useFriendSearch/useFriendSearch.test.js
import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useFriendSearch } from './useFriendSearch';

const MOCK_BASE_URL = 'https://test-odin-messenger.internal';
const MOCK_TOKEN = 'mocked-jwt-friend-token';

const MOCK_FRIENDS = [
  { id: 'u1', username: 'alice_dev', displayName: 'Alice Smith', avatarUrl: 'https://dicebear.com' },
  { id: 'u2', username: 'bob_builder', displayName: 'Bob Jones', avatarUrl: 'https://dicebear.com' },
  { id: 'u3', username: 'charlie_brown', displayName: 'Charlie Brown', avatarUrl: 'https://dicebear.com' }
];

const server = setupServer(
  http.get(`${MOCK_BASE_URL}/api/users/friends`, () => {
    return HttpResponse.json({ success: true, data: MOCK_FRIENDS });
  })
);

beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', MOCK_BASE_URL);
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', MOCK_TOKEN);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
  server.close();
});

describe('useFriendSearch Hook Testing Suite', () => {
  it('should filter suggestions dynamically based on partial match inputs case-insensitively', async () => {
    // 🎯 FIX: Pass values through initialProps so array references remain stable
    const { result, rerender } = renderHook(
      ({ isOpen, input, participants }) => useFriendSearch(isOpen, input, participants),
      { 
        initialProps: { isOpen: true, input: 'ALICE', participants: [] } 
      }
    );

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1);
    });
    expect(result.current.suggestions[0].username).toBe('alice_dev');

    // Safe re-render mutation tests
    rerender({ isOpen: true, input: 'bo', participants: [] });
    await waitFor(() => {
      expect(result.current.suggestions[0].username).toBe('bob_builder');
    });
  });

  it('should exclude friends who are already added as participant chips', async () => {
    // 🎯 FIX: Stable reference passing for the existing participants array
    const { result } = renderHook(
      ({ isOpen, input, participants }) => useFriendSearch(isOpen, input, participants),
      { 
        initialProps: { isOpen: true, input: 'dev', participants: ['alice_dev'] } 
      }
    );

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
    });
  });
});
