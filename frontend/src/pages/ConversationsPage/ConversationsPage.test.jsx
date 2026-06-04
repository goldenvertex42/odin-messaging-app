import { render, screen } from '@testing-library/react';
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
        { user: { id: 'current-user-id', displayName: 'Odin Boss' } },
        { user: { id: 'other-user-id', displayName: 'Heimdall' } }
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

    const threadTarget = await screen.findByText('Heimdall');
    expect(threadTarget).toBeInTheDocument();

    await user.click(threadTarget);

    expect(screen.getByTestId('chat-window-mock')).toHaveTextContent('Active: chat-xyz-123');
  });
});
