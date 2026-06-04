import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { useConversations } from './useConversations';

describe('useConversations Custom Hook', () => {
  const mockToken = 'mock-valid-jwt-token';
  const mockGetToken = vi.fn(() => mockToken);

  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetToken.mockClear();
    localStorage.clear();
    // 🎯 REMOVED: vi.stubEnv('VITE_API_BASE_URL', BASE_URL);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should start in a loading state with no conversations', () => {
    const pendingFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useConversations(mockGetToken));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBeNull();
    
    pendingFetch.mockRestore();
  });

  it('should fetch and populate conversations successfully', async () => {
    const mockConversationsPayload = [
      { id: 'chat-uuid-1', isGroup: false, participants: [{ userId: 'uuid-session-user' }, { userId: 'other-user' }], messages: [{ content: 'Skål!' }] }
    ];

    // ✅ Standard relative path matches production fetch paths exactly
    server.use(
      http.get('/api/conversations', ({ request }) => {
        expect(request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
        return HttpResponse.json({ success: true, data: mockConversationsPayload }, { status: 200 });
      })
    );

    const { result } = renderHook(() => useConversations(mockGetToken));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversations).toEqual(mockConversationsPayload);
    expect(result.current.error).toBeNull();
  });

  it('should set error state when the conversation API returns an error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    server.use(
      http.get('/api/conversations', () => {
        return HttpResponse.json({ success: false, error: 'Database pipeline timeout.' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useConversations(mockGetToken));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database pipeline timeout.');
    expect(result.current.conversations).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

    it('should create a new conversation and refresh the list', async () => {
    const newConversation = { id: 'freshly-created-1:1-uuid', isGroup: false };
    let requestBody = null;

    server.use(
      http.get('/api/conversations', () => {
        return HttpResponse.json({ success: true, data: [] }, { status: 200 });
      })
    );

    const { result } = renderHook(() => useConversations(mockGetToken));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.conversations).toEqual([]);
    });

    server.use(
      http.get('/api/conversations', () => {
        return HttpResponse.json({ success: true, data: [newConversation] }, { status: 200 });
      }),
      http.post('/api/conversations', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ success: true, data: newConversation }, { status: 201 });
      })
    );

    let createdConversation = null;
    await act(async () => {
      createdConversation = await result.current.createConversation(['recipient-uuid-456']);
    });

    expect(requestBody).toEqual({ 
      isGroup: false, 
      usernames: ['recipient-uuid-456'], 
      name: 'Chat with recipient-uuid-456' 
    });
    
    expect(createdConversation).toEqual(newConversation);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.conversations).toEqual([newConversation]);
    });
  });


  it('should throw when creating a conversation without participants', async () => {
    const { result } = renderHook(() => useConversations(mockGetToken));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.createConversation([]);
      })
    ).rejects.toThrow('No recipients specified.');
  });
});
