import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Sidebar from './Sidebar';

// 1. Mock the global AuthContext hook module
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

// 2. Mock getConversationName to match your production string-object structure predictably
vi.mock('../../../utils/getConversationName/getConversationName', () => ({
  getConversationName: vi.fn((chat, currentUserId) => {
    if (chat.isGroup) {
      return Object.assign(new String(chat.name || 'Group Chat'), { targetUser: null });
    }
    const partner = chat.participants?.find(p => p.userId !== currentUserId);
    const title = partner?.user?.displayName || 'Chat Partner';
    return Object.assign(new String(title), { targetUser: partner?.user || null });
  })
}));

// 3. Mock the NewChatButton to isolate sidebar integration bounds
vi.mock('./components/NewChatButton/NewChatButton', () => ({
  default: () => <button data-testid="mock-new-chat-btn">New Chat</button>,
}));

describe('Sidebar Component - Production Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const mockConversations = [
    {
      id: 'chat-uuid-1',
      isGroup: false,
      name: null,
      participants: [
        { userId: 'current-user', user: { id: 'current-user', displayName: 'Odin Dev', username: 'odindev' } },
        { userId: 'other-user-1', user: { id: 'other-user-1', displayName: 'Thor', username: 'thor_god' } },
      ],
      messages: [
        {
          id: 'm1',
          content: 'Hey there!',
          createdAt: '2026-01-01T00:00:00.000Z',
          sender: { id: 'other-user-1', username: 'thor_god' }
        }
      ],
    },
  ];

  it('should render an empty sidebar when no conversations are provided', () => {
    render(
      <MemoryRouter>
        <Sidebar conversations={[]} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.queryByText('Thor')).not.toBeInTheDocument();
    expect(screen.queryByText('Hey there!')).not.toBeInTheDocument();
  });

  it('should display names and direct messaging previews correctly when data loads', () => {
    render(
      <MemoryRouter>
        <Sidebar conversations={mockConversations} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.getByText('Thor')).toBeInTheDocument();
    
    // Check containment to protect against dynamic prefixes safely
    expect(screen.getByText(/Hey there!/i)).toBeInTheDocument();
  });

  it('should show the most recent message preview when multiple messages exist', () => {
    const conversationsWithHistory = [
      {
        ...mockConversations[0],
        messages: [
          {
            id: 'old-msg',
            content: 'Old message',
            createdAt: '2026-01-01T10:00:00.000Z',
            sender: { id: 'other-user-1', username: 'thor_god' }
          },
          {
            id: 'new-msg',
            content: 'Newest message',
            createdAt: '2026-01-01T12:00:00.000Z',
            sender: { id: 'other-user-1', username: 'thor_god' }
          },
        ],
      },
    ];

    render(
      <MemoryRouter>
        <Sidebar conversations={conversationsWithHistory} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Newest message/i)).toBeInTheDocument();
    expect(screen.queryByText(/Old message/i)).not.toBeInTheDocument();
  });

  it('should dispatch onSelectChat callbacks when user clicks a specific thread node row', async () => {
    const user = userEvent.setup();
    const mockSelectCallback = vi.fn();

    render(
      <MemoryRouter>
        <Sidebar conversations={mockConversations} currentUserId="current-user" onSelectChat={mockSelectCallback} />
      </MemoryRouter>
    );

    const clickTarget = screen.getByText('Thor');
    await user.click(clickTarget);

    expect(mockSelectCallback).toHaveBeenCalledTimes(1);
    expect(mockSelectCallback).toHaveBeenCalledWith(mockConversations[0]);
  });
});
