import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import ChatWindow from './ChatWindow';
import { useChatMessages } from '../../../hooks/useChatMessages/useChatMessages';
import { getConversationName } from '../../../utils/getConversationName/getConversationName';

// 1. Mock out the internal component dependency structures completely
vi.mock('../../../hooks/useChatMessages/useChatMessages', () => ({
  useChatMessages: vi.fn()
}));

vi.mock('../../../utils/getConversationName/getConversationName', () => ({
  getConversationName: vi.fn()
}));

// Mock AuthContext for ChatHeader's internal useAuth theme switch requirements
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    theme: 'light',
    toggleTheme: vi.fn()
  })
}));

describe('ChatWindow Component - Modular Integration Suite', () => {
  const currentUserId = 'current-user-id';
  
  const mockMessages = [
    { id: 'msg-abc-1', content: 'First entry layout text', senderId: 'foreign-user-id', createdAt: '2026-06-11T10:00:00.000Z' },
    { id: 'msg-abc-2', content: 'Second entry target reply', senderId: 'current-user-id', createdAt: '2026-06-11T10:05:00.000Z' }
  ];

  const activeChatMock = { id: 'active-chat-uuid-999', isGroup: false, messages: mockMessages };
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // Establish predictable hook return defaults
    useChatMessages.mockReturnValue({
      messages: mockMessages,
      sending: false,
      sendMessage: mockSendMessage
    });

    // Establish predictable conversation name parsing utility returns
    getConversationName.mockReturnValue({
      toString: () => 'The Citadel Channel',
      targetUser: { username: 'citadel_partner', isOnline: true }
    });
  });

  // 1. TEST EMPTY PLACEHOLDER STATES
  it('should render a clear instruction placeholder when zero chat selections are provided', () => {
    render(
      <MemoryRouter>
        <ChatWindow activeChat={null} currentUserId={currentUserId} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('chat-window-placeholder')).toBeInTheDocument();
    expect(screen.getByText(/select a conversation channel to start messaging/i)).toBeInTheDocument();
  });

  // 2. TEST DYNAMIC ROW HYDRATION ACROSS SUB-COMPONENTS
  it('should load ChatHeader titles and map historical threads inside MessageList rows', () => {
    render(
      <MemoryRouter>
        <ChatWindow activeChat={activeChatMock} currentUserId={currentUserId} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 4, name: 'The Citadel Channel' })).toBeInTheDocument();
    expect(getConversationName).toHaveBeenCalledWith(activeChatMock, currentUserId);

    expect(screen.getByText('First entry layout text')).toBeInTheDocument();
    expect(screen.getByText('Second entry target reply')).toBeInTheDocument();
  });

  // 3. TEST DATA EMISSION PIPELINES (SEND ACTIONS VIA MESSAGEINPUT)
  it('should pass text from MessageInput through the intercept pipeline and clear fields on success', async () => {
    const user = userEvent.setup();
    const mockOnNewMessageSent = vi.fn();
    const newlyCreatedMsg = { id: 'msg-abc-3', content: 'Fresh text bubble string', senderId: currentUserId };
    mockSendMessage.mockResolvedValue(newlyCreatedMsg);

    render(
      <MemoryRouter>
        <ChatWindow 
          activeChat={activeChatMock} 
          currentUserId={currentUserId} 
          onNewMessageSent={mockOnNewMessageSent} 
        />
      </MemoryRouter>
    );

    const inputElement = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    await user.type(inputElement, 'Fresh text bubble string');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('Fresh text bubble string', null);
    await waitFor(() => {
      expect(mockOnNewMessageSent).toHaveBeenCalledWith(newlyCreatedMsg);
      expect(inputElement.value).toBe('');
    });
  });

  // 4. TEST MEDIA ATTACHMENT LIGHTBOX PORTALS
  it('opens and closes the image lightbox modal overlay on request triggers', async () => {
    const user = userEvent.setup();
    
    const imageMessage = { 
      id: 'msg-img-99', 
      content: 'Look at this photo', 
      senderId: 'foreign-user-id', 
      fileUrl: 'blob:mock-preview-url', 
      createdAt: '2026-06-11T10:10:00.000Z' 
    };

    // 🌟 Fix 2: Preserve the sendMessage mock parameter callback signature during re-renders
    useChatMessages.mockReturnValue({
      messages: [imageMessage],
      sending: false,
      sendMessage: mockSendMessage
    });

    render(
      <MemoryRouter>
        <ChatWindow activeChat={activeChatMock} currentUserId={currentUserId} />
      </MemoryRouter>
    );

    // Act: Click the image layout node inside MessageBubble
    const attachmentImage = screen.getByRole('img', { name: /shared asset payload/i });
    await user.click(attachmentImage);

    // Assert: 🌟 Fix 1: Target the image by a generic role lookup to avoid alt-text string collisions
    const modalImage = screen.getByRole('img', { name: /shared asset payload/i });
    expect(modalImage).toBeInTheDocument();
    expect(modalImage).toHaveAttribute('src', 'blob:mock-preview-url');

    // Act: Dismiss the lightbox viewer portal via backdrop container click
    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);

    // Assert: Confirm the modal image correctly unmounts on overlay close
    await waitFor(() => {
      expect(screen.queryByTestId('modal-backdrop')).not.toBeInTheDocument();
    });
  });
});
