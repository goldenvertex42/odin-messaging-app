import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import ConversationsPage from './ConversationsPage';

// 1. Mock global AuthContext behaviors safely
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
    theme: 'light',
    toggleTheme: vi.fn()
  }),
}));

// 2. Control custom conversation state data hooks explicitly
const mockUseConversations = vi.fn();
vi.mock('../../hooks/useConversations/useConversations', () => ({
  useConversations: () => mockUseConversations()
}));

// 3. Mock out ChatWindow pane elements to track active property transfers
vi.mock('../../components/chat/ChatWindow/ChatWindow', () => {
  return {
    default: ({ activeChat }) => (
      <div data-testid="chat-window-mock">
        {activeChat ? `Active: ${activeChat.id}` : 'Placeholder View'}
      </div>
    )
  };
});

describe('ConversationsPage - Cross-Component Integration Suite', () => {
  const sampleUser = { id: 'current-user-id', username: 'odin_boss', themePreference: 'SLATE' };
  
  const sampleChats = [
    { 
      id: 'chat-xyz-123', 
      isGroup: false, 
      participants: [
        { userId: 'current-user-id', user: { id: 'current-user-id', displayName: 'Odin Boss' } },
        { userId: 'other-user-id', user: { id: 'other-user-id', displayName: 'Heimdall' } }
      ], 
      messages: [{ content: 'Bifrost is open', createdAt: '2026-06-11T12:00:00.000Z' }] 
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should initialize the layout side-by-side displaying the sidebar and the window placeholder', () => {
    mockUseConversations.mockReturnValue({
      conversations: sampleChats,
      loading: false,
      error: null,
      setConversations: vi.fn(),
      createConversation: vi.fn(),
      refreshConversations: vi.fn()
    });

    render(
      <MemoryRouter>
        <ConversationsPage user={sampleUser} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('conversations-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.getByText(/Select a conversation thread or launch a new chat channel to begin/i)).toBeInTheDocument();
  });

  it('should pass selected sidebar conversation data up to the parent layout and open the ChatWindow panel', async () => {
    const user = userEvent.setup();
    
    mockUseConversations.mockReturnValue({
      conversations: sampleChats,
      loading: false,
      error: null,
      setConversations: vi.fn(),
      createConversation: vi.fn(),
      refreshConversations: vi.fn()
    });

    render(
      <MemoryRouter>
        <ConversationsPage user={sampleUser} />
      </MemoryRouter>
    );

    // 1. Wait until child components map text elements out to JSDOM view trees safely
    let threadTargetText;
    await waitFor(() => {
      threadTargetText = screen.getByText(/Heimdall/i);
      expect(threadTargetText).toBeInTheDocument();
    });

    // 2. Extract parent list item structure layer
    const threadTargetRow = threadTargetText.closest('li');
    expect(threadTargetRow).toBeInTheDocument();

    // 3. Act: Simulate row panel selection
    await user.click(threadTargetRow);

    // 4. Assert: ChatWindow frame resolves properties accurately
    await waitFor(() => {
      expect(screen.getByTestId('chat-window-mock')).toHaveTextContent('Active: chat-xyz-123');
    });
  });
});
