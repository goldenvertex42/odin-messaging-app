import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';
import { server } from '../../../mocks/server';
import ChatWindow from './ChatWindow';

describe('ChatWindow Component - Modular Integration TDD Suite', () => {
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.stubEnv('VITE_API_BASE_URL', BASE_URL);
    
    // Polyfill scrollIntoView to prevent layout exceptions inside jsdom sandboxes
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const activeChatMock = {
    id: 'active-chat-uuid-999',
    name: 'The Citadel Channel',
    messages: [
      { id: 'msg-abc-1', content: 'First entry layout text', senderId: 'foreign-user-id' },
      { id: 'msg-abc-2', content: 'Second entry target reply', senderId: 'current-user-id' }
    ]
  };

  // 1. TEST EMPTY PLACEHOLDER STATES
  it('should render a clear instruction placeholder when zero chat selections are provided', () => {
    render(
      <MemoryRouter>
        <ChatWindow activeChat={null} currentUserId="current-user-id" />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('chat-window-placeholder')).toBeInTheDocument();
    expect(screen.getByText(/select a conversation channel to start messaging/i)).toBeInTheDocument();
  });

  // 2. TEST DYNAMIC ROW HYDRATION ACROSS SUB-COMPONENTS
  it('should load ChatHeader titles and map historical threads inside MessageList rows', async () => {
    server.use(
      http.get(`${BASE_URL}/api/conversations/${activeChatMock.id}`, () => {
        return HttpResponse.json({ success: true, data: activeChatMock }, { status: 200 });
      })
    );

    render(
      <MemoryRouter>
        <ChatWindow activeChat={activeChatMock} currentUserId="current-user-id" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /the citadel channel/i })).toBeInTheDocument();
    
    // Explicitly wait for async component hydration to finish rendering rows
    expect(await screen.findByText('First entry layout text')).toBeInTheDocument();
    expect(screen.getByText('Second entry target reply')).toBeInTheDocument();
  });

  // 3. TEST DATA EMISSION PIPELINES (SEND ACTIONS VIA MESSAGEINPUT)
  it('should pass text from MessageInput through POST routes and display newly created message bubbles', async () => {
    const user = userEvent.setup();
    const newlyCreatedMsg = { id: 'msg-abc-3', content: 'Fresh text bubble string', senderId: 'current-user-id' };
    let capturedBody = null;

    // DYNAMIC STATE MATRIX: Holds data models securely in memory to simulate DB behavior
    let currentChatState = { ...activeChatMock };

    server.use(
      // Unified GET handler tracking our mutable local object state
      http.get(`${BASE_URL}/api/conversations/${activeChatMock.id}`, () => {
        return HttpResponse.json({ success: true, data: currentChatState }, { status: 200 });
      }),
      
      // Unified POST handler appending the text block cleanly before re-renders run
      http.post(`${BASE_URL}/api/conversations/${activeChatMock.id}/messages`, async ({ request }) => {
        try {
          // 1. Parse the incoming multipart request packet as FormData
          const formData = await request.formData();
          const contentText = formData.get('content') || '';

          // 2. Map structural metrics into your tracking assertions container variable
          capturedBody = { content: contentText };

          // Emulate true backend update behavior inside our test context state object matrix
          currentChatState.messages = [...currentChatState.messages, newlyCreatedMsg];
          
          return HttpResponse.json({ success: true, data: newlyCreatedMsg }, { status: 201 });
        } catch (err) {
          return new HttpResponse(JSON.stringify({ success: false, error: err.message }), { status: 400 });
        }
      })
    );

    render(
      <MemoryRouter>
        <ChatWindow activeChat={activeChatMock} currentUserId="current-user-id" />
      </MemoryRouter>
    );

    // Wait for the initial GET request message list rows to populate the DOM frame first
    expect(await screen.findByText('First entry layout text')).toBeInTheDocument();

    const inputElement = screen.getByPlaceholderText(/type a message\.\.\./i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(inputElement, 'Fresh text bubble string');
    await user.click(sendButton);

    await waitFor(() => {
      expect(capturedBody).toEqual({ content: 'Fresh text bubble string' });
    });

    // Verify MessageList logs the final newly pushed node
    expect(await screen.findByText('Fresh text bubble string')).toBeInTheDocument();
    expect(inputElement).toHaveValue(''); 
  });
});
