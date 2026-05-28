import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Import the hook directly so we can spy on its implementation reactively
import * as useConversationsHook from '../../hooks/useConversations/useConversations';

// 2. Mock out the inner network fetch cycle inside ChatWindow.jsx completely
vi.mock('../../components/chat/ChatWindow/ChatWindow', () => {
  return {
    default: ({ activeChat }) => (
      <div data-testid="chat-window-mock">
        {activeChat ? `Active: ${activeChat.id}` : 'Placeholder View'}
      </div>
    )
  };
});

import ConversationsPage from './ConversationsPage';

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

  // A. TEST LAYOUT RENDERING BOUNDARIES
  it('should initialize the layout side-by-side displaying the sidebar and the window placeholder', () => {
    // FIX: Inject the mock return values reactively via a robust spy check
    vi.spyOn(useConversationsHook, 'useConversations').mockReturnValue({
      conversations: sampleChats,
      loading: false,
      error: null,
      setConversations: vi.fn(),
      createConversation: vi.fn()
    });

    render(<ConversationsPage user={sampleUser} />);

    expect(screen.getByTestId('conversations-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.getByText(/select a conversation thread or launch a new chat channel to begin/i)).toBeInTheDocument();
  });

  // B. TEST INTER-COMPONENT COMMUNICATION FLOWS
  it('should pass selected sidebar conversation data up to the parent layout and open the ChatWindow panel', async () => {
    const user = userEvent.setup();

    // FIX: Inject the mock return values reactively via a robust spy check
    vi.spyOn(useConversationsHook, 'useConversations').mockReturnValue({
      conversations: sampleChats,
      loading: false,
      error: null,
      setConversations: vi.fn(),
      createConversation: vi.fn()
    });

    render(<ConversationsPage user={sampleUser} />);

    // Locate the child item row rendered inside the sidebar module now that data streams bind green
    const threadTarget = await screen.findByText('Heimdall');
    expect(threadTarget).toBeInTheDocument();

    // Trigger user click selection event
    await user.click(threadTarget);

    // Verify parent container processed the state update correctly and passed the ID down
    expect(screen.getByTestId('chat-window-mock')).toHaveTextContent('Active: chat-xyz-123');
  });
});
