import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { customFetch } from '../utils/api/api';

// Mock out the explicit refactored API module location path
vi.mock('../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('AuthContext Core State & Lifecycle Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Ensure JSDOM root parameters drop back to crisp baselines before each execution sweep
    document.documentElement.removeAttribute('data-color-scheme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  test('initializes in a loading state with default light color scheme when zero tokens exist', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.theme).toBe('light'); // Pulls light mode by default
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light');
    expect(customFetch).not.toHaveBeenCalled();
  });

  test('synchronizes flat user data models accurately on mount while keeping color scheme separate', async () => {
    const mockUserPayload = { id: 'u-1', username: 'odin_dev', themePreference: 'EMERALD' };
    localStorage.setItem('token', 'valid-jwt-token');
    
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserPayload,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify user object maps with its brand design intact
    expect(result.current.user).toEqual(mockUserPayload);
    expect(result.current.user.themePreference).toBe('EMERALD');
    
    // Verify default canvas lighting is preserved rather than overwritten by the database accent
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light');
    expect(localStorage.getItem('workspace-color-scheme')).toBe('light');
  });

  test('wipes session parameters from browser cache slots when request validation fails', async () => {
    localStorage.setItem('token', 'stale-malformed-jwt');
    customFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('commits login properties to layout memory grids smoothly upon activation', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mockUserData = { id: 'u-2', username: 'thor_code', themePreference: 'OCEAN' };
    
    act(() => {
      result.current.login(mockUserData, 'fresh-jwt-token');
    });

    expect(result.current.user).toEqual(mockUserData);
    expect(localStorage.getItem('token')).toBe('fresh-jwt-token');
  });

  test('notifies server backend of exit routines, flushes token caches, and returns canvas to light baseline', async () => {
    localStorage.setItem('token', 'active-jwt');
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    localStorage.setItem('workspace-color-scheme', 'dark');

    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u-1', username: 'odin_dev' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.logout();
    });

    // Ensure state memory flushes securely
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    
    // 🌟 Symmetrical Reset Check: Verify canvas switches safely back to light mode layout limits
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light');
    expect(localStorage.getItem('workspace-color-scheme')).toBe('light');
  });

  test('toggles canvas lighting properties back and forth seamlessly mutating document variables', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.theme).toBe('light');

    // Toggle Phase 1: Light -> Dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
    expect(localStorage.getItem('workspace-color-scheme')).toBe('dark');

    // Toggle Phase 2: Dark -> Light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light');
    expect(localStorage.getItem('workspace-color-scheme')).toBe('light');
  });

  test('mutates user branding design accents instantly through optimistic updates without dropping canvas modes', async () => {
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'u-1', username: 'odin_dev', themePreference: 'SLATE' }),
    });
    localStorage.setItem('token', 'valid-jwt');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Switch palette design accent from SLATE -> AMETHYST optimistically
    act(() => {
      result.current.updateUserTheme('AMETHYST');
    });

    expect(result.current.user.themePreference).toBe('AMETHYST');
    
    // Verify lighting state parameter tracks independently
    expect(result.current.theme).toBe('light');
  });
});
