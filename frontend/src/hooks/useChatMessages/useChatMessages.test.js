import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChatMessages } from './useChatMessages';
import { customFetch } from '../../utils/api/api';

// 🌟 Aligned path: Mock the exact file layout path enclosing your refactored api utility
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('useChatMessages Custom Hook Suite', () => {
  const mockToken = 'mock-valid-jwt-token';
  const mockActiveChat = { id: 'chat-uuid-123', isGroup: false };
  const mockOnNewMessageSent = vi.fn();

  const mockHydrationPayload = {
    success: true,
    data: {
      messages: [
        { id: 'm1', content: 'Hello there!', createdAt: '2026-06-11T12:00:00.000Z' },
        { id: 'm2', content: 'General Kenobi!', createdAt: '2026-06-11T12:01:00.000Z' }
      ]
    }
  };

  const createMockResponse = (ok, status, data, contentType = 'application/json') => {
    const headersMap = new Map();
    if (contentType) headersMap.set('content-type', contentType);

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
    localStorage.clear();
    localStorage.setItem('token', mockToken);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty messages and false sending flag when activeChat is null', () => {
    const { result } = renderHook(() => useChatMessages(null, mockOnNewMessageSent));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.sending).toBe(false);
    expect(customFetch).not.toHaveBeenCalled();
  });

  it('should fetch and hydrate conversation histories successfully on mount', async () => {
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, mockHydrationPayload)
    );

    const { result } = renderHook(() => useChatMessages(mockActiveChat, mockOnNewMessageSent));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0].content).toBe('Hello there!');
    expect(customFetch).toHaveBeenCalledWith('/api/conversations/chat-uuid-123', expect.objectContaining({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      }
    }));
  });

  it('should gracefully leave messages array empty and log errors when network response format is invalid', async () => {
    // Return HTML text instead of valid JSON content headers
    customFetch.mockResolvedValueOnce(
      createMockResponse(false, 500, 'Internal Server Error', 'text/html')
    );

    const { result } = renderHook(() => useChatMessages(mockActiveChat, mockOnNewMessageSent));

    // Wait to guarantee async promise resolutions ran through catch blocks
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    expect(result.current.messages).toEqual([]);
  });

  it('should transmit text and file attachments as FormData inside sendMessage and update local lists', async () => {
    // 1st call: Mount history hydration
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, mockHydrationPayload)
    );

    const { result } = renderHook(() => useChatMessages(mockActiveChat, mockOnNewMessageSent));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // 2nd call: The POST message dispatch action
    const mockNewMessage = { id: 'm3', content: 'Fresh payload text', fileUrl: 'blob:img' };
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 201, { success: true, data: mockNewMessage })
    );

    const mockFile = new File(['image-binary'], 'photo.png', { type: 'image/png' });
    
    let sentMessageResult;
    await act(async () => {
      sentMessageResult = await result.current.sendMessage('Fresh payload text', mockFile);
    });

    // Verify returning data definitions match
    expect(sentMessageResult).toEqual(mockNewMessage);

    // Verify messages list array locally appended the fresh node instantly
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2]).toEqual(mockNewMessage);

    // Verify parent sync callback fired cleanly to update the sidebar snippet
    expect(mockOnNewMessageSent).toHaveBeenCalledWith(mockNewMessage);

    // Assert multi-part form payloads compiled correctly
    expect(customFetch).toHaveBeenCalledWith('/api/conversations/chat-uuid-123/messages', expect.objectContaining({
      method: 'POST',
      headers: { 'Authorization': `Bearer ${mockToken}` },
      body: expect.any(FormData)
    }));
  });

  it('should manage the sending loading flag lifecycle reliably throughout request transactions', async () => {
    customFetch.mockResolvedValueOnce(
      createMockResponse(true, 200, { success: true, data: { messages: [] } })
    );

    const { result } = renderHook(() => useChatMessages(mockActiveChat, mockOnNewMessageSent));
    expect(result.current.sending).toBe(false);

    // Hold the response inside an explicit resolving function block to observe intermediate hook state changes
    let resolveNetworkPromise;
    const pendingPromise = new Promise((resolve) => {
      resolveNetworkPromise = resolve;
    });
    customFetch.mockReturnValueOnce(pendingPromise);

    let sendActionPromise;
    act(() => {
      sendActionPromise = result.current.sendMessage('Awaiting resolution...');
    });

    // Verify the hook flips the state flag to true while network thread operates
    expect(result.current.sending).toBe(true);

    // Resolve the task
    await act(async () => {
      resolveNetworkPromise(createMockResponse(true, 201, { success: true, data: { id: 'm4' } }));
      await sendActionPromise;
    });

    // Verify loading status safely reverts back to false upon completion
    expect(result.current.sending).toBe(false);
  });
});
