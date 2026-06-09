import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileSession } from './useProfileSession';
import { server } from '../../mocks/server'; // Point this to your MSW server file path
import { http, HttpResponse } from 'msw';

describe('useProfileSession Custom Hook', () => {
  const mockCurrentUser = { username: 'denverclark', id: 'user-123' };
  const mockGlobalThemeChange = vi.fn();

  const mockProfileData = {
    id: 'target-456',
    username: 'odin_user',
    displayName: 'Odin Developer',
    bio: 'Coding in a monorepo workspace.',
    avatarUrl: 'https://dicebear.com',
    themePreference: 'EMERALD',
    relationshipStatus: 'NONE',
  };

  beforeEach(() => {
    // Standard-compliant implementation prevents window.localStorage.clear() exceptions
    let store = { 'token': 'mock-jwt-token' };
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = String(value); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; })
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully hydrate a foreign profile payload on mount via MSW', async () => {
    // Intercept using your built-in server instance cleanly
    server.use(
      http.get('/api/profile/odin_user', () => {
        return HttpResponse.json({ success: true, data: mockProfileData });
      })
    );

    const { result } = renderHook(() =>
      useProfileSession('odin_user', false, mockCurrentUser, mockGlobalThemeChange)
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toEqual(mockProfileData);
    expect(result.current.relationshipStatus).toBe('NONE');
  });

  it('should mutation flip status to PENDING upon executing handleSendFriendRequest', async () => {
    let networkIntercepted = false;

    server.use(
      http.get('/api/profile/odin_user', () => {
        return HttpResponse.json({ success: true, data: mockProfileData });
      }),
      http.post('/api/friends/requests', async ({ request }) => {
        const body = await request.json();
        if (body.receiverId === 'target-456') networkIntercepted = true;
        return HttpResponse.json({ success: true, message: 'Request sent.' });
      })
    );

    const { result } = renderHook(() =>
      useProfileSession('odin_user', false, mockCurrentUser, mockGlobalThemeChange)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSendFriendRequest('target-456');
    });

    expect(networkIntercepted).toBe(true);
    expect(result.current.relationshipStatus).toBe('PENDING');
  });
});
