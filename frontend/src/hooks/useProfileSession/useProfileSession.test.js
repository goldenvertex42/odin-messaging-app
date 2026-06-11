import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileSession } from './useProfileSession';
import { customFetch } from '../../utils/api/api';

// 1. Mock out the central api client layer cleanly
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

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
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-jwt-token');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully hydrate a foreign profile payload on mount', async () => {
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProfileData })
    });

    const { result } = renderHook(() => 
      useProfileSession('odin_user', false, mockCurrentUser, mockGlobalThemeChange)
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfileData);
    expect(result.current.relationshipStatus).toBe('NONE');
    expect(result.current.formData.themePreference).toBe('EMERALD');
    
    expect(customFetch).toHaveBeenCalledWith('/api/profile/odin_user', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        'Authorization': 'Bearer mock-jwt-token'
      })
    }));
  });

  it('should cleanly mutate relationship status to PENDING upon transmitting request record', async () => {
    // 1st call: Hook initial mount profile hydration
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProfileData })
    });

    const { result } = renderHook(() => 
      useProfileSession('odin_user', false, mockCurrentUser, mockGlobalThemeChange)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2nd call: The POST friend request transaction action trigger
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Request sent.' })
    });

    await act(async () => {
      await result.current.handleSendFriendRequest('target-456');
    });

    expect(result.current.relationshipStatus).toBe('PENDING');
    
    expect(customFetch).toHaveBeenCalledWith('/api/friends/requests', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ receiverId: 'target-456' })
    }));
  });

  it('should dispatch onGlobalThemeChange callback upon saving changes to personal profile theme settings', async () => {
    const personalProfileData = { ...mockProfileData, username: 'denverclark' };

    // 1st call: Mount hydration for self
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: personalProfileData })
    });

    const { result } = renderHook(() => 
      useProfileSession('denverclark', true, mockCurrentUser, mockGlobalThemeChange)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2nd call: The PATCH save transaction action trigger returning modified profile settings
    const updatedProfileData = { ...personalProfileData, themePreference: 'OCEAN' };
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: updatedProfileData })
    });

    // Act: Enter editing mode, modify form payload, and dispatch update to backend
    act(() => {
      result.current.handleStartEditing();
      result.current.setFormData(prev => ({ ...prev, themePreference: 'OCEAN' }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    // Assert: Ensure local view state locks clear, profile updates, and context callback resolves
    expect(result.current.isEditing).toBe(false);
    expect(result.current.profile.themePreference).toBe('OCEAN');
    expect(mockGlobalThemeChange).toHaveBeenCalledWith('OCEAN');
  });
});
