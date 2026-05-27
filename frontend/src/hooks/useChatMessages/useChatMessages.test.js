import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useChatMessages } from './useChatMessages'; // Adjust path if needed

const MOCK_BASE_URL = 'https://test-odin-messenger.internal';
const MOCK_TOKEN = 'mocked-jwt-pass-token';
const MOCK_CHAT = { id: 'conv_12345' };

// 1. Mock Service Worker Isolation Setup
const server = setupServer(
  // GET: Hydrate historical conversation logs
  http.get(`${MOCK_BASE_URL}/api/conversations/:id`, ({ params, request }) => {
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

  // POST: Send new message
  http.post(`${MOCK_BASE_URL}/api/conversations/:id/messages`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 'msg_new',
        content: body.content,
        createdAt: new Date().toISOString()
      }
    });
  })
);

beforeAll(() => {
  // Inject explicit env variable boundaries cleanly bypassing hoisting traps
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

    expect(result.current.messages).toEqual([]);
  });

  it('should manage sending state lifecycle and push messages state linearly on sendMessage', async () => {
    const { result } = renderHook(() => useChatMessages(MOCK_CHAT));

    // Wait for baseline payload hydration first
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    let sendPromise;
    act(() => {
      sendPromise = result.current.sendMessage('Automated Test Message Log');
    });

    // Verify loading/sending gate state is active immediately
    expect(result.current.sending).toBe(true);

    await act(async () => {
      await sendPromise;
    });

    // Verify sending state drops and state updates correctly
    expect(result.current.sending).toBe(false);
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].content).toBe('Automated Test Message Log');
    expect(result.current.messages[2].id).toBe('msg_new');
  });

  it('should handle API hydration server rejections gracefully without mutations', async () => {
    const badChat = { id: 'error_500' };
    const { result } = renderHook(() => useChatMessages(badChat));

    // Wait short window to ensure engine processed try/catch pipeline
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Chat messages hydration failure:',
        expect.any(Error)
      );
    });

    expect(result.current.messages).toEqual([]);
  });
});
