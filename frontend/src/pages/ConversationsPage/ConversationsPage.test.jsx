import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import ConversationsPage from './ConversationsPage';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

const mockUseConversations = vi.fn();
vi.mock('../../hooks/useConversations/useConversations', () => ({
  useConversations: () => mockUseConversations()
}));

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
  const sampleUser = { id: 'current-user-id', username: 'odin_boss' };
  const sampleChats = [
    {
      id: 'chat-xyz-123',
      isGroup: false,
      participants: [
        { 
          userId: 'current-user-id',
          user: { id: 'current-user-id', displayName: 'Odin Boss' } 
        },
        { 
          userId: 'other-user-id',
          user: { id: 'other-user-id', displayName: 'Heimdall' } 
        }
      ],
      messages: [{ content: 'Bifrost is open' }]
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
      createConversation: vi.fn()
    });

    render(
      <MemoryRouter>
        <ConversationsPage user={sampleUser} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('conversations-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.getByText(/select a conversation thread or launch a new chat channel to begin/i)).toBeInTheDocument();
  });

  it('should pass selected sidebar conversation data up to the parent layout and open the ChatWindow panel', async () => {
    const user = userEvent.setup();
    
    mockUseConversations.mockReturnValue({
      conversations: sampleChats,
      loading: false,
      error: null,
      setConversations: vi.fn(),
      createConversation: vi.fn()
    });

    render(
      <MemoryRouter>
        <ConversationsPage user={sampleUser} />
      </MemoryRouter>
    );

    // 1. CORE FIX: Wrap a standard Case-Insensitive Regex query inside an async waitFor block.
    // This avoids compiler interpretation bugs entirely while safely searching the JSDOM structure.
    let threadTargetText;
    await waitFor(() => {
      threadTargetText = screen.getByText(/Heimdall/i);
      expect(threadTargetText).toBeInTheDocument();
    });

    // 2. Safely capture the parent list item row container element holding the onClick trigger
    const threadTargetRow = threadTargetText.closest('li');
    expect(threadTargetRow).toBeInTheDocument();

    // 3. Execute the simulation on the true target element block
    await user.click(threadTargetRow);

    // 4. Confirm the layout opened the matching chat view
    expect(screen.getByTestId('chat-window-mock')).toHaveTextContent('Active: chat-xyz-123');
  });
});
