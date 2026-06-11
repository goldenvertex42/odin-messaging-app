import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConversations } from './useConversations';
import { customFetch } from '../../utils/api/api';

// 1. Mock out the explicit customFetch module that the hook utilizes internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('useConversations Custom Hook', () => {
  const mockToken = 'mock-valid-jwt-token';
  const mockGetToken = vi.fn(() => mockToken);

  // Helper function to simulate realistic network response objects including content-type maps
  const createMockResponse = (ok, status, data, isJson = true) => {
    const headersMap = new Map();
    if (isJson) headersMap.set('content-type', 'application/json');

    return {
      ok,
      status,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase())
      },
      json: async () => data
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockClear();
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start in a loading state with no conversations', () => {
    // Return an unresolved promise to catch the initial loading layout bounds
    customFetch.mockReturnValueOnce(new Promise(() => {}));
    
    const { result } = renderHook(() => useConversations(mockGetToken));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and populate conversations successfully', async () => {
    const mockConversationsPayload = [
      { id: 'chat-uuid-1', isGroup: false, participants: [{ userId: 'uuid-session-user' }, { userId: 'other-user' }], messages: [{ content: 'Skål!' }] }
    ];

    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, { success: true, data: mockConversationsPayload })
    );

    const { result } = renderHook(() => useConversations(mockGetToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversations).toEqual(mockConversationsPayload);
    expect(result.current.error).toBeNull();
    
    expect(customFetch).toHaveBeenCalledWith('/api/conversations', expect.objectContaining({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      }
    }));
  });

  it('should set error state when the conversation API returns an error', async () => {
    customFetch.mockResolvedValueOnce(
      createMockResponse(false, 500, { success: false, error: 'Database pipeline timeout.' })
    );

    const { result } = renderHook(() => useConversations(mockGetToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database pipeline timeout.');
    expect(result.current.conversations).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should create a new conversation and refresh the list', async () => {
    const newConversation = { id: 'freshly-created-1:1-uuid', isGroup: false };

    // 1st call: Initial hook fetch on mount resolves empty array
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, { success: true, data: [] })
    );

    const { result } = renderHook(() => useConversations(mockGetToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2nd call: The POST creation action
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 201, { success: true, data: newConversation })
    );
    // 3rd call: The automatic internal re-fetch Conversations re-hydration loop trigger
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, { success: true, data: [newConversation] })
    );

    let createdConversation = null;
    await act(async () => {
      createdConversation = await result.current.createConversation(['recipient-uuid-456']);
    });

    expect(createdConversation).toEqual(newConversation);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.conversations).toEqual([newConversation]);
    });

    // Verify the POST payloads were transmitted properly
    expect(customFetch).toHaveBeenCalledWith('/api/conversations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        isGroup: false,
        usernames: ['recipient-uuid-456'],
        name: 'Chat with recipient-uuid-456'
      })
    }));
  });

  it('should throw when creating a conversation without participants', async () => {
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, { success: true, data: [] })
    );

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
