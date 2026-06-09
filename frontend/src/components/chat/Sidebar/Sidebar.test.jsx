import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Sidebar from './Sidebar';

// Mock the global AuthContext hook module
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

// Mock getConversationName to match our augmented string-object hybrid structure
vi.mock('../../../utils/getConversationName', () => ({
  getConversationName: vi.fn((chat, currentUserId) => {
    // If there's an explicit chat name fallback or mock logic, use it
    if (chat.isGroup) {
      return Object.assign(new String(chat.name || 'Group Chat'), { targetUser: null });
    }
    // Simple mock participant extraction mirroring real utility behaviour
    const partner = chat.participants?.find(p => p.user?.id !== currentUserId);
    const title = partner?.user?.displayName || 'Chat Partner';
    return Object.assign(new String(title), { targetUser: partner?.user || null });
  })
}));

// Mock CSS Module imports to prevent structural path resolution failures
vi.mock('./Sidebar.module.css', () => ({
  default: {
    sidebar: 'mock-sidebar',
    titleArea: 'mock-title-area',
    list: 'mock-list',
    chatItem: 'mock-chat-item',
    isActive: 'mock-active',
    chatName: 'mock-chat-name',
    preview: 'mock-preview',
    footer: 'mock-footer',
    profileActions: 'mock-profile-actions',
    footerLink: 'mock-footer-link',
    logoutBtn: 'mock-logout-btn',
  },
}));

// Mock the NewChatButton to isolate sidebar navigation mechanics
vi.mock('./components/NewChatButton/NewChatButton', () => ({
  default: () => <button data-testid="mock-new-chat-btn">New Chat</button>,
}));

describe('Sidebar Component - Production Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // 🎯 FIX 3: Restructured parameters to provide matching user mappings
  const mockConversations = [
    {
      id: 'chat-uuid-1',
      isGroup: false,
      participants: [
        { userId: 'current-user', user: { id: 'current-user', displayName: 'Odin Dev', username: 'odindev' } },
        { userId: 'other-user-1', user: { id: 'other-user-1', displayName: 'Thor', username: 'thor_god' } },
      ],
      messages: [{ content: 'Hey there!', createdAt: '2026-01-01T00:00:00.000Z' }],
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
    expect(screen.getByText('Hey there!')).toBeInTheDocument();
  });

  it('should show the most recent message preview when multiple messages exist', () => {
    const conversationsWithHistory = [
      {
        ...mockConversations[0],
        messages: [
          { content: 'Old message', createdAt: '2026-01-01T10:00:00.000Z' },
          { content: 'Newest message', createdAt: '2026-01-01T12:00:00.000Z' },
        ],
      },
    ];
    render(
      <MemoryRouter>
        <Sidebar conversations={conversationsWithHistory} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Newest message')).toBeInTheDocument();
    expect(screen.queryByText('Old message')).not.toBeInTheDocument();
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
