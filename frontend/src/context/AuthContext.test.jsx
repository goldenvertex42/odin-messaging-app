import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext Core State & Lifecycle Suite', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    test('initializes in a loading state with null user when no token exists in local storage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.user).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });


  test('synchronizes user profile metrics successfully on mount if a valid token is found', async () => {
    const mockUserPayload = { id: 'u-1', username: 'odin_dev', themePreference: 'EMERALD' };
    localStorage.setItem('token', 'valid-jwt-token');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserPayload,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUserPayload);
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-jwt-token'
      }
    }));
  });

  test('wipes stale tokens from local storage if the profile validation fetch fails', async () => {
    localStorage.setItem('token', 'expired-or-malformed-jwt');

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('commits login metrics and tokens to browser storage layers instantly on execution', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mockUserData = { id: 'u-2', username: 'thor_code' };
    
    act(() => {
      result.current.login(mockUserData, 'fresh-jwt-token');
    });

    expect(result.current.user).toEqual(mockUserData);
    expect(localStorage.getItem('token')).toBe('fresh-jwt-token');
  });

  test('notifies the backend to update network presence status on logout before wiping memory bounds', async () => {
    localStorage.setItem('token', 'active-user-jwt');
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u-1', username: 'odin_dev' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer active-user-jwt'
      }
    }));

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('mutates local user theme configurations instantly to support optimistic visual alterations', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u-1', username: 'odin_dev', themePreference: 'SLATE' }),
    });
    localStorage.setItem('token', 'valid-jwt');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateUserTheme('ROSE');
    });

    expect(result.current.user.themePreference).toBe('ROSE');
  });
});
