import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useAuth } from './useAuth';

describe('useAuth Custom Hook - TDD Suite (Stateless JWT)', () => {
  const API_URL = 'http://localhost:3000/api';
  const mockToken = 'mock-valid-jwt-string';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear(); // Clear storage before every test case runs
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. TEST LOADING STATE
  it('should initialize with standard loading states', () => {
    // Seed a token so the initialization phase passes the fallback guard
    localStorage.setItem('token', mockToken);
    
    const hangSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);

    hangSpy.mockRestore();
  });

  // 2. TEST AUTHENTICATION HYDRATION
  it('should successfully hydrate user states on a 200 server response', async () => {
    const mockUserPayload = { id: 'uuid-123', username: 'odin_warrior', email: 'valhalla@odin.com' };
    
    // Seed token to allow fetch lifecycle execution
    localStorage.setItem('token', mockToken);

    server.use(
      http.get(`${API_URL}/auth/me`, ({ request }) => {
        // Optional validation: Ensure hook passes authorization header correctly
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${mockToken}`) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(mockUserPayload, { status: 200 });
      })
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUserPayload);
  });

  // 3. TEST UNAUTHORIZED TOKEN DROP
  it('should drop user profiles cleanly to null and wipe storage on a 401 response', async () => {
    localStorage.setItem('token', mockToken);

    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        return HttpResponse.json({ error: 'Unauthenticated token' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(localStorage.getItem('token')).toBeNull(); // Verifies token auto-wipe
  });

  // 4. TEST TOTAL NETWORK FAILURE
  it('should handle runtime network rejection failures safely', async () => {
    localStorage.setItem('token', mockToken);

    server.use(
      http.get(`${API_URL}/auth/me`, () => {
        return HttpResponse.error();
      })
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(consoleSpy).toHaveBeenCalled();
  });

  // 5. TEST STATE ACTIONS (New helpers verification)
  it('should manipulate state and storage via login and logout handlers', () => {
    const { result } = renderHook(() => useAuth());
    const sampleUser = { id: 'user-77', username: 'thor' };

    // Execute state changes inside testing act containers
    act(() => {
      result.current.login(sampleUser, 'thor-token');
    });

    expect(localStorage.getItem('token')).toBe('thor-token');
    expect(result.current.user).toEqual(sampleUser);

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
