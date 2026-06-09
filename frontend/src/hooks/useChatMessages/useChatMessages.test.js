import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useChatMessages } from './useChatMessages';

const MOCK_TOKEN = 'mocked-jwt-pass-token';
const MOCK_CHAT = { id: 'conv_12345' };

// 1. Mock Service Worker Isolation Setup using Relative Paths
const server = setupServer(
  // GET: Hydrate historical conversation logs
  http.get('/api/conversations/:id', ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${MOCK_TOKEN}`) {
      return new HttpResponse(null, { status: 401 });
    }
    if (params.id === 'error_500') {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        messages: [
          { id: 'msg_1', content: 'Hello World', createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 'msg_2', content: 'Testing hooks', createdAt: '2026-01-01T00:01:00.000Z' }
        ]
      }
    });
  }),

  http.post('/api/conversations/:id/messages', async ({ request }) => {
    try {
      // 1. Core Fix: Read the transmission boundary payload as Form Data entries
      const formData = await request.formData();
      
      // 2. Extract your text caption field parameter from the form layout boundary
      const textContent = formData.get('content') || '';

      return HttpResponse.json({ 
        success: true, 
        data: { 
          id: 'msg_new', 
          content: textContent, 
          createdAt: new Date().toISOString() 
        } 
    });
    } catch (err) {
      // Fallback block safeguard if an unexpected JSON payload hits the sandbox routing track
      return new HttpResponse(JSON.stringify({ success: false, error: err.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  })

);

beforeAll(() => {
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
  server.close();
});

describe('useChatMessages Hook Testing Suite', () => {
  it('should initialize with empty messages state and false sending flag', () => {
    const { result } = renderHook(() => useChatMessages(null));
    expect(result.current.messages).toEqual([]);
    expect(result.current.sending).toBe(false);
  });

  it('should hydrate historical messages from endpoint on mount with activeChat', async () => {
    const { result } = renderHook(() => useChatMessages(MOCK_CHAT));
    
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });
    expect(result.current.messages[0].content).toBe('Hello World');
    expect(result.current.messages[1].id).toBe('msg_2');
  });

  it('should clear message state immediately if activeChat becomes null', async () => {
    const { result, rerender } = renderHook(({ chat }) => useChatMessages(chat), {
      initialProps: { chat: MOCK_CHAT }
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    rerender({ chat: null });
    
    await waitFor(() => {
      expect(result.current.messages).toEqual([]);
    });
  });

    it('should manage sending state lifecycle and push messages state linearly on sendMessage', async () => {
      const { result } = renderHook(() => useChatMessages(MOCK_CHAT));

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      let sendPromise;
      act(() => {
        sendPromise = result.current.sendMessage('Automated Test Message Log');
      });

      expect(result.current.sending).toBe(true);

      await act(async () => {
        await sendPromise;
      });

      expect(result.current.sending).toBe(false);
      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[2].content).toBe('Automated Test Message Log');
      expect(result.current.messages[2].id).toBe('msg_new');
    });


  it('should handle API hydration server rejections gracefully without mutations', async () => {
    const badChat = { id: 'error_500' };
    const { result } = renderHook(() => useChatMessages(badChat));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    expect(result.current.messages).toEqual([]);
  });
});
